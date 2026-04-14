import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { companyService } from '@services/company.service';
import { useQuery } from 'react-query';
import Card from '@components/common/Card';
import Button from '@components/common/Button';
import Input from '@components/common/Input';
import Select from '@components/common/Select';
import Modal from '@components/common/Modal';
import Alert from '@components/common/Alert';
import LogoSys from '@components/LogoSys';
import Footer from '@components/Footer';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const schema = yup.object({
  name: yup.string().required('Nom requis').min(2),
  legalName: yup.string(),
  taxNumber: yup.string(),
  businessSectorId: yup.string().required('Secteur requis'),
  countryId: yup.string().required('Pays requis'),
  address: yup.string().required('Adresse requise'),
  city: yup.string(),
  postalCode: yup.string(),
  email: yup.string().email('Email invalide').required('Email requis'),
  phoneCountryCode: yup.string(),
  phoneNumber: yup.string(),
  website: yup.string().url('URL invalide'),
  executiveName: yup.string().required('Nom du dirigeant requis'),
  executivePositionId: yup.string().required('Poste requis'),
  executiveEmail: yup.string().email('Email invalide').required('Email requis'),
  executivePhoneCode: yup.string(),
  executivePhone: yup.string(),
  adminFirstName: yup.string().required('Prénom admin requis'),
  adminLastName: yup.string().required('Nom admin requis'),
  adminEmail: yup.string().email('Email invalide').required('Email admin requis'),
  adminPhoneCountryCode: yup.string(),
  adminPhoneNumber: yup.string(),
  adminJobPositionId: yup.string().required('Poste admin requis'),
  planCode: yup.string().default('BASIC'),
  userCount: yup.number().min(1).default(5)
});

// DONNÉES DE SECOURS GARANTIES
const FALLBACK_SECTORS = [
  { id: '1', name: 'Technologies de l\'Information' },
  { id: '2', name: 'Commerce et Distribution' },
  { id: '3', name: 'Finance et Assurance' },
  { id: '4', name: 'Agriculture' },
  { id: '5', name: 'Industrie Manufacturière' },
  { id: '6', name: 'Bâtiment et Travaux Publics' },
  { id: '7', name: 'Transport et Logistique' },
  { id: '8', name: 'Santé' },
  { id: '9', name: 'Éducation et Formation' },
  { id: '10', name: 'Tourisme et Hôtellerie' }
];

const FALLBACK_COUNTRIES = [
  { id: '1', name: 'France' },
  { id: '2', name: 'Belgique' },
  { id: '3', name: 'Suisse' },
  { id: '4', name: 'Canada' },
  { id: '5', name: 'Sénégal' },
  { id: '6', name: 'Côte d\'Ivoire' },
  { id: '7', name: 'Cameroun' },
  { id: '8', name: 'Maroc' },
  { id: '9', name: 'Tunisie' },
  { id: '10', name: 'Algérie' }
];

const FALLBACK_POSITIONS = [
  { id: '1', name: 'Directeur Général' },
  { id: '2', name: 'Directeur Administratif et Financier' },
  { id: '3', name: 'Comptable' },
  { id: '4', name: 'Commercial' },
  { id: '5', name: 'Assistant de Direction' },
  { id: '6', name: 'Directeur Logistique' },
  { id: '7', name: 'Directeur Commercial' }
];

