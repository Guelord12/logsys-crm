import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { authService } from '@services/auth.service';
import LogoSys from '@components/LogoSys';
import Input from '@components/common/Input';
import Button from '@components/common/Button';
import toast from 'react-hot-toast';

const schema = yup.object({
  firstName: yup.string().min(2).required('Prénom requis'),
  lastName: yup.string().min(2).required('Nom requis'),
  email: yup.string().email('Email invalide').required('Email requis'),
  password: yup.string().min(8).required('Mot de passe requis'),
  confirmPassword: yup.string().oneOf([yup.ref('password')], 'Les mots de passe ne correspondent pas'),
  acceptTerms: yup.boolean().oneOf([true], 'Vous devez accepter les conditions')
});

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authService.register(data);
      toast.success('Inscription réussie ! Vérifiez votre email pour activer votre compte.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <LogoSys size="large" asLink={false} />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Créer un compte</h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Prénom" {...register('firstName')} error={errors.firstName?.message} />
            <Input label="Nom" {...register('lastName')} error={errors.lastName?.message} />
          </div>
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
          <Input label="Mot de passe" type="password" {...register('password')} error={errors.password?.message} />
          <Input label="Confirmer le mot de passe" type="password" {...register('confirmPassword')} error={errors.confirmPassword?.message} />
          
          <div>
            <label className="flex items-center">
              <input type="checkbox" {...register('acceptTerms')} className="rounded border-gray-300" />
              <span className="ml-2 text-sm text-gray-600">
                J'accepte les{' '}
                <a href="/terms" className="text-blue-600 hover:text-blue-500">conditions d'utilisation</a>
              </span>
            </label>
            {errors.acceptTerms && (
              <p className="mt-1 text-sm text-red-600">{errors.acceptTerms.message}</p>
            )}
          </div>

          <Button type="submit" fullWidth loading={loading}>
            S'inscrire
          </Button>

          <p className="text-center text-sm text-gray-600">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-500">
              Se connecter
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;