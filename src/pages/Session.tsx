import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { parseISO, isAfter, isBefore } from 'date-fns';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Clock } from 'lucide-react';
import AgoraVideoCall from '../components/session/AgoraVideoCall';
import { toast } from 'sonner';

interface SessionDetails {
  id: string;
  expert_id: string;
  seeker_id: string;
  date: string;
  start_time: string;
  end_time: string;
  session_type: 'video' | 'audio' | 'chat';
  expert_name: string;
  seeker_name: string;
}

const Session = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agoraToken, setAgoraToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'expert' | 'seeker' | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [fetchingToken, setFetchingToken] = useState(false);

  // Get user data from localStorage
  const userDataRaw = localStorage.getItem('user') || localStorage.getItem('userData') || '{}';
  let userId = null;
  try {
    const userData = JSON.parse(userDataRaw);
    userId = userData.user_id || userData.id;
    if (!userId && (userData.token || userData.accessToken)) {
      const token = userData.token || userData.accessToken;
      const payloadBase64 = token.split('.')[1];
      const payloadJson = atob(payloadBase64);
      const payload = JSON.parse(payloadJson);
      userId = payload.user_id || payload.id || null;
    }
  } catch (e) {
    console.error('Failed to parse user data or token:', e);
  }
  // console.log('Session.tsx userId:', userId);

  useEffect(() => {
    const fetchSessionDetails = async () => {
      try {
        setLoading(true);
        const API_BASE_URL = import.meta.env.VITE_API_URL;
        const response = await fetch(`${API_BASE_URL}/api/bookings/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch session details');
        }
        
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch session details');
        }
        
        setSession(data.data);
        // console.log('Session data:', data.data);

        // Determine user role
        if (data.data.expert_id === userId) {
          setUserRole('expert');
        } else if (data.data.seeker_id === userId) {
          setUserRole('seeker');
        } else {
          console.error('Authorization failed: userId does not match expert_id or seeker_id');
          throw new Error('You are not authorized to join this session');
        }

        // Check if current time is within session time window (with 10 minute buffer)
        const now = new Date();
        const sessionStart = parseISO(`${data.data.date}T${data.data.start_time}`);
        const sessionEnd = parseISO(`${data.data.date}T${data.data.end_time}`);
        const bufferTime = 10 * 60 * 1000; // 10 minutes in milliseconds

        if (isBefore(now, new Date(sessionStart.getTime() - bufferTime)) || 
            isAfter(now, new Date(sessionEnd.getTime() + bufferTime))) {
          console.warn('Session time check:', { now, sessionStart, sessionEnd, withinWindow: false });
          throw new Error('Session is not active at this time');
        }
        
        console.log('Session time check passed:', { now, sessionStart, sessionEnd, withinWindow: true });
      } catch (err) {
        console.error('Error fetching session:', err);
        setError(typeof err === 'string' ? err : err instanceof Error ? err.message : 'Failed to load session');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchSessionDetails();
    }
  }, [id, userId]);

  const requestMediaPermissions = async () => {
    try {
      setError(null);
      setFetchingToken(true);
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setPermissionGranted(true);
      fetchAgoraToken();
    } catch (err) {
      setError('Camera and microphone access is required to join the session.');
      toast.error('Camera and microphone access is required to join the session.');
    } finally {
      setFetchingToken(false);
    }
  };

  const fetchAgoraToken = async () => {
    try {
      setFetchingToken(true);
      const API_BASE_URL = import.meta.env.VITE_API_URL;
      console.log('🔑 Fetching Agora token for:', { channelName: id, uid: userId });
      
      const response = await fetch(`${API_BASE_URL}/api/agora/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          channelName: id,
          uid: userId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Token fetch failed:', response.status, errorData);
        throw new Error(`Failed to fetch Agora token: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Agora token received:', { success: data.success, hasToken: !!data.token });
      setAgoraToken(data.token);
    } catch (err) {
      console.error('❌ Error fetching Agora token:', err);
      setError(err.message || 'Failed to fetch Agora token');
      toast.error(err.message || 'Failed to fetch Agora token');
    } finally {
      setFetchingToken(false);
    }
  };

  const handleEndCall = (showFeedback: boolean, remoteEnd?: boolean) => {
    console.log('🔴 handleEndCall called:', { showFeedback, remoteEnd });
    if (showFeedback) {
      navigate(`/session-feedback/${id}`);
    } else {
      navigate('/appointments');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
              <p className="mb-4">{error}</p>
              <Button onClick={() => navigate('/appointments')}>
                Back to Appointments
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Session Not Found</h2>
              <p className="mb-4">The requested session could not be found.</p>
              <Button onClick={() => navigate('/appointments')}>
                Back to Appointments
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {session.session_type.charAt(0).toUpperCase() + session.session_type.slice(1)} Session with {userRole === 'expert' ? session.seeker_name : session.expert_name}
      </h1>
      
      {!permissionGranted ? (
        <Button onClick={requestMediaPermissions} size="lg" disabled={fetchingToken}>
          {fetchingToken ? 'Requesting Permissions...' : 'Join Session'}
        </Button>
      ) : (
        agoraToken ? (
          <div className="bg-card rounded-lg shadow-lg overflow-hidden h-[600px]">
            <AgoraVideoCall
              channelName={session.id}
              token={agoraToken}
              uid={userId}
              sessionType={session.session_type as 'video' | 'audio'}
              onEndCall={handleEndCall}
              sessionStart={parseISO(`${session.date}T${session.start_time}`)}
              sessionEnd={parseISO(`${session.date}T${session.end_time}`)}
              expertName={session.expert_name}
              seekerName={session.seeker_name}
            />
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Clock className="h-12 w-12 text-primary mb-4" />
                <h2 className="text-2xl font-bold mb-2">Connecting to Session...</h2>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mt-4"></div>
              </div>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
};
export default Session;
