import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@store/auth.store';
import LogoSys from '@components/LogoSys';
import Footer from '@components/Footer';
import NotificationBell from '@components/NotificationBell';
import UserMenu from '@components/UserMenu';
import {
  HomeIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  Bars3Icon,
  XMarkIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const AdminLayout = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Tableau de bord', href: '/admin/dashboard', icon: HomeIcon },
    { name: 'Entreprises', href: '/admin/companies', icon: BuildingOfficeIcon },
    { name: 'Abonnements', href: '/admin/subscriptions', icon: CurrencyDollarIcon },
    { name: 'Utilisateurs', href: '/admin/users', icon: UserGroupIcon },
    { name: 'Audit', href: '/admin/audit', icon: ChartBarIcon },
    { name: 'Rapports', href: '/admin/reports', icon: DocumentTextIcon },
    { name: 'Paramètres', href: '/admin/settings', icon: Cog6ToothIcon },
  ];

  const NavItem = ({ item }) => {
    const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
    
    return (
      <Link
        to={item.href}
        className={clsx(
          'flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors',
          isActive
            ? 'bg-blue-50 text-blue-700'
            : 'text-gray-700 hover:bg-gray-100'
        )}
        onClick={() => setSidebarOpen(false)}
      >
        <item.icon className="w-5 h-5 mr-3" />
        {item.name}
      </Link>
    );
  };

  const sidebarContent = (
    <>
      <div className="sidebar-header">
        <LogoSys />
        <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs font-medium rounded-full">
          Admin
        </span>
      </div>
      
      <div className="px-4 py-3 bg-blue-50 mx-4 rounded-lg mb-4">
        <p className="text-xs text-blue-600 font-medium">Administrateur Système</p>
        <p className="text-sm font-medium text-gray-900 truncate">{user?.fullName}</p>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navigation.map((item) => (
          <NavItem key={item.name} item={item} />
        ))}
      </nav>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar mobile */}
      <div className={clsx(
        'fixed inset-0 z-40 lg:hidden',
        sidebarOpen ? 'block' : 'hidden'
      )}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex flex-col w-64 h-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>
          {sidebarContent}
        </div>
      </div>

      {/* Sidebar desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 bg-white border-r border-gray-200">
          {sidebarContent}
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <button
                  className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-600 focus:outline-none"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Bars3Icon className="h-6 w-6" />
                </button>
                <div className="ml-4 lg:ml-0">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Administration Système
                  </h2>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <NotificationBell />
                <UserMenu />
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default AdminLayout;