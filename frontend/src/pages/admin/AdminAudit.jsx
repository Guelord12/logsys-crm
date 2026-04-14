import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { auditService } from '@services/audit.service';
import Card from '@components/common/Card';
import Table from '@components/common/Table';
import Badge from '@components/common/Badge';
import Button from '@components/common/Button';
import Pagination from '@components/common/Pagination';
import { MagnifyingGlassIcon, FunnelIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { formatDateTime } from '@utils/formatters';
import LogoSys from '@components/LogoSys';
import Footer from '@components/Footer';
import toast from 'react-hot-toast';

const AdminAudit = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [actionType, setActionType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exporting, setExporting] = useState(false);

  const { data, isLoading, refetch } = useQuery(
    ['audit-logs', { page, limit, search, actionType, startDate, endDate }],
    () => auditService.getAuditLogs({ page, limit, search, actionType, startDate, endDate })
  );

  // ✅ Extraction correcte des données selon la structure Axios
  const logs = data?.data?.data?.logs || data?.data?.logs || [];
  const pagination = data?.data?.data?.pagination || data?.data?.pagination || {};

  const columns = [
    {
      key: 'createdAt',
      title: 'Date',
      render: (row) => formatDateTime(row.createdAt || row.logTimestamp)
    },
    {
      key: 'user',
      title: 'Utilisateur',
      render: (row) => row.user?.fullName || row.userEmail || row.user?.email || 'Système'
    },
    {
      key: 'actionType',
      title: 'Action',
      render: (row) => {
        const colors = {
          CREATE: 'green',
          UPDATE: 'blue',
          DELETE: 'red',
          LOGIN: 'purple',
          LOGOUT: 'gray',
          VIEW: 'cyan',
          EXPORT: 'orange',
          APPROVE: 'teal',
          REJECT: 'pink'
        };
        return <Badge variant={colors[row.actionType] || 'gray'}>{row.actionType}</Badge>;
      }
    },
    {
      key: 'entityType',
      title: 'Entité',
      render: (row) => row.entityType || '-'
    },
    {
      key: 'entityName',
      title: 'Nom',
      render: (row) => row.entityName || '-'
    },
    {
      key: 'actionDescription',
      title: 'Description',
      render: (row) => row.actionDescription || row.description || '-'
    },
    {
      key: 'ipAddress',
      title: 'IP',
      render: (row) => row.ipAddress || '-'
    },
    {
      key: 'status',
      title: 'Statut',
      render: (row) => (
        <Badge variant={row.status === 'SUCCESS' ? 'success' : 'danger'}>
          {row.status || 'SUCCESS'}
        </Badge>
      )
    }
  ];

  const handleExport = async () => {
    setExporting(true);
    try {
      await auditService.exportAuditLogs({ 
        format: 'csv', 
        search,
        actionType,
        startDate, 
        endDate
      });
      toast.success('Export démarré avec succès');
    } catch (error) {
      console.error('Erreur export:', error);
      toast.error('Erreur lors de l\'export');
    } finally {
      setExporting(false);
    }
  };

  const handleFilter = () => {
    setPage(1);
    refetch();
  };

  const handleClearFilters = () => {
    setSearch('');
    setActionType('');
    setStartDate('');
    setEndDate('');
    setPage(1);
    setTimeout(() => refetch(), 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <LogoSys size="small" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Audit</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Journal des actions et événements système
                </p>
              </div>
            </div>
            <Button onClick={handleExport} loading={exporting}>
              <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>
      </div>

      <div className="page-container">
        <Card>
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher par utilisateur, action, description..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input pl-9"
                  />
                </div>
              </div>

              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="input w-40"
              >
                <option value="">Toutes actions</option>
                <option value="CREATE">Création</option>
                <option value="UPDATE">Mise à jour</option>
                <option value="DELETE">Suppression</option>
                <option value="LOGIN">Connexion</option>
                <option value="LOGOUT">Déconnexion</option>
                <option value="VIEW">Consultation</option>
                <option value="EXPORT">Export</option>
              </select>

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input w-36"
                placeholder="Date début"
              />

              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input w-36"
                placeholder="Date fin"
              />

              <Button variant="secondary" onClick={handleFilter}>
                <FunnelIcon className="w-4 h-4 mr-2" />
                Filtrer
              </Button>

              {(search || actionType || startDate || endDate) && (
                <Button variant="ghost" onClick={handleClearFilters}>
                  Effacer
                </Button>
              )}
            </div>
            
            {/* Compteur de résultats */}
            {pagination.total > 0 && (
              <div className="mt-3 text-sm text-gray-500">
                {pagination.total} événement(s) trouvé(s)
              </div>
            )}
          </div>

          <Table
            columns={columns}
            data={logs}
            loading={isLoading}
            emptyMessage="Aucun log d'audit trouvé"
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

export default AdminAudit;