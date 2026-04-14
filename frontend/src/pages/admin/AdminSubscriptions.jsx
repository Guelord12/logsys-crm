import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { subscriptionService } from '@services/subscription.service';
import Card from '@components/common/Card';
import Table from '@components/common/Table';
import Badge from '@components/common/Badge';
import LogoSys from '@components/LogoSys';
import Footer from '@components/Footer';
import { formatDate, formatCurrency } from '@utils/formatters';

const AdminSubscriptions = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const { data, isLoading } = useQuery(
    ['subscriptions', { page, limit }],
    () => subscriptionService.getExpiringSubscriptions()
  );

  const columns = [
    {
      key: 'company',
      title: 'Entreprise',
      render: (row) => row.company?.name || '-'
    },
    {
      key: 'plan',
      title: 'Plan',
      render: (row) => row.plan?.name || '-'
    },
    {
      key: 'endDate',
      title: 'Date d\'expiration',
      render: (row) => formatDate(row.endDate)
    },
    {
      key: 'daysRemaining',
      title: 'Jours restants',
      render: (row) => (
        <Badge variant={row.daysRemaining <= 3 ? 'danger' : row.daysRemaining <= 7 ? 'warning' : 'info'}>
          {row.daysRemaining} jours
        </Badge>
      )
    }
  ];

  // ✅ CORRECTION : Gérer la structure de réponse Axios (response.data.data)
  // L'API renvoie : { data: { success: true, data: [...] } }
  // Donc le tableau est dans data?.data?.data
  const getTableData = () => {
    if (!data) return [];
    
    // Si data est directement un tableau (cas improbable mais sécurisé)
    if (Array.isArray(data)) return data;
    
    // Si data.data est un tableau
    if (data.data && Array.isArray(data.data)) return data.data;
    
    // Si data.data.data est un tableau (structure Axios complète)
    if (data.data?.data && Array.isArray(data.data.data)) return data.data.data;
    
    // Fallback : tableau vide
    return [];
  };

  const tableData = getTableData();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center space-x-4">
            <LogoSys size="small" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Abonnements</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Gestion des abonnements et expirations
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="page-container">
        <Card title="Abonnements arrivant à expiration">
          <Table
            columns={columns}
            data={tableData}
            loading={isLoading}
            emptyMessage="Aucun abonnement n'expire prochainement"
          />
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default AdminSubscriptions;