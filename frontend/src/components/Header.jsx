import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@store/auth.store';
import LogoSys from './LogoSys';
import NotificationBell from './NotificationBell';
import UserMenu from './UserMenu';

const Header = () => {
  const { user } = useAuthStore();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <LogoSys size="small" />
            <div className="ml-4">
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
  );
};

export default Header;