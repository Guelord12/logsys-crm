import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { logisticService } from '@services/logistic.service';
import Card from '@components/common/Card';
import Button from '@components/common/Button';
import Input from '@components/common/Input';
import LogoSys from '@components/LogoSys';
import Footer from '@components/Footer';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const NewShipment = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    shipmentType: 'OUTBOUND',
    carrierName: '',
    trackingNumber: '',
    transportMode: 'ROAD',
    scheduledDeparture: '',
    scheduledArrival: '',
    originWarehouseId: '',
    destinationWarehouseId: '',
    originAddress: '',
    destinationAddress: '',
    notes: ''
  });

  const { data: warehouses } = useQuery('warehouses', () => logisticService.getWarehouses());
  const warehousesList = warehouses?.data?.data || [];

  const createMutation = useMutation(
    (data) => logisticService.createShipment(data),
    {
      onSuccess: () => {
        toast.success('Expédition créée avec succès');
        queryClient.invalidateQueries('shipments');
        navigate('/logistics/shipments');
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
    
    if (!formData.originWarehouseId && !formData.originAddress) {
      toast.error('Veuillez spécifier une origine');
      return;
    }
    
    if (!formData.destinationWarehouseId && !formData.destinationAddress) {
      toast.error('Veuillez spécifier une destination');
      return;
    }
    
    createMutation.mutate(formData);
  };

  const shipmentTypes = [
    { value: 'INBOUND', label: 'Entrant' },
    { value: 'OUTBOUND', label: 'Sortant' },
    { value: 'TRANSFER', label: 'Transfert' }
  ];

  const transportModes = [
    { value: 'ROAD', label: 'Route' },
    { value: 'RAIL', label: 'Rail' },
    { value: 'AIR', label: 'Air' },
    { value: 'SEA', label: 'Mer' },
    { value: 'MULTIMODAL', label: 'Multimodal' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <LogoSys size="small" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Nouvelle expédition</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Créer une nouvelle expédition
                </p>
              </div>
            </div>
            <Button variant="secondary" onClick={() => navigate('/logistics/shipments')}>
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
                <label className="label">Type d'expédition *</label>
                <select
                  name="shipmentType"
                  value={formData.shipmentType}
                  onChange={handleChange}
                  className="input"
                  required
                >
                  {shipmentTypes.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Mode de transport</label>
                <select
                  name="transportMode"
                  value={formData.transportMode}
                  onChange={handleChange}
                  className="input"
                >
                  {transportModes.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Transporteur</label>
                <Input
                  name="carrierName"
                  value={formData.carrierName}
                  onChange={handleChange}
                  placeholder="Nom du transporteur"
                />
              </div>

              <div>
                <label className="label">N° de suivi</label>
                <Input
                  name="trackingNumber"
                  value={formData.trackingNumber}
                  onChange={handleChange}
                  placeholder="Numéro de tracking"
                />
              </div>

              <div>
                <label className="label">Départ prévu</label>
                <Input
                  name="scheduledDeparture"
                  type="datetime-local"
                  value={formData.scheduledDeparture}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="label">Arrivée prévue</label>
                <Input
                  name="scheduledArrival"
                  type="datetime-local"
                  value={formData.scheduledArrival}
                  onChange={handleChange}
                />
              </div>
            </div>
          </Card>

          <Card className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Origine</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Entrepôt d'origine</label>
                <select
                  name="originWarehouseId"
                  value={formData.originWarehouseId}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">Sélectionner</option>
                  {warehousesList.map(w => (
                    <option key={w.id} value={w.id}>{w.warehouseName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Adresse d'origine (si différent)</label>
                <textarea
                  name="originAddress"
                  value={formData.originAddress}
                  onChange={handleChange}
                  className="input"
                  rows={2}
                  placeholder="Adresse complète..."
                />
              </div>
            </div>
          </Card>

          <Card className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Destination</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Entrepôt de destination</label>
                <select
                  name="destinationWarehouseId"
                  value={formData.destinationWarehouseId}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">Sélectionner</option>
                  {warehousesList.map(w => (
                    <option key={w.id} value={w.id}>{w.warehouseName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Adresse de destination (si différent)</label>
                <textarea
                  name="destinationAddress"
                  value={formData.destinationAddress}
                  onChange={handleChange}
                  className="input"
                  rows={2}
                  placeholder="Adresse complète..."
                />
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Notes</h3>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="input"
              rows={3}
              placeholder="Notes additionnelles..."
            />
          </Card>

          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" variant="ghost" onClick={() => navigate('/logistics/shipments')}>
              Annuler
            </Button>
            <Button type="submit" loading={createMutation.isLoading}>
              Créer l'expédition
            </Button>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
};

export default NewShipment;