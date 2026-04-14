import React from 'react';
import { Link } from 'react-router-dom';
import { VideoCameraIcon, UserGroupIcon, ClockIcon } from '@heroicons/react/24/outline';
import { formatDateTime, formatDuration } from '@utils/formatters';
import Badge from '@components/common/Badge';
import clsx from 'clsx';

const MeetingCard = ({ meeting }) => {
  const statusColors = {
    SCHEDULED: 'blue',
    ONGOING: 'green',
    COMPLETED: 'gray',
    CANCELLED: 'red'
  };

  const statusLabels = {
    SCHEDULED: 'Planifiée',
    ONGOING: 'En cours',
    COMPLETED: 'Terminée',
    CANCELLED: 'Annulée'
  };

  const isUpcoming = new Date(meeting.startTime) > new Date();
  const isOngoing = new Date(meeting.startTime) <= new Date() && new Date(meeting.endTime) >= new Date();

  return (
    <Link to={`/meetings/${meeting.id}`} className="block">
      <div className={clsx(
        'bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow',
        isOngoing && 'border-green-500 ring-1 ring-green-500'
      )}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={clsx(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              isOngoing ? 'bg-green-100' : 'bg-blue-100'
            )}>
              <VideoCameraIcon className={clsx(
                'w-5 h-5',
                isOngoing ? 'text-green-600' : 'text-blue-600'
              )} />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{meeting.title}</h3>
              <p className="text-sm text-gray-500">
                Organisé par {meeting.organizer?.fullName}
              </p>
            </div>
          </div>
          <Badge variant={statusColors[meeting.status]}>
            {statusLabels[meeting.status]}
          </Badge>
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center">
            <ClockIcon className="w-4 h-4 mr-2 text-gray-400" />
            <span>
              {formatDateTime(meeting.startTime)} • {formatDuration(meeting.durationMinutes)}
            </span>
          </div>
          <div className="flex items-center">
            <UserGroupIcon className="w-4 h-4 mr-2 text-gray-400" />
            <span>{meeting.participants?.length || 0} participant(s)</span>
          </div>
        </div>

        {meeting.description && (
          <p className="mt-3 text-sm text-gray-500 line-clamp-2">{meeting.description}</p>
        )}

        {isOngoing && (
          <div className="mt-3">
            <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
              En cours - Rejoindre
            </span>
          </div>
        )}
      </div>
    </Link>
  );
};

export default MeetingCard;