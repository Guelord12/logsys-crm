import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PaperClipIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { formatTime, truncate } from '@utils/formatters';
import clsx from 'clsx';

const MessageList = ({ messages, selectedIds, onSelect, onToggleStar, folder }) => {
  const navigate = useNavigate();

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      onSelect(messages.map(m => m.id));
    } else {
      onSelect([]);
    }
  };

  return (
    <div className="message-list">
      <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 flex items-center">
        <input
          type="checkbox"
          checked={selectedIds.length === messages.length && messages.length > 0}
          onChange={handleSelectAll}
          className="rounded border-gray-300 text-blue-600 mr-4"
        />
        <span className="text-sm text-gray-600">
          {selectedIds.length > 0 ? `${selectedIds.length} sélectionné(s)` : ''}
        </span>
      </div>

      {messages.map((message) => (
        <div
          key={message.id}
          className={clsx(
            'message-item flex items-start space-x-3 px-4 py-3 hover:bg-gray-50 cursor-pointer',
            !message.isRead && 'bg-blue-50'
          )}
        >
          <input
            type="checkbox"
            checked={selectedIds.includes(message.id)}
            onChange={() => onSelect(message.id)}
            onClick={(e) => e.stopPropagation()}
            className="mt-1 rounded border-gray-300 text-blue-600"
          />

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleStar(message.id, !message.isStarred);
            }}
            className="mt-1"
          >
            {message.isStarred ? (
              <StarIconSolid className="w-5 h-5 text-yellow-400" />
            ) : (
              <StarIcon className="w-5 h-5 text-gray-400 hover:text-yellow-400" />
            )}
          </button>

          <div className="flex-1 min-w-0" onClick={() => navigate(`/messages/${message.id}`)}>
            <div className="flex items-center justify-between mb-1">
              <span className={clsx(
                'font-medium truncate',
                !message.isRead ? 'text-gray-900' : 'text-gray-600'
              )}>
                {message.senderName || message.senderEmail}
              </span>
              <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                {formatTime(message.receivedAt)}
              </span>
            </div>
            <p className={clsx(
              'font-medium mb-1 truncate',
              !message.isRead ? 'text-gray-900' : 'text-gray-600'
            )}>
              {message.subject || '(Sans objet)'}
            </p>
            <p className="text-sm text-gray-500 truncate">
              {truncate(message.snippet, 100)}
            </p>
            {message.hasAttachments && (
              <div className="mt-1">
                <PaperClipIcon className="w-4 h-4 text-gray-400" />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageList;