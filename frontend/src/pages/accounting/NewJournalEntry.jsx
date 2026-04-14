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

const NewJournalEntry = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    periodId: '',
    journalId: '',
    entryDate: new Date().toISOString().split('T')[0],
    documentDate: new Date().toISOString().split('T')[0],
    referenceNumber: '',
    documentType: '',
    description: '',
    lines: []
  });

  const { data: periods } = useQuery('periods', () => accountingService.getPeriods());
  const { data: journals } = useQuery('journals', () => accountingService.getJournals());
  const { data: accounts } = useQuery('chart-of-accounts', () => accountingService.getChartOfAccounts());

  const periodsList = periods?.data?.data || [];
  const journalsList = journals?.data?.data || [];
  const accountsList = accounts?.data?.data || [];

  const createMutation = useMutation(
    (data) => accountingService.createEntry(data),
    {
      onSuccess: () => {
        toast.success('Écriture créée avec succès');
        navigate('/accounting/journal-entries');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la création');
      }
    }
  );

  const addLine = () => {
    setFormData(prev => ({
      ...prev,
      lines: [...prev.lines, {
        accountNumber: '',
        description: '',
        debitAmount: 0,
        creditAmount: 0
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
        i === index ? { ...line, [field]: field.includes('Amount') ? parseFloat(value) || 0 : value } : line
      )
    }));
  };

  const calculateTotals = () => {
    const totalDebit = formData.lines.reduce((sum, line) => sum + (line.debitAmount || 0), 0);
    const totalCredit = formData.lines.reduce((sum, line) => sum + (line.creditAmount || 0), 0);
    return { totalDebit, totalCredit, difference: Math.abs(totalDebit - totalCredit) };
  };

  const totals = calculateTotals();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (totals.difference > 0.01) {
      toast.error('L\'écriture n\'est pas équilibrée');
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
                <h1 className="text-2xl font-bold text-gray-900">Nouvelle écriture comptable</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Créer une nouvelle écriture comptable
                </p>
              </div>
            </div>
            <Button variant="secondary" onClick={() => navigate('/accounting/journal-entries')}>
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
                <label className="label">Période *</label>
                <select
                  value={formData.periodId}
                  onChange={(e) => setFormData({ ...formData, periodId: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Sélectionner une période</option>
                  {periodsList.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.periodName} ({p.startDate} - {p.endDate})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Journal *</label>
                <select
                  value={formData.journalId}
                  onChange={(e) => setFormData({ ...formData, journalId: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Sélectionner un journal</option>
                  {journalsList.map(j => (
                    <option key={j.id} value={j.id}>{j.journalName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Date d'écriture *</label>
                <Input
                  type="date"
                  value={formData.entryDate}
                  onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="label">Date document</label>
                <Input
                  type="date"
                  value={formData.documentDate}
                  onChange={(e) => setFormData({ ...formData, documentDate: e.target.value })}
                />
              </div>

              <div>
                <label className="label">N° Référence</label>
                <Input
                  placeholder="Ex: FACT-2024-001"
                  value={formData.referenceNumber}
                  onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Type document</label>
                <Input
                  placeholder="Ex: FACTURE"
                  value={formData.documentType}
                  onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="label">Libellé</label>
              <Input
                placeholder="Description de l'écriture"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </Card>

          <Card title="Lignes d'écriture">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Compte</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Libellé</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">Débit</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">Crédit</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.lines.map((line, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2 px-2">
                        <select
                          value={line.accountNumber}
                          onChange={(e) => updateLine(index, 'accountNumber', e.target.value)}
                          className="input text-sm"
                          required
                        >
                          <option value="">Sélectionner</option>
                          {accountsList.map(a => (
                            <option key={a.accountNumber} value={a.accountNumber}>
                              {a.accountNumber} - {a.accountName}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-2">
                        <Input
                          placeholder="Libellé"
                          value={line.description}
                          onChange={(e) => updateLine(index, 'description', e.target.value)}
                          className="text-sm"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={line.debitAmount || ''}
                          onChange={(e) => updateLine(index, 'debitAmount', e.target.value)}
                          className="text-sm text-right"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={line.creditAmount || ''}
                          onChange={(e) => updateLine(index, 'creditAmount', e.target.value)}
                          className="text-sm text-right"
                        />
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
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-medium">
                    <td colSpan={2} className="py-3 px-2 text-right">Totaux :</td>
                    <td className="py-3 px-2 text-right">{formatCurrency(totals.totalDebit)}</td>
                    <td className="py-3 px-2 text-right">{formatCurrency(totals.totalCredit)}</td>
                    <td></td>
                  </tr>
                  {totals.difference > 0.01 && (
                    <tr className="text-red-600">
                      <td colSpan={2} className="py-2 px-2 text-right">Différence :</td>
                      <td colSpan={2} className="py-2 px-2 text-right">{formatCurrency(totals.difference)}</td>
                      <td></td>
                    </tr>
                  )}
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
            <Button type="button" variant="ghost" onClick={() => navigate('/accounting/journal-entries')}>
              Annuler
            </Button>
            <Button type="submit" loading={createMutation.isLoading}>
              Créer l'écriture
            </Button>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
};

export default NewJournalEntry;