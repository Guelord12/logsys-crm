import React, { useState, useEffect } from 'react';
import { meetingService } from '@services/meeting.service';
import { useAuthStore } from '@store/auth.store';
import Button from '@components/common/Button';
import Card from '@components/common/Card';
import MeetingCard from '@components/meetings/MeetingCard';
import MeetingScheduler from '@components/meetings/MeetingScheduler';
import { PlusIcon, CalendarIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { formatDate } from '@utils/formatters';
import Loader from '@components/common/Loader';
import Tabs from '@components/common/Tabs';
import clsx from 'clsx';

const Meetings = () => {
  const { user } = useAuthStore();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScheduler, setShowScheduler] = useState(false);
  const [filter, setFilter] = useState('upcoming');
  const [stats, setStats] = useState({ total: 0, upcoming: 0, ongoing: 0 });

  useEffect(() => {
    fetchMeetings();
  }, [filter]);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter === 'upcoming') {
        params.status = 'SCHEDULED';
        params.startDate = new Date().toISOString();
      } else if (filter === 'past') {
        params.endDate = new Date().toISOString();
      }

      const response = await meetingService.getMeetings(params);
      setMeetings(response.data.data.meetings);
      
      const allMeetings = await meetingService.getMeetings({});
      const meetingsData = allMeetings.data.data.meetings;
      setStats({
        total: meetingsData.length,
        upcoming: meetingsData.filter(m => m.status === 'SCHEDULED' && new Date(m.startTime) > new Date()).length,
        ongoing: meetingsData.filter(m => m.status === 'ONGOING').length
      });
    } catch (error) {
      console.error('Erreur chargement réunions:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'upcoming', label: 'À venir', badge: stats.upcoming },
    { id: 'past', label: 'Passées' },
    { id: 'all', label: 'Toutes', badge: stats.total }
  ];

  const now = new Date();
  const upcomingMeetings = meetings.filter(m => new Date(m.startTime) > now && m.status === 'SCHEDULED');
  const ongoingMeetings = meetings.filter(m => m.status === 'ONGOING');
  const pastMeetings = meetings.filter(m => new Date(m.endTime) < now || m.status === 'COMPLETED');

  return (
    <div className="page-container">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Réunions</h1>
          <p className="page-description">Gérez vos réunions et visioconférences</p>
        </div>
        <Button onClick={() => setShowScheduler(true)}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Nouvelle réunion
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total réunions</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <CalendarIcon className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">À venir</p>
              <p className="text-2xl font-bold text-blue-600">{stats.upcoming}</p>
            </div>
            <VideoCameraIcon className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">En cours</p>
              <p className="text-2xl font-bold text-green-600">{stats.ongoing}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <Tabs
          tabs={tabs}
          defaultTab={filter}
          onChange={(tabId) => setFilter(tabId)}
        />

        <div className="p-4">
          {loading ? (
            <Loader className="py-12" />
          ) : (
            <>
              {ongoingMeetings.length > 0 && filter === 'upcoming' && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                    En cours
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ongoingMeetings.map((meeting) => (
                      <MeetingCard key={meeting.id} meeting={meeting} />
                    ))}
                  </div>
                </div>
              )}

              {filter === 'upcoming' && upcomingMeetings.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">À venir</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {upcomingMeetings.map((meeting) => (
                      <MeetingCard key={meeting.id} meeting={meeting} />
                    ))}
                  </div>
                </div>
              )}

              {filter === 'past' && pastMeetings.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pastMeetings.map((meeting) => (
                    <MeetingCard key={meeting.id} meeting={meeting} />
                  ))}
                </div>
              )}

              {filter === 'all' && meetings.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {meetings.map((meeting) => (
                    <MeetingCard key={meeting.id} meeting={meeting} />
                  ))}
                </div>
              )}

              {meetings.length === 0 && (
                <div className="text-center py-12">
                  <VideoCameraIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune réunion trouvée</p>
                  <Button onClick={() => setShowScheduler(true)} className="mt-4">
                    Planifier une réunion
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      <MeetingScheduler
        isOpen={showScheduler}
        onClose={() => setShowScheduler(false)}
        onSuccess={() => {
          setShowScheduler(false);
          fetchMeetings();
        }}
      />
    </div>
  );
};

export default Meetings;