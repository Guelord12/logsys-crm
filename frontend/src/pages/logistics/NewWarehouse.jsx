import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from 'react-query';
import { logisticService } from '@services/logistic.service';
import Card from '@components/common/Card';
import Button from '@components/common/Button';
import Input from '@components/common/Input';
import LogoSys from '@components/LogoSys';
import Footer from '@components/Footer';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const NewWarehouse = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    warehouseName: '',
    warehouseType: 'MAIN',
    address: '',
    city: '',
    postalCode: '',
    countryId: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    capacityCubicMeters: '',
    capacityPallets: '',
    capacityUnits: ''
  });

  const createMutation = useMutation(
    (data) => logisticService.createWarehouse(data),
    {
      onSuccess: () => {
        toast.success('Entrepôt créé avec succès');
        queryClient.invalidateQueries('warehouses');
        navigate('/logistics/warehouses');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la création');
      }
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.warehouseName || !formData.address) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }
    
    createMutation.mutate(formData);
  };

  const warehouseTypes = [
    { value: 'MAIN', label: 'Principal' },
    { value: 'DISTRIBUTION', label: 'Distribution' },
    { value: 'TEMPORARY', label: 'Temporaire' },
    { value: 'TRANSIT', label: 'Transit' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <LogoSys size="small" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Nouvel entrepôt</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Créer un nouvel entrepôt de stockage
                </p>
              </div>
            </div>
            <Button variant="secondary" onClick={() => navigate('/logistics/warehouses')}>
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </div>
        </div>
      </div>

      <div className="page-container">
        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Informations générales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Nom de l'entrepôt *</label>
                <Input
                  name="warehouseName"
                  value={formData.warehouseName}
                  onChange={handleChange}
                  placeholder="Ex: Entrepôt Principal"
                  required
                />
              </div>

              <div>
                <label className="label">Type d'entrepôt</label>
                <select
                  name="warehouseType"
                  value={formData.warehouseType}
                  onChange={handleChange}
                  className="input"
                >
                  {warehouseTypes.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="label">Adresse *</label>
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Adresse complète"
                  required
                />
              </div>

              <div>
                <label className="label">Ville</label>
                <Input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Ville"
                />
              </div>

              <div>
                <label className="label">Code postal</label>
                <Input
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  placeholder="Code postal"
                />
              </div>

              <div>
                <label className="label">Pays</label>
                <Input
                  name="countryId"
                  value={formData.countryId}
                  onChange={handleChange}
                  placeholder="ID du pays"
                />
              </div>
            </div>
          </Card>

          <Card className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Personne de contact</label>
                <Input
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  placeholder="Nom du responsable"
                />
              </div>

              <div>
                <label className="label">Téléphone</label>
                <Input
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  placeholder="+XXX XXX XXX XXX"
                />
              </div>

              <div>
                <label className="label">Email</label>
                <Input
                  name="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  placeholder="contact@entrepot.com"
                />
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Capacité</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Capacité (m³)</label>
                <Input
                  name="capacityCubicMeters"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.capacityCubicMeters}
                  onChange={handleChange}
                  placeholder="Volume en m³"
                />
              </div>

              <div>
                <label className="label">Capacité (palettes)</label>
                <Input
                  name="capacityPallets"
                  type="number"
                  min="0"
                  value={formData.capacityPallets}
                  onChange={handleChange}
                  placeholder="Nombre de palettes"
                />
              </div>

              <div>
                <label className="label">Capacité (unités)</label>
                <Input
                  name="capacityUnits"
                  type="number"
                  min="0"
                  value={formData.capacityUnits}
                  onChange={handleChange}
                  placeholder="Nombre d'unités"
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" variant="ghost" onClick={() => navigate('/logistics/warehouses')}>
              Annuler
            </Button>
            <Button type="submit" loading={createMutation.isLoading}>
              Créer l'entrepôt
            </Button>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
};

export default NewWarehouse;