import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { messageService } from '@services/message.service';
import { useAuthStore } from '@store/auth.store';
import LogoSys from '@components/LogoSys';
import Footer from '@components/Footer';
import Button from '@components/common/Button';
import Loader from '@components/common/Loader';
import ComposeMessage from '@components/messages/ComposeMessage';
import MessageList from '@components/messages/MessageList';
import MessageView from '@components/messages/MessageView';
import {
  InboxIcon,
  PaperAirplaneIcon,
  PencilIcon,
  ArchiveBoxIcon,
  TrashIcon,
  StarIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const Messages = () => {
  const navigate = useNavigate();
  const { messageId } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  const [selectedFolder, setSelectedFolder] = useState('INBOX');
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const folders = [
    { id: 'INBOX', name: 'Boîte de réception', icon: InboxIcon },
    { id: 'SENT', name: 'Messages envoyés', icon: PaperAirplaneIcon },
    { id: 'DRAFTS', name: 'Brouillons', icon: PencilIcon },
    { id: 'STARRED', name: 'Favoris', icon: StarIcon },
    { id: 'ARCHIVE', name: 'Archives', icon: ArchiveBoxIcon },
    { id: 'TRASH', name: 'Corbeille', icon: TrashIcon }
  ];

  const { data, isLoading, refetch } = useQuery(
    ['messages', { folder: selectedFolder, search: searchTerm, page, limit }],
    () => messageService.getMessages({ folder: selectedFolder, search: searchTerm, page, limit }),
    { keepPreviousData: true }
  );

  const { data: folderCounts } = useQuery(
    'folder-counts',
    () => messageService.getFolderCounts(),
    { refetchInterval: 30000 }
  );

  const markAsReadMutation = useMutation(
    (messageIds) => messageService.markAsRead(messageIds),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('messages');
        queryClient.invalidateQueries('folder-counts');
      }
    }
  );

  const toggleStarMutation = useMutation(
    ({ messageId, isStarred }) => messageService.toggleStar(messageId, !isStarred),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('messages');
        queryClient.invalidateQueries('folder-counts');
      }
    }
  );

  const moveToFolderMutation = useMutation(
    ({ messageIds, folder }) => messageService.moveToFolder(messageIds, folder),
    {
      onSuccess: () => {
        toast.success(`${selectedMessages.length} message(s) déplacé(s)`);
        setSelectedMessages([]);
        queryClient.invalidateQueries('messages');
        queryClient.invalidateQueries('folder-counts');
      }
    }
  );

  const deleteMessagesMutation = useMutation(
    (messageIds) => messageService.deleteMessages(messageIds),
    {
      onSuccess: () => {
        toast.success(`${selectedMessages.length} message(s) supprimé(s)`);
        setSelectedMessages([]);
        queryClient.invalidateQueries('messages');
        queryClient.invalidateQueries('folder-counts');
      }
    }
  );

  const handleSelectMessage = (messageId) => {
    setSelectedMessages(prev =>
      prev.includes(messageId)
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  const handleSelectAll = () => {
    const allIds = data?.data?.messages?.map(m => m.id) || [];
    setSelectedMessages(selectedMessages.length === allIds.length ? [] : allIds);
  };

  const handleMessageClick = (message) => {
    if (!message.isRead) {
      markAsReadMutation.mutate([message.id]);
    }
    navigate(`/messages/${message.id}`);
  };

  const handleToggleStar = (messageId, isStarred) => {
    toggleStarMutation.mutate({ messageId, isStarred });
  };

  const messages = data?.data?.messages || [];
  const pagination = data?.data?.pagination;

  if (messageId) {
    return <MessageView messageId={messageId} onBack={() => navigate('/messages')} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <LogoSys size="small" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Messagerie</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Gérez vos emails et communications
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4">
            <Button onClick={() => setShowCompose(true)} fullWidth>
              <PencilIcon className="w-4 h-4 mr-2" />
              Nouveau message
            </Button>
          </div>
          
          <nav className="flex-1 px-2 space-y-1">
            {folders.map((folder) => {
              const Icon = folder.icon;
              const count = folderCounts?.data?.[folder.id.toLowerCase()] || 0;
              
              return (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder.id)}
                  className={clsx(
                    'w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    selectedFolder === folder.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <div className="flex items-center">
                    <Icon className="w-5 h-5 mr-3" />
                    {folder.name}
                  </div>
                  {count > 0 && (
                    <span className={clsx(
                      'px-2 py-0.5 text-xs font-medium rounded-full',
                      selectedFolder === folder.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    )}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedMessages.length === messages.length && messages.length > 0}
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-blue-600"
              />
              
              {selectedMessages.length > 0 && (
                <>
                  <button
                    onClick={() => moveToFolderMutation.mutate({ messageIds: selectedMessages, folder: 'ARCHIVE' })}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                    title="Archiver"
                  >
                    <ArchiveBoxIcon className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => deleteMessagesMutation.mutate(selectedMessages)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                    title="Supprimer"
                  >
                    <TrashIcon className="w-5 h-5 text-gray-600" />
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-9 w-64"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <InboxIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun message</p>
              </div>
            ) : (
              <MessageList
                messages={messages}
                selectedIds={selectedMessages}
                onSelect={handleSelectMessage}
                onToggleStar={handleToggleStar}
                onMessageClick={handleMessageClick}
                folder={selectedFolder}
              />
            )}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {pagination.total} messages
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} sur {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ComposeMessage
        isOpen={showCompose}
        onClose={() => setShowCompose(false)}
        onSuccess={() => {
          setShowCompose(false);
          refetch();
          queryClient.invalidateQueries('folder-counts');
          toast.success('Message envoyé avec succès');
        }}
      />
    </div>
  );
};

export default Messages;