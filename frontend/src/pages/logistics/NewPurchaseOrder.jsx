import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { logisticService } from '@services/logistic.service';
import Card from '@components/common/Card';
import Button from '@components/common/Button';
import Input from '@components/common/Input';
import LogoSys from '@components/LogoSys';
import Footer from '@components/Footer';
import { PlusIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '@utils/formatters';
import toast from 'react-hot-toast';

const NewPurchaseOrder = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    supplierName: '',
    supplierReference: '',
    warehouseId: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    notes: '',
    terms: '',
    lines: []
  });

  const { data: warehouses } = useQuery('warehouses', () => logisticService.getWarehouses());
  const { data: items } = useQuery('items', () => logisticService.getItems());

  const warehousesList = warehouses?.data?.data || [];
  const itemsList = items?.data?.data?.items || items?.data?.data || [];

  const createMutation = useMutation(
    (data) => logisticService.createPurchaseOrder(data),
    {
      onSuccess: () => {
        toast.success('Commande créée avec succès');
        queryClient.invalidateQueries('purchase-orders');
        navigate('/logistics/purchase-orders');
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

  const addLine = () => {
    setFormData(prev => ({
      ...prev,
      lines: [...prev.lines, {
        itemId: '',
        description: '',
        quantityOrdered: 1,
        unitPrice: 0,
        taxRate: 0
      }]
    }));
  };

  const removeLine = (index) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index)
    }));
  };

  const updateLine = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.map((line, i) => 
        i === index ? { ...line, [field]: field.includes('quantity') || field.includes('Price') || field.includes('Rate') ? parseFloat(value) || 0 : value } : line
      )
    }));
  };

  const calculateTotal = () => {
    return formData.lines.reduce((sum, line) => {
      const lineTotal = (line.quantityOrdered || 0) * (line.unitPrice || 0);
      return sum + lineTotal;
    }, 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.supplierName) {
      toast.error('Veuillez saisir le nom du fournisseur');
      return;
    }
    
    if (formData.lines.length === 0) {
      toast.error('Ajoutez au moins une ligne');
      return;
    }
    
    createMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <LogoSys size="small" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Nouvelle commande fournisseur</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Créer une nouvelle commande d'achat
                </p>
              </div>
            </div>
            <Button variant="secondary" onClick={() => navigate('/logistics/purchase-orders')}>
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </div>
        </div>
      </div>

      <div className="page-container">
        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Fournisseur *</label>
                <Input
                  name="supplierName"
                  value={formData.supplierName}
                  onChange={handleChange}
                  placeholder="Nom du fournisseur"
                  required
                />
              </div>

              <div>
                <label className="label">Référence fournisseur</label>
                <Input
                  name="supplierReference"
                  value={formData.supplierReference}
                  onChange={handleChange}
                  placeholder="Ex: DEVIS-123"
                />
              </div>

              <div>
                <label className="label">Entrepôt de réception</label>
                <select
                  name="warehouseId"
                  value={formData.warehouseId}
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
                <label className="label">Date de commande *</label>
                <Input
                  name="orderDate"
                  type="date"
                  value={formData.orderDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="label">Date de livraison prévue</label>
                <Input
                  name="expectedDeliveryDate"
                  type="date"
                  value={formData.expectedDeliveryDate}
                  onChange={handleChange}
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
                rows={2}
              />
            </div>

            <div className="mt-4">
              <label className="label">Conditions</label>
              <textarea
                name="terms"
                value={formData.terms}
                onChange={handleChange}
                className="input"
                rows={2}
              />
            </div>
          </Card>

          <Card title="Lignes de commande">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Article</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Description</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">Quantité</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">Prix unitaire</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">Total</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.lines.map((line, index) => {
                    const lineTotal = (line.quantityOrdered || 0) * (line.unitPrice || 0);
                    return (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-2 px-2">
                          <select
                            value={line.itemId}
                            onChange={(e) => updateLine(index, 'itemId', e.target.value)}
                            className="input text-sm"
                            required
                          >
                            <option value="">Sélectionner</option>
                            {itemsList.map(item => (
                              <option key={item.id} value={item.id}>
                                {item.itemName}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            placeholder="Description"
                            value={line.description}
                            onChange={(e) => updateLine(index, 'description', e.target.value)}
                            className="text-sm"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={line.quantityOrdered || ''}
                            onChange={(e) => updateLine(index, 'quantityOrdered', e.target.value)}
                            className="text-sm text-right"
                            required
                          />
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.unitPrice || ''}
                            onChange={(e) => updateLine(index, 'unitPrice', e.target.value)}
                            className="text-sm text-right"
                            required
                          />
                        </td>
                        <td className="py-2 px-2 text-right">
                          {formatCurrency(lineTotal)}
                        </td>
                        <td className="py-2 px-2">
                          <button
                            type="button"
                            onClick={() => removeLine(index)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-bold">
                    <td colSpan={4} className="py-3 px-2 text-right">Total :</td>
                    <td className="py-3 px-2 text-right">{formatCurrency(calculateTotal())}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-4">
              <Button type="button" variant="secondary" onClick={addLine}>
                <PlusIcon className="w-4 h-4 mr-2" />
                Ajouter une ligne
              </Button>
            </div>
          </Card>

          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" variant="ghost" onClick={() => navigate('/logistics/purchase-orders')}>
              Annuler
            </Button>
            <Button type="submit" loading={createMutation.isLoading}>
              Créer la commande
            </Button>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
};

export default NewPurchaseOrder;