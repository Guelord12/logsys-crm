import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { accountingService } from '@services/accounting.service';
import Card from '@components/common/Card';
import Button from '@components/common/Button';
import Input from '@components/common/Input';
import LogoSys from '@components/LogoSys';
import Footer from '@components/Footer';
import { PlusIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '@utils/formatters';
import toast from 'react-hot-toast';

const NewInvoice = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    customerId: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
    terms: 'Paiement à 30 jours',
    items: []
  });

  const { data: customers } = useQuery('customers', () => 
    accountingService.getAuxiliaryAccounts ? accountingService.getAuxiliaryAccounts() : Promise.resolve({ data: { data: [] } })
  );

  const customersList = customers?.data?.data || [];

  const createMutation = useMutation(
    (data) => accountingService.createInvoice(data),
    {
      onSuccess: () => {
        toast.success('Facture créée avec succès');
        navigate('/accounting/invoices');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la création');
      }
    }
  );

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: 20
      }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: field === 'quantity' || field === 'unitPrice' || field === 'taxRate' ? parseFloat(value) || 0 : value } : item
      )
    }));
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let taxAmount = 0;
    
    formData.items.forEach(item => {
      const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
      subtotal += itemTotal;
      taxAmount += itemTotal * ((item.taxRate || 0) / 100);
    });
    
    return { subtotal, taxAmount, total: subtotal + taxAmount };
  };

  const totals = calculateTotals();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.customerId) {
      toast.error('Veuillez sélectionner un client');
      return;
    }
    
    if (formData.items.length === 0) {
      toast.error('Ajoutez au moins un article');
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
                <h1 className="text-2xl font-bold text-gray-900">Nouvelle facture</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Créer une nouvelle facture client
                </p>
              </div>
            </div>
            <Button variant="secondary" onClick={() => navigate('/accounting/invoices')}>
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </div>
        </div>
      </div>

      <div className="page-container">
        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="label">Client *</label>
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Sélectionner un client</option>
                  {customersList.filter(c => c.accountType === 'CUSTOMER').map(c => (
                    <option key={c.id} value={c.id}>{c.accountName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Date facture *</label>
                <Input
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="label">Date d'échéance *</label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="label">Conditions de paiement</label>
              <Input
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
              />
            </div>

            <div className="mt-4">
              <label className="label">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input"
                rows={3}
              />
            </div>
          </Card>

          <Card title="Articles">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Description</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">Quantité</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">Prix unitaire</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">TVA %</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">Total</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => {
                    const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
                    return (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-2 px-2">
                          <Input
                            placeholder="Description"
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            className="text-sm"
                            required
                          />
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            type="number"
                            step="1"
                            min="1"
                            value={item.quantity || ''}
                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                            className="text-sm text-right"
                            required
                          />
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitPrice || ''}
                            onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                            className="text-sm text-right"
                            required
                          />
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            value={item.taxRate || ''}
                            onChange={(e) => updateItem(index, 'taxRate', e.target.value)}
                            className="text-sm text-right"
                          />
                        </td>
                        <td className="py-2 px-2 text-right">
                          {formatCurrency(itemTotal)}
                        </td>
                        <td className="py-2 px-2">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
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
                  <tr className="bg-gray-50">
                    <td colSpan={4} className="py-3 px-2 text-right font-medium">Sous-total :</td>
                    <td className="py-3 px-2 text-right">{formatCurrency(totals.subtotal)}</td>
                    <td></td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td colSpan={4} className="py-3 px-2 text-right font-medium">TVA :</td>
                    <td className="py-3 px-2 text-right">{formatCurrency(totals.taxAmount)}</td>
                    <td></td>
                  </tr>
                  <tr className="bg-gray-50 font-bold">
                    <td colSpan={4} className="py-3 px-2 text-right">Total :</td>
                    <td className="py-3 px-2 text-right">{formatCurrency(totals.total)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-4">
              <Button type="button" variant="secondary" onClick={addItem}>
                <PlusIcon className="w-4 h-4 mr-2" />
                Ajouter un article
              </Button>
            </div>
          </Card>

          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" variant="ghost" onClick={() => navigate('/accounting/invoices')}>
              Annuler
            </Button>
            <Button type="submit" loading={createMutation.isLoading}>
              Créer la facture
            </Button>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
};

export default NewInvoice;