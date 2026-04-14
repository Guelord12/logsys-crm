import React from 'react';
import { UserCircleIcon, MicrophoneIcon, VideoCameraIcon, HandRaisedIcon } from '@heroicons/react/24/outline';
import { MicrophoneIcon as MicrophoneSolidIcon, VideoCameraIcon as VideoCameraSolidIcon } from '@heroicons/react/24/solid';
import Badge from '@components/common/Badge';

const ParticipantsList = ({ participants, currentUserId, onRemove }) => {
  const roles = {
    ORGANIZER: { label: 'Organisateur', color: 'primary' },
    PRESENTER: { label: 'Présentateur', color: 'info' },
    ATTENDEE: { label: 'Participant', color: 'default' },
    GUEST: { label: 'Invité', color: 'secondary' }
  };

  return (
    <div className="divide-y divide-gray-200">
      {participants.map((participant) => (
        <div key={participant.id} className="py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                {participant.user?.avatarUrl ? (
                  <img src={participant.user.avatarUrl} alt="" className="w-10 h-10 rounded-full" />
                ) : (
                  <UserCircleIcon className="w-6 h-6 text-gray-500" />
                )}
              </div>
              {participant.joinedAt && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {participant.user?.fullName || participant.externalName || participant.externalEmail}
                {participant.userId === currentUserId && ' (Vous)'}
              </p>
              <p className="text-sm text-gray-500">{participant.user?.email || participant.externalEmail}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant={roles[participant.role]?.color || 'default'}>
              {roles[participant.role]?.label || participant.role}
            </Badge>

            {participant.muted ? (
              <MicrophoneSolidIcon className="w-4 h-4 text-red-500" />
            ) : (
              <MicrophoneIcon className="w-4 h-4 text-gray-400" />
            )}

            {participant.videoEnabled === false ? (
              <VideoCameraSolidIcon className="w-4 h-4 text-red-500" />
            ) : (
              <VideoCameraIcon className="w-4 h-4 text-gray-400" />
            )}

            {participant.handRaised && (
              <HandRaisedIcon className="w-4 h-4 text-yellow-500" />
            )}

            {onRemove && participant.userId !== currentUserId && participant.role !== 'ORGANIZER' && (
              <button
                onClick={() => onRemove(participant.id)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Retirer
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ParticipantsList;