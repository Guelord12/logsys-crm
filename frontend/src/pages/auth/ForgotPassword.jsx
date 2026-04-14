import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { authService } from '@services/auth.service';
import LogoSys from '@components/LogoSys';
import Input from '@components/common/Input';
import Button from '@components/common/Button';
import Alert from '@components/common/Alert';
import toast from 'react-hot-toast';

const schema = yup.object({
  email: yup.string().email('Email invalide').required('Email requis')
});

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authService.forgotPassword(data.email);
      setSubmitted(true);
      toast.success('Email de réinitialisation envoyé');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <LogoSys size="large" asLink={false} />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Mot de passe oublié ?</h2>
          <p className="mt-2 text-sm text-gray-600">
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>

        {submitted ? (
          <Alert type="success" title="Email envoyé !">
            <p>Un email contenant les instructions de réinitialisation a été envoyé à l'adresse indiquée.</p>
            <p className="mt-4">
              <Link to="/login" className="text-blue-600 hover:text-blue-500">
                Retour à la connexion
              </Link>
            </p>
          </Alert>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="Adresse email"
              type="email"
              {...register('email')}
              error={errors.email?.message}
            />

            <Button type="submit" fullWidth loading={loading}>
              Envoyer le lien
            </Button>

            <p className="text-center text-sm text-gray-600">
              <Link to="/login" className="text-blue-600 hover:text-blue-500">
                Retour à la connexion
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;