// frontend/src/pages/auth/ForcePasswordChange.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuthStore } from '@store/auth.store';
import LogoSys from '@components/LogoSys';
import Button from '@components/common/Button';
import Input from '@components/common/Input';
import Alert from '@components/common/Alert';
import toast from 'react-hot-toast';

const schema = yup.object({
  currentPassword: yup.string().required('Mot de passe actuel requis'),
  newPassword: yup.string()
    .min(8, 'Au moins 8 caractères')
    .matches(/[A-Z]/, 'Une majuscule requise')
    .matches(/[a-z]/, 'Une minuscule requise')
    .matches(/\d/, 'Un chiffre requis')
    .matches(/[@$!%*?&]/, 'Un caractère spécial requis')
    .required('Nouveau mot de passe requis'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('newPassword')], 'Les mots de passe ne correspondent pas')
    .required('Confirmation requise')
});

const ForcePasswordChange = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, changePassword, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  
  const mandatory = location.state?.mandatory || false;
  const changeReason = location.state?.reason || 'temporary_password';
  
  useEffect(() => {
    // Déterminer la raison du changement obligatoire
    const reasons = {
      temporary_password: 'Vous utilisez un mot de passe temporaire.',
      forced: 'Un administrateur a demandé le changement de votre mot de passe.',
      expired: 'Votre mot de passe a expiré (plus de 90 jours).'
    };
    setReason(reasons[changeReason] || 'Votre mot de passe doit être changé.');
    
    // Bloquer la navigation si obligatoire
    if (mandatory) {
      const handleBeforeUnload = (e) => {
        e.preventDefault();
        e.returnValue = '';
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [mandatory, changeReason]);
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });
  
  const onSubmit = async (data) => {
    setLoading(true);
    
    try {
      const result = await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      
      if (result.success) {
        toast.success('Mot de passe changé avec succès !');
        
        if (mandatory) {
          // Attendre un peu puis recharger
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1500);
        } else {
          navigate('/dashboard');
        }
      } else {
        toast.error(result.error || 'Erreur lors du changement de mot de passe');
      }
    } catch (error) {
      toast.error('Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <LogoSys size="large" asLink={false} />
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Changement de mot de passe requis
          </h2>
          
          <Alert type="warning" className="mb-6">
            <p>{reason}</p>
            <p className="mt-2 font-medium">
              Vous devez changer votre mot de passe avant de continuer.
            </p>
          </Alert>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Mot de passe actuel (temporaire)"
              type="password"
              {...register('currentPassword')}
              error={errors.currentPassword?.message}
              placeholder="Entrez votre mot de passe actuel"
            />
            
            <Input
              label="Nouveau mot de passe"
              type="password"
              {...register('newPassword')}
              error={errors.newPassword?.message}
              placeholder="Choisissez un nouveau mot de passe"
            />
            
            <div className="text-xs text-gray-500 -mt-2">
              Le mot de passe doit contenir au moins 8 caractères, une majuscule, 
              une minuscule, un chiffre et un caractère spécial.
            </div>
            
            <Input
              label="Confirmer le mot de passe"
              type="password"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
              placeholder="Confirmez votre nouveau mot de passe"
            />
            
            <div className="pt-4">
              <Button type="submit" fullWidth loading={loading}>
                Changer le mot de passe
              </Button>
            </div>
          </form>
          
          {!mandatory && (
            <div className="mt-4 text-center">
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Se déconnecter
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForcePasswordChange;