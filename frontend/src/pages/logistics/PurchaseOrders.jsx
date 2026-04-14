import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { logisticService } from '@services/logistic.service';
import Card from '@components/common/Card';
import Table from '@components/common/Table';
import Badge from '@components/common/Badge';
import Button from '@components/common/Button';
import Pagination from '@components/common/Pagination';
import LogoSys from '@components/LogoSys';
import Footer from '@components/Footer';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { formatDate, formatCurrency } from '@utils/formatters';

const PurchaseOrders = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery(
    ['purchase-orders', { page, limit, search, status }],
    () => logisticService.getPurchaseOrders({ page, limit, search, status })
  );

  const columns = [
    {
      key: 'poNumber',
      title: 'N° Commande',
      render: (row) => <span className="font-medium">{row.poNumber}</span>
    },
    {
      key: 'supplier',
      title: 'Fournisseur',
      render: (row) => row.supplierName
    },
    {
      key: 'orderDate',
      title: 'Date',
      render: (row) => formatDate(row.orderDate)
    },
    {
      key: 'expectedDelivery',
      title: 'Livraison prévue',
      render: (row) => formatDate(row.expectedDeliveryDate)
    },
    {
      key: 'totalAmount',
      title: 'Montant',
      render: (row) => formatCurrency(row.totalAmount)
    },
    {
      key: 'status',
      title: 'Statut',
      render: (row) => {
        const statuses = {
          DRAFT: { label: 'Brouillon', color: 'gray' },
          SUBMITTED: { label: 'Soumise', color: 'blue' },
          APPROVED: { label: 'Approuvée', color: 'green' },
          PARTIALLY_RECEIVED: { label: 'Partiellement reçue', color: 'orange' },
          COMPLETED: { label: 'Complétée', color: 'green' },
          CANCELLED: { label: 'Annulée', color: 'red' }
        };
        const s = statuses[row.status] || { label: row.status, color: 'gray' };
        return <Badge variant={s.color}>{s.label}</Badge>;
      }
    }
  ];

  // ✅ Extraction correcte des données
  const orders = data?.data?.data?.orders || [];
  const pagination = data?.data?.data?.pagination || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <LogoSys size="small" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Commandes fournisseurs</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Gestion des commandes d'achat
                </p>
              </div>
            </div>
            <Button onClick={() => navigate('/logistics/purchase-orders/new')}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Nouvelle commande
            </Button>
          </div>
        </div>
      </div>

      <div className="page-container">
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
                className="input w-48"
              >
                <option value="">Tous</option>
                <option value="DRAFT">Brouillons</option>
                <option value="SUBMITTED">Soumises</option>
                <option value="APPROVED">Approuvées</option>
                <option value="PARTIALLY_RECEIVED">Partiellement reçues</option>
                <option value="COMPLETED">Complétées</option>
              </select>
            </div>
          </div>

          <Table
            columns={columns}
            data={orders}
            loading={isLoading}
            onRowClick={(row) => navigate(`/logistics/purchase-orders/${row.id}`)}
            emptyMessage="Aucune commande trouvée"
          />

          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-gray-200">
              <Pagination
                currentPage={page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
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

export default PurchaseOrders;