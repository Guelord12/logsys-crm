import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { dashboardService } from '@services/dashboard.service';
import LogoSys from '@components/LogoSys';
import Footer from '@components/Footer';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { formatCurrency } from '@utils/formatters';

const AdminDashboard = () => {
  const { data, isLoading } = useQuery(
    'admin-dashboard',
    () => dashboardService.getSystemAdminDashboard()
  );

  // Extraire les stats correctement
  const stats = data?.data?.data?.stats || data?.data?.stats || {};

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center space-x-4">
            <LogoSys size="small" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Tableau de bord administrateur système
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Entreprises"
            value={stats.totalCompanies || 0}
            subtitle={`${stats.activeCompanies || 0} actives`}
            icon={BuildingOfficeIcon}
            color="blue"
          />
          <StatCard
            title="Utilisateurs"
            value={stats.totalUsers || 0}
            subtitle={`${stats.activeUsers || 0} actifs`}
            icon={UserGroupIcon}
            color="green"
          />
          <StatCard
            title="Abonnements actifs"
            value={stats.activeSubscriptions || 0}
            subtitle={`${stats.expiringSubscriptions || 0} expirent bientôt`}
            icon={CurrencyDollarIcon}
            color="purple"
          />
          <StatCard
            title="Revenu mensuel"
            value={formatCurrency(stats.monthlyRevenue || 0)}
            icon={ChartBarIcon}
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Accès rapides</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/admin/companies" className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <BuildingOfficeIcon className="w-6 h-6 text-blue-600 mb-2" />
                <p className="font-medium">Entreprises</p>
                <p className="text-sm text-gray-500">Gérer les entreprises</p>
              </Link>
              <Link to="/admin/users" className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                <UserGroupIcon className="w-6 h-6 text-green-600 mb-2" />
                <p className="font-medium">Utilisateurs</p>
                <p className="text-sm text-gray-500">Gérer les utilisateurs</p>
              </Link>
              <Link to="/admin/subscriptions" className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                <CurrencyDollarIcon className="w-6 h-6 text-purple-600 mb-2" />
                <p className="font-medium">Abonnements</p>
                <p className="text-sm text-gray-500">Gérer les abonnements</p>
              </Link>
              <Link to="/admin/audit" className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                <ChartBarIcon className="w-6 h-6 text-orange-600 mb-2" />
                <p className="font-medium">Audit</p>
                <p className="text-sm text-gray-500">Voir les logs</p>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;