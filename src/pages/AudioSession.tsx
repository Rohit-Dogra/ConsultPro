import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import AgoraVideoCall from '@/components/session/AgoraVideoCall';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import ReactStars from 'react-rating-stars-component';

const AudioSession = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agoraToken, setAgoraToken] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [sessionDetails, setSessionDetails] = useState<{ 
    start: Date, 
    end: Date,
    expertName: string,
    seekerName: string
  } | null>(null);

  const [callEnded, setCallEnded] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);
  const [bothParticipantsJoined, setBothParticipantsJoined] = useState(false);

  // TIMER STATE AND LOGIC
  const [remainingTime, setRemainingTime] = useState(0);
  const [showFiveMinPopup, setShowFiveMinPopup] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Format timer as mm:ss
  function formatTimer(seconds: number) {
    if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) return '00:00';
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  // Start timer when session actually starts (when user joins)
  const startSessionTimer = () => {
    if (sessionStarted || !sessionDetails) return;
    
    setSessionStarted(true);
    const now = new Date();
    const start = new Date(sessionDetails.start);
    const end = new Date(sessionDetails.end);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setRemainingTime(15 * 60); // fallback to 15 minutes
      return;
    }

    // Calculate remaining time from now to session end
    let initialRemaining = Math.floor((end.getTime() - now.getTime()) / 1000);
    if (initialRemaining < 0) initialRemaining = 0;
    
    setRemainingTime(initialRemaining);
    setShowFiveMinPopup(initialRemaining <= 5 * 60 && initialRemaining > 0);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRemainingTime(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          clearInterval(timerRef.current!);
          handleEndCall();
          return 0;
        }
        if (newTime === 5 * 60 && !showFiveMinPopup) {
          setShowFiveMinPopup(true);
        }
        return newTime;
      });
    }, 1000);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Get auth info with better token handling
  const getAuthInfo = () => {
    let userId = null;
    let token = null;
    let userRole = null;
    
    // Try multiple storage keys for different user types
    const storageKeys = ['user', 'userData', 'expertData', 'seekerData'];
    
    for (const key of storageKeys) {
      const userData = localStorage.getItem(key);
      if (userData && userData !== '{}') {
        try {
          const parsedUserData = JSON.parse(userData);
          userId = userId || parsedUserData.user_id || parsedUserData.id;
          token = token || parsedUserData.token || parsedUserData.accessToken || parsedUserData.access_token;
          userRole = userRole || parsedUserData.role || parsedUserData.user_role;
          
          if (userId && token && userRole) break;
        } catch (e) {
          console.error(`Failed to parse ${key}:`, e);
        }
      }
    }
    
    // Extract from token if still missing info
    if (token && (!userId || !userRole)) {
      try {
        const payloadBase64 = token.split('.')[1];
        const payloadJson = atob(payloadBase64);
        const payload = JSON.parse(payloadJson);
        userId = userId || payload.user_id || payload.id || payload.sub;
        userRole = userRole || payload.role || payload.user_role;
      } catch (e) {
        console.error('Failed to extract from token:', e);
      }
    }
    
    return { userId, token, userRole };
  };

  const { userId, token, userRole } = getAuthInfo();

  useEffect(() => {
    if (!userId || !token) {
      setError('Authentication required. Please log in again.');
      toast.error('Authentication required. Please log in again.');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    }
  }, [userId, token, navigate]);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!id) {
        console.error('❌ No booking ID provided');
        return;
      }
      try {
        console.log('🔍 Fetching booking details for ID:', id);
        setLoading(true);
        const { token: currentToken } = getAuthInfo();
        if (!currentToken) {
          console.error('❌ No auth token found');
          setError('Authentication required. Please log in again.');
          return;
        }
        
        console.log('📡 Fetching from:', `${API_BASE_URL}/api/bookings/${id}`);
        const response = await fetch(`${API_BASE_URL}/api/bookings/${id}`, {
          headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        
        console.log('📥 Response status:', response.status);
        
        if (response.status === 401) {
          setError('Session expired. Please log in again.');
          toast.error('Session expired. Please log in again.');
          setTimeout(() => navigate('/'), 2000);
          return;
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Fetch failed:', errorText);
          throw new Error('Failed to fetch booking details');
        }
        
        const data = await response.json();
        console.log('✅ Booking data received:', data);
        
        if (data.success && data.data) {
          const booking = data.data;
          console.log('📅 Setting session details:', {
            start: booking.real_start_time || booking.start_time,
            end: booking.end_time,
            expertName: booking.expert_name,
            seekerName: booking.seeker_name
          });
          
          setSessionDetails({ 
            start: new Date(booking.real_start_time || booking.start_time),
            end: new Date(booking.end_time),
            expertName: booking.expert_name,
            seekerName: booking.seeker_name 
          });
        } else {
          console.error('❌ Invalid data structure:', data);
          throw new Error(data.message || 'Could not find booking details.');
        }
      } catch (err: any) {
        console.error('❌ Error fetching booking:', err);
        setError(err.message || 'Failed to load session details.');
        toast.error(err.message || 'Failed to load session details.');
      } finally {
        setLoading(false);
        console.log('✅ Loading complete');
      }
    };
    fetchBookingDetails();
  }, [id, token]);

  const requestMediaPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setPermissionGranted(true);
      const { token: currentToken } = getAuthInfo();
      if (currentToken) {
        await fetch(`${API_BASE_URL}/api/bookings/${id}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentToken}` },
          body: JSON.stringify({ role: userRole })
        });
      }
      fetchAgoraToken();
    } catch (err) {
      setError('Microphone access is required to start the session.');
      toast.error('Microphone access is required to start the session.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgoraToken = async () => {
    try {
      const { userId: currentUserId, token: currentToken } = getAuthInfo();
      if (!currentUserId || !currentToken || !id) {
        throw new Error('Authentication required.');
      }
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/agora/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentToken}` },
        body: JSON.stringify({ channelName: id, uid: currentUserId })
      });
      
      if (response.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch Agora token');
      }
      const data = await response.json();
      if (!data.token) throw new Error('No token received from server');
      setAgoraToken(data.token);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch Agora token');
      toast.error(err.message || 'Failed to fetch token');
      if (err.message.includes('Session expired')) {
        setTimeout(() => navigate('/'), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleParticipantsUpdate = (count: number) => {
    setParticipantCount(count);
    if (count >= 2) {
      setBothParticipantsJoined(true);
    }
  };

  const handleEndCall = async () => {
    if (!id) return;
    try {
      // Get fresh token
      const { token: currentToken } = getAuthInfo();
      if (!currentToken) {
        navigate(userRole === 'expert' ? '/dashboard' : '/seekerdashboard');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/bookings/${id}/end-call`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });
      
      if (response.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/');
        return;
      }
      
      const data = await response.json();
      if (data.showFeedback) {
        setCallEnded(true);
      } else {
        navigate(userRole === 'expert' ? '/dashboard' : '/seekerdashboard');
      }
    } catch (err) {
      navigate(userRole === 'expert' ? '/dashboard' : '/seekerdashboard');
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      if (!id || !token || !userRole || !userId) {
        throw new Error('Required information is missing');
      }
      if ((userRole === 'seeker' || userRole === 'solution_seeker') && rating === 0) {
        toast.error('Please provide a rating before submitting');
        setSubmitting(false);
        return;
      }
      // Refresh auth info before API call
      const { token: currentToken } = getAuthInfo();
      if (!currentToken) {
        throw new Error('Authentication token not found. Please login again.');
      }
      
      const response = await fetch(`${API_BASE_URL}/api/session-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify({
          booking_id: id,
          rating: (userRole === 'seeker' || userRole === 'solution_seeker') ? rating : null,
          review: (userRole === 'seeker' || userRole === 'solution_seeker') ? review : null,
          message: userRole === 'expert' ? message : null
        })
      });
      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }
      toast.success('Feedback submitted successfully!');
      setFeedbackSubmitted(true);
      navigate(userRole === 'expert' ? '/dashboard' : '/seekerdashboard');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !sessionDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="ml-3">Loading session...</p>
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
                onClick={() => navigate('/bookings')}
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
    <div className="h-screen w-full p-0 m-0 overflow-hidden bg-gray-900">
      {!permissionGranted ? (
        <div className="flex items-center justify-center h-full">
          <button
            className="px-6 py-3 bg-primary text-white rounded-md text-lg"
            onClick={requestMediaPermissions}
            disabled={loading}
          >
            {loading ? 'Requesting...' : 'Join Audio Session'}
          </button>
        </div>
      ) : (
        <>
          {agoraToken && sessionDetails && !callEnded ? (
            <AgoraVideoCall
              channelName={id || ''}
              token={agoraToken}
              uid={userId}
              sessionType="audio"
              onEndCall={handleEndCall}
              onParticipantsUpdate={handleParticipantsUpdate}
              onSessionStart={startSessionTimer}
              onAutoEndCall={handleEndCall}
              sessionStart={sessionDetails.start}
              sessionEnd={sessionDetails.end}
              expertName={sessionDetails.expertName}
              seekerName={sessionDetails.seekerName}
            />
          ) : null}
          
      {/* TIMER UI (VISIBLE ONLY WHEN SESSION STARTED) */}
      {permissionGranted && sessionDetails && !callEnded && sessionStarted && (
        <div className="fixed top-4 right-8 z-50 bg-gray-900/90 text-white rounded-lg shadow-lg px-6 py-2 text-xl font-bold tracking-widest flex items-center">
          {/* <span className="mr-2">Time Remaining:</span> <span style={{minWidth:'80px'}}>{formatTimer(remainingTime)}</span> */}
          {/* 5 MIN POPUP */}
          {showFiveMinPopup && (
            <span className="ml-4 px-3 py-1 bg-yellow-300 text-black rounded shadow font-semibold animate-pulse">5 minutes left!</span>
          )}
        </div>
      )}

          {/* Feedback modal - shown only after call ends */}
          {callEnded && (
            <>
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="fixed inset-0 flex items-center justify-center z-50"
              >
                <div className="bg-white rounded-xl p-8 w-[480px] max-w-full mx-4 shadow-2xl">
                  {!feedbackSubmitted ? (
                    <div className="flex flex-col items-center space-y-6">
                      <h2 className="text-2xl font-bold text-gray-800">Session Feedback</h2>
                      <p className="text-gray-600">The call has ended. Please provide your feedback.</p>
                      
                      {(userRole === 'seeker' || userRole === 'solution_seeker') && (
                        <div className="w-full space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">
                              Rate your session <span className="text-red-500">*</span>
                            </label>
                            {rating === 0 && (
                              <span className="text-xs text-red-500">Rating is required</span>
                            )}
                          </div>
                          <ReactStars
                            count={5}
                            value={rating}
                            onChange={setRating}
                            size={32}
                            activeColor="#fbbf24"
                            color="#e5e7eb"
                          />
                        </div>
                      )}

                      <div className="w-full space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          {userRole === 'expert' ? 'Add a note about the session' : 'Share your experience'}
                          {userRole === 'seeker' && <span className="text-red-500">*</span>}
                        </label>
                        <Textarea
                          className="w-full border border-gray-300 rounded-lg p-4 resize-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[120px]"
                          placeholder={userRole === 'expert' ? 
                            "Add any notes or observations about the session..." : 
                            "Tell us about your session experience..."}
                          value={userRole === 'expert' ? message : review}
                          onChange={(e) => userRole === 'expert' ? setMessage(e.target.value) : setReview(e.target.value)}
                        />
                      </div>

                      <Button
                        className="w-full py-3 bg-primary text-white rounded-lg text-lg font-medium hover:bg-primary/90 disabled:opacity-50"
                        onClick={handleSubmit}
                        disabled={(userRole === 'seeker' && rating === 0) || submitting}
                      >
                        {submitting ? 'Submitting...' : 'Submit Feedback'}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-6">
                      <h2 className="text-2xl font-bold text-gray-800">Thank you for your feedback!</h2>
                      <Button
                        className="w-full py-3 bg-primary text-white rounded-lg text-lg font-medium hover:bg-primary/90"
                        onClick={() => navigate(userRole === 'expert' ? '/dashboard' : '/seekerdashboard')}
                      >
                        Return to Dashboard
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default AudioSession;