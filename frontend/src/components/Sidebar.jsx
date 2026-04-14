import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@store/auth.store';
import {
  HomeIcon,
  EnvelopeIcon,
  VideoCameraIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  UserGroupIcon,
  TruckIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import LogoSys from './LogoSys';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();

  const navigation = [
    { name: 'Tableau de bord', href: '/dashboard', icon: HomeIcon },
    { name: 'Messagerie', href: '/messages', icon: EnvelopeIcon },
    { name: 'Réunions', href: '/meetings', icon: VideoCameraIcon },
    { name: 'Tâches', href: '/tasks', icon: ClipboardDocumentListIcon },
    { name: 'Documents', href: '/documents', icon: DocumentTextIcon },
  ];

  const adminNav = user?.isCompanyAdmin ? [
    { name: 'Utilisateurs', href: '/company/users', icon: UserGroupIcon },
    { name: 'Rôles', href: '/company/roles', icon: ShieldCheckIcon },
    { name: 'Paramètres', href: '/company/settings', icon: Cog6ToothIcon },
  ] : [];

  const systemAdminNav = user?.isSystemAdmin ? [
    { name: 'Entreprises', href: '/admin/companies', icon: BuildingOfficeIcon },
    { name: 'Abonnements', href: '/admin/subscriptions', icon: CurrencyDollarIcon },
    { name: 'Audit', href: '/admin/audit', icon: ChartBarIcon },
  ] : [];

  const moduleNav = [];
  
  if (user?.company?.modules?.includes('LOGISTICS')) {
    moduleNav.push({ name: 'Logistique', href: '/logistics/dashboard', icon: TruckIcon });
  }
  
  if (user?.company?.modules?.includes('ACCOUNTING')) {
    moduleNav.push({ name: 'Comptabilité', href: '/accounting/dashboard', icon: CurrencyDollarIcon });
  }

  const NavItem = ({ item }) => (
    <NavLink
      to={item.href}
      className={({ isActive }) => clsx(
        'flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors',
        isActive
          ? 'bg-blue-50 text-blue-700'
          : 'text-gray-700 hover:bg-gray-100'
      )}
      onClick={() => onClose?.()}
    >
      <item.icon className="w-5 h-5 mr-3" />
      {item.name}
    </NavLink>
  );

  return (
    <div className={clsx(
      'fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out',
      'lg:translate-x-0',
      isOpen ? 'translate-x-0' : '-translate-x-full'
    )}>
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <LogoSys />
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navigation.map((item) => (
          <NavItem key={item.name} item={item} />
        ))}
        
        {adminNav.length > 0 && (
          <>
            <div className="pt-4 mt-4 border-t border-gray-200">
              <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Administration
              </p>
            </div>
            {adminNav.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </>
        )}
        
        {systemAdminNav.length > 0 && (
          <>
            <div className="pt-4 mt-4 border-t border-gray-200">
              <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Super Admin
              </p>
            </div>
            {systemAdminNav.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </>
        )}
        
        {moduleNav.length > 0 && (
          <>
            <div className="pt-4 mt-4 border-t border-gray-200">
              <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Modules
              </p>
            </div>
            {moduleNav.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </>
        )}
      </nav>
    </div>
  );
};

export default Sidebar;