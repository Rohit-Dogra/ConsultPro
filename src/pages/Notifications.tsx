  import React, { useEffect, useState } from 'react';
  import Navbar from '../components/layout/Navbar';
  import Footer from '../components/layout/Footer';
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
  import { Button } from '../components/ui/button';
  import { Badge } from '../components/ui/badge';
  import { formatDistanceToNow } from 'date-fns';
  import { toast } from '../components/ui/use-toast';
import { Bell } from 'lucide-react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging, requestNotificationPermission } from '../config/firebase';

import { shouldShowSuccessMessage, shouldRunSetup } from '../utils/notificationPermission';

  interface Notification {
    id: number;
    type: string;
    message: string;
    related_id: string | null;
    read_status: boolean;
    status_color: 'default' | 'success' | 'error' | 'warning' | 'info';
    created_at: string;
  }

  // Add JWT decode function
  const decodeJWT = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  };

  const Notifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);

    // Update user ID initialization
    useEffect(() => {
      // Debug: Check if VITE_FIREBASE_VAPID_KEY is loaded
      console.log("VITE_FIREBASE_VAPID_KEY:", import.meta.env.VITE_FIREBASE_VAPID_KEY);

      const initializeUser = () => {
        try {
          const storedUser = localStorage.getItem('user');
          if (!storedUser) {
            console.log('No user data found in localStorage');
            setError('Please log in to view notifications');
            return;
          }

          const parsedUser = JSON.parse(storedUser);
          console.log('Parsed user data:', parsedUser);

          // Try to get user ID from different sources
          let user_id = parsedUser.user_id || parsedUser.id || parsedUser.userId;
          const user_type = parsedUser.user_type || parsedUser.role || parsedUser.userRole;

          // If user_id is not found in the user object, try to get it from the JWT token
          if (!user_id && parsedUser.token) {
            const decodedToken = decodeJWT(parsedUser.token);
            console.log('Decoded JWT token:', decodedToken);
            if (decodedToken && decodedToken.user_id) {
              user_id = decodedToken.user_id;
            }
          }

          if (!user_id) {
            throw new Error('User ID not found in user data or token');
          }

          console.log('Setting user ID:', user_id, 'User type:', user_type);
          setUserId(user_id);

          // Store user type in state if needed
          if (user_type) {
            localStorage.setItem('userType', user_type);
          }
        } catch (e) {
          console.error('Failed to parse user data:', e);
          setError('Failed to load user data. Please try logging in again.');
        }
      };

      initializeUser();

      // Add event listener for storage changes
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'user') {
          initializeUser();
        }
      };

      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const fetchNotifications = async () => {
      if (!userId) {
        console.log('No user ID available for fetching notifications');
        return;
      }
      
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching notifications for user:', userId);
        const API_BASE_URL = import.meta.env.VITE_API_URL;
        
        // Try different possible token storage keys
        const storedUser = localStorage.getItem('user');
        let token = null;
        
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            // Try different possible token keys
            token = parsedUser.token || parsedUser.accessToken || parsedUser.jwt || parsedUser.jwtToken;
            console.log('Found token in user data:', token ? 'Yes' : 'No');
          } catch (e) {
            console.error('Error parsing user data:', e);
          }
        }
        
        // If token not found in user data, try direct localStorage
        if (!token) {
          token = localStorage.getItem('token') || 
                  localStorage.getItem('accessToken') || 
                  localStorage.getItem('jwt') || 
                  localStorage.getItem('jwtToken');
          console.log('Found token in localStorage:', token ? 'Yes' : 'No');
        }
        
        if (!token) {
          console.error('No authentication token found in any location');
          setError('Please log in again to view notifications');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/notifications/${userId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            console.error('Authentication failed - token may be invalid or expired');
            setError('Session expired. Please log in again.');
            // Clear invalid token
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('jwt');
            localStorage.removeItem('jwtToken');
            return;
          }
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to fetch notifications: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Received notifications data:', data);
        
        if (data.success) {
          const sortedNotifications = data.data.sort((a: Notification, b: Notification) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          setNotifications(sortedNotifications);
          setUnreadCount(sortedNotifications.filter((n: Notification) => !n.read_status).length);
        } else {
          throw new Error(data.error || 'Failed to load notifications');
        }
      } catch (err: any) {
        console.error('Error in fetchNotifications:', err);
        setError(err.message || 'Error fetching notifications');
        toast({
          title: 'Error',
          description: err.message || 'Failed to fetch notifications',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    // Request notification permission and setup Firebase
    useEffect(() => {
      if (!userId) return;

      const setupNotifications = async () => {
        try {
          // Request permission and get token
          const token = await requestNotificationPermission();
          
          if (token) {
            console.log('Firebase token received successfully');
            // Store token in backend
            const API_BASE_URL = import.meta.env.VITE_API_URL;
            const storedUser = localStorage.getItem('user');
            let authToken = null;
            
            if (storedUser) {
              try {
                const parsedUser = JSON.parse(storedUser);
                authToken = parsedUser.token || parsedUser.accessToken || parsedUser.jwt || parsedUser.jwtToken;
              } catch (e) {
                console.error('Error parsing user data for token storage:', e);
              }
            }
            
            if (!authToken) {
              authToken = localStorage.getItem('token') || 
                        localStorage.getItem('accessToken') || 
                        localStorage.getItem('jwt') || 
                        localStorage.getItem('jwtToken');
            }

            if (!authToken) {
              console.error('No authentication token found for storing notification token');
              return;
            }

            const response = await fetch(`${API_BASE_URL}/api/notifications/users/${userId}/notification-token`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
              },
              body: JSON.stringify({ token })
            });
            
            if (!response.ok) {
              throw new Error('Failed to store notification token');
            }
            console.log('Notification token stored successfully');
            
            // Show success toast only if not shown before
            if (shouldShowSuccessMessage()) {
              toast({
                title: 'Notifications Enabled',
                description: 'You will now receive notifications for new messages and updates.',
                variant: 'default',
              });
            }
          } else {
            // Show permission denied toast
            toast({
              title: 'Notifications Disabled',
              description: 'Please enable notifications in your browser settings to receive updates.',
              variant: 'destructive',
            });
          }
        } catch (err) {
          console.error('Error setting up notifications:', err);
          toast({
            title: 'Error',
            description: 'Failed to setup notifications. Please try again.',
            variant: 'destructive',
          });
        }
      };

      // Check if permission is already granted and setup should be run
      if (shouldRunSetup()) {
        setupNotifications();
      }

      // Listen for permission changes
      const handlePermissionChange = () => {
        if (Notification.permission === 'granted') {
          setupNotifications();
        }
      };

      window.addEventListener('notificationpermissionchange', handlePermissionChange);
      return () => window.removeEventListener('notificationpermissionchange', handlePermissionChange);
    }, [userId]);

    // Add polling for notifications with exponential backoff
    useEffect(() => {
      if (!userId) return;

      let pollInterval = 30000; // Start with 30 seconds
      let maxInterval = 300000; // Max 5 minutes
      let pollTimeout: NodeJS.Timeout;

      const poll = () => {
        fetchNotifications();
        pollTimeout = setTimeout(poll, pollInterval);
        // Increase interval up to max
        pollInterval = Math.min(pollInterval * 1.5, maxInterval);
      };

      // Initial fetch
      fetchNotifications();
      pollTimeout = setTimeout(poll, pollInterval);

      return () => {
        clearTimeout(pollTimeout);
      };
    }, [userId]);

    // Add visibility change listener to fetch notifications when tab becomes visible
    useEffect(() => {
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && userId) {
          fetchNotifications();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [userId]);

    const markAsRead = async (id: number) => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL;
        const response = await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
          method: 'PUT',
        });
        if (!response.ok) {
          throw new Error('Failed to mark notification as read');
        }
        setNotifications((prev) =>
          prev.map((notif) => (notif.id === id ? { ...notif, read_status: true } : notif))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        toast({
          title: 'Notification marked as read',
        });
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to mark notification as read',
          variant: 'destructive',
        });
      }
    };

    const markAllAsRead = async () => {
      if (!userId) return;
      
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL;
        const response = await fetch(`${API_BASE_URL}/api/notifications/${userId}/read-all`, {
          method: 'PUT',
        });
        if (!response.ok) {
          throw new Error('Failed to mark all notifications as read');
        }
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, read_status: true }))
        );
        setUnreadCount(0);
        toast({
          title: 'All notifications marked as read',
        });
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to mark all notifications as read',
          variant: 'destructive',
        });
      }
    };

    const getStatusColor = (type: string, status_color: string) => {
      switch (status_color) {
        case 'success':
          return 'bg-green-100 text-green-800 border-green-200';
        case 'error':
          return 'bg-red-100 text-red-800 border-red-200';
        case 'warning':
          return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'info':
          return 'bg-blue-100 text-blue-800 border-blue-200';
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto py-8 px-4 pt-20 max-w-4xl">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </h1>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" onClick={markAllAsRead}>
                  Mark all as read
                </Button>
              )}
              {/* <Button 
                variant="outline" 
                onClick={async () => {
                  const result = await testNotificationSetup();
                  toast({
                    title: result ? 'Test Successful' : 'Test Failed',
                    description: result ? 'Notification setup is working correctly' : 'Check console for details',
                    variant: result ? 'default' : 'destructive',
                  });
                }}
              >
                Test Notifications
              </Button> */}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-red-600 p-4 bg-red-50 rounded-lg">{error}</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="mx-auto h-12 w-12 mb-4 opacity-20" />
              <p>No notifications found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notif) => (
                <Card
                  key={notif.id}
                  className={`transition-colors ${
                    notif.read_status ? 'bg-card' : 'bg-accent/50'
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={getStatusColor(notif.type, notif.status_color)}
                          >
                            {notif.type.split('_').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </Badge>
                          {!notif.read_status && (
                            <span className="h-2 w-2 rounded-full bg-primary"></span>
                          )}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {notif.message}
                        </CardDescription>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={notif.read_status}
                        onClick={() => markAsRead(notif.id)}
                        className="ml-4"
                      >
                        {notif.read_status ? 'Read' : 'Mark as Read'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        <Footer />
      </div>
    );
  };

  export default Notifications;
