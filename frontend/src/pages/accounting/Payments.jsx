import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { accountingService } from '@services/accounting.service';
import Card from '@components/common/Card';
import Table from '@components/common/Table';
import Badge from '@components/common/Badge';
import Button from '@components/common/Button';
import LogoSys from '@components/LogoSys';
import Footer from '@components/Footer';
import { PlusIcon } from '@heroicons/react/24/outline';
import { formatDate, formatCurrency } from '@utils/formatters';

const Payments = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const { data, isLoading } = useQuery(
    ['payments', { page, limit }],
    () => accountingService.getPayments({ page, limit })
  );

  const columns = [
    {
      key: 'paymentNumber',
      title: 'N° Paiement',
      render: (row) => <span className="font-medium">{row.paymentNumber}</span>
    },
    {
      key: 'paymentDate',
      title: 'Date',
      render: (row) => formatDate(row.paymentDate)
    },
    {
      key: 'payer',
      title: 'Payeur',
      render: (row) => row.payer?.accountName || '-'
    },
    {
      key: 'payee',
      title: 'Bénéficiaire',
      render: (row) => row.payee?.accountName || '-'
    },
    {
      key: 'paymentMethod',
      title: 'Méthode',
      render: (row) => {
        const methods = {
          CASH: 'Espèces',
          CHECK: 'Chèque',
          BANK_TRANSFER: 'Virement',
          CREDIT_CARD: 'Carte',
          MOBILE_MONEY: 'Mobile Money'
        };
        return methods[row.paymentMethod] || row.paymentMethod;
      }
    },
    {
      key: 'amount',
      title: 'Montant',
      render: (row) => formatCurrency(row.amount)
    },
    {
      key: 'status',
      title: 'Statut',
      render: (row) => {
        const statuses = {
          PENDING: { label: 'En attente', color: 'warning' },
          COMPLETED: { label: 'Complété', color: 'success' },
          FAILED: { label: 'Échoué', color: 'danger' },
          CANCELLED: { label: 'Annulé', color: 'gray' }
        };
        const s = statuses[row.status] || { label: row.status, color: 'gray' };
        return <Badge variant={s.color}>{s.label}</Badge>;
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <LogoSys size="small" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Paiements</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Gestion des paiements
                </p>
              </div>
            </div>
            <Button onClick={() => navigate('/accounting/payments/new')}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Nouveau paiement
            </Button>
          </div>
        </div>
      </div>

      <div className="page-container">
        <Card>
          <Table
            columns={columns}
            data={data?.data?.payments || []}
            loading={isLoading}
            onRowClick={(row) => navigate(`/accounting/payments/${row.id}`)}
            emptyMessage="Aucun paiement trouvé"
          />
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default Payments;