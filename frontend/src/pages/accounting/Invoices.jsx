import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { accountingService } from '@services/accounting.service';
import Card from '@components/common/Card';
import Table from '@components/common/Table';
import Badge from '@components/common/Badge';
import Button from '@components/common/Button';
import Pagination from '@components/common/Pagination';
import LogoSys from '@components/LogoSys';
import Footer from '@components/Footer';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { formatDate, formatCurrency } from '@utils/formatters';

const Invoices = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery(
    ['invoices', { page, limit, search, status }],
    () => accountingService.getInvoices({ page, limit, search, status })
  );

  const columns = [
    {
      key: 'invoiceNumber',
      title: 'N° Facture',
      render: (row) => <span className="font-medium">{row.invoiceNumber}</span>
    },
    {
      key: 'customer',
      title: 'Client',
      render: (row) => row.customer?.accountName || '-'
    },
    {
      key: 'invoiceDate',
      title: 'Date',
      render: (row) => formatDate(row.invoiceDate)
    },
    {
      key: 'dueDate',
      title: 'Échéance',
      render: (row) => formatDate(row.dueDate)
    },
    {
      key: 'totalAmount',
      title: 'Montant',
      render: (row) => formatCurrency(row.totalAmount)
    },
    {
      key: 'balanceDue',
      title: 'Reste à payer',
      render: (row) => (
        <span className={row.balanceDue > 0 ? 'text-orange-600 font-medium' : 'text-green-600'}>
          {formatCurrency(row.balanceDue)}
        </span>
      )
    },
    {
      key: 'status',
      title: 'Statut',
      render: (row) => {
        const statuses = {
          DRAFT: { label: 'Brouillon', color: 'gray' },
          SENT: { label: 'Envoyée', color: 'blue' },
          PARTIALLY_PAID: { label: 'Partiellement payée', color: 'orange' },
          PAID: { label: 'Payée', color: 'green' },
          OVERDUE: { label: 'En retard', color: 'red' },
          CANCELLED: { label: 'Annulée', color: 'gray' }
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
                <h1 className="text-2xl font-bold text-gray-900">Factures</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Gestion des factures clients
                </p>
              </div>
            </div>
            <Button onClick={() => navigate('/accounting/invoices/new')}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Nouvelle facture
            </Button>
          </div>
        </div>
      </div>

      <div className="page-container">
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <p className="text-sm text-gray-500">Total factures</p>
            <p className="text-2xl font-bold">{data?.data?.pagination?.total || 0}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500">En attente</p>
            <p className="text-2xl font-bold text-orange-600">
              {data?.data?.invoices?.filter(i => i.status === 'SENT' || i.status === 'PARTIALLY_PAID').length || 0}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500">En retard</p>
            <p className="text-2xl font-bold text-red-600">
              {data?.data?.invoices?.filter(i => i.status === 'OVERDUE').length || 0}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500">Payées</p>
            <p className="text-2xl font-bold text-green-600">
              {data?.data?.invoices?.filter(i => i.status === 'PAID').length || 0}
            </p>
          </Card>
        </div>

        <Card>
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input pl-9"
                  />
                </div>
              </div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="input w-40"
              >
                <option value="">Tous</option>
                <option value="DRAFT">Brouillons</option>
                <option value="SENT">Envoyées</option>
                <option value="PARTIALLY_PAID">Partiellement payées</option>
                <option value="PAID">Payées</option>
                <option value="OVERDUE">En retard</option>
              </select>
            </div>
          </div>

          <Table
            columns={columns}
            data={data?.data?.invoices || []}
            loading={isLoading}
            onRowClick={(row) => navigate(`/accounting/invoices/${row.id}`)}
            emptyMessage="Aucune facture trouvée"
          />

          {data?.data?.pagination && data.data.pagination.totalPages > 1 && (
            <div className="p-4 border-t border-gray-200">
              <Pagination
                currentPage={page}
                totalPages={data.data.pagination.totalPages}
                totalItems={data.data.pagination.total}
                pageSize={limit}
                onPageChange={setPage}
              />
            </div>
          )}
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default Invoices;