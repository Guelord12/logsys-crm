import React, { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import { settingService } from '@services/setting.service';
import Card from '@components/common/Card';
import Button from '@components/common/Button';
import Input from '@components/common/Input';
import LogoSys from '@components/LogoSys';
import Footer from '@components/Footer';
import toast from 'react-hot-toast';

const AdminSettings = () => {
  const [settings, setSettings] = useState({});

  const { data, isLoading, refetch } = useQuery('system-settings', () =>
    settingService.getSettings()
  );

  const updateMutation = useMutation(
    ({ key, value }) => settingService.updateSetting(key, value),
    {
      onSuccess: () => {
        toast.success('Paramètre mis à jour');
        refetch();
      }
    }
  );

  const handleChange = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  const handleSave = (key) => {
    updateMutation.mutate({ key, value: settings[key] });
  };

  if (isLoading) {
    return <div className="flex justify-center py-12">Chargement...</div>;
  }

  const settingsData = data?.data || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center space-x-4">
            <LogoSys size="small" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Paramètres système</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Configuration de la plateforme
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="page-container max-w-3xl mx-auto">
        <Card title="Général" className="mb-6">
          <div className="space-y-4">
            <div className="flex items-end gap-4">
              <Input
                label="Nom du système"
                defaultValue={settingsData['system.name']}
                onChange={(e) => handleChange('system.name', e.target.value)}
                className="flex-1"
              />
              <Button onClick={() => handleSave('system.name')}>Enregistrer</Button>
            </div>
            <div className="flex items-end gap-4">
              <Input
                label="Footer"
                defaultValue={settingsData['system.footer']}
                onChange={(e) => handleChange('system.footer', e.target.value)}
                className="flex-1"
              />
              <Button onClick={() => handleSave('system.footer')}>Enregistrer</Button>
            </div>
            <div className="flex items-end gap-4">
              <Input
                label="Couleur primaire"
                type="color"
                defaultValue={settingsData['system.primary_color'] || '#E6F3FF'}
                onChange={(e) => handleChange('system.primary_color', e.target.value)}
                className="w-32"
              />
              <Button onClick={() => handleSave('system.primary_color')}>Enregistrer</Button>
            </div>
          </div>
        </Card>

        <Card title="Sécurité" className="mb-6">
          <div className="space-y-4">
            <div className="flex items-end gap-4">
              <Input
                label="Longueur minimale du mot de passe"
                type="number"
                defaultValue={settingsData['security.password_min_length']}
                onChange={(e) => handleChange('security.password_min_length', e.target.value)}
                className="w-32"
              />
              <Button onClick={() => handleSave('security.password_min_length')}>Enregistrer</Button>
            </div>
            <div className="flex items-end gap-4">
              <Input
                label="Tentatives de connexion max"
                type="number"
                defaultValue={settingsData['security.max_login_attempts']}
                onChange={(e) => handleChange('security.max_login_attempts', e.target.value)}
                className="w-32"
              />
              <Button onClick={() => handleSave('security.max_login_attempts')}>Enregistrer</Button>
            </div>
            <div className="flex items-end gap-4">
              <Input
                label="Timeout de session (minutes)"
                type="number"
                defaultValue={settingsData['security.session_timeout_minutes']}
                onChange={(e) => handleChange('security.session_timeout_minutes', e.target.value)}
                className="w-32"
              />
              <Button onClick={() => handleSave('security.session_timeout_minutes')}>Enregistrer</Button>
            </div>
          </div>
        </Card>

        <Card title="Notifications">
          <div className="space-y-4">
            <div className="flex items-end gap-4">
              <Input
                label="Email d'envoi"
                type="email"
                defaultValue={settingsData['notification.email_sender']}
                onChange={(e) => handleChange('notification.email_sender', e.target.value)}
                className="flex-1"
              />
              <Button onClick={() => handleSave('notification.email_sender')}>Enregistrer</Button>
            </div>
          </div>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default AdminSettings;