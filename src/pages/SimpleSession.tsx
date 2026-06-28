import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import AgoraVideoCall from '../components/session/AgoraVideoCall';
import { toast } from 'sonner';

const SimpleSession = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agoraToken, setAgoraToken] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Get user data from localStorage
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const userId = userData.user_id || userData.id;
  const userName = userData.name || 'User';

  const requestMediaPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setPermissionGranted(true);
      fetchAgoraToken();
    } catch (err) {
      setError('Camera and microphone access is required to start the session.');
      toast.error('Camera and microphone access is required to start the session.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgoraToken = async () => {
    try {
      setLoading(true);
      const API_BASE_URL = import.meta.env.VITE_API_URL;
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
        throw new Error('Failed to fetch Agora token');
      }
      
      const data = await response.json();
      setAgoraToken(data.token);
    } catch (err) {
      console.error('Error fetching Agora token:', err);
      setError(err.message || 'Failed to fetch Agora token');
      toast.error(err.message || 'Failed to fetch Agora token');
    } finally {
      setLoading(false);
    }
  };

  const handleEndCall = () => {
    navigate('/appointment-log');
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
              <Button onClick={() => navigate('/appointment-log')}>
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
        Video Session - {id}
      </h1>
      
      {!permissionGranted ? (
        <Button onClick={requestMediaPermissions} size="lg">
          Start Session
        </Button>
      ) : (
        agoraToken ? (
          <div className="bg-card rounded-lg shadow-lg overflow-hidden h-[600px]">
            <AgoraVideoCall
              channelName={id || ''}
              token={agoraToken}
              uid={userId}
              sessionType="video"
              onEndCall={handleEndCall}
              sessionStart={new Date()}
              sessionEnd={new Date(Date.now() + 60 * 60 * 1000)} // 1 hour from now
            />
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Connecting to Session...</h2>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mt-4 mx-auto"></div>
              </div>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
};

export default SimpleSession;
