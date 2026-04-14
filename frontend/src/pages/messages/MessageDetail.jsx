import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { messageService } from '@services/message.service';
import { useAuthStore } from '@store/auth.store';
import Button from '@components/common/Button';
import Loader from '@components/common/Loader';
import ComposeMessage from '@components/messages/ComposeMessage';
import {
  ArrowLeftIcon,
  ArchiveBoxIcon,
  TrashIcon,
  StarIcon,
  ArrowUturnLeftIcon,
  ArrowPathRoundedSquareIcon,
  PaperClipIcon,
  EllipsisHorizontalIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { formatDateTime, formatFileSize } from '@utils/formatters';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import toast from 'react-hot-toast';

const MessageDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReply, setShowReply] = useState(false);
  const [showForward, setShowForward] = useState(false);

  useEffect(() => {
    fetchMessage();
  }, [id]);

  const fetchMessage = async () => {
    try {
      const response = await messageService.getMessage(id);
      setMessage(response.data.data);
    } catch (error) {
      toast.error('Erreur lors du chargement du message');
      navigate('/messages');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    try {
      await messageService.moveToFolder([id], 'ARCHIVE');
      toast.success('Message archivé');
      navigate('/messages');
    } catch (error) {
      toast.error('Erreur lors de l\'archivage');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Supprimer ce message ?')) return;
    
    try {
      await messageService.deleteMessage(id);
      toast.success('Message supprimé');
      navigate('/messages');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleToggleStar = async () => {
    try {
      await messageService.toggleStar(id, !message.isStarred);
      setMessage({ ...message, isStarred: !message.isStarred });
      toast.success(message.isStarred ? 'Favori retiré' : 'Ajouté aux favoris');
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleDownloadAttachment = async (attachmentId) => {
    try {
      await messageService.downloadAttachment(id, attachmentId);
      toast.success('Téléchargement démarré');
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  const handleMarkAsUnread = async () => {
    try {
      await messageService.markAsUnread([id]);
      toast.success('Message marqué comme non lu');
      navigate('/messages');
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleReportSpam = async () => {
    try {
      await messageService.moveToFolder([id], 'SPAM');
      toast.success('Message signalé comme spam');
      navigate('/messages');
    } catch (error) {
      toast.error('Erreur');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (!message) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Message non trouvé</p>
      </div>
    );
  }

  const isSent = message.senderId === user?.id;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/messages')} 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Retour"
              >
                <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
              </button>
              <h2 className="text-xl font-semibold text-gray-900 truncate max-w-2xl">
                {message.subject || '(Sans objet)'}
              </h2>
            </div>
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={handleArchive} 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors" 
                title="Archiver"
              >
                <ArchiveBoxIcon className="w-5 h-5 text-gray-600" />
              </button>
              
              <button 
                onClick={handleDelete} 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors" 
                title="Supprimer"
              >
                <TrashIcon className="w-5 h-5 text-gray-600" />
              </button>
              
              <button 
                onClick={handleToggleStar} 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors" 
                title={message.isStarred ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              >
                {message.isStarred ? (
                  <StarIconSolid className="w-5 h-5 text-yellow-400" />
                ) : (
                  <StarIcon className="w-5 h-5 text-gray-600" />
                )}
              </button>
              
              <Menu as="div" className="relative">
                <Menu.Button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
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
                  <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-30">
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleMarkAsUnread}
                            className={`${active ? 'bg-gray-100' : ''} block w-full text-left px-4 py-2 text-sm text-gray-700`}
                          >
                            Marquer comme non lu
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleReportSpam}
                            className={`${active ? 'bg-gray-100' : ''} block w-full text-left px-4 py-2 text-sm text-red-600`}
                          >
                            Signaler comme spam
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            className={`${active ? 'bg-gray-100' : ''} block w-full text-left px-4 py-2 text-sm text-gray-700`}
                          >
                            Imprimer
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu du message */}
      <div className="page-container max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* En-tête du message */}
          <div className="flex items-start justify-between mb-6 pb-4 border-b border-gray-100">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 flex items-center justify-center text-white font-medium text-lg">
                {message.senderName?.charAt(0) || message.senderEmail?.charAt(0) || '?'}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {message.senderName || message.senderEmail}
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    &lt;{message.senderEmail}&gt;
                  </span>
                </p>
                <p className="text-sm text-gray-500">
                  <span className="text-gray-400">À :</span> {message.recipients?.filter(r => r.recipientType === 'TO').map(r => r.recipientEmail).join(', ')}
                </p>
                {message.recipients?.some(r => r.recipientType === 'CC') && (
                  <p className="text-sm text-gray-500">
                    <span className="text-gray-400">Cc :</span> {message.recipients?.filter(r => r.recipientType === 'CC').map(r => r.recipientEmail).join(', ')}
                  </p>
                )}
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

          {/* Corps du message */}
          <div 
            className="prose prose-sm max-w-none mb-6 p-4 bg-gray-50 rounded-lg min-h-[200px]"
            dangerouslySetInnerHTML={{ __html: message.bodyHtml || message.bodyText || '<p class="text-gray-400 italic">(Message vide)</p>' }}
          />

          {/* Pièces jointes */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="border-t border-gray-200 pt-4 mt-4">
              <p className="text-sm font-medium mb-3 flex items-center text-gray-700">
                <PaperClipIcon className="w-4 h-4 mr-2 text-gray-500" />
                Pièces jointes ({message.attachments.length})
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {message.attachments.map((att) => (
                  <button
                    key={att.id}
                    onClick={() => handleDownloadAttachment(att.id)}
                    className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 group"
                  >
                    <PaperClipIcon className="w-5 h-5 text-gray-400 mr-3 group-hover:text-blue-500 transition-colors" />
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium truncate group-hover:text-blue-600 transition-colors">
                        {att.originalFilename}
                      </p>
                      <p className="text-xs text-gray-500">{formatFileSize(att.fileSize)}</p>
                    </div>
                    <ArrowDownTrayIcon className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bouton retour */}
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={() => navigate('/messages')}>
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Retour à la messagerie
          </Button>
        </div>
      </div>

      {/* Modal de réponse */}
      {showReply && (
        <ComposeMessage
          isOpen={showReply}
          onClose={() => setShowReply(false)}
          onSuccess={() => {
            setShowReply(false);
            toast.success('Réponse envoyée avec succès');
          }}
          replyTo={message}
        />
      )}

      {/* Modal de transfert */}
      {showForward && (
        <ComposeMessage
          isOpen={showForward}
          onClose={() => setShowForward(false)}
          onSuccess={() => {
            setShowForward(false);
            toast.success('Message transféré avec succès');
          }}
          forwardFrom={message}
        />
      )}
    </div>
  );
};

export default MessageDetail;