import React from "react";
import Navbar from '../layout/Navbar';
import Footer from '../layout/Footer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from "@/components/ui/use-toast";
import { Pencil, User, Calendar, BookOpen, MapPin, Briefcase, Mail, Phone, Link as LinkIcon, Globe, TrendingUp, Clock, Star, Activity } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import jwtDecode from "jwt-decode";
import { SessionRequestForm } from "../../components/features/SessionRequestForm";
import { API_BASE_URL } from '@/config/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import CurrencyTimezoneDialog from "@/components/modals/CurrencyTimezoneDialog";
import { useCurrencyTimezone } from "@/components/contexts/CurrencyTimezoneContext";
import { Settings } from 'lucide-react';

// Update the SeekerProfile interface to match database schema
interface SeekerProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  company: string;
  position: string;
  experience: string;
  location: string;
  bio: string;
  linkedin_url?: string;
  website_url?: string;
  created_at: string;
  updated_at: string;
  industry_id: string;
  product_category_id: string;
  industry_name: string;
  product_category_name: string;
  turnover?: string;
}

interface EditingState {
  personal: boolean;
  contact: boolean;
}

// Add Booking interface
interface Booking {
  id: string;
  expert_id: string;
  expert_name: string;
  seeker_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  amount: string;
}

interface JWTPayload {
    user_id: string;
    role: string;
    iat: number;
    exp: number;
}

const useToken = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  const validateToken = useCallback((token: string) => {
    try {
      const cleanToken = token.replace(/^[Bb]earer\s+/, '');
      const decoded = jwtDecode<JWTPayload>(cleanToken);
      const currentTime = Date.now() / 1000;
      
      if (decoded.exp < currentTime) {
        return false;
      }
      
      if (decoded.role !== 'solution_seeker' && decoded.role !== 'seeker') {
        return false;
      }
      
      return true;
    } catch (e) {
      return false;
    }
  }, []);

  const updateToken = useCallback((newToken: string | null) => {
    if (!newToken) {
      setToken(null);
      setIsValid(false);
      return false;
    }

    const formattedToken = newToken.startsWith('Bearer ') ? newToken : `Bearer ${newToken}`;
    const isValidToken = validateToken(formattedToken);

    setToken(formattedToken);
    setIsValid(isValidToken);
    return isValidToken;
  }, [validateToken]);

  return { token, isValid, updateToken };
};

const SeekerDashboard: React.FC = () => {
    const [profile, setProfile] = useState<SeekerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState<EditingState>({ personal: false, contact: false });
    const [isSessionFormOpen, setIsSessionFormOpen] = useState(false);

    // Initialize bookings as empty array to prevent undefined errors
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [bookingsLoading, setBookingsLoading] = useState(true);
    const [bookingsError, setBookingsError] = useState<string | null>(null);

    // Use auth token hook
    const { token, isValid, updateToken } = useToken();

    // Add state to store expert notes for bookings
    const [expertNotes, setExpertNotes] = useState<Record<string, string>>({});

    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [modalFeedbacks, setModalFeedbacks] = useState<any[]>([]);
    const [modalBookingId, setModalBookingId] = useState<string | null>(null);

    const [allNotesModalOpen, setAllNotesModalOpen] = useState(false);

    const [revenueModalOpen, setRevenueModalOpen] = useState(false);

    // Add state for expert card popup
    const [expertCardOpen, setExpertCardOpen] = useState(false);
    const [selectedExpert, setSelectedExpert] = useState<any>(null);
    const [expertLoading, setExpertLoading] = useState(false);

    // DEMO DATA for pie chart
    const demoRevenueData = [
      { name: 'Your Revenue', value: 40 },
      { name: 'Global Market Revenue', value: 60 },
    ];
    const DEMO_COLORS = ['#29b6f6', '#ffa726']; // blue, orange

    const navigate = useNavigate();    const redirectToLogin = () => {
        navigate('/auth/seeker');
    };

    const redirectToOnboarding = () => {
        navigate('/onboarding');
    };

    // Add dependencies to prevent stale closures
    useEffect(() => {
        const handleTokenExpiry = () => {
            localStorage.clear();
            redirectToLogin();
        };

        window.addEventListener('storage', (e) => {
            if (e.key === 'user' && !e.newValue) {
                handleTokenExpiry();
            }
        });        return () => {
            window.removeEventListener('storage', handleTokenExpiry);
        };
    }, [navigate]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            setProfile(null);
            setBookings([]);
            setError(null);
            setBookingsError(null);
        };
    }, []);// First, simplify the auth check and data fetching
