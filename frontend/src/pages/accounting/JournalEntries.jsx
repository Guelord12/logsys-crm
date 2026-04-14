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
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { formatDate, formatCurrency } from '@utils/formatters';

const JournalEntries = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [journalId, setJournalId] = useState('');

  const { data: entries, isLoading } = useQuery(
    ['journal-entries', { page, limit, search, status, journalId }],
    () => accountingService.getEntries({ page, limit, search, status, journalId })
  );

  const { data: journals } = useQuery(
    'journals',
    () => accountingService.getJournals()
  );

  // ✅ Extraction correcte des données selon la structure Axios
  const journalsList = journals?.data?.data || [];
  const entriesList = entries?.data?.data?.entries || [];
  const pagination = entries?.data?.data?.pagination || {};

  const columns = [
    {
      key: 'entryNumber',
      title: 'N° Écriture',
      render: (row) => (
        <span className="font-medium">{row.entryNumber}</span>
      )
    },
    {
      key: 'entryDate',
      title: 'Date',
      render: (row) => formatDate(row.entryDate)
    },
    {
      key: 'journal',
      title: 'Journal',
      render: (row) => row.journal?.journalName || '-'
    },
    {
      key: 'description',
      title: 'Libellé',
      render: (row) => row.description || '-'
    },
    {
      key: 'totalDebit',
      title: 'Débit',
      render: (row) => {
        const total = row.lines?.reduce((sum, line) => sum + parseFloat(line.debitAmount || 0), 0) || 0;
        return formatCurrency(total);
      }
    },
    {
      key: 'totalCredit',
      title: 'Crédit',
      render: (row) => {
        const total = row.lines?.reduce((sum, line) => sum + parseFloat(line.creditAmount || 0), 0) || 0;
        return formatCurrency(total);
      }
    },
    {
      key: 'status',
      title: 'Statut',
      render: (row) => {
        const statuses = {
          DRAFT: { label: 'Brouillon', color: 'gray' },
          POSTED: { label: 'Comptabilisé', color: 'blue' },
          VALIDATED: { label: 'Validé', color: 'green' },
          REVERSED: { label: 'Extourné', color: 'red' }
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
                <h1 className="text-2xl font-bold text-gray-900">Écritures comptables</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Gestion des écritures comptables
                </p>
              </div>
            </div>
            <Button onClick={() => navigate('/accounting/journal-entries/new')}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Nouvelle écriture
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
                <option value="">Tous statuts</option>
                <option value="DRAFT">Brouillons</option>
                <option value="POSTED">Comptabilisés</option>
                <option value="VALIDATED">Validés</option>
              </select>

              <select
                value={journalId}
                onChange={(e) => setJournalId(e.target.value)}
                className="input w-48"
              >
                <option value="">Tous journaux</option>
                {journalsList.map(j => (
                  <option key={j.id} value={j.id}>{j.journalName}</option>
                ))}
              </select>

              <Button variant="secondary">
                <FunnelIcon className="w-4 h-4 mr-2" />
                Filtrer
              </Button>
            </div>
          </div>

          <Table
            columns={columns}
            data={entriesList}
            loading={isLoading}
            onRowClick={(row) => navigate(`/accounting/journal-entries/${row.id}`)}
            emptyMessage="Aucune écriture trouvée"
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

export default JournalEntries;