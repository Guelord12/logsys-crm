import React from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import {
  CurrencyDollarIcon,
  DocumentTextIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  PlusIcon,
  DocumentDuplicateIcon,
  CreditCardIcon,
  CalendarIcon,
  PencilIcon  // ✅ AJOUTÉ
} from '@heroicons/react/24/outline';
import { accountingService } from '@services/accounting.service';
import { formatCurrency, formatDate } from '@utils/formatters';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts';
import LogoSys from '@components/LogoSys';
import Footer from '@components/Footer';
import clsx from 'clsx';

const AccountingDashboard = () => {
  const { data: dashboardData, isLoading } = useQuery(
    'accounting-dashboard',
    () => accountingService.getDashboardData(),
    {
      refetchInterval: 300000 // 5 minutes
    }
  );

  const { data: recentEntries } = useQuery(
    'recent-entries',
    () => accountingService.getRecentEntries(10)
  );

  const { data: unpaidInvoices } = useQuery(
    'unpaid-invoices',
    () => accountingService.getUnpaidInvoices()
  );

  const COLORS = ['#4A90E2', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  // ✅ Extraction correcte des données selon la structure Axios
  const dashboard = dashboardData?.data?.data || dashboardData?.data || {};
  const entries = recentEntries?.data?.data || recentEntries?.data || [];
  const invoices = unpaidInvoices?.data?.data || unpaidInvoices?.data || [];

  const StatCard = ({ title, value, icon: Icon, trend, color = 'blue' }) => (
    <div className="logsys-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <p className={clsx(
              'text-sm mt-2 flex items-center',
              trend > 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {trend > 0 ? (
                <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
              )}
              {Math.abs(trend)}% par rapport au mois dernier
            </p>
          )}
        </div>
        <div className={clsx(
          'w-12 h-12 rounded-lg flex items-center justify-center',
          `bg-${color}-100`
        )}>
          <Icon className={clsx('w-6 h-6', `text-${color}-600`)} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <LogoSys size="small" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Comptabilité</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Tableau de bord comptable - Plan OHADA
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link to="/accounting/journal-entries/new" className="btn btn-primary">
                <PlusIcon className="w-4 h-4 mr-2" />
                Nouvelle écriture
              </Link>
              <Link to="/accounting/invoices/new" className="btn btn-secondary">
                <DocumentTextIcon className="w-4 h-4 mr-2" />
                Nouvelle facture
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="page-container">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                title="Total Actif"
                value={formatCurrency(dashboard.totalAssets || 0)}
                icon={ChartBarIcon}
                trend={dashboard.assetsTrend}
                color="blue"
              />
              <StatCard
                title="Total Passif"
                value={formatCurrency(dashboard.totalLiabilities || 0)}
                icon={DocumentDuplicateIcon}
                trend={dashboard.liabilitiesTrend}
                color="red"
              />
              <StatCard
                title="Chiffre d'affaires"
                value={formatCurrency(dashboard.revenue || 0)}
                icon={CurrencyDollarIcon}
                trend={dashboard.revenueTrend}
                color="green"
              />
              <StatCard
                title="Trésorerie"
                value={formatCurrency(dashboard.cashBalance || 0)}
                icon={BanknotesIcon}
                trend={dashboard.cashTrend}
                color="yellow"
              />
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Évolution du CA */}
              <div className="logsys-card">
                <div className="logsys-card-header">
                  <h3 className="font-semibold text-gray-900">Évolution du chiffre d'affaires</h3>
                </div>
                <div className="logsys-card-body">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dashboard.revenueChart || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => formatCurrency(value)}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#4A90E2" 
                        strokeWidth={2}
                        name="Chiffre d'affaires"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="expenses" 
                        stroke="#EF4444" 
                        strokeWidth={2}
                        name="Dépenses"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Répartition des charges */}
              <div className="logsys-card">
                <div className="logsys-card-header">
                  <h3 className="font-semibold text-gray-900">Répartition des charges</h3>
                </div>
                <div className="logsys-card-body">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={dashboard.expensesBreakdown || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.percentage}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {(dashboard.expensesBreakdown || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Factures impayées */}
              <div className="logsys-card lg:col-span-2">
                <div className="logsys-card-header flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Factures clients impayées</h3>
                  <Link 
                    to="/accounting/invoices" 
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Voir tout
                  </Link>
                </div>
                <div className="logsys-card-body">
                  <div className="space-y-3">
                    {invoices.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        Aucune facture impayée
                      </p>
                    ) : (
                      invoices.slice(0, 5).map((invoice) => (
                        <div 
                          key={invoice.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                              <DocumentTextIcon className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {invoice.customer?.accountName || invoice.customerName}
                              </p>
                              <p className="text-sm text-gray-500">
                                Facture #{invoice.invoiceNumber} • {formatDate(invoice.invoiceDate)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">
                              {formatCurrency(invoice.totalAmount)}
                            </p>
                            <p className={clsx(
                              'text-sm',
                              new Date(invoice.dueDate) < new Date() 
                                ? 'text-red-600' 
                                : 'text-orange-600'
                            )}>
                              Échéance: {formatDate(invoice.dueDate)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Dernières écritures */}
              <div className="logsys-card">
                <div className="logsys-card-header flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Dernières écritures</h3>
                  <Link 
                    to="/accounting/journal-entries" 
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Voir tout
                  </Link>
                </div>
                <div className="logsys-card-body">
                  <div className="space-y-3">
                    {entries.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        Aucune écriture récente
                      </p>
                    ) : (
                      entries.map((entry) => (
                        <div 
                          key={entry.id}
                          className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {entry.description}
                            </p>
                            <p className="text-xs text-gray-500">
                              {entry.entryNumber} • {formatDate(entry.entryDate)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(entry.lines?.reduce((sum, l) => sum + (l.debitAmount || 0), 0) || 0)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {entry.journal?.journalCode}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Raccourcis rapides */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Accès rapides</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {[
                  { name: 'Plan comptable', icon: DocumentDuplicateIcon, path: '/accounting/chart-of-accounts', color: 'blue' },
                  { name: 'Écritures', icon: PencilIcon, path: '/accounting/journal-entries', color: 'green' },
                  { name: 'Factures', icon: DocumentTextIcon, path: '/accounting/invoices', color: 'orange' },
                  { name: 'Paiements', icon: CreditCardIcon, path: '/accounting/payments', color: 'purple' },
                  { name: 'Rapports', icon: ChartBarIcon, path: '/accounting/reports', color: 'red' },
                  { name: 'Périodes', icon: CalendarIcon, path: '/accounting/periods', color: 'indigo' }
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={index}
                      to={item.path}
                      className={clsx(
                        'flex flex-col items-center p-4 rounded-lg border-2 border-transparent',
                        'hover:border-blue-200 hover:bg-blue-50 transition-all duration-200',
                        `bg-${item.color}-50`
                      )}
                    >
                      <div className={clsx(
                        'w-12 h-12 rounded-lg flex items-center justify-center mb-2',
                        `bg-${item.color}-100`
                      )}>
                        <Icon className={clsx('w-6 h-6', `text-${item.color}-600`)} />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default AccountingDashboard;