const AdminCreateCompany = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showAdminCredentials, setShowAdminCredentials] = useState(false);
  const [createdAdmin, setCreatedAdmin] = useState(null);

  // États locaux pour les options (garantit qu'elles ne sont jamais vides)
  const [sectorOptions, setSectorOptions] = useState([]);
  const [countryOptions, setCountryOptions] = useState([]);
  const [positionOptions, setPositionOptions] = useState([]);

  console.log('🔵 AdminCreateCompany - RENDU');
  console.log('📊 sectorOptions:', sectorOptions.length, sectorOptions);
  console.log('📊 countryOptions:', countryOptions.length, countryOptions);
  console.log('📊 positionOptions:', positionOptions.length, positionOptions);

  // Requête secteurs
  const { isLoading: sectorsLoading } = useQuery(
    'sectors',
    async () => {
      try {
        console.log('🔄 Chargement secteurs depuis API...');
        const res = await companyService.getBusinessSectors();
        console.log('✅ Secteurs API reçus:', res);
        
        const data = res?.data || res;
        if (Array.isArray(data) && data.length > 0) {
          const options = data.map(s => ({ 
            value: String(s.id), 
            label: s.name 
          }));
          console.log('✅ Secteurs traités:', options.length);
          setSectorOptions(options);
        } else {
          console.warn('⚠️ API secteurs vide, utilisation fallback');
          setSectorOptions(FALLBACK_SECTORS.map(s => ({ value: s.id, label: s.name })));
        }
        return res;
      } catch (error) {
        console.error('❌ Erreur API secteurs:', error);
        setSectorOptions(FALLBACK_SECTORS.map(s => ({ value: s.id, label: s.name })));
        return { data: FALLBACK_SECTORS };
      }
    },
    {
      onError: () => {
        console.warn('⚠️ onError - utilisation fallback secteurs');
        setSectorOptions(FALLBACK_SECTORS.map(s => ({ value: s.id, label: s.name })));
      }
    }
  );

  // Requête pays
  const { isLoading: countriesLoading } = useQuery(
    'countries',
    async () => {
      try {
        console.log('🔄 Chargement pays depuis API...');
        const res = await companyService.getCountries();
        console.log('✅ Pays API reçus:', res);
        
        const data = res?.data || res;
        if (Array.isArray(data) && data.length > 0) {
          const options = data.map(c => ({ 
            value: String(c.id), 
            label: c.name 
          }));
          console.log('✅ Pays traités:', options.length);
          setCountryOptions(options);
        } else {
          console.warn('⚠️ API pays vide, utilisation fallback');
          setCountryOptions(FALLBACK_COUNTRIES.map(c => ({ value: c.id, label: c.name })));
        }
        return res;
      } catch (error) {
        console.error('❌ Erreur API pays:', error);
        setCountryOptions(FALLBACK_COUNTRIES.map(c => ({ value: c.id, label: c.name })));
        return { data: FALLBACK_COUNTRIES };
      }
    },
    {
      onError: () => {
        console.warn('⚠️ onError - utilisation fallback pays');
        setCountryOptions(FALLBACK_COUNTRIES.map(c => ({ value: c.id, label: c.name })));
      }
    }
  );

  // Requête postes
  const { isLoading: positionsLoading } = useQuery(
    'jobPositions',
    async () => {
      try {
        console.log('🔄 Chargement postes depuis API...');
        const res = await companyService.getJobPositions();
        console.log('✅ Postes API reçus:', res);
        
        const data = res?.data || res;
        if (Array.isArray(data) && data.length > 0) {
          const options = data.map(p => ({ 
            value: String(p.id), 
            label: p.title || p.name 
          }));
          console.log('✅ Postes traités:', options.length);
          setPositionOptions(options);
        } else {
          console.warn('⚠️ API postes vide, utilisation fallback');
          setPositionOptions(FALLBACK_POSITIONS.map(p => ({ value: p.id, label: p.name })));
        }
        return res;
      } catch (error) {
        console.error('❌ Erreur API postes:', error);
        setPositionOptions(FALLBACK_POSITIONS.map(p => ({ value: p.id, label: p.name })));
        return { data: FALLBACK_POSITIONS };
      }
    },
    {
      onError: () => {
        console.warn('⚠️ onError - utilisation fallback postes');
        setPositionOptions(FALLBACK_POSITIONS.map(p => ({ value: p.id, label: p.name })));
      }
    }
  );

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      planCode: 'BASIC',
      userCount: 5,
      phoneCountryCode: '+33',
      executivePhoneCode: '+33',
      adminPhoneCountryCode: '+33'
    }
  });

  const planCode = watch('planCode');

  const onSubmit = async (data) => {
    console.log('📤 Soumission formulaire:', data);
    setLoading(true);
    try {
      const response = await companyService.createCompany(data);
      console.log('✅ Réponse création entreprise:', response);
      toast.success('Entreprise créée avec succès');
      
      if (response.data?.data?.adminCredentials) {
        setCreatedAdmin(response.data.data.adminCredentials);
        setShowAdminCredentials(true);
      } else {
        navigate('/admin/companies');
      }
    } catch (error) {
      console.error('❌ Erreur création entreprise:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowAdminCredentials(false);
    navigate('/admin/companies');
  };

  // Initialiser avec les fallbacks si les options sont vides après 2 secondes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (sectorOptions.length === 0) {
        console.warn('⚠️ Timeout - initialisation fallback secteurs');
        setSectorOptions(FALLBACK_SECTORS.map(s => ({ value: s.id, label: s.name })));
      }
      if (countryOptions.length === 0) {
        console.warn('⚠️ Timeout - initialisation fallback pays');
        setCountryOptions(FALLBACK_COUNTRIES.map(c => ({ value: c.id, label: c.name })));
      }
      if (positionOptions.length === 0) {
        console.warn('⚠️ Timeout - initialisation fallback postes');
        setPositionOptions(FALLBACK_POSITIONS.map(p => ({ value: p.id, label: p.name })));
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/admin/companies')} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <LogoSys size="small" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nouvelle entreprise</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Créer une nouvelle entreprise cliente
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="page-container max-w-4xl mx-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card title="Informations de l'entreprise" className="mb-6">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nom de l'entreprise"
                {...register('name')}
                error={errors.name?.message}
                required
              />
              <Input
                label="Nom légal"
                {...register('legalName')}
                error={errors.legalName?.message}
              />
              <Input
                label="Numéro fiscal"
                {...register('taxNumber')}
                error={errors.taxNumber?.message}
              />
              
              {/* SELECT SECTEUR - AVEC DÉBOGAGE */}
              <div className="relative">
                <Select
                  label="Secteur d'activité"
                  {...register('businessSectorId')}
                  error={errors.businessSectorId?.message}
                  options={sectorOptions}
                  placeholder={sectorsLoading && sectorOptions.length === 0 ? "Chargement..." : "Sélectionner un secteur"}
                  disabled={sectorsLoading && sectorOptions.length === 0}
                  required
                />
                <span className="absolute -top-2 right-0 text-xs text-gray-400">
                  ({sectorOptions.length} options)
                </span>
              </div>
              
              {/* SELECT PAYS - AVEC DÉBOGAGE */}
              <div className="relative">
                <Select
                  label="Pays"
                  {...register('countryId')}
                  error={errors.countryId?.message}
                  options={countryOptions}
                  placeholder={countriesLoading && countryOptions.length === 0 ? "Chargement..." : "Sélectionner un pays"}
                  disabled={countriesLoading && countryOptions.length === 0}
                  required
                />
                <span className="absolute -top-2 right-0 text-xs text-gray-400">
                  ({countryOptions.length} options)
                </span>
              </div>
              
              <Input
                label="Adresse"
                {...register('address')}
                error={errors.address?.message}
                required
                className="col-span-2"
              />
              <Input
                label="Ville"
                {...register('city')}
                error={errors.city?.message}
              />
              <Input
                label="Code postal"
                {...register('postalCode')}
                error={errors.postalCode?.message}
              />
              <Input
                label="Email"
                type="email"
                {...register('email')}
                error={errors.email?.message}
                required
              />
              <Input
                label="Site web"
                {...register('website')}
                error={errors.website?.message}
                placeholder="https://"
              />
              <div className="flex gap-2">
                <Input
                  label="Indicatif"
                  {...register('phoneCountryCode')}
                  className="w-24"
                />
                <Input
                  label="Téléphone"
                  {...register('phoneNumber')}
                  className="flex-1"
                />
              </div>
            </div>
          </Card>

          <Card title="Informations du dirigeant" className="mb-6">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nom complet"
                {...register('executiveName')}
                error={errors.executiveName?.message}
                required
                className="col-span-2"
              />
              <div className="relative">
                <Select
                  label="Poste"
                  {...register('executivePositionId')}
                  error={errors.executivePositionId?.message}
                  options={positionOptions}
                  placeholder={positionsLoading && positionOptions.length === 0 ? "Chargement..." : "Sélectionner un poste"}
                  disabled={positionsLoading && positionOptions.length === 0}
                  required
                />
                <span className="absolute -top-2 right-0 text-xs text-gray-400">
                  ({positionOptions.length} options)
                </span>
              </div>
              <Input
                label="Email"
                type="email"
                {...register('executiveEmail')}
                error={errors.executiveEmail?.message}
                required
              />
              <div className="flex gap-2">
                <Input
                  label="Indicatif"
                  {...register('executivePhoneCode')}
                  className="w-24"
                />
                <Input
                  label="Téléphone"
                  {...register('executivePhone')}
                  className="flex-1"
                />
              </div>
            </div>
          </Card>

          <Card title="Administrateur de l'entreprise" className="mb-6">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Prénom"
                {...register('adminFirstName')}
                error={errors.adminFirstName?.message}
                required
              />
              <Input
                label="Nom"
                {...register('adminLastName')}
                error={errors.adminLastName?.message}
                required
              />
              <Input
                label="Email"
                type="email"
                {...register('adminEmail')}
                error={errors.adminEmail?.message}
                required
                className="col-span-2"
              />
              <div className="relative">
                <Select
                  label="Poste"
                  {...register('adminJobPositionId')}
                  error={errors.adminJobPositionId?.message}
                  options={positionOptions}
                  placeholder={positionsLoading && positionOptions.length === 0 ? "Chargement..." : "Sélectionner un poste"}
                  disabled={positionsLoading && positionOptions.length === 0}
                  required
                />
                <span className="absolute -top-2 right-0 text-xs text-gray-400">
                  ({positionOptions.length} options)
                </span>
              </div>
              <div className="flex gap-2">
                <Input
                  label="Indicatif"
                  {...register('adminPhoneCountryCode')}
                  className="w-24"
                />
                <Input
                  label="Téléphone"
                  {...register('adminPhoneNumber')}
                  className="flex-1"
                />
              </div>
            </div>
          </Card>

          <Card title="Abonnement" className="mb-6">
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Plan"
                {...register('planCode')}
                options={[
                  { value: 'BASIC', label: 'Basic - Gratuit (5 utilisateurs)' },
                  { value: 'PRO', label: 'Pro - 100$/utilisateur (50 max)' },
                  { value: 'ENTERPRISE', label: 'Enterprise - 150$/utilisateur (100+ max)' }
                ]}
              />
              <Input
                label="Nombre d'utilisateurs"
                type="number"
                {...register('userCount')}
                error={errors.userCount?.message}
                min={1}
                max={planCode === 'BASIC' ? 5 : planCode === 'PRO' ? 50 : 500}
              />
            </div>
            {planCode !== 'BASIC' && (
              <p className="mt-2 text-sm text-gray-500">
                Prix estimé : {planCode === 'PRO' ? '100$' : '150$'} × {watch('userCount') || 0} = {' '}
                {(planCode === 'PRO' ? 100 : 150) * (watch('userCount') || 0)}$ / mois
              </p>
            )}
          </Card>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => navigate('/admin/companies')}>
              Annuler
            </Button>
            <Button type="submit" loading={loading}>
              Créer l'entreprise
            </Button>
          </div>
        </form>
      </div>

      {showAdminCredentials && (
        <Modal
          isOpen={showAdminCredentials}
          onClose={handleCloseModal}
          title="Entreprise créée avec succès"
        >
          <div className="space-y-4">
            <Alert type="success">
              L'entreprise a été créée avec succès. Voici les identifiants de l'administrateur :
            </Alert>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p><strong>Email :</strong> {createdAdmin?.email}</p>
              <p><strong>Mot de passe temporaire :</strong> {createdAdmin?.temporaryPassword}</p>
            </div>
            
            <p className="text-sm text-gray-500">
              Ces identifiants doivent être communiqués à l'administrateur de l'entreprise.
              Il devra changer son mot de passe lors de sa première connexion.
            </p>
            
            <div className="flex justify-end">
              <Button onClick={handleCloseModal}>
                Fermer
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <Footer />
    </div>
  );
};

export default AdminCreateCompany;