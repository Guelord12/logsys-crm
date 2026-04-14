const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const db = require('../models');
const config = require('./config');

const { User } = db;

// Stratégie locale (email/password)
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    async (email, password, done) => {
      try {
        const user = await User.findOne({
          where: { email },
          include: ['company', 'roles']
        });

        if (!user) {
          return done(null, false, { message: 'Email ou mot de passe incorrect' });
        }

        if (user.status !== 'ACTIVE') {
          return done(null, false, { message: 'Compte inactif ou suspendu' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
          return done(null, false, { message: 'Email ou mot de passe incorrect' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Stratégie JWT
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.jwt.secret
    },
    async (payload, done) => {
      try {
        const user = await User.findByPk(payload.id, {
          include: ['company', 'roles']
        });

        if (!user) {
          return done(null, false);
        }

        if (user.status !== 'ACTIVE') {
          return done(null, false);
        }

        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

// Sérialisation/Désérialisation pour les sessions
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id, {
      include: ['company', 'roles']
    });
    done(null, user);
  } catch (error) {
    done(error);
  }
});

module.exports = passport;