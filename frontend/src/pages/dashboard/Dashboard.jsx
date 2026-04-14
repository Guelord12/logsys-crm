import React from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@store/auth.store';
import { dashboardService } from '@services/dashboard.service';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  EnvelopeIcon,
  VideoCameraIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  BellIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { formatDate, formatCurrency, formatTime } from '@utils/formatters';
import Card from '@components/common/Card';
import LogoSys from '@components/LogoSys';
import Footer from '@components/Footer';
import clsx from 'clsx';

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    teal: 'bg-teal-50 text-teal-600'
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

const Dashboard = () => {
  const { user } = useAuthStore();
  
  const isSystemAdmin = user?.isSystemAdmin;
  const isCompanyAdmin = user?.isCompanyAdmin;

  // Déterminer l'URL selon le rôle
  const getDashboardUrl = () => {
    if (isSystemAdmin) return '/dashboard/system';
    if (isCompanyAdmin) return '/dashboard/company';
    return '/dashboard/user';
  };

  const { data: dashboardData, isLoading } = useQuery(
    ['dashboard', user?.id, isSystemAdmin, isCompanyAdmin],
    () => dashboardService.getDashboard(),
    {
      enabled: !!user,
      refetchInterval: 60000
    }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  // Extraire les données avec la bonne structure
  const responseData = dashboardData?.data?.data || dashboardData?.data || {};
  const stats = responseData.stats || {};
  const recentCompanies = responseData.recentCompanies || [];
  const recentActivity = responseData.recentActivity || [];
  const upcomingMeetings = responseData.upcomingMeetings || [];
  const myTasks = responseData.myTasks || [];
  const recentNotifications = responseData.recentNotifications || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <LogoSys size="small" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Bienvenue, {user?.fullName || user?.firstName} !
                </h1>
                <p className="text-sm text-gray-500">
                  {isSystemAdmin && 'Tableau de bord administrateur système'}
                  {isCompanyAdmin && !isSystemAdmin && `Tableau de bord - ${user?.company?.name || 'Entreprise'}`}
                  {!isSystemAdmin && !isCompanyAdmin && 'Votre tableau de bord personnel'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link to="/notifications" className="relative p-2 hover:bg-gray-100 rounded-lg">
                <BellIcon className="w-6 h-6 text-gray-600" />
              </Link>
              <Link to="/messages" className="p-2 hover:bg-gray-100 rounded-lg">
                <EnvelopeIcon className="w-6 h-6 text-gray-600" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {isSystemAdmin ? (
            <>
              <StatCard
                title="Total entreprises"
                value={stats.totalCompanies || 0}
                subtitle={`${stats.activeCompanies || 0} actives`}
                icon={BuildingOfficeIcon}
                color="blue"
              />
              <StatCard
                title="Total utilisateurs"
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
            </>
          ) : isCompanyAdmin ? (
            <>
              <StatCard
                title="Utilisateurs"
                value={`${stats.activeUsers || 0}/${stats.userLimit || 0}`}
                subtitle="Utilisateurs actifs"
                icon={UserGroupIcon}
                color="blue"
              />
              <StatCard
                title="Messages non lus"
                value={stats.unreadMessages || 0}
                icon={EnvelopeIcon}
                color="green"
              />
              <StatCard
                title="Réunions à venir"
                value={stats.upcomingMeetings || 0}
                icon={VideoCameraIcon}
                color="purple"
              />
              <StatCard
                title="Tâches en attente"
                value={stats.pendingTasks || 0}
                icon={ClipboardDocumentListIcon}
                color="orange"
              />
            </>
          ) : (
            <>
              <StatCard
                title="Messages non lus"
                value={stats.unreadMessages || 0}
                icon={EnvelopeIcon}
                color="blue"
              />
              <StatCard
                title="Réunions à venir"
                value={stats.upcomingMeetings || 0}
                icon={VideoCameraIcon}
                color="green"
              />
              <StatCard
                title="Tâches en cours"
                value={stats.pendingTasks || 0}
                icon={ClipboardDocumentListIcon}
                color="purple"
              />
              <StatCard
                title="Documents uploadés"
                value={stats.documentsUploaded || 0}
                icon={DocumentTextIcon}
                color="orange"
              />
            </>
          )}
        </div>

        {/* Statistiques secondaires (admin système) */}
        {isSystemAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatCard
              title="Utilisateurs actifs"
              value={stats.activeUsers || 0}
              icon={CheckCircleIcon}
              color="indigo"
            />
            <StatCard
              title="Abonnements expirant"
              value={stats.expiringSubscriptions || 0}
              icon={ClockIcon}
              color="red"
            />
          </div>
        )}

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Activités récentes */}
            <Card title="Activités récentes">
              <div className="space-y-3">
                {recentActivity.length > 0 ? (
                  recentActivity.slice(0, 8).map((activity, index) => (
                    <div key={activity.id || index} className="flex items-start space-x-3 py-1">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.actionType === 'CREATE' ? 'bg-green-500' :
                        activity.actionType === 'UPDATE' ? 'bg-blue-500' :
                        activity.actionType === 'DELETE' ? 'bg-red-500' : 'bg-gray-500'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{activity.description}</p>
                        <p className="text-xs text-gray-500">
                          {activity.user} • {formatDate(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">Aucune activité récente</p>
                )}
              </div>
            </Card>

            {/* Tâches récentes */}
            {!isSystemAdmin && (
              <Card 
                title="Mes tâches" 
                headerAction={
                  <Link to="/tasks" className="text-sm text-blue-600 hover:text-blue-700">
                    Voir tout
                  </Link>
                }
              >
                <div className="space-y-3">
                  {myTasks.length > 0 ? (
                    myTasks.map((task) => (
                      <Link
                        key={task.id}
                        to={`/tasks/${task.id}`}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={clsx(
                            'w-2 h-2 rounded-full',
                            task.priority === 'URGENT' && 'bg-red-500',
                            task.priority === 'HIGH' && 'bg-orange-500',
                            task.priority === 'MEDIUM' && 'bg-yellow-500',
                            task.priority === 'LOW' && 'bg-green-500'
                          )} />
                          <div>
                            <p className="font-medium text-gray-900">{task.title}</p>
                            <p className="text-sm text-gray-500">
                              Échéance: {formatDate(task.dueDate)}
                            </p>
                          </div>
                        </div>
                        <span className={clsx(
                          'text-xs px-2 py-1 rounded-full',
                          task.status === 'COMPLETED' && 'bg-green-100 text-green-800',
                          task.status === 'IN_PROGRESS' && 'bg-blue-100 text-blue-800',
                          task.status === 'PENDING' && 'bg-yellow-100 text-yellow-800'
                        )}>
                          {task.status === 'COMPLETED' ? 'Terminé' : 
                           task.status === 'IN_PROGRESS' ? 'En cours' : 'En attente'}
                        </span>
                      </Link>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-4">Aucune tâche</p>
                  )}
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {/* Réunions à venir */}
            <Card 
              title="Réunions à venir"
              headerAction={
                <Link to="/meetings" className="text-sm text-blue-600 hover:text-blue-700">
                  Voir tout
                </Link>
              }
            >
              <div className="space-y-3">
                {upcomingMeetings.length > 0 ? (
                  upcomingMeetings.map((meeting) => (
                    <Link
                      key={meeting.id}
                      to={`/meetings/${meeting.id}`}
                      className="block p-3 hover:bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <VideoCameraIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{meeting.title}</p>
                          <p className="text-sm text-gray-500">
                            {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Organisé par {meeting.organizer?.fullName || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">Aucune réunion à venir</p>
                )}
              </div>
            </Card>

            {/* Entreprises récentes */}
            {isSystemAdmin && (
              <Card 
                title="Entreprises récentes"
                headerAction={
                  <Link to="/admin/companies" className="text-sm text-blue-600 hover:text-blue-700">
                    Voir tout
                  </Link>
                }
              >
                <div className="space-y-3">
                  {recentCompanies.length > 0 ? (
                    recentCompanies.slice(0, 5).map((company) => (
                      <Link
                        key={company.id}
                        to={`/admin/companies/${company.id}`}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{company.name}</p>
                          <p className="text-sm text-gray-500">{company.email}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-400">
                            {formatDate(company.createdAt)}
                          </span>
                          <p className="text-xs font-medium text-blue-600">
                            {company.activeSubscription?.plan?.name || 'Basic'}
                          </p>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-4">Aucune entreprise récente</p>
                  )}
                </div>
              </Card>
            )}

            {/* Notifications récentes */}
            <Card title="Notifications récentes">
              <div className="space-y-3">
                {recentNotifications.length > 0 ? (
                  recentNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={clsx(
                        'p-3 rounded-lg',
                        notification.status === 'UNREAD' ? 'bg-blue-50' : 'bg-gray-50'
                      )}
                    >
                      <p className="font-medium text-gray-900">{notification.title}</p>
                      <p className="text-sm text-gray-600">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">Aucune notification</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;