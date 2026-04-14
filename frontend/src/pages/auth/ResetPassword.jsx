import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { authService } from '@services/auth.service';
import LogoSys from '@components/LogoSys';
import Input from '@components/common/Input';
import Button from '@components/common/Button';
import toast from 'react-hot-toast';

const schema = yup.object({
  password: yup.string().min(8).required('Mot de passe requis'),
  confirmPassword: yup.string().oneOf([yup.ref('password')], 'Les mots de passe ne correspondent pas')
});

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  
  const token = searchParams.get('token');

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });

  const onSubmit = async (data) => {
    if (!token) {
      toast.error('Token de réinitialisation manquant');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(token, data.password);
      toast.success('Mot de passe réinitialisé avec succès');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la réinitialisation');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Lien de réinitialisation invalide</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <LogoSys size="large" asLink={false} />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Nouveau mot de passe</h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Nouveau mot de passe"
            type="password"
            {...register('password')}
            error={errors.password?.message}
          />
          <Input
            label="Confirmer le mot de passe"
            type="password"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />

          <Button type="submit" fullWidth loading={loading}>
            Réinitialiser le mot de passe
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;