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

const NewInventoryMovement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    movementType: 'RECEIPT',
    fromWarehouseId: '',
    toWarehouseId: '',
    itemId: '',
    quantity: '',
    unitCost: '',
    referenceNumber: '',
    notes: ''
  });

  const { data: warehouses } = useQuery('warehouses', () => logisticService.getWarehouses());
  const { data: items } = useQuery('items', () => logisticService.getItems());

  const warehousesList = warehouses?.data?.data || [];
  const itemsList = items?.data?.data?.items || items?.data?.data || [];

  const createMutation = useMutation(
    (data) => logisticService.createMovement(data),
    {
      onSuccess: () => {
        toast.success('Mouvement créé avec succès');
        queryClient.invalidateQueries('inventory');
        queryClient.invalidateQueries('recent-movements');
        navigate('/logistics/inventory');
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
    
    if (!formData.itemId || !formData.quantity) {
      toast.error('Veuillez sélectionner un article et une quantité');
      return;
    }
    
    if (formData.movementType === 'TRANSFER' && (!formData.fromWarehouseId || !formData.toWarehouseId)) {
      toast.error('Veuillez sélectionner les entrepôts d\'origine et de destination');
      return;
    }
    
    if ((formData.movementType === 'RECEIPT' || formData.movementType === 'ISSUE') && !formData.toWarehouseId && !formData.fromWarehouseId) {
      toast.error('Veuillez sélectionner un entrepôt');
      return;
    }
    
    createMutation.mutate(formData);
  };

  const movementTypes = [
    { value: 'RECEIPT', label: 'Réception (Entrée)' },
    { value: 'ISSUE', label: 'Sortie' },
    { value: 'TRANSFER', label: 'Transfert' },
    { value: 'ADJUSTMENT', label: 'Ajustement' },
    { value: 'RETURN', label: 'Retour' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <LogoSys size="small" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Nouveau mouvement de stock</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Enregistrer un mouvement d'entrée ou de sortie
                </p>
              </div>
            </div>
            <Button variant="secondary" onClick={() => navigate('/logistics/inventory')}>
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </div>
        </div>
      </div>

      <div className="page-container">
        <form onSubmit={handleSubmit}>
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Type de mouvement *</label>
                <select
                  name="movementType"
                  value={formData.movementType}
                  onChange={handleChange}
                  className="input"
                  required
                >
                  {movementTypes.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Article *</label>
                <select
                  name="itemId"
                  value={formData.itemId}
                  onChange={handleChange}
                  className="input"
                  required
                >
                  <option value="">Sélectionner un article</option>
                  {itemsList.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.itemName} ({item.itemCode})
                    </option>
                  ))}
                </select>
              </div>

              {(formData.movementType === 'ISSUE' || formData.movementType === 'TRANSFER') && (
                <div>
                  <label className="label">Entrepôt d'origine *</label>
                  <select
                    name="fromWarehouseId"
                    value={formData.fromWarehouseId}
                    onChange={handleChange}
                    className="input"
                    required
                  >
                    <option value="">Sélectionner</option>
                    {warehousesList.map(w => (
                      <option key={w.id} value={w.id}>{w.warehouseName}</option>
                    ))}
                  </select>
                </div>
              )}

              {(formData.movementType === 'RECEIPT' || formData.movementType === 'TRANSFER') && (
                <div>
                  <label className="label">Entrepôt de destination *</label>
                  <select
                    name="toWarehouseId"
                    value={formData.toWarehouseId}
                    onChange={handleChange}
                    className="input"
                    required
                  >
                    <option value="">Sélectionner</option>
                    {warehousesList.map(w => (
                      <option key={w.id} value={w.id}>{w.warehouseName}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="label">Quantité *</label>
                <Input
                  name="quantity"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="label">Coût unitaire</label>
                <Input
                  name="unitCost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unitCost}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="label">N° Référence</label>
                <Input
                  name="referenceNumber"
                  value={formData.referenceNumber}
                  onChange={handleChange}
                  placeholder="Ex: CMD-2024-001"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="label">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="input"
                rows={3}
                placeholder="Notes additionnelles..."
              />
            </div>
          </Card>

          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" variant="ghost" onClick={() => navigate('/logistics/inventory')}>
              Annuler
            </Button>
            <Button type="submit" loading={createMutation.isLoading}>
              Enregistrer le mouvement
            </Button>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
};

export default NewInventoryMovement;