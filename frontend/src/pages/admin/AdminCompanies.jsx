import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { companyService } from '@services/company.service';
import { subscriptionService } from '@services/subscription.service';
import toast from 'react-hot-toast';
import { formatDate, formatCurrency } from '@utils/formatters';
import clsx from 'clsx';
import LogoSys from '@components/LogoSys';
import Footer from '@components/Footer';
import {
  BuildingOfficeIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Card from '@components/common/Card';
import Pagination from '@components/common/Pagination';

const AdminCompanies = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Récupérer les entreprises
  const { data, isLoading, refetch } = useQuery(
    ['companies', { search: searchTerm, status: statusFilter, plan: planFilter, page, limit }],
    () => companyService.getCompanies({
      search: searchTerm,
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
      plan: planFilter !== 'ALL' ? planFilter : undefined,
      page,
      limit
    }),
    {
      keepPreviousData: true,
      staleTime: 60000
    }
  );

  // Statistiques
  const { data: stats } = useQuery(
    'companies-stats',
    () => companyService.getCompaniesStats(),
    {
      staleTime: 300000
    }
  );

  // Extraire les données correctement
  const companies = data?.data?.data?.companies || data?.data?.companies || [];
  const pagination = data?.data?.data?.pagination || data?.data?.pagination || {};
  const statsData = stats?.data?.data || stats?.data || {};
  const overview = statsData.overview || {};
  const expiringSubscriptions = statsData.expiringSubscriptions || [];
  const recentCompanies = statsData.recent || [];

  // Mutation pour supprimer une entreprise
  const deleteCompanyMutation = useMutation(
    (companyId) => companyService.deleteCompany(companyId),
    {
      onSuccess: () => {
        toast.success('Entreprise supprimée avec succès');
        queryClient.invalidateQueries('companies');
        queryClient.invalidateQueries('companies-stats');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  );

  // Mutation pour annuler un abonnement
  const cancelSubscriptionMutation = useMutation(
    ({ companyId, reason }) => subscriptionService.cancelSubscription(companyId, reason),
    {
      onSuccess: () => {
        toast.success('Abonnement annulé avec succès');
        queryClient.invalidateQueries('companies');
        refetch();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de l\'annulation');
      }
    }
  );

  const handleDeleteCompany = (company) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'entreprise "${company.name}" ? Cette action est irréversible.`)) {
      deleteCompanyMutation.mutate(company.id);
    }
  };

  const handleCancelSubscription = (company) => {
    const reason = window.prompt('Raison de l\'annulation (optionnel) :');
    cancelSubscriptionMutation.mutate({ 
      companyId: company.id, 
      reason: reason || 'Annulation manuelle' 
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: { icon: CheckCircleIcon, color: 'bg-green-100 text-green-800', label: 'Actif' },
      SUSPENDED: { icon: XCircleIcon, color: 'bg-red-100 text-red-800', label: 'Suspendu' },
      EXPIRED: { icon: ClockIcon, color: 'bg-orange-100 text-orange-800', label: 'Expiré' },
      CANCELLED: { icon: XCircleIcon, color: 'bg-gray-100 text-gray-800', label: 'Annulé' },
      PENDING: { icon: ClockIcon, color: 'bg-yellow-100 text-yellow-800', label: 'En attente' }
    };

    const badge = badges[status] || badges.PENDING;
    const Icon = badge.icon;

    return (
      <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', badge.color)}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <LogoSys size="small" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Entreprises</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Gérez toutes les entreprises de la plateforme
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/companies/create')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Nouvelle entreprise
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total entreprises</p>
                <p className="text-2xl font-bold">{overview.total || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <BuildingOfficeIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Entreprises actives</p>
                <p className="text-2xl font-bold text-green-600">{overview.active || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                <CheckCircleIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Abonnements à expirer</p>
                <p className="text-2xl font-bold text-orange-600">
                  {expiringSubscriptions.length || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                <ClockIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Revenu mensuel</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(overview.monthlyRevenue || 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres et recherche */}
        <Card className="mb-6">
          <div className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher une entreprise..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="ACTIVE">Actif</option>
                <option value="SUSPENDED">Suspendu</option>
                <option value="EXPIRED">Expiré</option>
                <option value="CANCELLED">Annulé</option>
                <option value="PENDING">En attente</option>
              </select>

              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Tous les plans</option>
                <option value="BASIC">Basic</option>
                <option value="PRO">Pro</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>

              <button
                onClick={() => refetch()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors"
              >
                <ArrowPathIcon className="w-4 h-4 mr-2" />
                Actualiser
              </button>
            </div>
          </div>
        </Card>

        {/* Liste des entreprises */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entreprise</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Secteur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateurs</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Créée le</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                      <p className="mt-4 text-gray-500">Chargement des entreprises...</p>
                    </td>
                  </tr>
                ) : companies.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <BuildingOfficeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Aucune entreprise trouvée</p>
                      <button
                        onClick={() => navigate('/admin/companies/create')}
                        className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Créer une entreprise
                      </button>
                    </td>
                  </tr>
                ) : (
                  companies.map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
                            <BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{company.name}</p>
                            <p className="text-sm text-gray-500">{company.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {company.businessSector?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {company.activeSubscription ? (
                          <div>
                            <span className="font-medium">{company.activeSubscription.plan?.name}</span>
                            <p className="text-xs text-gray-500">{company.activeSubscription.userCount} utilisateurs</p>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="font-medium">{company.activeUsersCount || 0}</span>
                        <span className="text-gray-500"> / {company.activeSubscription?.userCount || 0}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(company.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {company.activeSubscription ? (
                          <span className={clsx(
                            new Date(company.activeSubscription.endDate) < new Date() ? 'text-red-600 font-medium' : 'text-gray-900'
                          )}>
                            {formatDate(company.activeSubscription.endDate)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(company.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Menu as="div" className="relative inline-block text-left">
                          <Menu.Button className="p-2 hover:bg-gray-100 rounded-lg">
                            <EllipsisVerticalIcon className="w-4 h-4 text-gray-600" />
                          </Menu.Button>
                          <Transition
                            as={Fragment}
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                          >
                            <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-30">
                              <div className="px-1 py-1">
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => navigate(`/admin/companies/${company.id}`)}
                                      className={`${active ? 'bg-blue-50 text-blue-600' : 'text-gray-700'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                    >
                                      <BuildingOfficeIcon className="w-4 h-4 mr-3" />
                                      Voir détails
                                    </button>
                                  )}
                                </Menu.Item>
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => navigate(`/admin/companies/${company.id}/edit`)}
                                      className={`${active ? 'bg-blue-50 text-blue-600' : 'text-gray-700'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                    >
                                      <PencilIcon className="w-4 h-4 mr-3" />
                                      Modifier
                                    </button>
                                  )}
                                </Menu.Item>
                              </div>
                              {company.activeSubscription && (
                                <div className="px-1 py-1">
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        onClick={() => handleCancelSubscription(company)}
                                        className={`${active ? 'bg-orange-50 text-orange-600' : 'text-gray-700'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                      >
                                        <XCircleIcon className="w-4 h-4 mr-3" />
                                        Annuler abonnement
                                      </button>
                                    )}
                                  </Menu.Item>
                                </div>
                              )}
                              <div className="px-1 py-1">
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => handleDeleteCompany(company)}
                                      className={`${active ? 'bg-red-50 text-red-600' : 'text-red-600'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                    >
                                      <TrashIcon className="w-4 h-4 mr-3" />
                                      Supprimer
                                    </button>
                                  )}
                                </Menu.Item>
                              </div>
                            </Menu.Items>
                          </Transition>
                        </Menu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
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

        {/* Activités récentes et Abonnements à expirer */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activités récentes */}
          <Card className="lg:col-span-2">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Activités récentes</h3>
            </div>
            <div className="p-6">
              {recentCompanies.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Aucune activité récente</p>
              ) : (
                <div className="space-y-4">
                  {recentCompanies.slice(0, 5).map((company) => (
                    <div key={company.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Nouvelle entreprise ajoutée
                          </p>
                          <p className="text-xs text-gray-500">
                            {company.name} • {formatDate(company.createdAt)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/admin/companies/${company.id}`)}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Voir
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Abonnements à expirer */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Abonnements à expirer</h3>
            </div>
            <div className="p-6">
              {expiringSubscriptions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Aucun abonnement n'expire prochainement
                </p>
              ) : (
                <div className="space-y-3">
                  {expiringSubscriptions.map((sub, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{sub.companyName}</p>
                        <p className="text-xs text-gray-600">
                          {sub.planName} • Expire dans {sub.daysRemaining} jours
                        </p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        {formatDate(sub.endDate)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AdminCompanies;