import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { messageService } from '@services/message.service';
import { useAuthStore } from '@store/auth.store';
import Button from '@components/common/Button';
import Loader from '@components/common/Loader';
import ComposeMessage from './ComposeMessage';
import {
  ArrowLeftIcon,
  ArchiveBoxIcon,
  TrashIcon,
  StarIcon,
  ArrowUturnLeftIcon,
  ArrowPathRoundedSquareIcon,
  PaperClipIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { formatDateTime, formatFileSize } from '@utils/formatters';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import toast from 'react-hot-toast';

const MessageView = ({ messageId, onBack }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReply, setShowReply] = useState(false);
  const [showForward, setShowForward] = useState(false);

  useEffect(() => {
    fetchMessage();
  }, [messageId]);

  const fetchMessage = async () => {
    try {
      const response = await messageService.getMessage(messageId);
      setMessage(response.data.data);
    } catch (error) {
      toast.error('Erreur lors du chargement du message');
      onBack?.();
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    try {
      await messageService.moveToFolder([messageId], 'ARCHIVE');
      toast.success('Message archivé');
      onBack?.();
    } catch (error) {
      toast.error('Erreur lors de l\'archivage');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Supprimer ce message ?')) return;
    
    try {
      await messageService.deleteMessage(messageId);
      toast.success('Message supprimé');
      onBack?.();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleToggleStar = async () => {
    try {
      await messageService.toggleStar(messageId, !message.isStarred);
      setMessage({ ...message, isStarred: !message.isStarred });
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleDownloadAttachment = async (attachmentId) => {
    try {
      await messageService.downloadAttachment(messageId, attachmentId);
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  if (loading) return <Loader size="lg" className="py-12" />;
  if (!message) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 truncate">
            {message.subject || '(Sans objet)'}
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={handleArchive} className="p-2 hover:bg-gray-100 rounded-lg" title="Archiver">
            <ArchiveBoxIcon className="w-5 h-5 text-gray-600" />
          </button>
          <button onClick={handleDelete} className="p-2 hover:bg-gray-100 rounded-lg" title="Supprimer">
            <TrashIcon className="w-5 h-5 text-gray-600" />
          </button>
          <button onClick={handleToggleStar} className="p-2 hover:bg-gray-100 rounded-lg" title="Marquer">
            {message.isStarred ? (
              <StarIconSolid className="w-5 h-5 text-yellow-400" />
            ) : (
              <StarIcon className="w-5 h-5 text-gray-600" />
            )}
          </button>
          <Menu as="div" className="relative">
            <Menu.Button className="p-2 hover:bg-gray-100 rounded-lg">
              <EllipsisHorizontalIcon className="w-5 h-5 text-gray-600" />
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
              <Menu.Items className="absolute right-0 mt-2 w-48 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button className={`${active ? 'bg-gray-100' : ''} block w-full text-left px-4 py-2 text-sm`}>
                        Marquer comme non lu
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-medium text-lg">
                  {message.senderName?.charAt(0) || message.senderEmail?.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {message.senderName || message.senderEmail}
                </p>
                <p className="text-sm text-gray-500">
                  À : {message.recipients?.filter(r => r.recipientType === 'TO').map(r => r.recipientEmail).join(', ')}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDateTime(message.sentAt || message.receivedAt)}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="ghost" size="sm" onClick={() => setShowReply(true)}>
                <ArrowUturnLeftIcon className="w-4 h-4 mr-1" />
                Répondre
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowForward(true)}>
                <ArrowPathRoundedSquareIcon className="w-4 h-4 mr-1" />
                Transférer
              </Button>
            </div>
          </div>

          <div 
            className="prose prose-sm max-w-none mb-6"
            dangerouslySetInnerHTML={{ __html: message.bodyHtml || message.bodyText }}
          />

          {message.attachments?.length > 0 && (
            <div className="border-t pt-4 mt-4">
              <p className="text-sm font-medium mb-3">
                Pièces jointes ({message.attachments.length})
              </p>
              <div className="grid grid-cols-2 gap-2">
                {message.attachments.map((att) => (
                  <button
                    key={att.id}
                    onClick={() => handleDownloadAttachment(att.id)}
                    className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <PaperClipIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium truncate">{att.originalFilename}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(att.fileSize)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showReply && (
        <ComposeMessage
          isOpen={showReply}
          onClose={() => setShowReply(false)}
          onSuccess={() => {
            setShowReply(false);
            toast.success('Réponse envoyée');
          }}
          replyTo={message}
        />
      )}

      {showForward && (
        <ComposeMessage
          isOpen={showForward}
          onClose={() => setShowForward(false)}
          onSuccess={() => {
            setShowForward(false);
            toast.success('Message transféré');
          }}
          forwardFrom={message}
        />
      )}
    </div>
  );
};

export default MessageView;