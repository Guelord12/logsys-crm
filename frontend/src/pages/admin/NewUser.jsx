import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { userService } from '@services/user.service';
import { companyService } from '@services/company.service';
import Card from '@components/common/Card';
import Button from '@components/common/Button';
import Input from '@components/common/Input';
import LogoSys from '@components/LogoSys';
import Footer from '@components/Footer';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const NewUser = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    firstName: '',
    lastName: '',
    companyId: '',
    userTypeId: '',
    jobPositionId: '',
    isSystemAdmin: false,
    isCompanyAdmin: false,
    phoneCountryCode: '',
    phoneNumber: '',
    status: 'ACTIVE'
  });

  const { data: companies } = useQuery('companies', () => companyService.getAllCompanies());
  const { data: userTypes } = useQuery('user-types', () => userService.getUserTypes());
  const { data: jobPositions } = useQuery('job-positions', () => userService.getJobPositions());

  const companiesList = companies?.data?.data?.companies || companies?.data?.data || [];
  const userTypesList = userTypes?.data?.data || [];
  const jobPositionsList = jobPositions?.data?.data || [];

  const createMutation = useMutation(
    (data) => userService.createUser(data),
    {
      onSuccess: () => {
        toast.success('Utilisateur créé avec succès');
        navigate('/admin/users');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la création');
      }
    }
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.email) {
      toast.error('L\'email est requis');
      return;
    }
    
    if (!formData.firstName || !formData.lastName) {
      toast.error('Le nom et prénom sont requis');
      return;
    }
    
    createMutation.mutate({
      ...formData,
      fullName: `${formData.firstName} ${formData.lastName}`
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <LogoSys size="small" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Nouvel utilisateur</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Créer un nouvel utilisateur dans le système
                </p>
              </div>
            </div>
            <Button variant="secondary" onClick={() => navigate('/admin/users')}>
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </div>
        </div>
      </div>

      <div className="page-container">
        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Informations de connexion</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Email *</label>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="utilisateur@exemple.com"
                  required
                />
              </div>

              <div>
                <label className="label">Nom d'utilisateur</label>
                <Input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Nom d'utilisateur"
                />
              </div>
            </div>
          </Card>

          <Card className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Informations personnelles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Prénom *</label>
                <Input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Prénom"
                  required
                />
              </div>

              <div>
                <label className="label">Nom *</label>
                <Input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Nom"
                  required
                />
              </div>

              <div>
                <label className="label">Indicatif téléphone</label>
                <Input
                  name="phoneCountryCode"
                  value={formData.phoneCountryCode}
                  onChange={handleChange}
                  placeholder="+33"
                />
              </div>

              <div>
                <label className="label">Numéro de téléphone</label>
                <Input
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="612345678"
                />
              </div>
            </div>
          </Card>

          <Card className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Affectation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Entreprise</label>
                <select
                  name="companyId"
                  value={formData.companyId}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">Sélectionner une entreprise</option>
                  {companiesList.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Type d'utilisateur</label>
                <select
                  name="userTypeId"
                  value={formData.userTypeId}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">Sélectionner un type</option>
                  {userTypesList.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Poste</label>
                <select
                  name="jobPositionId"
                  value={formData.jobPositionId}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">Sélectionner un poste</option>
                  {jobPositionsList.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Statut</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="ACTIVE">Actif</option>
                  <option value="INACTIVE">Inactif</option>
                  <option value="PENDING_ACTIVATION">En attente d'activation</option>
                </select>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Permissions</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="isSystemAdmin"
                  checked={formData.isSystemAdmin}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Administrateur Système</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="isCompanyAdmin"
                  checked={formData.isCompanyAdmin}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Administrateur d'entreprise</span>
              </label>
            </div>
          </Card>

          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" variant="ghost" onClick={() => navigate('/admin/users')}>
              Annuler
            </Button>
            <Button type="submit" loading={createMutation.isLoading}>
              Créer l'utilisateur
            </Button>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
};

export default NewUser;