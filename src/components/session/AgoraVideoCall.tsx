import React, { useEffect, useRef, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import AgoraRTM, { RTMClient } from 'agora-rtm-sdk';
// import joinSound from '@/assets/sounds/join.mp3';

const SENDER_COLORS = [
  "bg-blue-500", "bg-green-500", "bg-purple-500", 
  "bg-yellow-500", "bg-indigo-500", "bg-pink-500"
];

const getColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % SENDER_COLORS.length);
  return SENDER_COLORS[index];
};

const Avatar = ({ initials, name }: { initials: string; name: string }) => {
  const color = getColor(name);
  return (
    <div className={`w-24 h-24 ${color} rounded-full flex items-center justify-center text-4xl font-bold text-white`}>
      {initials}
    </div>
  );
};

const getInitials = (name: string) => {
  if (!name) return '?';
  const names = name.split(' ');
  if (names.length > 1) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

interface AgoraVideoCallProps {
  channelName: string;
  token: string;
  uid: string | number;
  sessionType: 'video' | 'audio';
  onEndCall: (showFeedback: boolean, remoteEnd?: boolean) => void;
  onSessionStart?: () => void;
  onAutoEndCall?: () => void;
  sessionStart: Date;
  sessionEnd: Date;
  expertName: string;
  seekerName: string;
  onParticipantsUpdate?: (count: number) => void;
}

const AgoraVideoCall: React.FC<AgoraVideoCallProps> = ({
  channelName,
  token,
  uid,
  sessionType,
  onEndCall,
  onSessionStart,
  onAutoEndCall,
  sessionStart,
  sessionEnd,
  expertName,
  seekerName,
  onParticipantsUpdate
}) => {
  const [localTracks, setLocalTracks] = useState<[AgoraRTC.IMicrophoneAudioTrack, AgoraRTC.ICameraVideoTrack] | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<AgoraRTC.IAgoraRTCRemoteUser[]>([]);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [participantCount, setParticipantCount] = useState(1);
  const [callEndedByRemote, setCallEndedByRemote] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showConfirmEnd, setShowConfirmEnd] = useState(false);
  const [userJoinedNotification, setUserJoinedNotification] = useState<string | null>(null);
  const [waitingForParticipant, setWaitingForParticipant] = useState(true);
  
  const rtcClient = useRef<AgoraRTC.IAgoraRTCClient | null>(null);
  const localVideoRef = useRef<HTMLDivElement | null>(null);
  const rtmClient = useRef<RTMClient | null>(null);
  const joinAudio = useRef<HTMLAudioElement | null>(null);
  
  // Initialize join sound
  useEffect(() => {
    try {
      joinAudio.current = new Audio('/sounds/join.mp3');
      joinAudio.current.volume = 0.5;
    } catch (e) {
      console.warn('Join sound not available');
    }
  }, []);
  const [localUser, setLocalUser] = useState({ name: '', initials: '' });
  const [remoteUser, setRemoteUser] = useState({ name: '', initials: '' });

  const setLocalVideoRef = (node: HTMLDivElement | null) => {
    localVideoRef.current = node;
    if (node && localTracks && localTracks[1]) {
      try {
        localTracks[1].play(node);
      } catch (err) {
        console.error('[AgoraVideoCall] Error playing local video:', err);
      }
    }
  };
  
  const handleUserPublished = async (user: AgoraRTC.IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
    await rtcClient.current?.subscribe(user, mediaType);
    
    if (mediaType === 'audio') {
      // Another participant joined - no longer waiting
      setWaitingForParticipant(false);
      
      // Play join sound when user joins
      if (joinAudio.current) {
        joinAudio.current.play().catch(e => console.warn('Join sound not available'));
      }
      
      // Show user joined notification
      let isExpert = false;
      const storageKeys = ['user', 'userData', 'expertData', 'seekerData'];
      
      for (const key of storageKeys) {
        const userData = localStorage.getItem(key);
        if (userData && userData !== '{}') {
          try {
            const parsed = JSON.parse(userData);
            const role = parsed.role || parsed.user_role;
            if (role === 'expert') {
              isExpert = true;
              break;
            }
          } catch (e) {}
        }
      }
      
      const joinedUserName = isExpert ? seekerName : expertName;
      setUserJoinedNotification(`${joinedUserName} joined`);
      setTimeout(() => setUserJoinedNotification(null), 3000);
      
      setRemoteUsers(prev => {
        if (prev.find(u => u.uid === user.uid)) {
          return prev;
        }
        return [...prev, user];
      });
      
      // Play audio track when available
      if (user.audioTrack) {
        try {
          user.audioTrack.play();
        } catch (err) {
          console.error('Error playing remote audio:', err);
        }
      }
    }
    
    if (mediaType === 'video') {
      setRemoteUsers(prev => {
        if (prev.find(u => u.uid === user.uid)) {
          return prev;
        }
        return [...prev, user];
      });
    }
  };
  
  const handleUserUnpublished = (user: AgoraRTC.IAgoraRTCRemoteUser) => {
    setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
  };

  const handleUserLeft = (user: AgoraRTC.IAgoraRTCRemoteUser) => {
    setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
    
    // Show user left notification
    let isExpert = false;
    const storageKeys = ['user', 'userData', 'expertData', 'seekerData'];
    
    for (const key of storageKeys) {
      const userData = localStorage.getItem(key);
      if (userData && userData !== '{}') {
        try {
          const parsed = JSON.parse(userData);
          const role = parsed.role || parsed.user_role;
          if (role === 'expert') {
            isExpert = true;
            break;
          }
        } catch (e) {}
      }
    }
    
    const leftUserName = isExpert ? seekerName : expertName;
    setUserJoinedNotification(`${leftUserName} left`);
    setTimeout(() => setUserJoinedNotification(null), 3000);
    
    // Set waiting state back to true if no remote users
    if (remoteUsers.length <= 1) {
      setWaitingForParticipant(true);
    }
    
    // End call for both sides when one user leaves (only if both had joined)
    if (!isLeaving && !waitingForParticipant) {
      setCallEndedByRemote(true);
      if (onAutoEndCall) {
        onAutoEndCall();
      } else {
        leaveCall(true);
      }
    }
  };
  
  useEffect(() => {
    const init = async () => {
      try {
        console.log('🚀 Initializing Agora call with:', { channelName, uid, sessionType });
        setIsLoading(true);
        rtcClient.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        
        rtcClient.current.on('user-published', handleUserPublished);
        rtcClient.current.on('user-unpublished', handleUserUnpublished);
        rtcClient.current.on('user-left', handleUserLeft);
        
        const numericUid = typeof uid === 'string' 
          ? parseInt(uid.replace(/[^0-9]/g, '').substring(0, 8), 10) % 1000000
          : uid;
        
        const appId = import.meta.env.VITE_AGORA_APP_ID || "ce0203f2478e435cb7aae5509ee3a212";
        console.log('🎯 Joining Agora channel:', { appId, channelName, numericUid });
        
        await rtcClient.current.join(appId, channelName, token, numericUid);
        console.log('✅ Successfully joined Agora channel');
        
        // Wait for connection to stabilize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setIsJoined(true);
        
        // Mark user as joined in database after successfully joining Agora channel
        try {
          const storageKeys = ['user', 'userData', 'expertData', 'seekerData'];
          let authToken = null;
          
          for (const key of storageKeys) {
            const userData = localStorage.getItem(key);
            if (userData && userData !== '{}') {
              try {
                const parsed = JSON.parse(userData);
                authToken = parsed.token || parsed.accessToken || parsed.access_token;
                if (authToken) break;
              } catch (e) {}
            }
          }
          
          if (authToken) {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/bookings/${channelName}/join`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (response.ok) {
              console.log('✅ Successfully marked as joined in database');
            } else {
              console.warn('⚠️ Failed to mark as joined in database');
            }
          }
        } catch (joinError) {
          console.warn('⚠️ Failed to mark as joined:', joinError);
        }
        
        // Start session timer when user joins
        if (onSessionStart) {
          onSessionStart();
        }
        
        let tracks: [AgoraRTC.IMicrophoneAudioTrack, AgoraRTC.ICameraVideoTrack];
        if (sessionType === 'audio') {
          console.log('🎤 Creating audio track...');
          const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
          await audioTrack.setEnabled(true);
          tracks = [audioTrack, null as any]; 
          console.log('✅ Audio track created');
        } else {
          console.log('🎥 Creating video and audio tracks...');
          tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
          await tracks[0].setEnabled(true);
          console.log('✅ Video and audio tracks created');
        }
        
        console.log('📤 Publishing tracks...');
        if (sessionType === 'audio') {
          await rtcClient.current.publish([tracks[0]]);
        } else {
          await rtcClient.current.publish(tracks);
        }
        
        console.log('✅ Successfully published tracks');
        setLocalTracks(tracks);
        setIsAudioMuted(false);
        setIsVideoMuted(false);
        setIsLoading(false);
      } catch (err: any) {
        console.error('❌ Agora initialization failed:', err);
        setError(err.message || 'Failed to join call');
        setIsLoading(false);
      }
    };
    
    init();
    
    return () => {
      console.log('🧹 Cleanup: Component unmounting');
      if (localTracks) {
        localTracks[0]?.close();
        localTracks[1]?.close();
      }
      if (rtcClient.current) {
        rtcClient.current.leave().catch(err => console.error('Error leaving channel:', err));
      }
    };
  }, [channelName, token, uid, sessionType]);
  
  const toggleAudio = async () => {
    if (localTracks && localTracks[0]) {
      const newMutedState = !isAudioMuted;
      await localTracks[0].setEnabled(!newMutedState);
      setIsAudioMuted(newMutedState);
    }
  };
  
  const toggleVideo = async () => {
    if (localTracks && localTracks[1]) {
      const newMutedState = !isVideoMuted;
      await localTracks[1].setEnabled(!newMutedState);
      setIsVideoMuted(newMutedState);
    }
  };
  
  const leaveCall = async (remoteEnd = false) => {
    if (isLeaving) return;
    setIsLeaving(true);
    try {
      // Send end call message to remote user before leaving
      if (!remoteEnd && remoteUsers.length > 0 && rtmClient.current) {
        try {
          await rtmClient.current.sendMessageToPeer(
            { text: 'END_CALL' },
            remoteUsers[0].uid.toString()
          );
        } catch (err) {
          console.error('Failed to send END_CALL message:', err);
        }
      }
      
      if (localTracks) {
        localTracks[0]?.stop();
        localTracks[0]?.close();
        localTracks[1]?.stop();
        localTracks[1]?.close();
      }
      if (rtcClient.current) {
        await rtcClient.current.unpublish();
      }
      await rtcClient.current?.leave();
      
      if (rtmClient.current) {
        await rtmClient.current.logout();
      }
      
      // Call backend to check if both joined, only then show feedback
      let showFeedback = false;
      try {
        const storageKeys = ['user', 'userData', 'expertData', 'seekerData'];
        let token = null;
        
        for (const key of storageKeys) {
          const userData = localStorage.getItem(key);
          if (userData && userData !== '{}') {
            try {
              const parsed = JSON.parse(userData);
              token = parsed.token || parsed.accessToken || parsed.access_token;
              if (token) break;
            } catch (e) {}
          }
        }
        
        if (token && channelName) {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/bookings/${channelName}/end-call`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            showFeedback = !!data.showFeedback;
          }
        }
      } catch (err) {
        // fallback: showFeedback remains false
      }
      onEndCall(showFeedback, remoteEnd);
    } catch (err) {
      onEndCall(false, remoteEnd);
    } finally {
      setIsLeaving(false);
      setShowConfirmEnd(false);
    }
  };
  
  // Auto-end call when session time expires
  useEffect(() => {
    if (!sessionStart || !sessionEnd || !isJoined) {
      console.log('⏰ Auto-end timer not set:', { hasSessionStart: !!sessionStart, hasSessionEnd: !!sessionEnd, isJoined });
      return;
    }
    
    // Validate dates
    const startTime = new Date(sessionStart);
    const endTime = new Date(sessionEnd);
    
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      console.error('❌ Invalid session dates:', { sessionStart, sessionEnd });
      return;
    }
    
    const now = new Date();
    const timeUntilEnd = endTime.getTime() - now.getTime();
    
    console.log('⏰ Session timing:', { 
      now: now.toISOString(), 
      sessionEnd: endTime.toISOString(), 
      timeUntilEnd: Math.round(timeUntilEnd / 1000) + 's' 
    });
    
    if (timeUntilEnd <= -300000) {
      console.log('⏰ Session expired - auto ending call');
      if (onAutoEndCall) {
        onAutoEndCall();
      } else {
        leaveCall();
      }
      return;
    }
    
    const autoEndTimer = setTimeout(() => {
      console.log('⏰ Session time expired with buffer - auto ending call');
      if (onAutoEndCall) {
        onAutoEndCall();
      } else {
        leaveCall();
      }
    }, timeUntilEnd + 300000);
    
    console.log('⏰ Auto-end timer set for:', Math.round((timeUntilEnd + 300000) / 1000) + 's from now');
    
    return () => {
      console.log('⏰ Clearing auto-end timer');
      clearTimeout(autoEndTimer);
    };
  }, [sessionStart, sessionEnd, isJoined, onAutoEndCall])
  
  useEffect(() => {
    const count = 1 + remoteUsers.length;
    setParticipantCount(count);
    if(onParticipantsUpdate) {
      onParticipantsUpdate(count);
    }
  }, [remoteUsers, onParticipantsUpdate]);

  useEffect(() => {
    if (!isJoined || callEndedByRemote || remoteUsers.length === 0) return;

    const appId = import.meta.env.VITE_AGORA_APP_ID || "ce0203f2478e435cb7aae5509ee3a212";
    const rtmToken = null; 

    const initRTM = async () => {
      try {
        rtmClient.current = new AgoraRTM.RTM(appId, String(uid));

        rtmClient.current.on('MessageFromPeer', (message: { text?: string }, peerId: string) => {
          if (message.text === 'END_CALL') {
            setCallEndedByRemote(true);
            if (onAutoEndCall) {
              onAutoEndCall();
            } else {
              leaveCall(true);
            }
          }
        });
        
        await rtmClient.current.login({ token: rtmToken });

      } catch (err) {
        console.error('Agora RTM initialization failed:', err);
      }
    };
    
    initRTM();

    return () => {
      rtmClient.current?.logout();
    }
  }, [isJoined, uid, callEndedByRemote, remoteUsers]);
   
  useEffect(() => {
     // Check multiple storage locations for user role
     let isExpert = false;
     const storageKeys = ['user', 'userData', 'expertData', 'seekerData'];
     
     for (const key of storageKeys) {
       const userData = localStorage.getItem(key);
       if (userData && userData !== '{}') {
         try {
           const parsed = JSON.parse(userData);
           const role = parsed.role || parsed.user_role;
           if (role === 'expert') {
             isExpert = true;
             break;
           }
         } catch (e) {}
       }
     }
     
     setLocalUser({
       name: isExpert ? expertName : seekerName,
       initials: getInitials(isExpert ? expertName : seekerName)
     });
     setRemoteUser({
       name: isExpert ? seekerName : expertName,
       initials: getInitials(isExpert ? seekerName : expertName)
     });
  }, [expertName, seekerName]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        <p className="ml-4">Joining session...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => onEndCall(false)}>Back to Bookings</Button>
      </div>
    );
  }

  if (callEndedByRemote) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-red-500 mb-4">The other participant has ended the call.</p>
        <Button onClick={() => onEndCall(false, true)}>Back to Bookings</Button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col bg-black">
      {/* Confirmation Dialog */}
      {showConfirmEnd && (
        <div className="absolute inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">End Session?</h3>
            <p className="text-gray-300 mb-6">Are you sure you want to end this session?</p>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowConfirmEnd(false)}
                className="bg-white text-black hover:bg-white hover:text-blue-600 hover:border-blue-600 border border-gray-300"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => leaveCall()}
              >
                End Session
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
        <div className="relative w-full h-full bg-gray-900 rounded-lg flex items-center justify-center overflow-hidden">
          <div 
            ref={setLocalVideoRef} 
            className="w-full h-full"
          />
          {(sessionType === 'audio' || isVideoMuted) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80">
              <Avatar initials={localUser.initials} name={localUser.name} />
              <p className="text-white mt-4 text-lg">{localUser.name} (You)</p>
              {isAudioMuted && (
                <div className="mt-2 px-3 py-1 bg-red-600 text-white rounded-full text-sm">
                  Muted
                </div>
              )}
            </div>
          )}
        </div>

        <div className="relative w-full h-full bg-gray-900 rounded-lg flex items-center justify-center overflow-hidden">
          {remoteUsers.length > 0 ? (
            remoteUsers.map(user => (
              <div key={user.uid} className="w-full h-full">
                <RemoteUserPlayer user={user} name={remoteUser.name} />
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center">
              <Avatar initials={remoteUser.initials} name={remoteUser.name} />
              <p className="text-white mt-4 text-lg">Waiting for {remoteUser.name}...</p>
              {waitingForParticipant && (
                <div className="mt-2 flex items-center text-gray-300">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <span className="text-sm">Connecting...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-gray-800 bg-opacity-50 p-3 rounded-full">
        <Button 
          onClick={toggleAudio} 
          variant="ghost" 
          size="icon" 
          className={`text-white hover:bg-white/20 rounded-full ${isAudioMuted ? 'bg-red-600' : 'bg-green-600'}`}
        >
          {isAudioMuted ? <MicOff /> : <Mic />}
        </Button>
        {sessionType === 'video' && (
          <Button 
            onClick={toggleVideo} 
            variant="ghost" 
            size="icon" 
            className={`text-white hover:bg-white/20 rounded-full ${isVideoMuted ? 'bg-red-600' : 'bg-green-600'}`}
          >
            {isVideoMuted ? <VideoOff /> : <Video />}
          </Button>
        )}
        <Button 
          onClick={() => setShowConfirmEnd(true)} 
          variant="destructive" 
          size="icon" 
          className="rounded-full bg-red-600 hover:bg-red-700"
        >
          <PhoneOff />
        </Button>
      </div>

      {/* User join/leave notifications */}
      {userJoinedNotification && (
        <div className="absolute top-5 left-5 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-10 animate-pulse">
          {userJoinedNotification}
        </div>
      )}
      
      {/* Participant count */}
      <div className="absolute top-5 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white text-sm px-3 py-1 rounded-md">
        {participantCount} participant{participantCount > 1 ? 's' : ''}
      </div>
    </div>
  );
};

const RemoteUserPlayer = ({ user, name }: { user: AgoraRTC.IAgoraRTCRemoteUser, name: string }) => {
  const videoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (videoRef.current && user.videoTrack) {
      user.videoTrack.play(videoRef.current);
    }
    return () => {
      user.videoTrack?.stop();
    };
  }, [user.videoTrack]);

  useEffect(() => {
    // Play audio track when available
    if (user.audioTrack) {
      try {
        user.audioTrack.play();
      } catch (err) {
        console.error('Error playing remote audio:', err);
      }
    }
    return () => {
      if (user.audioTrack) {
        user.audioTrack.stop();
      }
    }
  }, [user.audioTrack]);

  return (
    <div ref={videoRef} className="w-full h-full relative">
      {!user.hasVideo && (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900/80">
          <Avatar initials={getInitials(name)} name={name} />
          <p className="text-white mt-4 text-lg">{name}</p>
          {!user.hasAudio && (
            <div className="mt-2 px-3 py-1 bg-red-600 text-white rounded-full text-sm">
              Muted
            </div>
          )}
        </div>
      )}
      {user.hasVideo && !user.hasAudio && (
        <div className="absolute bottom-4 left-4 px-3 py-1 bg-red-600 text-white rounded-full text-sm">
          Muted
        </div>
      )}
    </div>
  );
};

export default AgoraVideoCall;