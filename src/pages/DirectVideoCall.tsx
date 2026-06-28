import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import AgoraVideoCall from '@/components/session/AgoraVideoCall';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/api';

const DirectVideoCall = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agoraToken, setAgoraToken] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);
  const [showReview, setShowReview] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Get user data from localStorage with improved error handling
  const userData = localStorage.getItem('user') || localStorage.getItem('userData') || '{}';
  let userId = null;
  let token = null;
  try {
    const parsedUserData = JSON.parse(userData);
    userId = parsedUserData.user_id || parsedUserData.id;
    token = parsedUserData.token || parsedUserData.accessToken;
    
    // If we have a token but no userId, try to extract it from the token
    if (!userId && token) {
      try {
        const payloadBase64 = token.split('.')[1];
        const payloadJson = atob(payloadBase64);
        const payload = JSON.parse(payloadJson);
        userId = payload.user_id || payload.id || null;
      } catch (e) {
        console.error('Failed to extract userId from token:', e);
      }
    }
  } catch (e) {
    console.error('Failed to parse user data:', e);
  }

  // Validate user data before proceeding
  useEffect(() => {
    if (!userId || !token) {
      setError('Authentication required. Please log in again.');
      toast.error('Authentication required. Please log in again.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
  }, [userId, token, navigate]);

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
      if (!userId || !token || !id) {
        throw new Error('Authentication required. Please log in again.');
      }

      setLoading(true);
      console.log("Fetching Agora token for channel:", id, "userId:", userId);
      
      const response = await fetch(`${API_BASE_URL}/api/agora/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          channelName: id,
          uid: userId
        })
      });
      
      if (!response.ok) {
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If response is not JSON, use the status text
          console.error("Failed to parse error response:", e);
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log("Received token response:", data);
      
      if (!data.token) {
        throw new Error('No token received from server');
      }
      
      setAgoraToken(data.token);
    } catch (err) {
      console.error('Error fetching Agora token:', err);
      setError(err.message || 'Failed to fetch Agora token');
    } finally {
      setLoading(false);
    }
  };

  const handleEndCall = async (remoteEnd?: boolean) => {
    if (!id || !userId || !token) {
      navigate('/appointment-log');
      return;
    }
    try {
      // Call backend to end session and check join status
      const response = await fetch(`${API_BASE_URL}/api/sessions/${id}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      });
      const data = await response.json();

      if (data.bothJoined) {
        setShowReview(true);
      } else {
        navigate('/appointment-log');
      }
    } catch (err) {
      // Fallback: old logic
      if (participantCount >= 2) {
        setShowReview(true);
      } else {
        navigate('/appointment-log');
      }
    }
  };

  const submitReview = async () => {
    if (!reviewText.trim()) {
      toast.error('Please enter your review before submitting.');
      return;
    }
    setSubmittingReview(true);
    try {
      if (!userId || !token || !id) {
        throw new Error('Authentication required. Please log in again.');
      }
      const response = await fetch(`${API_BASE_URL}/api/session-feedback/booking/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          feedback: reviewText.trim()
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit review');
      }
      // After successful review submission, update booking status to completed
      const updateResponse = await fetch(`${API_BASE_URL}/api/bookings/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'completed' })
      });
      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.message || 'Failed to update booking status');
      }
      toast.success('Review submitted successfully');
      setShowReview(false);
      navigate('/appointment-log');
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="ml-3">Connecting to your meeting...</p>
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
              <button 
                className="px-4 py-2 bg-primary text-white rounded-md"
                onClick={() => navigate('/appointment-log')}
              >
                Back to Appointments
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen w-full p-0 m-0 overflow-hidden">
      {!permissionGranted ? (
        <div className="flex items-center justify-center h-full">
          <button
            className="px-6 py-3 bg-primary text-white rounded-md text-lg"
            onClick={requestMediaPermissions}
            disabled={loading}
          >
            {loading ? 'Requesting Permissions...' : 'Start Session'}
          </button>
        </div>
      ) : (
        <>
          {agoraToken ? (
            <AgoraVideoCall
              channelName={id || ''}
              token={agoraToken}
              uid={userId}
              sessionType="video"
              onEndCall={handleEndCall}
              sessionStart={new Date()}
              sessionEnd={new Date(Date.now() + 60 * 60 * 1000)} // 1 hour from now
              onParticipantsUpdate={setParticipantCount}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="ml-3">Connecting to your meeting...</p>
            </div>
          )}

          {/* Review Feedback Modal */}
          {showReview && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
                <h2 className="text-xl font-semibold mb-4">Session Review</h2>
                <textarea
                  className="w-full border border-gray-300 rounded-md p-2 mb-4"
                  rows={5}
                  placeholder="Please provide your feedback for the session..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                />
                <div className="flex justify-end space-x-4">
                  <button
                    className="px-4 py-2 bg-gray-300 rounded-md"
                    onClick={() => {
                      setShowReview(false);
                      navigate('/appointment-log');
                    }}
                    disabled={submittingReview}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-primary text-white rounded-md"
                    onClick={submitReview}
                    disabled={submittingReview}
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DirectVideoCall;
