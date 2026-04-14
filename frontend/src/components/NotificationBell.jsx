import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNotificationStore } from '@store/notification.store';
import { BellIcon } from '@heroicons/react/24/outline';
import { Popover } from '@headlessui/react';
import { formatTime } from '@utils/formatters';
import clsx from 'clsx';

const NotificationBell = () => {
  const { 
    notifications, 
    unreadCount, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead 
  } = useNotificationStore();

  // Charger les notifications au montage - pas pendant le rendu
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const recentNotifications = notifications.slice(0, 5);

  const handleMarkAsRead = (id) => {
    markAsRead(id);
  };

  return (
    <Popover className="relative">
      {({ open }) => (
        <>
          <Popover.Button className="relative p-2 text-gray-500 hover:text-gray-600 rounded-full hover:bg-gray-100 focus:outline-none">
            <BellIcon className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs font-medium flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Popover.Button>

          <Popover.Panel className="absolute right-0 z-50 mt-2 w-80 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Tout marquer comme lu
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {recentNotifications.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Aucune notification
                  </p>
                ) : (
                  recentNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={clsx(
                        'p-3 rounded-lg cursor-pointer transition-colors',
                        notification.status === 'UNREAD'
                          ? 'bg-blue-50 hover:bg-blue-100'
                          : 'bg-gray-50 hover:bg-gray-100'
                      )}
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200">
                <Link
                  to="/notifications"
                  className="block text-center text-sm text-blue-600 hover:text-blue-700"
                >
                  Voir toutes les notifications
                </Link>
              </div>
            </div>
          </Popover.Panel>
        </>
      )}
    </Popover>
  );
};

export default NotificationBell;