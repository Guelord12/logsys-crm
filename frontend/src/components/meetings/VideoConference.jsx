import React, { useEffect, useRef, useState } from 'react';
import { useSocketStore } from '@store/socket.store';
import { useAuthStore } from '@store/auth.store';
import {
  MicrophoneIcon,
  VideoCameraIcon,
  PhoneXMarkIcon,
  SpeakerWaveIcon,
  ChatBubbleLeftIcon,
  UserGroupIcon,
  HandRaisedIcon,
  EllipsisHorizontalIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';
import {
  MicrophoneIcon as MicrophoneSolidIcon,
  VideoCameraIcon as VideoCameraSolidIcon
} from '@heroicons/react/24/solid';
import Button from '@components/common/Button';
import { XMarkIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

const VideoConference = ({ meeting, onLeave }) => {
  const { user } = useAuthStore();
  const { socket } = useSocketStore();
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [participants, setParticipants] = useState([]);

  const localVideoRef = useRef(null);
  const peerConnections = useRef(new Map());

  useEffect(() => {
    initializeMedia();
    setupSocketListeners();

    return () => {
      cleanupMedia();
    };
  }, []);

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      socket?.emit('meeting:join', { meetingId: meeting.id });
    } catch (error) {
      console.error('Erreur média:', error);
    }
  };

  const setupSocketListeners = () => {
    if (!socket) return;
    
    socket.on('meeting:participant:joined', handleParticipantJoined);
    socket.on('meeting:participant:left', handleParticipantLeft);
    socket.on('meeting:signal', handleSignal);
    socket.on('meeting:chat:message', handleChatMessage);
    socket.on('meeting:participants', handleParticipantsList);
    socket.on('meeting:participant:muted', handleParticipantMuted);
    socket.on('meeting:participant:video', handleParticipantVideo);
    socket.on('meeting:hand-raised', handleHandRaised);
  };

  const cleanupMedia = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();
  };

  const handleParticipantJoined = (data) => {
    console.log('Participant rejoint:', data);
    setParticipants(prev => [...prev, data]);
  };

  const handleParticipantLeft = (data) => {
    setParticipants(prev => prev.filter(p => p.userId !== data.userId));
    if (peerConnections.current.has(data.userId)) {
      peerConnections.current.get(data.userId).close();
      peerConnections.current.delete(data.userId);
    }
  };

  const handleSignal = async (data) => {
    // Gérer les signaux WebRTC
  };

  const handleChatMessage = (data) => {
    setMessages(prev => [...prev, data]);
  };

  const handleParticipantsList = (data) => {
    setParticipants(data.participants || []);
  };

  const handleParticipantMuted = (data) => {
    setParticipants(prev => prev.map(p => 
      p.userId === data.userId ? { ...p, muted: data.muted } : p
    ));
  };

  const handleParticipantVideo = (data) => {
    setParticipants(prev => prev.map(p => 
      p.userId === data.userId ? { ...p, videoEnabled: data.videoEnabled } : p
    ));
  };

  const handleHandRaised = (data) => {
    setParticipants(prev => prev.map(p => 
      p.userId === data.userId ? { ...p, handRaised: true } : p
    ));
    setTimeout(() => {
      setParticipants(prev => prev.map(p => 
        p.userId === data.userId ? { ...p, handRaised: false } : p
      ));
    }, 5000);
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
      socket?.emit('meeting:mute', { meetingId: meeting.id, muted: !isMuted });
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
      socket?.emit('meeting:video', { meetingId: meeting.id, videoEnabled: !isVideoOff });
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);
        socket?.emit('meeting:screen-share', { meetingId: meeting.id, sharing: true });
        
        screenStream.getVideoTracks()[0].onended = () => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
          }
          setIsScreenSharing(false);
          socket?.emit('meeting:screen-share', { meetingId: meeting.id, sharing: false });
        };
      } else {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
        setIsScreenSharing(false);
        socket?.emit('meeting:screen-share', { meetingId: meeting.id, sharing: false });
      }
    } catch (error) {
      console.error('Erreur partage écran:', error);
    }
  };

  const raiseHand = () => {
    setHandRaised(true);
    socket?.emit('meeting:raise-hand', { meetingId: meeting.id });
    setTimeout(() => setHandRaised(false), 5000);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    socket?.emit('meeting:chat', {
      meetingId: meeting.id,
      message: newMessage
    });
    setNewMessage('');
  };

  const handleLeave = () => {
    socket?.emit('meeting:leave', { meetingId: meeting.id });
    cleanupMedia();
    onLeave?.();
  };

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col">
      {/* Zone vidéo principale */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="grid grid-cols-2 gap-4 p-4 max-w-6xl w-full">
            <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                Vous {isMuted && '(micro coupé)'} {isVideoOff && '(vidéo coupée)'}
              </div>
            </div>
            {Array.from(remoteStreams.entries()).map(([userId, stream]) => (
              <div key={userId} className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
                <video
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                  ref={el => el && (el.srcObject = stream)}
                />
                <div className="absolute bottom-2 left-2 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                  {participants.find(p => p.userId === userId)?.name || 'Participant'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Barre de contrôle */}
      <div className="bg-gray-800 p-4 flex items-center justify-center space-x-4">
        <Button
          variant={isMuted ? 'danger' : 'secondary'}
          onClick={toggleMute}
          className="!p-3 rounded-full"
        >
          {isMuted ? (
            <MicrophoneSolidIcon className="w-6 h-6" />
          ) : (
            <MicrophoneIcon className="w-6 h-6" />
          )}
        </Button>

        <Button
          variant={isVideoOff ? 'danger' : 'secondary'}
          onClick={toggleVideo}
          className="!p-3 rounded-full"
        >
          {isVideoOff ? (
            <VideoCameraSolidIcon className="w-6 h-6" />
          ) : (
            <VideoCameraIcon className="w-6 h-6" />
          )}
        </Button>

        <Button
          variant={isScreenSharing ? 'primary' : 'secondary'}
          onClick={toggleScreenShare}
          className="!p-3 rounded-full"
        >
          <ArrowUpTrayIcon className="w-6 h-6" />
        </Button>

        <Button
          variant={handRaised ? 'warning' : 'secondary'}
          onClick={raiseHand}
          className="!p-3 rounded-full"
        >
          <HandRaisedIcon className="w-6 h-6" />
        </Button>

        <Button
          variant={showChat ? 'primary' : 'secondary'}
          onClick={() => setShowChat(!showChat)}
          className="!p-3 rounded-full"
        >
          <ChatBubbleLeftIcon className="w-6 h-6" />
        </Button>

        <Button
          variant={showParticipants ? 'primary' : 'secondary'}
          onClick={() => setShowParticipants(!showParticipants)}
          className="!p-3 rounded-full"
        >
          <UserGroupIcon className="w-6 h-6" />
        </Button>

        <Button
          variant="danger"
          onClick={handleLeave}
          className="!p-3 rounded-full !bg-red-600 hover:!bg-red-700"
        >
          <PhoneXMarkIcon className="w-6 h-6" />
        </Button>
      </div>

      {/* Panneau latéral (Chat/Participants) */}
      {(showChat || showParticipants) && (
        <div className="absolute right-0 top-0 bottom-20 w-80 bg-white shadow-lg flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">
              {showChat ? 'Chat' : 'Participants'} ({participants.length})
            </h3>
            <button onClick={() => { setShowChat(false); setShowParticipants(false); }}>
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {showChat && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, i) => (
                  <div key={i} className={clsx(
                    'text-sm',
                    msg.userId === user?.id ? 'text-right' : 'text-left'
                  )}>
                    <span className="font-medium">{msg.userName}</span>
                    <p className={clsx(
                      'inline-block px-3 py-1 rounded-lg mt-1',
                      msg.userId === user?.id ? 'bg-blue-100' : 'bg-gray-100'
                    )}>
                      {msg.message}
                    </p>
                  </div>
                ))}
              </div>
              <form onSubmit={sendMessage} className="p-4 border-t flex">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Votre message..."
                  className="input flex-1 rounded-r-none"
                />
                <Button type="submit" className="rounded-l-none">
                  Envoyer
                </Button>
              </form>
            </>
          )}

          {showParticipants && (
            <div className="flex-1 overflow-y-auto p-4">
              {participants.map((p) => (
                <div key={p.userId || p.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                      <span className="text-sm font-medium">{p.name?.charAt(0) || '?'}</span>
                    </div>
                    <div>
                      <p className="font-medium">{p.name || 'Participant'}</p>
                      <p className="text-xs text-gray-500">{p.role || 'Participant'}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    {p.muted && <MicrophoneSolidIcon className="w-4 h-4 text-red-500" />}
                    {p.videoEnabled === false && <VideoCameraSolidIcon className="w-4 h-4 text-red-500" />}
                    {p.handRaised && <HandRaisedIcon className="w-4 h-4 text-yellow-500" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoConference;