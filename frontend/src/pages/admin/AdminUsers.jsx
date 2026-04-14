import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';  // ✅ AJOUT
import { useQuery } from 'react-query';
import { userService } from '@services/user.service';
import Card from '@components/common/Card';
import Table from '@components/common/Table';
import Badge from '@components/common/Badge';
import Button from '@components/common/Button';
import Pagination from '@components/common/Pagination';
import LogoSys from '@components/LogoSys';
import Footer from '@components/Footer';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { formatDate } from '@utils/formatters';

const AdminUsers = () => {
  const navigate = useNavigate();  // ✅ AJOUT
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery(
    ['admin-users', { page, limit, search, status }],
    () => userService.getUsers({ page, limit, search, status })
  );

  const columns = [
    {
      key: 'user',
      title: 'Utilisateur',
      render: (row) => (
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
            <UserCircleIcon className="w-6 h-6 text-gray-500" />
          </div>
          <div>
            <p className="font-medium">{row.fullName}</p>
            <p className="text-sm text-gray-500">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'company',
      title: 'Entreprise',
      render: (row) => row.company?.name || '-'
    },
    {
      key: 'userType',
      title: 'Type',
      render: (row) => row.userType?.name || '-'
    },
    {
      key: 'role',
      title: 'Rôle',
      render: (row) => {
        if (row.isSystemAdmin) return <Badge variant="danger">Admin Système</Badge>;
        if (row.isCompanyAdmin) return <Badge variant="info">Admin Entreprise</Badge>;
        return <Badge variant="gray">Utilisateur</Badge>;
      }
    },
    {
      key: 'status',
      title: 'Statut',
      render: (row) => {
        const variants = {
          ACTIVE: 'success',
          INACTIVE: 'gray',
          SUSPENDED: 'danger',
          PENDING_ACTIVATION: 'warning'
        };
        return <Badge variant={variants[row.status] || 'gray'}>{row.status}</Badge>;
      }
    },
    {
      key: 'lastLoginAt',
      title: 'Dernière connexion',
      render: (row) => row.lastLoginAt ? formatDate(row.lastLoginAt) : '-'
    },
    {
      key: 'createdAt',
      title: 'Créé le',
      render: (row) => formatDate(row.createdAt)
    }
  ];

  // ✅ Extraction correcte des données
  const users = data?.data?.data?.users || data?.data?.users || [];
  const pagination = data?.data?.data?.pagination || data?.data?.pagination || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <LogoSys size="small" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Gestion des utilisateurs de la plateforme
                </p>
              </div>
            </div>
            {/* ✅ AJOUT : onClick pour naviguer vers /admin/users/new */}
            <Button onClick={() => navigate('/admin/users/new')}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Nouvel utilisateur
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
                className="input w-40"
              >
                <option value="">Tous</option>
                <option value="ACTIVE">Actifs</option>
                <option value="INACTIVE">Inactifs</option>
                <option value="SUSPENDED">Suspendus</option>
                <option value="PENDING_ACTIVATION">En attente</option>
              </select>
            </div>
          </div>

          <Table
            columns={columns}
            data={users}
            loading={isLoading}
            emptyMessage="Aucun utilisateur trouvé"
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

export default AdminUsers;