import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@store/auth.store';
import { useNotificationStore } from '@store/notification.store';
import { useUIStore } from '@store/ui.store';
import LogoSys from '@components/LogoSys';
import Footer from '@components/Footer';
import NotificationBell from '@components/NotificationBell';
import UserMenu from '@components/UserMenu';
import {
  HomeIcon,
  EnvelopeIcon,
  VideoCameraIcon,
  BellIcon,
  UserGroupIcon,
  TruckIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import clsx from 'clsx';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const [expandedMenus, setExpandedMenus] = useState([]);

  const toggleMenu = (menuId) => {
    setExpandedMenus(prev =>
      prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId]
    );
  };

  const navigation = [
    { name: 'Tableau de bord', href: '/dashboard', icon: HomeIcon },
    { name: 'Messagerie', href: '/messages', icon: EnvelopeIcon, badge: 0 },
    { name: 'Réunions', href: '/meetings', icon: VideoCameraIcon },
    { name: 'Tâches', href: '/tasks', icon: ClipboardDocumentListIcon },
    { name: 'Documents', href: '/documents', icon: DocumentTextIcon },
  ];

  const adminNavigation = [
    { name: 'Utilisateurs', href: '/company/users', icon: UserGroupIcon },
    { name: 'Rôles', href: '/company/roles', icon: ShieldCheckIcon },
    { name: 'Paramètres', href: '/company/settings', icon: Cog6ToothIcon },
  ];

  const systemAdminNavigation = [
    { name: 'Entreprises', href: '/admin/companies', icon: BuildingOfficeIcon },
    { name: 'Abonnements', href: '/admin/subscriptions', icon: CurrencyDollarIcon },
    { name: 'Utilisateurs', href: '/admin/users', icon: UserGroupIcon },
    { name: 'Audit', href: '/admin/audit', icon: ChartBarIcon },
    { name: 'Paramètres système', href: '/admin/settings', icon: Cog6ToothIcon },
  ];

  const moduleNavigation = [];

  if (user?.company?.modules?.includes('LOGISTICS') || user?.isSystemAdmin) {
    moduleNavigation.push({
      id: 'logistics',
      name: 'Logistique',
      icon: TruckIcon,
      children: [
        { name: 'Tableau de bord', href: '/logistics/dashboard' },
        { name: 'Entrepôts', href: '/logistics/warehouses' },
        { name: 'Stocks', href: '/logistics/inventory' },
        { name: 'Commandes', href: '/logistics/purchase-orders' },
        { name: 'Expéditions', href: '/logistics/shipments' },
      ]
    });
  }

  if (user?.company?.modules?.includes('ACCOUNTING') || user?.isSystemAdmin) {
    moduleNavigation.push({
      id: 'accounting',
      name: 'Comptabilité',
      icon: CurrencyDollarIcon,
      children: [
        { name: 'Tableau de bord', href: '/accounting/dashboard' },
        { name: 'Plan comptable', href: '/accounting/chart-of-accounts' },
        { name: 'Écritures', href: '/accounting/journal-entries' },
        { name: 'Factures', href: '/accounting/invoices' },
        { name: 'Paiements', href: '/accounting/payments' },
        { name: 'Rapports', href: '/accounting/reports' },
      ]
    });
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

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
        <span className="flex-1">{item.name}</span>
        {item.badge > 0 && (
          <span className="ml-auto bg-blue-600 text-white text-xs font-medium px-2 py-0.5 rounded-full">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  const NavMenu = ({ menu }) => {
    const isExpanded = expandedMenus.includes(menu.id);
    const isActive = menu.children?.some(child => location.pathname.startsWith(child.href));

    return (
      <div>
        <button
          onClick={() => toggleMenu(menu.id)}
          className={clsx(
            'w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors',
            isActive
              ? 'text-blue-700'
              : 'text-gray-700 hover:bg-gray-100'
          )}
        >
          <menu.icon className="w-5 h-5 mr-3" />
          <span className="flex-1 text-left">{menu.name}</span>
          {isExpanded ? (
            <ChevronDownIcon className="w-4 h-4" />
          ) : (
            <ChevronRightIcon className="w-4 h-4" />
          )}
        </button>
        
        {isExpanded && (
          <div className="ml-9 mt-1 space-y-1">
            {menu.children.map((child) => (
              <Link
                key={child.href}
                to={child.href}
                className={clsx(
                  'block px-4 py-2 text-sm rounded-lg transition-colors',
                  location.pathname.startsWith(child.href)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
                onClick={() => setSidebarOpen(false)}
              >
                {child.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  const sidebarContent = (
    <>
      <div className="sidebar-header">
        <LogoSys />
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navigation.map((item) => (
          <NavItem key={item.name} item={item} />
        ))}
        
        {(user?.isCompanyAdmin || user?.isSystemAdmin) && (
          <>
            <div className="pt-4 mt-4 border-t border-gray-200">
              <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Administration
              </p>
            </div>
            {adminNavigation.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </>
        )}

        {user?.isSystemAdmin && (
          <>
            <div className="pt-4 mt-4 border-t border-gray-200">
              <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Super Admin
              </p>
            </div>
            {systemAdminNavigation.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </>
        )}

        {moduleNavigation.length > 0 && (
          <>
            <div className="pt-4 mt-4 border-t border-gray-200">
              <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Modules
              </p>
            </div>
            {moduleNavigation.map((menu) => (
              <NavMenu key={menu.id} menu={menu} />
            ))}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
          Déconnexion
        </button>
      </div>
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
        {/* Header */}
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
                    {user?.company?.name || 'LogSys CRM'}
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

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default DashboardLayout;