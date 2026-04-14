const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate, validateRefreshToken } = require('../middleware/auth.middleware');
const { validate, schemas } = require('../middleware/validation.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');

// Routes publiques (sans authentification)
router.post('/login', authLimiter, validate(schemas.login), authController.login);
router.post('/forgot-password', validate(schemas.forgotPassword), authController.forgotPassword);
router.post('/reset-password', validate(schemas.resetPassword), authController.resetPassword);
router.get('/verify-email/:token', authController.verifyEmail);

// Routes protégées (avec authentification)
router.post('/register', authenticate, validate(schemas.register), authController.register);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh-token', validateRefreshToken, authController.refreshToken);
router.post('/change-password', authenticate, validate(schemas.changePassword), authController.changePassword);
router.get('/me', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);

module.exports = router;