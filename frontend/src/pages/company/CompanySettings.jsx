import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { companyService } from '@services/company.service';
import { useAuthStore } from '@store/auth.store';
import Card from '@components/common/Card';
import Button from '@components/common/Button';
import Input from '@components/common/Input';
import Select from '@components/common/Select';
import Tabs from '@components/common/Tabs';
import LogoSys from '@components/LogoSys';
import Footer from '@components/Footer';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const CompanySettings = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('general');
  
  const companyId = user?.companyId;
  const isSystemAdmin = user?.isSystemAdmin;

  const { data: settings, isLoading: settingsLoading } = useQuery(
    ['company-settings', companyId],
    () => companyService.getCompanySettings(companyId),
    { enabled: !!companyId && !isSystemAdmin }
  );

  const { data: company, isLoading: companyLoading } = useQuery(
    ['company-details', companyId],
    () => companyService.getCompanyById(companyId),
    { enabled: !!companyId && !isSystemAdmin }
  );

  const updateMutation = useMutation(
    (data) => companyService.updateCompanySettings(companyId, data),
    {
      onSuccess: () => {
        toast.success('Paramètres mis à jour avec succès');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
      }
    }
  );

  const { register: registerGeneral, handleSubmit: handleGeneralSubmit, reset: resetGeneral } = useForm();
  const { register: registerSecurity, handleSubmit: handleSecuritySubmit } = useForm();
  const { register: registerNotifications, handleSubmit: handleNotificationsSubmit } = useForm();

  useEffect(() => {
    if (company?.data?.data) {
      const companyData = company.data.data;
      resetGeneral({
        companyName: companyData.name,
        email: companyData.email,
        phone: companyData.phoneNumber,
        address: companyData.address,
        city: companyData.city,
        postalCode: companyData.postalCode,
        country: companyData.country?.id
      });
    }
  }, [company, resetGeneral]);

  const onGeneralSubmit = (data) => {
    updateMutation.mutate({ settings: { general: data } });
  };

  const onSecuritySubmit = (data) => {
    updateMutation.mutate({ settings: { security: data } });
  };

  const onNotificationsSubmit = (data) => {
    updateMutation.mutate({ settings: { notifications: data } });
  };

  // ✅ Si admin système, afficher un message
  if (isSystemAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="px-6 py-4">
            <div className="flex items-center space-x-4">
              <LogoSys size="small" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Paramètres de l'entreprise</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Configurez les paramètres de votre entreprise
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="page-container max-w-3xl mx-auto">
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                En tant qu'administrateur système, vous n'êtes pas rattaché à une entreprise spécifique.
              </p>
              <p className="text-gray-500 mb-6">
                Accédez à la gestion des entreprises pour configurer leurs paramètres.
              </p>
              <Button onClick={() => navigate('/admin/companies')}>
                Gérer les entreprises
              </Button>
            </div>
          </Card>
        </div>

        <Footer />
      </div>
    );
  }

  const isLoading = settingsLoading || companyLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tabs = [
    {
      id: 'general',
      label: 'Général',
      content: (
        <form onSubmit={handleGeneralSubmit(onGeneralSubmit)} className="space-y-4">
          <Input
            label="Nom de l'entreprise"
            {...registerGeneral('companyName')}
          />
          <Input
            label="Email"
            type="email"
            {...registerGeneral('email')}
          />
          <Input
            label="Téléphone"
            {...registerGeneral('phone')}
          />
          <Input
            label="Adresse"
            {...registerGeneral('address')}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Ville"
              {...registerGeneral('city')}
            />
            <Input
              label="Code postal"
              {...registerGeneral('postalCode')}
            />
          </div>
          <Select
            label="Pays"
            {...registerGeneral('country')}
            options={[]}
          />
          <Button type="submit" loading={updateMutation.isLoading}>
            Enregistrer
          </Button>
        </form>
      )
    },
    {
      id: 'security',
      label: 'Sécurité',
      content: (
        <form onSubmit={handleSecuritySubmit(onSecuritySubmit)} className="space-y-4">
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                {...registerSecurity('require2FA')}
                className="rounded"
              />
              <span className="ml-2">Exiger l'authentification à deux facteurs</span>
            </label>
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                {...registerSecurity('passwordExpiration')}
                className="rounded"
              />
              <span className="ml-2">Expiration du mot de passe (90 jours)</span>
            </label>
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                {...registerSecurity('sessionTimeout')}
                className="rounded"
              />
              <span className="ml-2">Déconnexion automatique après inactivité</span>
            </label>
          </div>
          <Button type="submit" loading={updateMutation.isLoading}>
            Enregistrer
          </Button>
        </form>
      )
    },
    {
      id: 'notifications',
      label: 'Notifications',
      content: (
        <form onSubmit={handleNotificationsSubmit(onNotificationsSubmit)} className="space-y-4">
          <h3 className="font-semibold">Notifications par défaut</h3>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                {...registerNotifications('emailNotifications')}
                defaultChecked
                className="rounded"
              />
              <span className="ml-2">Notifications par email</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                {...registerNotifications('smsNotifications')}
                className="rounded"
              />
              <span className="ml-2">Notifications par SMS</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                {...registerNotifications('pushNotifications')}
                defaultChecked
                className="rounded"
              />
              <span className="ml-2">Notifications push</span>
            </label>
          </div>
          <Button type="submit" loading={updateMutation.isLoading}>
            Enregistrer
          </Button>
        </form>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center space-x-4">
            <LogoSys size="small" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Paramètres de l'entreprise</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Configurez les paramètres de votre entreprise
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="page-container max-w-3xl mx-auto">
        <Card>
          <Tabs tabs={tabs} defaultTab={activeTab} onChange={setActiveTab} />
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default CompanySettings;