const fetchProfileAndBookings = async () => {
  try {
    setLoading(true);
    setBookingsLoading(true);
    
    // Get auth data from localStorage
    const userData = localStorage.getItem('user');
    if (!userData) {
      throw new Error('No user data found');
    }

    const parsedData = JSON.parse(userData);
    const token = parsedData.token || parsedData.accessToken;
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Clean token and verify
    const cleanToken = token.replace(/^[Bb]earer\s+/, '');
    const decodedToken = jwtDecode<JWTPayload>(cleanToken);
    const userId = decodedToken.user_id;

    if (!userId) {
      throw new Error('Invalid user ID');
    }

    // Format token for requests
    const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

    const API_BASE_URL = import.meta.env.VITE_API_URL;



    // Fetch profile data
    const profileResponse = await fetch(`${API_BASE_URL}/api/profiles/seeker/${userId}`, {
      headers: {
        'Authorization': authToken,
        'Content-Type': 'application/json'
      }
    });

    if (!profileResponse.ok) {
      if (profileResponse.status === 404) {
        navigate('/auth/SeekerProfileForm');
        return;
      }
      throw new Error(`Failed to fetch profile: ${profileResponse.status}`);
    }

    const profileData = await profileResponse.json();
    // Fix: Access the data property from the response
    if (!profileData.success) {
      throw new Error(profileData.message || 'Failed to load profile data');
    }

    // Fix: Set the correct data from the response
    setProfile(profileData.data); // Changed from profileData.profile

    // Fetch bookings data
    const bookingsResponse = await fetch(`${API_BASE_URL}/api/bookings/seeker/${userId}`, {
      headers: {
        'Authorization': authToken,
        'Content-Type': 'application/json'
      }
    });

    if (bookingsResponse.ok) {
      const bookingsData = await bookingsResponse.json();
      // console.log('Bookings response:', bookingsData);
      
      if (bookingsData.success) {
        // Transform the booking data to match the interface
        const transformedBookings = bookingsData.data.map((booking: any) => ({
          id: booking.id,
          expert_id: booking.expert_id,
          expert_name: booking.expert_name,
          seeker_id: booking.seeker_id,
          date: booking.date,
          start_time: booking.start_time,
          end_time: booking.end_time,
          status: booking.status.toLowerCase(),
          amount: booking.amount
        }));
        // console.log('Transformed bookings:', transformedBookings);
        setBookings(transformedBookings);
      }
    } else {
      setBookings([]);
      if (bookingsResponse.status !== 404) {
        console.error('Failed to fetch bookings:', bookingsResponse.status);
      }
    }

    // Fetch revenue data
    // fetchRevenueData(userId, authToken);

  } catch (error: any) {
    console.error('Data fetch error:', error);
    setError(error.message);
    // ...existing error handling...
  } finally {
    setLoading(false);
    setBookingsLoading(false);
  }
};

    // Single useEffect for initialization
    useEffect(() => {
      const fetchData = async () => {
        try {
          // console.log('Fetching profile data...');
          await fetchProfileAndBookings();
          // console.log('Profile data:', profile);
        } catch (error) {
          console.error('Effect error:', error);
        }
      };

      fetchData();
    }, []);

    // Function to fetch expert note for a booking
    const fetchExpertNote = async (bookingId: string, token: string) => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/session-feedback/booking/${bookingId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          // console.log('Fetched feedbacks for booking', bookingId, data.data);
          if (data.data && Array.isArray(data.data)) {
            // Try to find expert feedback with message, fallback to any feedback with message
            let expertFeedback = data.data.find((fb: any) => (fb.user_role && fb.user_role.trim().toLowerCase() === 'expert') && fb.message);
            if (!expertFeedback) {
              expertFeedback = data.data.find((fb: any) => fb.message);
            }
            if (expertFeedback) {
              setExpertNotes(prev => ({ ...prev, [bookingId]: expertFeedback.message }));
            }
          }
        }
      } catch (err) {
        // ignore
      }
    };

    // Fetch expert notes for completed bookings when bookings change
    useEffect(() => {
      const userData = localStorage.getItem('user') || localStorage.getItem('userData') || '{}';
      let token = '';
      try {
        const parsedUserData = JSON.parse(userData);
        token = parsedUserData.token || parsedUserData.accessToken;
      } catch {}
      if (bookings && token) {
        bookings.filter(b => b.status === 'completed').forEach(b => {
          if (!expertNotes[b.id]) {
            fetchExpertNote(b.id, token);
          }
        });
      }
      // eslint-disable-next-line
    }, [bookings]);

    const handleViewNotes = async (bookingId: string) => {
      setModalBookingId(bookingId);
      setFeedbackModalOpen(true);
      setModalFeedbacks([]);
      const userData = localStorage.getItem('user') || localStorage.getItem('userData') || '{}';
      let token = '';
      try {
        const parsedUserData = JSON.parse(userData);
        token = parsedUserData.token || parsedUserData.accessToken;
      } catch {}
      try {
        const response = await fetch(`${API_BASE_URL}/api/session-feedback/booking/${bookingId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.data && Array.isArray(data.data)) {
            setModalFeedbacks(data.data);
          }
        }
      } catch {}
    };

    // Fetch revenue data
    // const fetchRevenueData = async (userId: string, token: string) => { ... };

    // State for market report data
    const [marketReport, setMarketReport] = useState<{
      currentMarketSize: string;
      growthRate: string;
      forecastedSize: string;
      loading: boolean;
      error: string | null;
    }>({
      currentMarketSize: '',
      growthRate: '',
      forecastedSize: '',
      loading: false,
      error: null
    });

    // Function to fetch market report
    const fetchMarketReport = async () => {
      if (!profile?.user_id) {
        console.error('No user_id available');
        return;
      }

      setMarketReport(prev => ({ ...prev, loading: true, error: null }));

      try {
        const userData = localStorage.getItem('user');
        if (!userData) throw new Error('No user data found');

        const parsedData = JSON.parse(userData);
        const rawToken = parsedData.token || parsedData.accessToken;
        if (!rawToken) throw new Error('No auth token found');

        const authToken = `Bearer ${rawToken.replace(/^[Bb]earer\s+/, '')}`;

        const checkResponse = await fetch(`${API_BASE_URL}/api/market-reports/seeker/${profile.user_id}`, {
          headers: {
            Authorization: authToken,
            'Content-Type': 'application/json'
          }
        });

        if (checkResponse.ok) {
          const existing = await checkResponse.json();
          if (existing.success && existing.data) {
            setMarketReport({
              currentMarketSize: existing.data.current_market_size,
              growthRate: existing.data.growth_rate,
              forecastedSize: existing.data.forecasted_size,
              loading: false,
              error: null
            });
            return;
          }
        }
   
        const response = await fetch(`${API_BASE_URL}/api/generate-report`, {
          method: 'POST',
          headers: {
            Authorization: authToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: profile.user_id,
            industry_id: profile.industry_id,
            product_category_id: profile.product_category_id,
            company: profile.company,
            region: 'Global',
            year: '2025'
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || response.statusText);
        }

        const data = await response.json();
        if (!data.marketData) throw new Error('Invalid market data');

        const { currentMarketSize, growthRate, forecastedSize } = data.marketData;

        // Optional check
        if (currentMarketSize === forecastedSize) {
          console.warn("⚠️ Market data warning: current and forecasted sizes are identical. Verify data source.");
        }

        setMarketReport({
          currentMarketSize: currentMarketSize || '$0',
          growthRate: growthRate || '0%',
          forecastedSize: forecastedSize || '$0',
          loading: false,
          error: null
        });

      } catch (err: any) {
        console.error('Market report fetch error:', err);
        setMarketReport(prev => ({
          ...prev,
          loading: false,
          error: err.message || 'Failed to fetch market report'
        }));
      }
    };

    // Fetch market report when profile is loaded
    useEffect(() => {
      if (profile?.user_id) {
        fetchMarketReport();
      }
    }, [profile?.user_id, token]);

    // Function to fetch expert details
    const fetchExpertDetails = async () => {
      if (!profile?.user_id) return;
      
      setExpertLoading(true);
      try {
        const userData = localStorage.getItem('user');
        if (!userData) throw new Error('No user data found');

        const parsedData = JSON.parse(userData);
        const token = parsedData.token || parsedData.accessToken;
        if (!token) throw new Error('No auth token found');

        const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        const API_BASE_URL = import.meta.env.VITE_API_URL;

        const response = await fetch(`${API_BASE_URL}/api/experts/consultation-expert/${profile.user_id}`, {
          headers: {
            'Authorization': authToken,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setSelectedExpert(data.data);
            setExpertCardOpen(true);
          } else {
            toast({
              title: "No Expert Selected",
              description: "You haven't selected an expert for consultation yet.",
              variant: "default",
            });
          }
        } else {
          throw new Error('Failed to fetch expert details');
        }
      } catch (error: any) {
        console.error('Error fetching expert details:', error);
        toast({
          title: "Error",
          description: "Failed to load expert details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setExpertLoading(false);
      }
    };

    // Function to view full expert profile
    const viewFullProfile = () => {
      if (selectedExpert?.user_id) {
        navigate(`/expert-profile/${selectedExpert.user_id}`);
      }
    };

    // Filter bookings to only show today's sessions (any status), robust to timezones and formats
    const todayObj = new Date();
    const isSameDay = (dateStr: string) => {
      if (!dateStr) return false;
      const bookingDate = new Date(dateStr);
      return (
        bookingDate.getFullYear() === todayObj.getFullYear() &&
        bookingDate.getMonth() === todayObj.getMonth() &&
        bookingDate.getDate() === todayObj.getDate()
      );
    };
    const todaysBookings = bookings.filter(b => isSameDay(b.date)).slice(0, 8);

    const [bioExpanded, setBioExpanded] = React.useState(false);

// Add a ref to track if we've shown the preferences prompt
const preferencesPromptShown = useRef(false);

// State to track if the preferences toast is currently showing
const [preferencesToastShowing, setPreferencesToastShowing] = useState(false);

// In CurrencyTimezoneContext.tsx - add logging to the fetchUserPreferences function

// const fetchUserPreferences = async () => {
//   try {
//     console.log("Fetching user preferences...");
//     const userData = localStorage.getItem('user');
//     if (!userData) {
//       console.log("No user data in localStorage");
//       setLoading(false);
//       return;
//     }

//     const parsedData = JSON.parse(userData);
//     const token = parsedData.token || parsedData.accessToken;
    
//     if (!token) {
//       console.log("No token found in user data");
//       setLoading(false);
//       return;
//     }

//     const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
//     console.log(`Making API request to ${API_BASE_URL}/api/user/preferences`);

//     try {
//       const response = await fetch(`${API_BASE_URL}/api/user/preferences`, {
//         headers: {
//           'Authorization': authToken,
//           'Content-Type': 'application/json'
//         }
//       });

//       console.log(`API response status: ${response.status}`);
      
//       if (response.ok) {
//         const data = await response.json();
//         console.log("Preferences data received:", data);
        
//         if (data.success && data.data) {
//           const { currency: currencyCode, timezone: userTimezone } = data.data;
          
//           if (currencyCode) {
//             console.log(`Setting currency to: ${currencyCode}`);
//             setCurrencyAndTimezone(currencyCode, userTimezone || timezone);
//           }
          
//           if (userTimezone) {
//             console.log(`Setting timezone to: ${userTimezone}`);
//             // setTimezone(userTimezone); // Removed because setTimezone is not defined
//           }
//         }
//       }
//     } catch (error) {
//       console.error("Error fetching preferences:", error);
//     }
//   } catch (error) {
//     console.error('Error processing user data:', error);
//   } finally {
//     setLoading(false);
//   }
// };

    // Add new state for currency/timezone preferences modal
const [preferencesModalOpen, setPreferencesModalOpen] = useState(false);
  
// Use the currency/timezone context
const { currency, timezone, setCurrencyAndTimezone, formatCurrency, formatDateTime } = useCurrencyTimezone();

    // Add this function to handle saving preferences
const handleSavePreferences = async (newCurrency: string, newTimezone: string) => {
  try {
    await setCurrencyAndTimezone(newCurrency, newTimezone);
    setPreferencesModalOpen(false);
    
    // Set the ref to true to prevent showing the prompt again
    preferencesPromptShown.current = true;
    
    toast({
      title: "Preferences updated",
      description: "Your currency and timezone settings have been saved.",
    });
    
    // Optionally refresh data to show updated currency
    fetchProfileAndBookings();
  } catch (error) {
    console.error('Error saving preferences:', error);
    toast({
      title: "Error saving preferences",
      description: "There was an error saving your preferences. Please try again.",
      variant: "destructive",
    });
  }
};

    // Move this function definition to the top, before any useEffects that might use it
    const refreshPreferences = async () => {
      try {
        const userData = localStorage.getItem('user');
        if (!userData) return;
        const parsedData = JSON.parse(userData);
        const token = parsedData.token || parsedData.accessToken;
        if (!token) return;
        const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        
        console.log("Refreshing currency preferences...");
        
        const response = await fetch(`${API_BASE_URL}/api/user/preferences`, {
          headers: {
            'Authorization': authToken,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log("Preferences data received:", data);
          
          if (data.success && data.data) {
            const { currency: currencyCode, timezone: userTimezone } = data.data;
            if (currencyCode || userTimezone) {
              console.log(`Setting currency to: ${currencyCode}, timezone to: ${userTimezone}`);
              await setCurrencyAndTimezone(currencyCode, userTimezone);
            }
          }
        }
      } catch (error) {
        console.error("Error refreshing preferences:", error);
        // Ignore errors for silent refresh
      }
    };
    
    // Add this effect to refresh preferences when component mounts or profile changes
useEffect(() => {
  if (profile?.user_id) {
    
  }
}, [profile?.user_id, refreshPreferences]);

// Replace your existing useEffect with this version
// useEffect(() => {
//   // Check if preferences are not set AND profile is loaded
//   if (!loading && !error && profile && (!currency.code || !timezone)) {
//     // Only show one toast at a time
//     if (!preferencesToastShowing) {
//       setPreferencesToastShowing(true);
      
//       Show a persistent toast that can't be dismissed until preferences are set
//       const { dismiss } = toast({
//         title: "Required Setup",
//         description: "You must set your currency and timezone preferences to continue using the dashboard.",
//         variant: "destructive",
//         action: (
//           <Button variant="secondary" onClick={() => setPreferencesModalOpen(true)}>
//             Set Now
//           </Button>
//         ),
//         // Make it stick around until manually dismissed
//         duration: 1000000,
//         // Use this callback to track when toast is dismissed
//         onDismiss: () => {
//           // If preferences are still not set, immediately show the toast again
//           if (!currency.code || !timezone) {
//             setTimeout(() => setPreferencesToastShowing(false), 300);
//           }
//         },
//       });
      
//       // If preferences get set, dismiss the toast
//       if (currency.code && timezone) {
//         dismiss();
//         setPreferencesToastShowing(false);
//       }
//     }
//   } else if (currency.code && timezone && preferencesToastShowing) {
//     // When preferences are set, update the state
//     setPreferencesToastShowing(false);
//   }
// }, [loading, error, profile, currency.code, timezone, preferencesToastShowing]);

    // Add this effect near the top of your other useEffects
useEffect(() => {
  const loadInitialPreferences = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return;

      const user = JSON.parse(userData);
      if (!user.token) return;

      const API_BASE_URL = import.meta.env.VITE_API_URL;
      
      // Silent fetch - no loading indicators
      const response = await fetch(`${API_BASE_URL}/api/user/preferences`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const { currency: currencyCode, timezone: userTimezone } = data.data;
          
          if (currencyCode && userTimezone) {
            await setCurrencyAndTimezone(currencyCode, userTimezone);
          }
        }
      }
    } catch (error) {
      console.error("Error loading initial preferences:", error);
    }
  };

  loadInitialPreferences();
}, []); // Empty dependency array means this runs once on mount

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
          <Navbar />
          
          {/* Hero Section - Light Blue Theme */}
          <div className="bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-500 text-white pt-20 pb-12 shadow-lg">
            <div className="container mx-auto px-4">
              <div className="text-center">
                <h1 className="text-4xl font-bold mb-4 text-white drop-shadow-md">Welcome to Your Dashboard</h1>
                <p className="text-xl opacity-95 text-blue-50">Manage your profile and track your expert consultations</p>
              </div>
            </div>
          </div>

          {/* Stats Cards - Light Blue Theme */}
          <div className="container mx-auto px-4 -mt-8 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <BookOpen className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Total Consultations</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {bookings.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-emerald-50 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Completed</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {bookings.filter(b => b.status === 'completed').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-amber-50 rounded-lg">
                      <Clock className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Pending</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {bookings.filter(b => b.status === 'pending').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6 flex items-center space-x-4 justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-violet-50 rounded-lg">
                      <Star className="w-6 h-6 text-violet-500" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Key Takeaways</p>
                    </div>
                  </div>
                  <button
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                    onClick={() => setAllNotesModalOpen(true)}
                  >
                    View Notes
                  </button>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6 flex items-center space-x-4 justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-emerald-50 rounded-lg">
                      <User className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Selected Expert</p>
                    </div>
                  </div>
                  <button
                    className="px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm font-medium disabled:opacity-50"
                    onClick={fetchExpertDetails}
                    disabled={expertLoading}
                  >
                    {expertLoading ? 'Loading...' : 'View Expert'}
                  </button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* === Revenue Section Start (redesigned) === */}
          <div className="container mx-auto px-4 mb-8">
            <div className="rounded-3xl bg-gradient-to-br from-white via-blue-50 to-cyan-50 p-8 flex flex-col items-center justify-center shadow-lg border border-blue-100 min-h-[340px] mb-6 relative overflow-hidden transition-all duration-300">
              <div className="relative z-10 w-full flex flex-col items-center justify-center">
                {/* Company Revenue Heading */}
              <div className="flex items-center gap-3 mb-2">
              <div className="text-3xl md:text-4xl font-extrabold tracking-tight text-blue-500 drop-shadow-lg flex items-center">

                 <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="36"
                  height="36"
                  viewBox="0 0 48 48"
                  className="w-9 h-9 md:w-12 md:h-12 mr-2 text-green-500"
                  fill="none"
                  >
                  <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="4" fill="#e0f7fa"/>
                  <path d="M16 24l6 6 10-10" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                 </svg>

                  {profile && profile.company ? `${profile.company} Revenue` : 'Revenue Overview'}
                  </div>
                </div>
                <span className="font-semibold text-blue-700 mb-4">Your Revenue: ${(profile?.turnover || 0)}</span>
                {/* Business Growth Subheading */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {/* Market Size Card */}
                  <div className="bg-white p-4 rounded-xl shadow-md border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-semibold text-slate-600">Current Market Size</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {marketReport.loading ? (
                        <div className="animate-pulse h-8 w-32 bg-blue-100 rounded"></div>
                      ) : marketReport.error ? (
                        <span className="text-red-500 text-base">Error loading data</span>
                      ) : (
                        <span>${(marketReport.currentMarketSize.replace(/[^\d.]/g, '') || 0).toLocaleString()} Billion</span>
                      )}
                    </div>
                  </div>

                  {/* Growth Rate Card */}
                  <div className="bg-white p-4 rounded-xl shadow-md border border-emerald-100">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <span className="text-sm font-semibold text-slate-600">Growth Rate (CAGR)</span>
                    </div>
                    <div className="text-2xl font-bold text-emerald-600">
                      {marketReport.loading ? (
                        <div className="animate-pulse h-8 w-24 bg-emerald-100 rounded"></div>
                      ) : marketReport.error ? (
                        <span className="text-red-500 text-base">Error loading data</span>
                      ) : (
                        marketReport.growthRate
                      )}
                    </div>
                  </div>

                  {/* Forecasted Size Card */}
                  <div className="bg-white p-4 rounded-xl shadow-md border border-violet-100">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-6 h-6 text-violet-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm font-semibold text-slate-600">2030 Forecast</span>
                    </div>
                    <div className="text-2xl font-bold text-violet-600">
                      {marketReport.loading ? (
                        <div className="animate-pulse h-8 w-32 bg-violet-100 rounded"></div>
                      ) : marketReport.error ? (
                        <span className="text-red-500 text-base">Error loading data</span>
                      ) : (
                        marketReport.forecastedSize
                      )}
                    </div>
                  </div>
                </div>

                {/* Add the disclaimer here */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700 italic text-center max-w-4xl mx-auto mb-4">
                  <p>
                    <span className="font-semibold">Disclaimer:</span> These values are generated with AI assistance and are intended for general guidance only. Please consult a qualified expert before making business decisions.
                  </p>
                </div>

                <div className="text-center">
                  <Button
                    className="bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg transition-all duration-300"
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      setIsSessionFormOpen(true);
                    }}
                  >
                    Connect with Experts
                  </Button>
                </div>

                {/* Market Share Heading */}
                {/* <div className="flex items-center gap-2 mb-6">
                  <svg className="w-7 h-7 md:w-8 md:h-8 text-emerald-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 17l6-6 4 4 8-8"/></svg>
                  <span className="text-lg md:text-2xl font-bold text-emerald-700">Market Share Distribution</span>
              }}
              >
            Connect with Experts
            </Button>
                </div>

                {/* Market Share Heading */}
                {/* <div className="flex items-center gap-2 mb-6">
                  <svg className="w-7 h-7 md:w-8 md:h-8 text-emerald-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 17l6-6 4 4 8-8"/></svg>
                  <span className="text-lg md:text-2xl font-bold text-emerald-700">Market Share Distribution</span>
                  <span className="text-lg md:text-2xl font-bold text-emerald-500 ml-2">{demoRevenueData[1].value.toLocaleString()}%</span>
                </div> */}

                {/* Pie Chart */}
                {/* <div className="w-full md:w-2/3 flex justify-center items-center mb-6">
                  <div style={{
                    background: 'linear-gradient(135deg, #f0f9ff 0%, #bae6fd 100%)',
                    borderRadius: '2rem',
                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
                    padding: '1.5rem 0',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <ResponsiveContainer width={340} height={260}>
                      <PieChart style={{ filter: 'drop-shadow(0 4px 16px rgba(56,189,248,0.18))' }}>
                        <Pie
                          data={demoRevenueData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          innerRadius={60}
                          label={({ name, value }) => <tspan style={{ fontWeight: 700, fontSize: 16, fill: '#222' }}>{`${name}: ${value}%`}</tspan>}
                          labelLine={false}
                          isAnimationActive={true}
                          stroke="#fff"
                          strokeWidth={2}
                        >
                          {demoRevenueData.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={DEMO_COLORS[idx % DEMO_COLORS.length]} cursor="pointer" />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name, props) => [`${value}%`, props.payload.name]}
                          contentStyle={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', color: '#222', fontWeight: 600, fontSize: 16 }}
                          itemStyle={{ fontWeight: 600 }}
                        />
                        <Legend verticalAlign="bottom" iconType="circle" formatter={(value) => <span style={{ color: '#222', fontWeight: 600 }}>{value}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div> */}
                {/* View onboarding page */}
                {/* <Button
                  className="mt-2 bg-gradient-to-r from-blue-400 to-cyan-400 text-white font-semibold rounded-lg shadow-md hover:from-blue-500 hover:to-cyan-500 transition-all flex items-center gap-2 px-6 py-3 text-lg"
                  onClick={() => navigate('/onboarding')}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 17a1 1 0 100-2 1 1 0 000 2z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8V6a5 5 0 00-9.9-1M5 10h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8a2 2 0 012-2z" />
  </svg>
   Get Full Assessment   
                </Button> */}
              </div>
            </div>
            
          </div>
          {/* === Revenue Section End (redesigned) === */}



          {/* Main Content */}
          <main className="container mx-auto px-4 pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Profile Section - Light Blue Theme */}
              <Card className="lg:col-span-1 bg-white shadow-xl border-0 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
                <div className="bg-gradient-to-r from-blue-400 to-cyan-400 h-20"></div>
                <CardHeader className="relative -mt-10 pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                      <div className="h-20 w-20 rounded-full bg-white shadow-lg flex items-center justify-center border-4 border-white">
                        <User className="h-10 w-10 text-blue-500" />
                      </div>
                      {/* <div className="pt-6">
                        <CardTitle className="text-2xl font-bold text-slate-900">Profile</CardTitle>
                      </div> */}
                    </div>
                    {/* <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing({ ...isEditing, personal: true })}
                      className="mt-6 hover:bg-blue-50 border-blue-300 text-blue-600 hover:border-blue-400"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </Button> */}
                  </div>
                </CardHeader>
                {/* Profile Section */}
                <CardContent className="pt-0">
                  {loading ? (
                    <div className="flex justify-center items-center h-40">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : error ? (
                    <div className="text-red-600 text-center p-4 bg-red-50 rounded-lg border border-red-200">
                      {error}
                    </div>
                  ) : !profile ? (
                    <div className="text-center py-8">
                      <p className="text-slate-600">Profile not found</p>
                      <Button 
                        onClick={() => navigate('/auth/SeekerProfileForm')}
                        className="mt-4"
                      >
                        Complete Your Profile
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Profile Header */}
                      <div className="text-center">
                        <h3 className="text-2xl font-bold text-slate-900">{profile.name}</h3>
                        <p className="text-lg text-blue-600 font-medium">{profile.position}</p>
                        <p className="text-slate-600 mt-1">{profile.company}</p>
                      </div>
                      
                      {/* Bio Section */}
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <h4 className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">About</h4>
                        <p
                          className="text-slate-700 leading-relaxed"
                          style={
                            !bioExpanded && (profile.bio?.length > 200)
                              ? {
                                  display: "-webkit-box",
                                  WebkitLineClamp: 4,
                                  WebkitBoxOrient: "vertical" as 'vertical',
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }
                              : {}
                          }
                        >
                          {profile.bio}
                        </p>
                        {profile.bio?.length > 200 && (
                          <button
                            className="text-blue-600 mt-2 text-sm font-semibold focus:outline-none"
                            onClick={() => setBioExpanded((prev) => !prev)}
                          >
                            {bioExpanded ? "View Less" : "View More"}
                          </button>
                        )}
                      </div>

                      {/* Professional Details */}
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                          <div className="p-2 bg-emerald-100 rounded-lg">
                            <Calendar className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-emerald-800">Experience</p>
                            <p className="font-semibold text-slate-900">{profile.experience} years</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-3 bg-violet-50 rounded-lg border border-violet-100">
                          <div className="p-2 bg-violet-100 rounded-lg">
                            <MapPin className="w-5 h-5 text-violet-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-violet-800">Location</p>
                            <p className="font-semibold text-slate-900">{profile.location}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-3 bg-cyan-50 rounded-lg border border-cyan-100">
                          <div className="p-2 bg-cyan-100 rounded-lg">
                            <Activity className="w-5 h-5 text-cyan-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-cyan-800">Industry & Category</p>
                            <div className="font-semibold text-slate-900">
                              <p>{profile.industry_name || 'Not specified'}</p>
                              <p className="text-sm text-cyan-600 mt-1">{profile.product_category_name || 'Not specified'}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="p-2 bg-slate-100 rounded-lg flex-shrink-0">
                            <Mail className="w-5 h-5 text-slate-600" />
                          </div>
                          <div className="min-w-0 flex-1"> {/* Add min-w-0 and flex-1 */}
                            <p className="text-sm font-medium text-slate-700">Email</p>
                            <p className="font-semibold text-slate-900 truncate break-all"> {/* Add truncate and break-all */}
                              {profile.email}
                            </p>
                          </div>
                        </div>

                        {/* Social Links */}
                        {(profile.linkedin_url || profile.website_url) && (
                          <div className="space-y-3 pt-4 border-t border-slate-200">
                            <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Links</h4>
                            
                            {profile.linkedin_url && (
                              <a 
                                href={profile.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100"
                              >
                                <LinkIcon className="w-5 h-5 text-blue-600" />
                                <span className="text-blue-700 font-medium">LinkedIn Profile</span>
                              </a>
                            )}
                            
                            {profile.website_url && (
                              <a 
                                href={profile.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-3 p-3 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-100"
                              >
                                <Globe className="w-5 h-5 text-emerald-600" />
                                <span className="text-emerald-700 font-medium">Personal Website</span>
                              </a>
                            )}
                          </div>
                        )}

                        {/* Profile Meta */}
                        <div className="text-xs text-slate-500 pt-4 border-t border-slate-200 space-y-1">
                          <p className="flex items-center space-x-2">
                            <Calendar className="w-3 h-3" />
                            <span>Member since: {new Date(profile.created_at).toLocaleDateString()}</span>
                          </p>
                          <p className="flex items-center space-x-2">
                            <Clock className="w-3 h-3" />
                            <span>Last updated: {new Date(profile.updated_at).toLocaleDateString()}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Bookings Section - Light Blue Theme */}
              <Card className="lg:col-span-2 bg-white shadow-xl border-0 hover:shadow-2xl transition-shadow duration-300">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-t-lg p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-xl sm:text-2xl font-bold flex items-center">
                      <Calendar className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                     Consultation Timeline
                    </CardTitle>
                    <p className="text-sm sm:text-base text-blue-100 mt-1 sm:mt-2">Track your consultations and bookings</p>
                  </div>
                  <Button
                    className="mt-4 sm:mt-0 bg-gradient-to-r from-blue-400 to-cyan-400 text-white font-semibold rounded-lg shadow-md hover:from-blue-500 hover:to-cyan-500 transition-all flex items-center gap-2 px-5 py-2 text-base"
                    onClick={() => navigate('/appointment-log')}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    View Appointment Log
                  </Button>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  {bookingsLoading ? (
                    <div className="flex justify-center items-center h-40">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : bookingsError ? (
                    <div className="text-red-600 text-center p-6 bg-red-50 rounded-lg border border-red-200">
                      <div className="text-red-500 mb-2">⚠</div>
                      {bookingsError}
                    </div>
                  ) : !todaysBookings || todaysBookings.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="bg-blue-50 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center border border-blue-100">
                        <BookOpen className="w-12 h-12 text-blue-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-700 mb-2">No Sessions Yet</h3>
                      <p className="text-slate-500 mb-6">Start your learning journey by booking your first expert session</p>
                      <Button 
                        className="bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg transition-all duration-300"
                        onClick={() => {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                          setIsSessionFormOpen(true);
                        }}
                      >
                        Connect with Experts
                        </Button>
                      </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {todaysBookings.map((booking, index) => (
                        <div 
                          key={booking.id || `booking-${index}`} 
                          className="border border-slate-200 rounded-xl p-3 sm:p-6 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-slate-50 hover:from-blue-50 hover:to-cyan-50"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                            <div className="flex items-start sm:items-center space-x-3 sm:space-x-4">
                              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-md flex-shrink-0">
                                {(booking.expert_name || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-base sm:text-lg text-slate-900 truncate">
                                  Booking ID: {booking.id || 'Unknown booking id'}
                                </h3>
                                <p className='font-medium text-sm sm:text-base mt-1'>
                                  Time: {booking.start_time} - {booking.end_time}
                                </p>
                                <div className="flex items-center space-x-2 text-slate-600 mt-1 text-sm sm:text-base">
                                  <Calendar className="w-4 h-4 flex-shrink-0" />
                                  <p className="font-medium truncate">
                                    {booking.date ? new Date(booking.date).toLocaleDateString('en-US', {
                                      weekday: 'short',
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    }) : 'Date not set'}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="sm:text-right mt-2 sm:mt-0">
                              <span className={`inline-flex items-center px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium ${
                                booking.status === 'completed' 
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                booking.status === 'pending' 
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                  'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}>
                                {booking.status === 'completed' && '✓ '}
                                {booking.status === 'pending' && '⏳ '}
                                {booking.status === 'cancelled' && '✕ '}
                                {(booking.status || 'unknown').charAt(0).toUpperCase() + (booking.status || 'unknown').slice(1)}
                              </span>
                            </div>
                          </div>
                          {booking.status === 'completed' && expertNotes[booking.id] && (
                            <div className="mt-2 p-3 bg-violet-50 border border-violet-100 rounded-lg flex items-center justify-between">
                              <div>
                                <span className="font-semibold text-violet-700">Expert Note:</span>
                                <span className="ml-2 text-slate-800">{expertNotes[booking.id]}</span>
                              </div>
                              <button
                                className="ml-4 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                                onClick={() => handleViewNotes(booking.id)}
                              >
                                View Notes
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions - Light Blue Theme */}
            <div className="mt-8">
              <Card className="bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 text-white shadow-xl border-0 hover:shadow-2xl transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Quick Actions</CardTitle>
                  <p className="text-blue-100">Take action to enhance your experience</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link to="/features">
                      <Button variant="secondary" className="w-full h-16 text-lg font-semibold bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 shadow-md hover:shadow-lg transition-all duration-300">
                        <User className="w-5 h-5 mr-2" />
                        Find Experts
                      </Button>
                    </Link>
                    
                    <Button 
                      variant="secondary" 
                      className="w-full h-16 text-lg font-semibold bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 shadow-md hover:shadow-lg transition-all duration-300"
                      onClick={() => setIsSessionFormOpen(true)}
                    >
                      <Calendar className="w-5 h-5 mr-2" />
                      Schedule Session
                    </Button>
                    
                    <Button variant="secondary" className="w-full h-16 text-lg font-semibold bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 shadow-md hover:shadow-lg transition-all duration-300">
                      <BookOpen className="w-5 h-5 mr-2" />
                      Explore Insight Library 
                    </Button>

                    {/* Add the preferences button as fourth item */}
                    {/* <Button 
                      variant="secondary" 
                      className="w-full h-16 text-lg font-semibold bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 shadow-md hover:shadow-lg transition-all duration-300"
                      onClick={() => setPreferencesModalOpen(true)}
                      >
                      <Settings className="w-5 h-5 mr-2" />
                       Preferences
                    </Button> */}
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
          
          <SessionRequestForm
            isOpen={isSessionFormOpen}
            onClose={() => setIsSessionFormOpen(false)}
          />
          <Footer />

          {/* Feedback Modal */}
          <Dialog open={feedbackModalOpen} onOpenChange={setFeedbackModalOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Session Feedback</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                {modalFeedbacks.length === 0 ? (
                  <div className="text-center text-gray-500">No feedback available for this session.</div>
                ) : (
                  modalFeedbacks.map((fb, idx) => (
                    <div key={fb.id || idx} className="border rounded p-3 bg-slate-50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-blue-700">{fb.user_role === 'expert' ? 'Expert' : 'Seeker'}</span>
                        <span className="text-xs text-gray-500">{new Date(fb.created_at).toLocaleString()}</span>
                      </div>
                      {fb.rating && (
                        <div className="mb-1 text-yellow-600">Rating: {fb.rating} / 5</div>
                      )}
                      {fb.review && (
                        <div className="mb-1 text-gray-700">Review: {fb.review}</div>
                      )}
                      {fb.message && (
                        <div className="mb-1 text-violet-700">Note: {fb.message}</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* All Notes Modal */}
          <Dialog open={allNotesModalOpen} onOpenChange={setAllNotesModalOpen}>
            <DialogContent className="max-w-lg w-full sm:w-[90vw] md:w-[500px] max-h-[90vh] flex flex-col items-center justify-center">
              <DialogHeader>
                <DialogTitle>All Expert Notes</DialogTitle>
              </DialogHeader>
              <div className="w-full overflow-y-auto overflow-x-hidden" style={{ maxHeight: '60vh' }}>
                {Object.keys(expertNotes).length === 0 ? (
                  <div className="text-center text-gray-500">No expert notes available.</div>
                ) : (
                  // Sort notes by insertion order, newest first (FIFO)
                  Object.entries(expertNotes)
                    .reverse() // Newest on top
                    .map(([bookingId, note], idx) => (
                      <div key={bookingId} className="border rounded p-3 bg-slate-50 mb-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-blue-700">Session ID: {bookingId}</span>
                        </div>
                        <div className="mb-1 text-violet-700 break-words">Note: {note}</div>
                      </div>
                    ))
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Currency/Timezone Preferences Modal */}
          <CurrencyTimezoneDialog
            isOpen={preferencesModalOpen}
            onClose={() => {
              setPreferencesModalOpen(false);
              // Set the ref to true even if they cancel to prevent showing the prompt again
              preferencesPromptShown.current = true;
            }}
            currentCurrency={currency.code}
            currentTimezone={timezone}
            onSave={handleSavePreferences}
          />

          {/* Expert Card Modal */}
          <Dialog open={expertCardOpen} onOpenChange={setExpertCardOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Selected Expert</DialogTitle>
              </DialogHeader>
              {selectedExpert && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
                      {selectedExpert.firstName?.charAt(0)}{selectedExpert.lastName?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{selectedExpert.name}</h3>
                      <p className="text-blue-600 font-medium">{selectedExpert.designation}</p>
                      <p className="text-slate-600 text-sm">{selectedExpert.currentOrganization}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                      <MapPin className="w-4 h-4 text-slate-600" />
                      <span className="text-sm text-slate-700">{selectedExpert.location}</span>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                      <Calendar className="w-4 h-4 text-slate-600" />
                      <span className="text-sm text-slate-700">{selectedExpert.workExperience} years experience</span>
                    </div>
                    
                    {selectedExpert.expertise && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-800 mb-1">Expertise</p>
                        <p className="text-sm text-blue-700">{selectedExpert.expertise}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-3 pt-4">
                    <Button 
                      onClick={viewFullProfile}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      View Full Profile
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setExpertCardOpen(false)}
                      className="flex-1"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      );
    };
    


    export default SeekerDashboard;

