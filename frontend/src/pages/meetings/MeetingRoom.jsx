import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { meetingService } from '@services/meeting.service';
import { useAuthStore } from '@store/auth.store';
import VideoConference from '@components/meetings/VideoConference';
import Loader from '@components/common/Loader';
import Button from '@components/common/Button';
import { VideoCameraIcon, UserGroupIcon, ClockIcon } from '@heroicons/react/24/outline';
import { formatDateTime, formatDuration } from '@utils/formatters';
import toast from 'react-hot-toast';

const MeetingRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inCall, setInCall] = useState(false);
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    fetchMeeting();
  }, [id]);

  const fetchMeeting = async () => {
    try {
      const response = await meetingService.getMeeting(id);
      setMeeting(response.data.data);
    } catch (error) {
      toast.error('Erreur lors du chargement de la réunion');
      navigate('/meetings');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    try {
      const response = await meetingService.joinMeeting(id);
      setAccessToken(response.data.data.accessToken);
      setInCall(true);
    } catch (error) {
      toast.error('Impossible de rejoindre la réunion');
    }
  };

  const handleLeave = () => {
    setInCall(false);
    meetingService.leaveMeeting(id);
    navigate('/meetings');
  };

  if (loading) return <Loader size="lg" className="py-12" />;
  if (!meeting) return null;

  if (inCall) {
    return <VideoConference meeting={meeting} accessToken={accessToken} onLeave={handleLeave} />;
  }

  const isOrganizer = meeting.organizerId === user.id;
  const canJoin = meeting.status === 'SCHEDULED' || meeting.status === 'ONGOING';
  const isParticipant = meeting.participants?.some(p => p.userId === user.id);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">{meeting.title}</h1>
            <p className="text-blue-100">{meeting.description}</p>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="flex items-start space-x-3">
                <ClockIcon className="w-6 h-6 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Date et heure</p>
                  <p className="font-medium">{formatDateTime(meeting.startTime)}</p>
                  <p className="text-sm text-gray-500">Durée : {formatDuration(meeting.durationMinutes)}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <UserGroupIcon className="w-6 h-6 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Organisateur</p>
                  <p className="font-medium">{meeting.organizer?.fullName}</p>
                  <p className="text-sm text-gray-500">{meeting.participants?.length || 0} participant(s)</p>
                </div>
              </div>
            </div>

            {meeting.participants?.length > 0 && (
              <div className="mb-8">
                <h3 className="font-semibold mb-3">Participants</h3>
                <div className="flex flex-wrap gap-2">
                  {meeting.participants.map((p) => (
                    <div key={p.id} className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                      <span className="text-sm">{p.user?.fullName || p.externalName || p.externalEmail}</span>
                      {p.responseStatus === 'ACCEPTED' && (
                        <span className="ml-2 w-2 h-2 bg-green-500 rounded-full" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center">
              {canJoin && (isParticipant || isOrganizer || user.isSystemAdmin) ? (
                <Button size="lg" onClick={handleJoin} className="!px-8">
                  <VideoCameraIcon className="w-5 h-5 mr-2" />
                  Rejoindre la réunion
                </Button>
              ) : meeting.status === 'COMPLETED' ? (
                <p className="text-gray-500">Cette réunion est terminée</p>
              ) : meeting.status === 'CANCELLED' ? (
                <p className="text-red-500">Cette réunion a été annulée</p>
              ) : (
                <p className="text-gray-500">Vous n'êtes pas invité à cette réunion</p>
              )}
            </div>

            <div className="mt-6 text-center">
              <button onClick={() => navigate('/meetings')} className="text-sm text-gray-500 hover:text-gray-700">
                Retour aux réunions
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;