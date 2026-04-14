import React, { useState } from 'react';
import { useAuthStore } from '@store/auth.store';
import { useThemeStore } from '@store/theme.store';
import Card from '@components/common/Card';
import Button from '@components/common/Button';
import Input from '@components/common/Input';
import Select from '@components/common/Select';
import LogoSys from '@components/LogoSys';
import Footer from '@components/Footer';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const Settings = () => {
  const { user, updateProfile, changePassword } = useAuthStore();
  const { theme, setTheme, primaryColor, setPrimaryColor } = useThemeStore();
  const [activeTab, setActiveTab] = useState('general');
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const { register: registerProfile, handleSubmit: handleProfileSubmit, setValue } = useForm({
    defaultValues: {
      languagePreference: user?.languagePreference || 'fr',
      timezone: user?.timezone || 'UTC'
    }
  });

  const { register: registerPassword, handleSubmit: handlePasswordSubmit, reset: resetPassword, watch } = useForm();
  
  const newPassword = watch('newPassword');

  // Initialiser les valeurs
  React.useEffect(() => {
    if (user) {
      setValue('languagePreference', user.languagePreference || 'fr');
      setValue('timezone', user.timezone || 'UTC');
    }
  }, [user, setValue]);

  const onProfileSubmit = async (data) => {
    setProfileLoading(true);
    try {
      const result = await updateProfile(data);
      if (result.success) {
        toast.success('Préférences mises à jour');
      } else {
        toast.error(result.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setProfileLoading(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    
    setPasswordLoading(true);
    try {
      const result = await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      
      if (result.success) {
        toast.success('Mot de passe modifié');
        resetPassword();
      } else {
        toast.error(result.error || 'Erreur lors du changement');
      }
    } catch (error) {
      toast.error('Erreur lors du changement de mot de passe');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    toast.success(`Thème ${newTheme === 'light' ? 'clair' : 'sombre'} activé`);
  };

  const handleColorChange = (color) => {
    setPrimaryColor(color);
    toast.success('Couleur principale mise à jour');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center space-x-4">
            <LogoSys size="small" />
            <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
          </div>
        </div>
      </div>

      <div className="page-container max-w-3xl mx-auto py-6">
        <Card>
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                className={clsx(
                  'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                  activeTab === 'general'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
                onClick={() => setActiveTab('general')}
              >
                Général
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
                  'px-4 py-3 text14-sm font-medium border-b-2 -mb-px transition-colors',
                  activeTab === 'appearance'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
                onClick={() => setActiveTab('appearance')}
              >
                Apparence
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'general' && (
              <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4 max-w-md">
                <Select
                  label="Langue"
                  options={[
                    { value: 'fr', label: 'Français' },
                    { value: 'en', label: 'English' },
                    { value: 'ar', label: 'العربية' },
                    { value: 'es', label: 'Español' }
                  ]}
                  {...registerProfile('languagePreference')}
                />
                <Select
                  label="Fuseau horaire"
                  options={[
                    { value: 'UTC', label: 'UTC' },
                    { value: 'Europe/Paris', label: 'Europe/Paris' },
                    { value: 'Europe/London', label: 'Europe/London' },
                    { value: 'America/New_York', label: 'America/New_York' },
                    { value: 'Asia/Dubai', label: 'Asia/Dubai' }
                  ]}
                  {...registerProfile('timezone')}
                />
                <div className="pt-4">
                  <Button type="submit" loading={profileLoading}>
                    Enregistrer les préférences
                  </Button>
                </div>
              </form>
            )}

            {activeTab === 'security' && (
              <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
                <Input
                  label="Mot de passe actuel"
                  type="password"
                  {...registerPassword('currentPassword', { required: 'Mot de passe actuel requis' })}
                />
                <Input
                  label="Nouveau mot de passe"
                  type="password"
                  {...registerPassword('newPassword', { 
                    required: 'Nouveau mot de passe requis',
                    minLength: { value: 8, message: 'Au moins 8 caractères' }
                  })}
                />
                <Input
                  label="Confirmer le mot de passe"
                  type="password"
                  {...registerPassword('confirmPassword', {
                    required: 'Confirmation requise',
                    validate: value => value === newPassword || 'Les mots de passe ne correspondent pas'
                  })}
                />
                <div className="pt-4">
                  <Button type="submit" loading={passwordLoading}>
                    Changer le mot de passe
                  </Button>
                </div>
              </form>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Thème</label>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => handleThemeChange('light')}
                      className={clsx(
                        'px-6 py-3 rounded-lg border-2 transition-all',
                        theme === 'light'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      )}
                    >
                      <span className="mr-2">☀️</span> Clair
                    </button>
                    <button
                      type="button"
                      onClick={() => handleThemeChange('dark')}
                      className={clsx(
                        'px-6 py-3 rounded-lg border-2 transition-all',
                        theme === 'dark'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      )}
                    >
                      <span className="mr-2">🌙</span> Sombre
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Couleur principale</label>
                  <div className="flex space-x-3">
                    {['#4A90E2', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'].map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleColorChange(color)}
                        className="w-10 h-10 rounded-full border-2 transition-all hover:scale-110"
                        style={{ 
                          backgroundColor: color,
                          borderColor: primaryColor === color ? '#1F2937' : 'transparent',
                          boxShadow: primaryColor === color ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : 'none'
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <p className="text-sm text-gray-500">
                    Ces préférences sont enregistrées automatiquement.
                  </p>
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

export default Settings;