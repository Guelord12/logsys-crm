import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuthStore } from '@store/auth.store';
import {
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  KeyIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import Card from '@components/common/Card';
import Button from '@components/common/Button';
import Input from '@components/common/Input';
import LogoSys from '@components/LogoSys';
import Footer from '@components/Footer';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const profileSchema = yup.object({
  firstName: yup.string().min(2).required('Prénom requis'),
  lastName: yup.string().min(2).required('Nom requis'),
  phoneNumber: yup.string().nullable(),
  phoneCountryCode: yup.string().nullable(),
  languagePreference: yup.string(),
  timezone: yup.string()
});

const passwordSchema = yup.object({
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

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile,
    setValue: setProfileValue
  } = useForm({
    resolver: yupResolver(profileSchema)
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword
  } = useForm({
    resolver: yupResolver(passwordSchema)
  });

  // Initialiser les valeurs du formulaire quand l'utilisateur est chargé
  useEffect(() => {
    if (user) {
      setProfileValue('firstName', user.firstName || '');
      setProfileValue('lastName', user.lastName || '');
      setProfileValue('phoneNumber', user.phoneNumber || '');
      setProfileValue('phoneCountryCode', user.phoneCountryCode || '');
      setProfileValue('languagePreference', user.languagePreference || 'fr');
      setProfileValue('timezone', user.timezone || 'UTC');
    }
  }, [user, setProfileValue]);

  const onProfileSubmit = async (data) => {
    setProfileLoading(true);
    try {
      const result = await updateProfile(data);
      
      if (result.success) {
        toast.success('Profil mis à jour avec succès');
        setIsEditing(false);
      } else {
        toast.error(result.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du profil');
      console.error('Profile update error:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    setPasswordLoading(true);
    try {
      const result = await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      
      if (result.success) {
        toast.success('Mot de passe modifié avec succès');
        resetPassword();
      } else {
        toast.error(result.error || 'Erreur lors du changement de mot de passe');
      }
    } catch (error) {
      toast.error('Erreur lors du changement de mot de passe');
      console.error('Password change error:', error);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCancel = () => {
    resetProfile();
    setIsEditing(false);
  };

  const handleEdit = () => {
    // Réinitialiser avec les valeurs actuelles
    setProfileValue('firstName', user?.firstName || '');
    setProfileValue('lastName', user?.lastName || '');
    setProfileValue('phoneNumber', user?.phoneNumber || '');
    setProfileValue('phoneCountryCode', user?.phoneCountryCode || '');
    setIsEditing(true);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center space-x-4">
            <LogoSys size="small" />
            <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
          </div>
        </div>
      </div>

      <div className="page-container max-w-4xl mx-auto py-6">
        {/* Informations générales */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} className="w-20 h-20 rounded-full" />
                ) : (
                  <UserCircleIcon className="w-12 h-12 text-blue-600" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{user?.fullName}</h2>
                <p className="text-gray-500">{user?.email}</p>
                <div className="flex items-center space-x-2 mt-1">
                  {user?.isSystemAdmin && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <ShieldCheckIcon className="w-3 h-3 mr-1" />
                      Admin Système
                    </span>
                  )}
                  {user?.isCompanyAdmin && !user?.isSystemAdmin && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <ShieldCheckIcon className="w-3 h-3 mr-1" />
                      Admin Entreprise
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <EnvelopeIcon className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user?.email}</p>
                  {user?.emailVerified ? (
                    <span className="text-xs text-green-600 flex items-center">
                      <CheckCircleIcon className="w-3 h-3 mr-1" />
                      Vérifié
                    </span>
                  ) : (
                    <span className="text-xs text-orange-600">Non vérifié</span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <PhoneIcon className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Téléphone</p>
                  <p className="font-medium">
                    {user?.phoneNumber 
                      ? `${user.phoneCountryCode || ''} ${user.phoneNumber}` 
                      : 'Non renseigné'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <BuildingOfficeIcon className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Entreprise</p>
                  <p className="font-medium">{user?.company?.name || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <KeyIcon className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Dernière connexion</p>
                  <p className="font-medium">
                    {user?.lastLoginAt 
                      ? new Date(user.lastLoginAt).toLocaleString() 
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Onglets */}
        <Card>
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                className={clsx(
                  'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                  activeTab === 'profile'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
                onClick={() => setActiveTab('profile')}
              >
                Informations personnelles
              </button>
              <button
                className={clsx(
                  'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                  activeTab === 'security'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
                onClick={() => setActiveTab('security')}
              >
                Sécurité
              </button>
              <button
                className={clsx(
                  'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                  activeTab === 'preferences'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
                onClick={() => setActiveTab('preferences')}
              >
                Préférences
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSubmit(onProfileSubmit)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Prénom"
                    {...registerProfile('firstName')}
                    error={profileErrors.firstName?.message}
                    disabled={!isEditing}
                  />
                  <Input
                    label="Nom"
                    {...registerProfile('lastName')}
                    error={profileErrors.lastName?.message}
                    disabled={!isEditing}
                  />
                  <Input
                    label="Indicatif téléphonique"
                    {...registerProfile('phoneCountryCode')}
                    error={profileErrors.phoneCountryCode?.message}
                    disabled={!isEditing}
                    placeholder="+33"
                  />
                  <Input
                    label="Numéro de téléphone"
                    {...registerProfile('phoneNumber')}
                    error={profileErrors.phoneNumber?.message}
                    disabled={!isEditing}
                    placeholder="612345678"
                  />
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  {isEditing ? (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleCancel}
                      >
                        Annuler
                      </Button>
                      <Button
                        type="submit"
                        loading={profileLoading}
                      >
                        Enregistrer
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleEdit}
                    >
                      Modifier
                    </Button>
                  )}
                </div>
              </form>
            )}

            {activeTab === 'security' && (
              <form onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
                <div className="max-w-md space-y-4">
                  <Input
                    label="Mot de passe actuel"
                    type="password"
                    {...registerPassword('currentPassword')}
                    error={passwordErrors.currentPassword?.message}
                  />
                  <Input
                    label="Nouveau mot de passe"
                    type="password"
                    {...registerPassword('newPassword')}
                    error={passwordErrors.newPassword?.message}
                    helper="Au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial"
                  />
                  <Input
                    label="Confirmer le mot de passe"
                    type="password"
                    {...registerPassword('confirmPassword')}
                    error={passwordErrors.confirmPassword?.message}
                  />
                </div>

                <div className="flex justify-end mt-6">
                  <Button
                    type="submit"
                    loading={passwordLoading}
                  >
                    Changer le mot de passe
                  </Button>
                </div>
              </form>
            )}

            {activeTab === 'preferences' && (
              <div className="max-w-md space-y-4">
                <div>
                  <label className="label">Langue</label>
                  <select 
                    className="input"
                    value={user?.languagePreference || 'fr'}
                    onChange={(e) => {
                      updateProfile({ languagePreference: e.target.value });
                      toast.success('Préférence de langue mise à jour');
                    }}
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                    <option value="ar">العربية</option>
                    <option value="es">Español</option>
                  </select>
                </div>

                <div>
                  <label className="label">Fuseau horaire</label>
                  <select 
                    className="input"
                    value={user?.timezone || 'UTC'}
                    onChange={(e) => {
                      updateProfile({ timezone: e.target.value });
                      toast.success('Fuseau horaire mis à jour');
                    }}
                  >
                    <option value="UTC">UTC</option>
                    <option value="Europe/Paris">Europe/Paris</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="Asia/Dubai">Asia/Dubai</option>
                  </select>
                </div>

                <div>
                  <label className="label">Notifications</label>
                  <div className="space-y-2 mt-2">
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-blue-600" 
                        defaultChecked={user?.notificationPreferences?.email !== false}
                        onChange={(e) => {
                          updateProfile({ 
                            notificationPreferences: { 
                              ...user?.notificationPreferences, 
                              email: e.target.checked 
                            } 
                          });
                        }}
                      />
                      <span className="ml-2 text-sm">Notifications par email</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-blue-600" 
                        defaultChecked={user?.notificationPreferences?.sms !== false}
                        onChange={(e) => {
                          updateProfile({ 
                            notificationPreferences: { 
                              ...user?.notificationPreferences, 
                              sms: e.target.checked 
                            } 
                          });
                        }}
                      />
                      <span className="ml-2 text-sm">Notifications par SMS</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-blue-600" 
                        defaultChecked={user?.notificationPreferences?.push !== false}
                        onChange={(e) => {
                          updateProfile({ 
                            notificationPreferences: { 
                              ...user?.notificationPreferences, 
                              push: e.target.checked 
                            } 
                          });
                        }}
                      />
                      <span className="ml-2 text-sm">Notifications push</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default Profile;