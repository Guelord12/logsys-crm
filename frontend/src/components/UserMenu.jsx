import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@store/auth.store';
import {
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

const UserMenu = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <UserCircleIcon className="w-5 h-5 text-blue-600" />
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
          <p className="text-xs text-gray-500">{user?.email}</p>
        </div>
        <ChevronDownIcon className="hidden md:block w-4 h-4 text-gray-500" />
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
        <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-1 py-1">
            <Menu.Item>
              {({ active }) => (
                <Link
                  to="/profile"
                  className={`${
                    active ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                >
                  <UserCircleIcon className="w-4 h-4 mr-3" />
                  Mon profil
                </Link>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <Link
                  to="/settings"
                  className={`${
                    active ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                >
                  <Cog6ToothIcon className="w-4 h-4 mr-3" />
                  Paramètres
                </Link>
              )}
            </Menu.Item>
          </div>
          <div className="px-1 py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleLogout}
                  className={`${
                    active ? 'bg-red-50 text-red-600' : 'text-gray-700'
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                  Déconnexion
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default UserMenu;