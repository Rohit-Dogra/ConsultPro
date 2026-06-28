import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, CheckCircle, Play, Star, TrendingUp, Clock, X } from "lucide-react";
const SessionRequestForm = lazy(() => import("@/components/features/SessionRequestForm").then(module => ({ default: module.default || module.SessionRequestForm })));
import { useFlowCheckpoint } from "@/hooks/useFlowCheckpoint";
import { trackBrowseEngagement, trackCategoryClick } from "@/services/recommendationEngine";


const HeroSection = () => {
  const navigate = useNavigate();
  const { saveCheckpoint, clearCheckpoint, checkAndRestore } = useFlowCheckpoint();
  const [showGoogleSignup, setShowGoogleSignup] = useState(false);
  const [showAdditionalQuestions, setShowAdditionalQuestions] = useState(false);
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [showPhoneCapture, setShowPhoneCapture] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);

  const [userInfo, setUserInfo] = useState({ email: "", name: "", id: "" });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isValidatingSession, setIsValidatingSession] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userFlowState, setUserFlowState] = useState<'initial' | 'authenticated' | 'questions' | 'report' | 'phone' | 'experts' | 'subscription' | 'profile'>('initial');
  const [isCheckingProgress, setIsCheckingProgress] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentStep, setCurrentStep] = useState('initial');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [industries, setIndustries] = useState([]);
  const [productCategories, setProductCategories] = useState([]);
  const [functionalities, setFunctionalities] = useState([]);
  const [formData, setFormData] = useState({
    industry: "",
    productCategory: "",
    problems: "",
    outcomes: "",
    functionality: "",
    phone: "",
    expert_id: ""
  });
  const [phoneError, setPhoneError] = useState("");
  
  // Loading states and error handling
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [authRetryCount, setAuthRetryCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const MAX_RETRY_ATTEMPTS = 3;
  
  // Form validation
  const [fieldErrors, setFieldErrors] = useState({
    industry: '',
    productCategory: '',
    functionality: ''
  });
  
  // Market report state
  const [marketReport, setMarketReport] = useState<{
    currentMarketSize: string;
    growthRate: string;
    forecastedSize: string;
    loading: boolean;
    error: string | null;
    metadata?: {
      warnings: string[];
    };
  }>({
    currentMarketSize: '',
    growthRate: '',
    forecastedSize: '',
    loading: false,
    error: null
  });

  // Initialize component without auto-restoring checkpoints
  useEffect(() => {
    // Check for expert_id in URL parameters or sessionStorage
    const urlParams = new URLSearchParams(window.location.search);
    const expertId = urlParams.get('expert_id') || sessionStorage.getItem('selected_expert_id');
    if (expertId) {
      setFormData(prev => ({ ...prev, expert_id: expertId }));
    }
    
    validateSession();
  }, []);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Mobile detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowGoogleSignup(false);
        setShowAdditionalQuestions(false);
        setShowReportPreview(false);
        setShowPhoneCapture(false);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Restore user's checkpoint only when explicitly called (not automatically)
  const restoreUserCheckpoint = () => {
    try {
      const savedCheckpoint = sessionStorage.getItem('freeSessionCheckpoint');
      if (!savedCheckpoint) {
        return false;
      }

      const checkpoint = JSON.parse(savedCheckpoint);
      
      // Check if checkpoint is expired (within 24 hours)
      const checkpointAge = Date.now() - checkpoint.timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (checkpointAge > maxAge) {
        sessionStorage.removeItem('freeSessionCheckpoint');
        return false;
      }

      // Restore user info if available
      if (checkpoint.userInfo && checkpoint.userInfo.email) {
        setUserInfo(checkpoint.userInfo);
        setIsLoggedIn(true);
      }

      // Restore form data
      if (checkpoint.formData) {
        setFormData(prev => ({ ...prev, ...checkpoint.formData }));
      }

      // Restore to the appropriate step
      switch (checkpoint.step) {
        case 'additional_questions':
          setUserFlowState('questions');
          setShowAdditionalQuestions(true);
          if (checkpoint.industries) setIndustries(checkpoint.industries);
          if (checkpoint.productCategories) setProductCategories(checkpoint.productCategories);
          return true;
        case 'report_preview':
          setUserFlowState('report');
          setShowReportPreview(true);
          if (checkpoint.marketReport) setMarketReport(checkpoint.marketReport);
          return true;
        case 'phone_capture':
          setUserFlowState('phone');
          setShowPhoneCapture(true);
          return true;
        default:
          return false;
      }
    } catch (error) {
      console.error('Error restoring checkpoint:', error);
      sessionStorage.removeItem('freeSessionCheckpoint');
      return false;
    }
  };

  // Save checkpoint with current context
  const saveFlowCheckpoint = (step: string, additionalData: any = {}) => {
    const checkpointData = {
      userInfo: isLoggedIn ? userInfo : null,
      formData,
      userFlowState,
      ...additionalData
    };
    saveCheckpoint(step as any, checkpointData);
  };
  
  // Save form state to sessionStorage only during active flows
  useEffect(() => {
    // Only save state if we're in an active flow (not initial)
    if (userFlowState !== 'initial') {
      const stateToSave = {
        formData,
        showAdditionalQuestions,
        showReportPreview,
        showPhoneCapture,

        userFlowState,
        userInfo,
        isLoggedIn
      };
      sessionStorage.setItem('heroFormState', JSON.stringify(stateToSave));
    }
  }, [formData, showAdditionalQuestions, showReportPreview, showPhoneCapture, userFlowState, userInfo, isLoggedIn]);

  // Load Google Sign-In script when modal opens
  useEffect(() => {
    if (showGoogleSignup) {
      const timer = setTimeout(() => {
        if (!window.google) {
          loadGoogleSignIn();
        } else {
          renderGoogleButton();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showGoogleSignup]);

  const loadGoogleSignIn = () => {
    if (window.google) {
      renderGoogleButton();
      return;
    }

    // Check if script is already loading
    if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: false,
          use_fedcm_for_prompt: false
        });
        renderGoogleButton();
      }
    };
    
    script.onerror = () => {
      console.error('Failed to load Google Sign-In script');
      toast({
        title: "Error loading Google Sign-In",
        description: "Please refresh the page and try again.",
        variant: "destructive"
      });
    };
  };

  const renderGoogleButton = () => {
    const buttonContainer = document.getElementById('google-signin-button');
    if (buttonContainer && window.google) {
      buttonContainer.innerHTML = ''; // Clear existing content
      window.google.accounts.id.renderButton(buttonContainer, {
        theme: 'outline',
        size: 'large',
        width: 350,
        text: 'continue_with',
        shape: 'rectangular',
        type: 'standard'
      });
    }
  };

  // Fetch non-critical data after first paint / when idle to avoid blocking LCP
  useEffect(() => {
    const run = () => {
      try {
        fetchFunctionalities();
        fetchIndustries();
      } catch (err) {
        // swallow - fetch functions handle their own errors
      }
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const id = (window as any).requestIdleCallback(run, { timeout: 2000 });
      return () => (window as any).cancelIdleCallback?.(id);
    } else {
      const t = setTimeout(run, 1500);
      return () => clearTimeout(t);
    }
  }, []);

  const validateSession = async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (!token || !userData) {
        setIsValidatingSession(false);
        return;
      }

      const user = JSON.parse(userData);
      
      if (isTokenExpired(token)) {
        clearAuthData();
        setIsValidatingSession(false);
        return;
      }

      setUserInfo({
        email: user.email || '',
        name: user.name || '',
        id: user.id || user.user_id || ''
      });
      setUserRole(user.role);
      setIsLoggedIn(true);
      
    } catch (error) {
      console.error('Session validation error:', error);
      clearAuthData();
    } finally {
      setIsValidatingSession(false);
    }
  };

  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true; // If we can't parse the token, consider it expired
    }
  };

  const clearAuthData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUserInfo({ email: "", name: "", id: "" });
    setIsLoggedIn(false);
  };

  // Respond to global auth changes (logout from Navbar or other components)
  useEffect(() => {
    const handleAuthChanged = (e: Event) => {
      try {
        const detail = (e as CustomEvent)?.detail;
        if (detail && detail.isAuthenticated === false) {
          clearAuthData();
        } else {
          // reload user from localStorage if available
          const stored = localStorage.getItem('user');
          if (stored) {
            const parsed = JSON.parse(stored);
            setUserInfo({ email: parsed.email || '', name: parsed.name || '', id: parsed.id || parsed.user_id || '' });
            setIsLoggedIn(true);
          }
        }
      } catch (err) {
        console.error('Error handling auth-changed in HeroSection', err);
      }
    };

    const handleStorage = (ev: StorageEvent) => {
      try {
        if (ev.key === 'auth-event' && ev.newValue) {
          const payload = JSON.parse(ev.newValue as string);
          if (payload.type === 'logout') {
            clearAuthData();
          }
        }

        // If user key was removed, clear local state
        if (ev.key === 'user' && ev.newValue === null) {
          clearAuthData();
        }
      } catch (err) {
        console.error('Error handling storage event in HeroSection', err);
      }
    };

    window.addEventListener('auth-changed', handleAuthChanged as EventListener);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('auth-changed', handleAuthChanged as EventListener);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const fetchIndustries = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/industries`);
      const data = await response.json();
      setIndustries(data || []);
    } catch (error) {
      console.error('Error fetching industries:', error);
      setIndustries([
        { id: 1, name: 'Technology' },
        { id: 2, name: 'Healthcare' },
        { id: 3, name: 'Finance' }
      ]);
    }
  };

  const fetchProductCategories = async (industryId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/product-categories/${industryId}`);
      const data = await response.json();
      if (data.success) {
        setProductCategories(data.data || []);
      } else {
        setProductCategories(data || []);
      }
    } catch (error) {
      console.error('Error fetching product categories:', error);
      setProductCategories([
        { id: 1, name: 'Software Solutions' },
        { id: 2, name: 'Hardware Products' }
      ]);
    }
  };

  const fetchFunctionalities = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/functionalities`);
      const data = await response.json();
      if (data.success) {
        setFunctionalities(data.data);
      } else {
        setFunctionalities(data || []);
      }
    } catch (error) {
      console.error('Error fetching functionalities:', error);
      // Use fallback data
      setFunctionalities([
        { id: 1, display_name: 'Business Strategy & Growth', option_value: 'business_strategy' },
        { id: 2, display_name: 'HR & Workforce Solutions', option_value: 'hr_solutions' },
        { id: 3, display_name: 'Digital Transformation & IT', option_value: 'digital_transformation' },
        { id: 4, display_name: 'Marketing & Brand Positioning', option_value: 'marketing_brand' },
        { id: 5, display_name: 'Financial & Risk Advisory', option_value: 'financial_advisory' }
      ]);
    }
  };

  const handleGoogleResponse = async (response) => {
    setIsGoogleLoading(true);
    try {
      if (!response.credential) {
        throw new Error('No credential received from Google');
      }

      const result = await fetch(`${import.meta.env.VITE_API_URL}/api/google-auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          credential: response.credential
        })
      });

      if (!result.ok) {
        throw new Error(`HTTP error! status: ${result.status}`);
      }

      const data = await result.json();
      
      if (data.success && data.data) {
        // Validate required user data
        if (!data.data.email || !data.data.token) {
          throw new Error('Invalid user data received');
        }

        console.log('Setting userInfo with data:', data.data);
        setUserInfo({
          email: data.data.email,
          name: data.data.name || '',
          id: data.data.id || data.data.user_id || ''
        });
        
        // Store authentication data
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data));
        
        setShowGoogleSignup(false);
        setIsLoggedIn(true);
        setAuthRetryCount(0);
        setIsGoogleLoading(false);
        
        // Continue to next step after successful authentication
        setTimeout(async () => {
          if (data.data.is_new_user) {
            // New user, start from questions
            setUserFlowState('questions');
            toast({
              title: "Welcome! Let's get started",
              description: "Please tell us about your business needs."
            });
            setShowAdditionalQuestions(true);
          } else {
            // Existing user - check profile completion first
            if (data.data.profile_completed === 1) {
              // Profile is complete, go to appropriate dashboard based on role
              if (data.data.role === 'expert') {
                navigate('/dashboard');
                toast({
                  title: "Welcome back!",
                  description: "Taking you to your expert dashboard."
                });
              } else {
                navigate('/seekerdashboard');
                toast({
                  title: "Welcome back!",
                  description: "Taking you to your dashboard."
                });
              }
            } else {
              // Profile not complete, go to appropriate profile form based on role
              if (data.data.role === 'expert') {
                navigate('/auth/ExpertProfileForm');
                toast({
                  title: "Welcome back!",
                  description: "Please complete your expert profile to continue."
                });
              } else {
                navigate('/auth/SeekerProfileForm');
                toast({
                  title: "Welcome back!",
                  description: "Please complete your profile to continue."
                });
              }
            }
          }
        }, 500);
      } else {
        throw new Error(data.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Google auth error:', error);
      
      // Show error without auto-retry to prevent loops
      toast({
        title: "Signup failed",
        description: error.message || "Please try again later or use email signup.",
        variant: "destructive"
      });
      setAuthRetryCount(0);
      
      // Clear any partial authentication state
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUserInfo({ email: "", name: "", id: "" });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Utility functions
  const withRetry = async (fn: () => Promise<any>, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  };

  const trackFlowStep = (step: string, userId?: string) => {
    const w: any = window as any;
    if (typeof w.gtag === 'function') {
      w.gtag('event', 'flow_step_completed', {
        step_name: step,
        user_id: userId,
        timestamp: Date.now()
      });
    }
  };

  const trackFlowAbandonment = (step: string, reason: string) => {
    const w: any = window as any;
    if (typeof w.gtag === 'function') {
      w.gtag('event', 'flow_abandoned', {
        step_name: step,
        abandonment_reason: reason
      });
    }
  };

  const getProgressPercentage = (step: string) => {
    const steps = ['questions', 'report', 'phone', 'experts', 'subscription', 'profile', 'dashboard'];
    return (steps.indexOf(step) + 1) / steps.length * 100;
  };

  const checkUserProgress = async () => {
    if (!isLoggedIn || !userInfo.id) return 'questions';
    
    try {
      const token = localStorage.getItem('token');
      
      // Parallel API calls for better performance
      const [consultationResult, profileResult, subscriptionResult] = await Promise.allSettled([
        withRetry(() => fetch(`${import.meta.env.VITE_API_URL}/api/consultation-requests/user/${userInfo.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })),
        withRetry(() => fetch(`${import.meta.env.VITE_API_URL}/api/profiles/seeker/${userInfo.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })),
        withRetry(() => fetch(`${import.meta.env.VITE_API_URL}/api/subscriptions/user/${userInfo.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }))
      ]);
      
      // Process consultation data
      let consultationData = null;
      if (consultationResult.status === 'fulfilled' && consultationResult.value.ok) {
        const data = await consultationResult.value.json();
        if (data.success && data.data?.length > 0) {
          consultationData = data.data[0];
        }
      }
      
      // Process profile data
      let profileComplete = false;
      if (profileResult.status === 'fulfilled' && profileResult.value.ok) {
        const data = await profileResult.value.json();
        profileComplete = data.success && data.data;
      }
      
      // Process subscription data
      let hasSubscription = false;
      if (subscriptionResult.status === 'fulfilled' && subscriptionResult.value.ok) {
        const data = await subscriptionResult.value.json();
        hasSubscription = data.success && data.data?.length > 0;
      }
      
      // Determine next step
      if (consultationData) {
        if (profileComplete) {
          trackFlowStep('dashboard', userInfo.id);
          return 'dashboard';
        }
        if (hasSubscription) {
          trackFlowStep('profile', userInfo.id);
          return 'profile';
        }
        if (!consultationData.phone || consultationData.phone === '000-000-0000') {
          trackFlowStep('phone', userInfo.id);
          return 'phone';
        }
        trackFlowStep('experts', userInfo.id);
        return 'experts';
      }
      
      trackFlowStep('questions', userInfo.id);
      return 'questions';
      
    } catch (error) {
      console.error('Error checking user progress:', error);
      trackFlowAbandonment('progress_check', error.message);
      return 'questions';
    }
  };

  const handleGetFreeSession = async () => {
    if (!isOnline) {
      toast({
        title: "No internet connection",
        description: "Please check your connection and try again.",
        variant: "destructive"
      });
      return;
    }

    if (isLoggedIn && userInfo.id) {
      setIsCheckingProgress(true);
      try {
        // Check profile completion from localStorage first
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          
          console.log('Debug - User role:', userRole, 'Profile completed:', user.profile_completed);
          
          // Handle Expert role
          if (userRole === 'expert') {
            console.log('Debug - Expert detected, profile_completed:', user.profile_completed);
            if (user.profile_completed === 1 || user.profile_completed === true) {
              console.log('Debug - Redirecting expert to dashboard');
              navigate('/dashboard');
              toast({
                title: "Welcome back!",
                description: "Taking you to your dashboard."
              });
            } else {
              console.log('Debug - Redirecting expert to profile form');
              navigate('/auth/ExpertProfileForm');
              toast({
                title: "Complete your profile",
                description: "Please complete your expert profile to continue."
              });
            }
            return;
          }
          
          // For Solution Seekers - only profile completion validation
          if (user.profile_completed === 1 || user.profile_completed === true) {
            console.log('Debug - Opening SessionRequestForm for solution seeker');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setShowSessionForm(true);
          } else if (user.profile_completed === 0 || user.profile_completed === false) {
            console.log('Debug - Redirecting to SeekerProfileForm');
            navigate('/auth/SeekerProfileForm');
          }
          return;
        }
      } catch (error) {
        console.error('Progress check failed:', error);
        toast({
          title: "Error checking progress",
          description: "Starting from the beginning.",
          variant: "destructive"
        });
        setUserFlowState('questions');
        setShowAdditionalQuestions(true);
      } finally {
        setIsCheckingProgress(false);
      }
    } else {
      setShowGoogleSignup(true);
    }
  };

  const handleGoogleSignup = () => {
    // This function is now only for fallback - the Google button handles its own click
    if (window.google) {
      window.google.accounts.id.prompt();
    } else {
      loadGoogleSignIn();
    }
  };

  // Function to fetch market report
  const fetchMarketReport = async () => {
    setMarketReport(prev => ({ ...prev, loading: true, error: null }));

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // Use demo data if no token
        setMarketReport({
          currentMarketSize: '$125.8',
          growthRate: '8.2%',
          forecastedSize: '$189.4',
          loading: false,
          error: null
        });
        return;
      }

      const authToken = `Bearer ${token.replace(/^[Bb]earer\s+/, '')}`;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/generate-report`, {
        method: 'POST',
        headers: {
          Authorization: authToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userInfo.id || 'demo_user',
          industry_id: formData.industry,
          product_category_id: formData.productCategory,
          company: 'Demo Company',
          region: 'Global',
          year: '2025'
        })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      if (!data.marketData) throw new Error('Invalid market data');

      const { currentMarketSize, growthRate, forecastedSize } = data.marketData;

      setMarketReport({
        currentMarketSize: currentMarketSize || '$125.8',
        growthRate: growthRate || '8.2%',
        forecastedSize: forecastedSize || '$189.4',
        loading: false,
        error: null
      });

    } catch (err: any) {
      console.error('Market report fetch error:', err);
      // Use demo data as fallback
      setMarketReport({
        currentMarketSize: '$125.8',
        growthRate: '8.2%',
        forecastedSize: '$189.4',
        loading: false,
        error: null
      });
    }
  };

  // Form validation function
  const validateForm = () => {
    const errors = {
      industry: !formData.industry ? 'Please select your industry' : '',
      productCategory: !formData.productCategory ? 'Please select a product category' : '',
      functionality: !formData.functionality ? 'Please select an area of focus' : ''
    };
    
    setFieldErrors(errors);
    return !Object.values(errors).some(error => error !== '');
  };
  
  const handleAdditionalQuestionsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }
    
    if (isSubmitting) return; // Prevent double submission
    setIsSubmitting(true);

    try {
      // Update seeker profile with industry and product category
      const profileResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/profiles/seeker/update-basic`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          user_id: userInfo.id,
          industry_id: formData.industry,
          product_category_id: formData.productCategory
        })
      });

      // Save consultation request with required fields
      const consultationData = {
        user_id: userInfo.id,
        expert_id: formData.expert_id || null,
        email: userInfo.email,
        name: userInfo.name,
        problems: `Industry: ${formData.industry}, Product Category: ${formData.productCategory}`,
        outcomes: `Seeking help with ${formData.functionality}`,
        functionality: formData.functionality,
        phone: '000-000-0000', // Temporary phone number
        functionality_id: functionalities.find(f => f.option_value === formData.functionality)?.id
      };
      
      console.log('Sending consultation request with data:', consultationData);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/consultation-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(consultationData)
      });

      if (response.ok) {
        // Mark consultation as completed
        const progressKey = `user_progress_${userInfo.id}`;
        const currentProgress = JSON.parse(localStorage.getItem(progressKey) || '{}');
        localStorage.setItem(progressKey, JSON.stringify({
          ...currentProgress,
          consultationCompleted: true
        }));
        
        sessionStorage.removeItem('selected_expert_id');
        setShowAdditionalQuestions(false);
        setUserFlowState('report');
        setShowReportPreview(true);
        fetchMarketReport();
        if (userInfo.id && formData.productCategory) {
          trackCategoryClick(userInfo.id, formData.productCategory);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit');
      }
    } catch (error) {
      console.error('Submission error:', error);
      trackFlowAbandonment('additional_questions', error.message);
      toast({
        title: "Submission failed",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enhanced phone validation for international numbers
  const validatePhone = (phone: string) => {
    // Remove all non-digit characters except +
    const cleanNumber = phone.replace(/[^\d+]/g, '');
    
    // International phone number patterns
    const patterns = [
      /^[6-9]\d{9}$/,           // Indian: 10 digits starting with 6-9
      /^0[6-9]\d{9}$/,          // Indian: 11 digits starting with 0
      /^91[6-9]\d{9}$/,         // Indian: 12 digits starting with 91
      /^\+91[6-9]\d{9}$/,       // Indian: +91 format
      /^\+1[2-9]\d{9}$/,        // US/Canada: +1 format
      /^\+44[1-9]\d{8,9}$/,     // UK: +44 format
      /^\+[1-9]\d{7,14}$/       // General international format
    ];
    
    return patterns.some(pattern => pattern.test(cleanNumber));
  };
  
  // Progress indicator helper
  const getProgressStep = () => {
    if (showAdditionalQuestions) return 1;
    if (showReportPreview) return 2;
    if (showPhoneCapture) return 3;
    return 0;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value;
    setFormData(prev => ({ ...prev, phone }));
    
    // Clear error when user starts typing
    if (phoneError) {
      setPhoneError("");
    }
    
    // Validate on the fly if phone has content
    if (phone && !validatePhone(phone)) {
      setPhoneError("Please enter a valid phone number (e.g., +91 98765 43210)");
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.phone) {
      setPhoneError("Phone number is required");
      return;
    }

    if (!validatePhone(formData.phone)) {
      setPhoneError("Please enter a valid phone number (e.g., +91 98765 43210)");
      return;
    }

    console.log('Phone submit started', { phone: formData.phone, userEmail: userInfo.email });

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/update-phone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: userInfo.email,
          phone: formData.phone
        })
      });

      const data = await response.json();
      console.log('Phone update response:', { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update phone number');
      }

      // Mark phone as completed
      const progressKey = `user_progress_${userInfo.id}`;
      const currentProgress = JSON.parse(localStorage.getItem(progressKey) || '{}');
      localStorage.setItem(progressKey, JSON.stringify({
        ...currentProgress,
        phoneCompleted: true
      }));
      
      toast({
        title: "Success!",
        description: "Now let's find the right expert for you..."
      });
      setShowPhoneCapture(false);
      setPhoneError("");
      
      setUserFlowState('experts');
      
      if (userInfo.id && formData.productCategory) {
        trackCategoryClick(userInfo.id, formData.productCategory);
      }

      // Navigate to experts page with functionality filter
      const selectedFunc = functionalities.find(f => f.option_value === formData.functionality);
      if (selectedFunc) {
        void trackBrowseEngagement(selectedFunc.id);
        navigate(`/experts?functionality_id=${selectedFunc.id}`);
      } else {
        navigate('/experts');
      }
    } catch (error) {
      console.error('Phone update error:', error);
      trackFlowAbandonment('phone_capture', error.message);
      setPhoneError(error.message || "Failed to update phone number. Please try again.");
      toast({
        title: "Update failed",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    }
  };

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-cyan-100 overflow-hidden pb-8">
      {/* Scrolling Images Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* <div className="absolute top-0 left-0 w-full h-32 flex items-center animate-scroll-left">
          <div className="flex gap-8 whitespace-nowrap">
            <div className="w-24 h-16 bg-white/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <div className="w-24 h-16 bg-white/20 rounded-lg flex items-center justify-center">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="w-24 h-16 bg-white/20 rounded-lg flex items-center justify-center">
              <Award className="h-8 w-8 text-blue-600" />
            </div>
            <div className="w-24 h-16 bg-white/20 rounded-lg flex items-center justify-center">
              <Star className="h-8 w-8 text-blue-600" />
            </div>
            <div className="w-24 h-16 bg-white/20 rounded-lg flex items-center justify-center">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <div className="w-24 h-16 bg-white/20 rounded-lg flex items-center justify-center">
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div> */}
        {/* <div className="absolute top-40 right-0 w-full h-32 flex items-center animate-scroll-right">
          <div className="flex gap-8 whitespace-nowrap">
            <div className="px-6 py-3 bg-white/30 rounded-full text-blue-700 font-medium">Strategy</div>
            <div className="px-6 py-3 bg-white/30 rounded-full text-blue-700 font-medium">Growth</div>
            <div className="px-6 py-3 bg-white/30 rounded-full text-blue-700 font-medium">Innovation</div>
            <div className="px-6 py-3 bg-white/30 rounded-full text-blue-700 font-medium">Excellence</div>
            <div className="px-6 py-3 bg-white/30 rounded-full text-blue-700 font-medium">Results</div>
            <div className="px-6 py-3 bg-white/30 rounded-full text-blue-700 font-medium">Success</div>
          </div>
        </div> */}
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 pt-20 pb-16">
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
          <div className="max-w-4xl space-y-8">
            {/* Trust Badge */}
            {/* <div className="inline-flex items-center gap-2 bg-white/40 rounded-full px-4 py-2">
              <Shield className="h-4 w-4 text-blue-700" />
              <span className="text-sm font-medium text-blue-800">Trusted by Fortune 500 Companies</span>
            </div> */}

            {/* Welcome Badge for logged-in users */}
            {isLoggedIn && (
              <div className="inline-flex items-center gap-2 bg-cyan-200/40 rounded-full px-2 py-0 mb-2">
                <span className="text-lg font-semibold text-blue-800">Welcome back, {userInfo.name || 'User'}!</span>
              </div>
            )}

            {/* Main Headline */}
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-7xl font-bold text-slate-800 leading-tight">
                Transform Your
                <span className="block bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Business Growth</span>
              </h1>
              <p className="text-xl text-slate-700 leading-relaxed max-w-3xl mx-auto">
                Get expert strategic guidance from 300+ verified consultants. 
                Accelerate growth, optimize operations, and achieve measurable results.
              </p>
            </div>

            {/* Key Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
                <div className="font-bold text-2xl text-slate-800">2x Growth</div>
                <div className="text-sm text-slate-600">Average ROI</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-white/50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
                <div className="font-bold text-2xl text-slate-800">30 Days</div>
                <div className="text-sm text-slate-600">To Results</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-white/50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Star className="h-8 w-8 text-blue-600" />
                </div>
                <div className="font-bold text-2xl text-slate-800">98% Success</div>
                <div className="text-sm text-slate-600">Client Rate</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-4 text-lg h-auto shadow-lg"
                onClick={() => {
                  // Track button click in Google Analytics
                  if (typeof window !== 'undefined' && (window as any).gtag) {
                    (window as any).gtag('event', 'click', {
                      event_category: 'CTA',
                      event_label: 'Get Free Strategy Session',
                      value: 1
                    });
                  }
                  handleGetFreeSession();
                }}
                disabled={isValidatingSession || isCheckingProgress || !isOnline}
              > 
                {!isOnline ? "Offline" : isValidatingSession ? "Loading..." : isCheckingProgress ? "Checking progress..." : isLoggedIn ? (userRole === 'expert' ? "Go to Dashboard" : userRole === 'solution_seeker' ? "Request Session" : "Get Started") : "Get Free Strategy Session"}
                {!isCheckingProgress && <ArrowRight className="ml-2 h-5 w-5" />}
                {isCheckingProgress && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>}
              </Button>
              
              {/* <Button 
                variant="outline" 
                size="lg"
                className="border-white/50 text-slate-700 hover:bg-white/20 px-8 py-4 text-lg h-auto"
              >
                <Play className="mr-2 h-5 w-5" />
                View Case Studies
              </Button> */}
            </div>

            {/* Social Proof */}
            {/* <div className="pt-8">
              <p className="text-sm text-slate-600 mb-4">Trusted by leading companies worldwide</p>
              <div className="flex items-center justify-center gap-8 opacity-70">
                <div className="text-lg font-bold text-slate-500">Microsoft</div>
                <div className="text-lg font-bold text-slate-500">Amazon</div>
                <div className="text-lg font-bold text-slate-500">Google</div>
                <div className="text-lg font-bold text-slate-500">Tesla</div>
              </div>
            </div> */}
          </div>
        </div>

        {/* Stats Section */}
        {/* <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="bg-white/30 rounded-2xl p-6">
            <div className="text-3xl font-bold text-blue-700 mb-2">300+</div>
            <div className="text-slate-700">Expert Consultants</div>
          </div>
          <div className="bg-white/30 rounded-2xl p-6">
            <div className="text-3xl font-bold text-blue-700 mb-2">20+</div>
            <div className="text-slate-700">Industry Sectors</div>
          </div>
          <div className="bg-white/30 rounded-2xl p-6">
            <div className="text-3xl font-bold text-blue-700 mb-2">1000+</div>
            <div className="text-slate-700">Successful Projects</div>
          </div>
          <div className="bg-white/30 rounded-2xl p-6">
            <div className="text-3xl font-bold text-blue-700 mb-2">98%</div>
            <div className="text-slate-700">Client Satisfaction</div>
          </div>
        </div> */}
      </div>

      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed top-20 left-0 right-0 bg-red-500 text-white text-center py-2 z-40">
          <p className="text-sm font-medium">You're offline. Please check your internet connection.</p>
        </div>
      )}

      {/* Google Signup Modal */}
      {showGoogleSignup && (
        <div className={`fixed inset-0 bg-black/50 z-50 flex p-4 ${
          isMobile ? 'items-end' : 'items-center justify-center'
        }`}>
          <div className={`bg-white shadow-lg w-full ${
            isMobile ? 'max-w-full rounded-t-2xl' : 'rounded-2xl max-w-md'
          }`}>
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Get Started</h2>
                <button 
                  onClick={() => {
                    setShowGoogleSignup(false);
                    setIsGoogleLoading(false);
                    // Keep checkpoint when user closes modal (they might return)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close signup form"
                  title="Close signup form"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-600 text-center mb-6">
                  Sign up with Google to get your free business strategy report
                </p>
                
                {isGoogleLoading ? (
                  <div className="w-full flex justify-center min-h-[44px] items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Signing in...</span>
                  </div>
                ) : (
                  <div 
                    id="google-signin-button"
                    className="w-full flex justify-center min-h-[44px]"
                  ></div>
                )}
                
                {authRetryCount > 0 && authRetryCount < MAX_RETRY_ATTEMPTS && (
                  <div className="text-center text-sm text-orange-600">
                    Retrying... ({authRetryCount}/{MAX_RETRY_ATTEMPTS})
                  </div>
                )}
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or</span>
                  </div>
                </div>
                
                <Button 
                  onClick={() => window.location.href = '/auth/seeker'}
                  variant="outline"
                  className="w-full border-blue-300 text-blue-700 hover:bg-blue-400 py-3"
                >
                  Continue with Email
                </Button>
                
                <p className="text-xs text-gray-500 text-center">
                  By continuing, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Additional Questions Modal */}
      {showAdditionalQuestions && (
        <div className={`fixed inset-0 bg-black/50 z-50 flex p-4 ${
          isMobile ? 'items-end' : 'items-center justify-center'
        }`}>
          <div className={`bg-white shadow-lg w-full max-h-[90vh] overflow-y-auto ${
            isMobile ? 'max-w-full rounded-t-2xl' : 'rounded-2xl max-w-2xl'
          }`}>
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Tell Us About Your Business</h2>
                  <p className="text-gray-600">Help us create your personalized strategy report</p>
                </div>
                <button 
                  onClick={() => {
                    setShowAdditionalQuestions(false);
                    setUserFlowState('initial');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close form"
                  title="Close form"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              {/* Progress Indicator */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${getProgressPercentage(currentStep)}%` }}
                />
              </div>
              <div className="text-center mb-4">
                <span className="text-sm text-gray-500">
                  Step {Math.max(1, Math.ceil(getProgressPercentage(currentStep) / 100 * 7))} of 7
                </span>
              </div>
              
              <form onSubmit={handleAdditionalQuestionsSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="industry" className="text-base font-medium">Industry Sector *</Label>
                  <Select onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, industry: value }));
                    fetchProductCategories(value);
                  }}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((industry) => (
                        <SelectItem key={industry.id} value={industry.id.toString()}>
                          {industry.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="productCategory" className="text-base font-medium">Product Product/ Service category *</Label>
                  <Select onValueChange={(value) => setFormData(prev => ({ ...prev, productCategory: value }))}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select your product category" />
                    </SelectTrigger>
                    <SelectContent>
                      {productCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="functionality" className="text-base font-medium">Area of Focus *</Label>
                  <Select onValueChange={(value) => setFormData(prev => ({ ...prev, functionality: value }))}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select the area where you need help" />
                    </SelectTrigger>
                    <SelectContent>
                      {functionalities.map((func) => (
                        <SelectItem key={func.id} value={func.option_value}>
                          {func.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 py-3"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating Report...
                    </>
                  ) : (
                    <>
                      Generate My Report
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Report Preview Modal */}
      {showReportPreview && (
        <div className={`fixed inset-0 bg-black/50 z-50 flex p-4 ${
          isMobile ? 'items-end' : 'items-center justify-center'
        }`}>
          <div className={`bg-white shadow-lg w-full max-h-[90vh] overflow-y-auto ${
            isMobile ? 'max-w-full rounded-t-2xl' : 'rounded-2xl max-w-4xl'
          }`}>
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Your Strategy Report Preview</h2>
                  <p className="text-gray-600">Here's a preview of your personalized business strategy report</p>
                </div>
                <button 
                  onClick={() => {
                    setShowReportPreview(false);
                    setUserFlowState('initial');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close report preview"
                  title="Close report preview"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Revenue Section */}
                <div className="rounded-3xl bg-gradient-to-br from-white via-blue-50 to-cyan-50 p-6 flex flex-col items-center justify-center shadow-lg border border-blue-100">
                  <div className="relative z-10 w-full flex flex-col items-center justify-center">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-2xl md:text-3xl font-extrabold tracking-tight text-blue-500 drop-shadow-lg flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="32"
                          height="32"
                          viewBox="0 0 48 48"
                          className="w-8 h-8 md:w-10 md:h-10 mr-2 text-green-500"
                          fill="none"
                        >
                          <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="4" fill="#e0f7fa"/>
                          <path d="M16 24l6 6 10-10" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                        </svg>
                        Market Analysis
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 w-full">
                      <div className="bg-white p-4 rounded-xl shadow-md border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-xs font-semibold text-slate-600">Current Market Size</span>
                        </div>
                        <div className="text-lg font-bold text-blue-600">
                          {marketReport.loading ? (
                            <div className="animate-pulse h-6 w-24 bg-blue-100 rounded"></div>
                          ) : marketReport.error ? (
                            <span className="text-red-500 text-sm">Error loading</span>
                          ) : (
                            <span>{marketReport.currentMarketSize}</span>
                          )}
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-xl shadow-md border border-emerald-100">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          <span className="text-xs font-semibold text-slate-600">Growth Rate (CAGR)</span>
                        </div>
                        <div className="text-lg font-bold text-emerald-600">
                          {marketReport.loading ? (
                            <div className="animate-pulse h-6 w-20 bg-emerald-100 rounded"></div>
                          ) : marketReport.error ? (
                            <span className="text-red-500 text-sm">Error loading</span>
                          ) : (
                            marketReport.growthRate
                          )}
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-xl shadow-md border border-violet-100">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-xs font-semibold text-slate-600">2030 Forecast</span>
                        </div>
                        <div className="text-lg font-bold text-violet-600">
                          {marketReport.loading ? (
                            <div className="animate-pulse h-6 w-24 bg-violet-100 rounded"></div>
                          ) : marketReport.error ? (
                            <span className="text-red-500 text-sm">Error loading</span>
                          ) : (
                            marketReport.forecastedSize
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs text-blue-700 italic text-center max-w-3xl mx-auto mb-4">
                      <p>
                        <span className="font-semibold">Disclaimer:</span> These values are generated with AI assistance and are intended for general guidance only.
                      </p>
                      {marketReport.metadata?.warnings && marketReport.metadata.warnings.length > 0 && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                          <p className="font-semibold">Data Quality Warnings:</p>
                          <ul className="text-left mt-1 space-y-1">
                            {marketReport.metadata.warnings.map((warning, index) => (
                              <li key={index} className="text-xs">• {warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Executive Summary</h3>
                  <p className="text-gray-700 mb-4">
                    Based on your industry and focus area, we've identified key opportunities for growth and optimization.
                  </p> 
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-600 mb-2">25%</div>
                      <div className="text-sm text-gray-600">Potential Revenue Increase</div>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-600 mb-2">40%</div>
                      <div className="text-sm text-gray-600">Cost Reduction Opportunity</div>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-2xl font-bold text-purple-600 mb-2">60 Days</div>
                      <div className="text-sm text-gray-600">Implementation Timeline</div>
                    </div>
                  </div>
                </div> */}
                
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Key Recommendations</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <span className="text-gray-700">Optimize your current business processes for better efficiency</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <span className="text-gray-700">Implement data-driven decision making frameworks</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <span className="text-gray-700">Develop strategic partnerships in your industry</span>
                    </li>
                  </ul>
                </div>
                
                <div className="text-center">
                  <p className="text-gray-600 mb-4">You’re viewing just a glimpse. Get the full consultation report packed with expert insights and actionable strategies tailored for you.</p>
                  <Button 
                    onClick={() => {
                      setShowReportPreview(false);
                      setUserFlowState('phone');
                      saveFlowCheckpoint('phone_capture');
                      setShowPhoneCapture(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 px-8 py-3"
                  >
                    Connect with Expert
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phone Capture Modal */}
      {showPhoneCapture && (
        <div className={`fixed inset-0 bg-black/50 z-50 flex p-4 ${
          isMobile ? 'items-end' : 'items-center justify-center'
        }`}>
          <div className={`bg-white shadow-lg w-full ${
            isMobile ? 'max-w-full rounded-t-2xl' : 'rounded-2xl max-w-md'
          }`}>
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">📲 Send my report to phone</h2>
                <button 
                  onClick={() => {
                    setShowPhoneCapture(false);
                    setUserFlowState('initial');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close phone capture form"
                  title="Close phone capture form"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    placeholder="+91 98765 43210"
                    className={`text-center text-lg py-3 ${phoneError ? 'border-red-500' : ''}`}
                    required
                  />
                  {phoneError && (
                    <p className="text-red-500 text-sm mt-1 text-center">{phoneError}</p>
                  )}
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Enter your phone number (international format supported)
                  </p>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 py-3"
                  disabled={!!phoneError || !formData.phone}
                  onClick={() => console.log('Phone submit button clicked')}
                >
                  📲 Send my report to phone
                </Button>
                
                <p className="text-xs text-gray-500 text-center">
                  No spam. Only reports and priority updates.
                </p>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Session Request Form (lazy loaded) */}
      {showSessionForm && (
        <Suspense fallback={<div aria-hidden className="fixed inset-0 flex items-center justify-center z-50">Loading…</div>}>
          <SessionRequestForm 
            isOpen={showSessionForm}
            onClose={() => setShowSessionForm(false)}
          />
        </Suspense>
      )}


    </section>
  );
};

export default HeroSection;