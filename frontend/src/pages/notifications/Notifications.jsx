import React, { useEffect } from 'react';
import { useNotificationStore } from '@store/notification.store';
import { formatDateTime } from '@utils/formatters';
import Card from '@components/common/Card';
import Button from '@components/common/Button';
import Badge from '@components/common/Badge';
import { BellIcon, CheckIcon, TrashIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const Notifications = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications(true);
  }, []);

  const handleMarkAsRead = async (id) => {
    await markAsRead(id);
    toast.success('Notification marquée comme lue');
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    toast.success('Toutes les notifications ont été marquées comme lues');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer cette notification ?')) {
      await deleteNotification(id);
      toast.success('Notification supprimée');
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      fetchNotifications(false);
    }
  };

  return (
    <div className="page-container max-w-3xl mx-auto">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-description">
            {unreadCount} notification{unreadCount !== 1 ? 's' : ''} non lue{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" onClick={handleMarkAllAsRead}>
            <CheckIcon className="w-4 h-4 mr-2" />
            Tout marquer comme lu
          </Button>
        )}
      </div>

      <Card>
        {notifications.length === 0 && !isLoading ? (
          <div className="text-center py-12">
            <BellIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucune notification</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={clsx(
                  'py-4 px-2 hover:bg-gray-50 transition-colors',
                  notification.status === 'UNREAD' && 'bg-blue-50'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium text-gray-900">{notification.title}</h3>
                      {notification.priority === 'HIGH' && (
                        <Badge variant="danger" size="sm">Important</Badge>
                      )}
                      {notification.priority === 'URGENT' && (
                        <Badge variant="danger" size="sm">Urgent</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {formatDateTime(notification.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {notification.status === 'UNREAD' && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="Marquer comme lu"
                      >
                        <CheckIcon className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Supprimer"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                    {notification.actionUrl && (
                      <Button
                        to={notification.actionUrl}
                        size="sm"
                        variant="outline"
                      >
                        {notification.actionText || 'Voir'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="mt-4 text-center">
            <Button variant="secondary" onClick={handleLoadMore} loading={isLoading}>
              Charger plus
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Notifications;