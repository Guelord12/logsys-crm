import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { accountingService } from '@services/accounting.service';
import Card from '@components/common/Card';
import Button from '@components/common/Button';
import Input from '@components/common/Input';
import LogoSys from '@components/LogoSys';
import Footer from '@components/Footer';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const NewPayment = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    paymentType: 'CUSTOMER_PAYMENT',
    paymentMethod: 'BANK_TRANSFER',
    payerId: '',
    payeeId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    amount: 0,
    currency: 'USD',
    reference: '',
    notes: ''
  });

  const { data: accounts } = useQuery('auxiliary-accounts', () => 
    accountingService.getAuxiliaryAccounts ? accountingService.getAuxiliaryAccounts() : Promise.resolve({ data: { data: [] } })
  );

  const accountsList = accounts?.data?.data || [];

  const createMutation = useMutation(
    (data) => accountingService.createPayment(data),
    {
      onSuccess: () => {
        toast.success('Paiement créé avec succès');
        navigate('/accounting/payments');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la création');
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.amount <= 0) {
      toast.error('Le montant doit être supérieur à 0');
      return;
    }
    
    createMutation.mutate(formData);
  };

  const paymentTypes = [
    { value: 'CUSTOMER_PAYMENT', label: 'Paiement client' },
    { value: 'SUPPLIER_PAYMENT', label: 'Paiement fournisseur' },
    { value: 'EXPENSE_PAYMENT', label: 'Paiement de charge' }
  ];

  const paymentMethods = [
    { value: 'CASH', label: 'Espèces' },
    { value: 'CHECK', label: 'Chèque' },
    { value: 'BANK_TRANSFER', label: 'Virement bancaire' },
    { value: 'CREDIT_CARD', label: 'Carte de crédit' },
    { value: 'MOBILE_MONEY', label: 'Mobile Money' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <LogoSys size="small" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Nouveau paiement</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Enregistrer un nouveau paiement
                </p>
              </div>
            </div>
            <Button variant="secondary" onClick={() => navigate('/accounting/payments')}>
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
                <label className="label">Type de paiement *</label>
                <select
                  value={formData.paymentType}
                  onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
                  className="input"
                  required
                >
                  {paymentTypes.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Mode de paiement *</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="input"
                  required
                >
                  {paymentMethods.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Payeur</label>
                <select
                  value={formData.payerId}
                  onChange={(e) => setFormData({ ...formData, payerId: e.target.value })}
                  className="input"
                >
                  <option value="">Sélectionner</option>
                  {accountsList.map(a => (
                    <option key={a.id} value={a.id}>{a.accountName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Bénéficiaire</label>
                <select
                  value={formData.payeeId}
                  onChange={(e) => setFormData({ ...formData, payeeId: e.target.value })}
                  className="input"
                >
                  <option value="">Sélectionner</option>
                  {accountsList.map(a => (
                    <option key={a.id} value={a.id}>{a.accountName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Date de paiement *</label>
                <Input
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="label">Montant *</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>

              <div>
                <label className="label">Devise</label>
                <Input
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Référence transaction</label>
                <Input
                  placeholder="Ex: TXN-2024-001"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                />
              </div>
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

          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" variant="ghost" onClick={() => navigate('/accounting/payments')}>
              Annuler
            </Button>
            <Button type="submit" loading={createMutation.isLoading}>
              Enregistrer le paiement
            </Button>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
};

export default NewPayment;