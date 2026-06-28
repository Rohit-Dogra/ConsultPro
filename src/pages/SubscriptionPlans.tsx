import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, X, Crown, Star, Zap, AlertTriangle, Clock, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import TrialExpiredPopup from '@/components/TrialExpiredPopup';
import { useFlowCheckpoint } from '@/hooks/useFlowCheckpoint';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

// Simple auth hook
const useAuth = () => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  });
  
  return { user };
};

interface Plan {
  id: string;
  plan_name: string;
  plan_key: string;
  price: number;
  original_price: number;
  discount_percentage: number;
  is_most_popular: boolean;
  validity_months: number | null;
  validity_display: string;
  features: Feature[];
}

interface Feature {
  feature_key: string;
  feature_name: string;
  feature_type: string;
  feature_value: string;
  is_enabled: boolean;
}

const SubscriptionPlans: React.FC = () => {
  const navigate = useNavigate();
  const { saveCheckpoint } = useFlowCheckpoint();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [activatingTrial, setActivatingTrial] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('inactive');
  const [showExpiredPopup, setShowExpiredPopup] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const API_URL = import.meta.env.VITE_API_URL;

  // Fetch comparison data
  const fetchComparisonData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/subscriptions/compare`);
      const data = await response.json();
      if (data.success) {
        console.log('Comparison data:', data.data);
        setComparisonData(data.data);
      }
    } catch (error) {
      console.error('Error fetching comparison data:', error);
    }
  };

  // Check subscription status
  const checkSubscriptionStatus = async () => {
    if (!user?.token) {
      setSubscriptionStatus('inactive');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/subscriptions/current`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus(data.data?.subscription_status || 'inactive');
      }
    } catch (error) {
      console.error('Failed to check subscription status:', error);
      setSubscriptionStatus('inactive');
    }
  };

  // Fetch subscription plans
  const fetchPlans = async () => {
    try {
      const response = await fetch(`${API_URL}/api/subscriptions/plans`);
      const data = await response.json();
      if (data.success) {
        setPlans(data.data);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      // Fallback data when server is unavailable
      setPlans([
        {
          id: '0',
          plan_name: 'Trial Plan',
          plan_key: 'trial',
          price: 0,
          original_price: 10000,
          discount_percentage: 100,
          is_most_popular: false,
          validity_months: null,
          validity_display: '1 Week',
          features: [
            { feature_key: 'lms', feature_name: 'LMS', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'business_analysis_report_limited', feature_name: 'Business Analysis Report * (Limited Information)', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'expert_profile_search', feature_name: 'Expert Profile Search', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'expert_detailed_profile_view', feature_name: 'Expert Detailed Profile View', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'intro_call_with_expert', feature_name: 'Intro Call With Expert (mins)', feature_type: 'text', feature_value: '3 (15 min each)', is_enabled: true },
            { feature_key: 'merger_acquisition_access', feature_name: 'Access to Merger and Acquisition / Technology Partner (Open Deals)', feature_type: 'boolean', feature_value: 'true', is_enabled: true }
          ]
        },
        {
          id: '1',
          plan_name: 'Silver',
          plan_key: 'silver',
          price: 10000,
          original_price: 50000,
          discount_percentage: 80,
          is_most_popular: false,
          validity_months: 3,
          validity_display: '3 Months',
          features: [
            { feature_key: 'core_services', feature_name: 'Core Services', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'case_study', feature_name: 'Case Study', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'lms', feature_name: 'LMS', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'business_analysis_report_limited', feature_name: 'Business Analysis Report * (Limited Information)', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'expert_profile_search', feature_name: 'Expert Profile Search', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'expert_detailed_profile_view', feature_name: 'Expert Detailed Profile View', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'intro_call_with_expert', feature_name: 'Intro Call With Expert (mins)', feature_type: 'text', feature_value: '3 (15 min each)', is_enabled: true },
            { feature_key: 'expert_feedback', feature_name: 'Expert Feedback', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'merger_acquisition_access', feature_name: 'Access to Merger and Acquisition / Technology Partner (Open Deals)', feature_type: 'boolean', feature_value: 'true', is_enabled: true }
          ]
        },
        {
          id: '2',
          plan_name: 'Gold Plan',
          plan_key: 'gold',
          price: 25000,
          original_price: 100000,
          discount_percentage: 75,
          is_most_popular: true,
          validity_months: 6,
          validity_display: '6 Months',
          features: [
            { feature_key: 'core_services', feature_name: 'Core Services', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'case_study', feature_name: 'Case Study', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'lms', feature_name: 'LMS', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'business_analysis_report_limited', feature_name: 'Business Analysis Report * (Limited Information)', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'expert_profile_search', feature_name: 'Expert Profile Search', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'expert_detailed_profile_view', feature_name: 'Expert Detailed Profile View', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'intro_call_with_expert', feature_name: 'Intro Call With Expert (mins)', feature_type: 'text', feature_value: '90', is_enabled: true },
            { feature_key: 'expert_feedback', feature_name: 'Expert Feedback', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'mom', feature_name: 'MOM', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'discount_agent_tools', feature_name: 'Discount on Agent Tools', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'merger_acquisition_access', feature_name: 'Access to Merger and Acquisition / Technology Partner (Open Deals)', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'discount_management_fee', feature_name: 'Discount on Management Fee', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'business_referral_program', feature_name: 'Business Referral Program', feature_type: 'boolean', feature_value: 'true', is_enabled: true }
          ]
        },
        {
          id: '3',
          plan_name: 'Platinum Plan',
          plan_key: 'platinum',
          price: 100000,
          original_price: 200000,
          discount_percentage: 50,
          is_most_popular: false,
          validity_months: 12,
          validity_display: '1 Year',
          features: [
            { feature_key: 'core_services', feature_name: 'Core Services', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'case_study', feature_name: 'Case Study', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'lms', feature_name: 'LMS', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'business_analysis_report_limited', feature_name: 'Business Analysis Report * (Limited Information)', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'expert_profile_search', feature_name: 'Expert Profile Search', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'expert_detailed_profile_view', feature_name: 'Expert Detailed Profile View', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'intro_call_with_expert', feature_name: 'Intro Call With Expert (mins)', feature_type: 'text', feature_value: '150', is_enabled: true },
            { feature_key: 'expert_feedback', feature_name: 'Expert Feedback', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'detailed_meeting_problem_solution', feature_name: 'Detailed Meeting ; Problem Statement and Potential Solution', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'mom', feature_name: 'MOM', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'discount_agent_tools', feature_name: 'Discount on Agent Tools', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'merger_acquisition_access', feature_name: 'Access to Merger and Acquisition / Technology Partner (Open Deals)', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'discount_management_fee', feature_name: 'Discount on Management Fee', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'business_referral_program', feature_name: 'Business Referral Program', feature_type: 'boolean', feature_value: 'true', is_enabled: true }
          ]
        },
        {
          id: '4',
          plan_name: 'Business Plan',
          plan_key: 'business',
          price: 0,
          original_price: 0,
          discount_percentage: 0,
          is_most_popular: false,
          validity_months: null,
          validity_display: 'Custom Quote',
          features: [
            { feature_key: 'core_services', feature_name: 'Core Services', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'case_study', feature_name: 'Case Study', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'lms', feature_name: 'LMS', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'business_analysis_report_limited', feature_name: 'Business Analysis Report * (Limited Information)', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'business_analysis_report', feature_name: 'Business Analysis Report', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'expert_profile_search', feature_name: 'Expert Profile Search', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'expert_detailed_profile_view', feature_name: 'Expert Detailed Profile View', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'expert_feedback', feature_name: 'Expert Feedback', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'detailed_meeting_problem_solution', feature_name: 'Detailed Meeting ; Problem Statement and Potential Solution', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'onsite_virtual_meetings', feature_name: 'On site / Virtual meetings', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'long_term_problem_solving', feature_name: 'Long Term Problem Solving Consultation', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'mom', feature_name: 'MOM', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'program_management_software', feature_name: 'Program Management Software (1 User)', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'crm_software', feature_name: 'CRM Software (1 User) Free for 1st Year', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'day_to_day_monitoring', feature_name: 'Day to Day monitoring', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'project_report', feature_name: 'Project Report', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'discount_agent_tools', feature_name: 'Discount on Agent Tools', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'merger_acquisition_access', feature_name: 'Access to Merger and Acquisition / Technology Partner (Open Deals)', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'discount_management_fee', feature_name: 'Discount on Management Fee', feature_type: 'boolean', feature_value: 'true', is_enabled: true },
            { feature_key: 'business_referral_program', feature_name: 'Business Referral Program', feature_type: 'boolean', feature_value: 'true', is_enabled: true }
          ]
        }
      ]);
    }
  };

  // Fetch current subscription
  const fetchCurrentSubscription = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return;

      const user = JSON.parse(userData);
      const response = await fetch(`${API_URL}/api/subscriptions/current`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCurrentPlan(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching current subscription:', error);
    }
  };

  // Activate trial subscription
  const activateTrial = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        toast({
          title: "Authentication Required",
          description: "Please log in to activate your free trial.",
          variant: "destructive"
        });
        return;
      }

      const user = JSON.parse(userData);
      setActivatingTrial(true);
      
      const response = await fetch(`${API_URL}/api/subscriptions/activate-trial`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      console.log('Trial activation response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 400 && errorData.message === 'Trial already used') {
          toast({
            title: "Trial Already Used",
            description: "You have already used your free trial. Please choose a paid plan.",
            variant: "destructive"
          });
          return;
        }
        
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Trial Activated!",
          description: "Your 1-week Silver plan trial has been activated successfully! Redirecting to complete your profile...",
          variant: "default"
        });
        await fetchCurrentSubscription();
        
        // Check profile completion and redirect accordingly
        setTimeout(async () => {
          try {
            // Check if user has completed seeker profile
            const profileResponse = await fetch(`${API_URL}/api/profiles/seeker/${user.id}`, {
              headers: { 'Authorization': `Bearer ${user.token}` }
            });
            
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              // Profile exists and is complete
              navigate('/seekerdashboard', { replace: true });
            } else if (profileResponse.status === 404) {
              // Profile doesn't exist, redirect to profile form
              navigate('/auth/SeekerProfileForm', { 
                replace: true,
                state: { 
                  fromSubscription: true,
                  selectedPlan: 'Silver Trial' 
                }
              });
            } else {
              // Other error, default to profile form
              navigate('/auth/SeekerProfileForm', { 
                replace: true,
                state: { 
                  fromSubscription: true,
                  selectedPlan: 'Silver Trial' 
                }
              });
            }
          } catch (error) {
            console.error('Error checking profile status:', error);
            // On error, default to profile form
            navigate('/auth/SeekerProfileForm', { 
              replace: true,
              state: { 
                fromSubscription: true,
                selectedPlan: 'Silver Trial' 
              }
            });
          }
        }, 2000);
      } else {
        throw new Error(data.message || 'Failed to activate trial');
      }
    } catch (error: any) {
      console.error('Trial activation error:', error);
      toast({
        title: "Activation Failed",
        description: error.message || "Failed to activate trial. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setActivatingTrial(false);
    }
  };

  // Handle plan selection
  const handlePlanSelection = (planId: string) => {
    const selectedPlan = plans.find(p => p.id === planId);
    if (selectedPlan?.plan_key === 'business') {
      window.open('/contact', '_blank');
    } else {
      updateSubscription(planId);
    }
  };

  // Update subscription - redirect to payment gateway
  const updateSubscription = async (planId: string) => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        toast({
          title: "Authentication Required",
          description: "Please log in to purchase a subscription plan.",
          variant: "destructive"
        });
        const selectedPlanName = plans.find(p => p.id === planId)?.plan_name;
        saveCheckpoint('subscription_plans', {
          selectedPlan: selectedPlanName,
          planId: planId,
          requiresAuth: true
        });
        navigate('/auth/seeker');
        return;
      }

      const user = JSON.parse(userData);
      const selectedPlan = plans.find(p => p.id === planId);
      
      if (!selectedPlan) {
        toast({
          title: "Plan Not Found",
          description: "Selected plan could not be found.",
          variant: "destructive"
        });
        return;
      }

      // For free plans, update directly without payment
      if (selectedPlan.price === 0) {
        setUpgrading(planId);
        
        const response = await fetch(`${API_URL}/api/subscriptions/update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify({ planId })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            toast({
              title: "Subscription Updated",
              description: `Successfully upgraded to ${selectedPlan.plan_name} plan!`,
              variant: "default"
            });
            await fetchCurrentSubscription();
            navigate('/seeker-dashboard', { replace: true });
          }
        }
        setUpgrading(null);
        return;
      }

      // For paid plans, redirect to payment gateway
      setUpgrading(planId);
      
      // Generate a unique subscription order ID
      const subscriptionOrderId = `SUB_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      
      // Navigate to payments page with subscription data
      navigate('/payments', {
        state: {
          bookingId: subscriptionOrderId,
          amount: selectedPlan.price.toString(),
          userId: user.id || user.user_id,
          expertName: selectedPlan.plan_name,
          sessionType: 'Subscription',
          sessionDate: new Date().toLocaleDateString(),
          sessionTime: 'Immediate',
          paymentDetails: {
            description: `${selectedPlan.plan_name} Subscription`,
            duration: selectedPlan.validity_display,
            ratePerHour: selectedPlan.price,
            currency: 'INR'
          },
          subscriptionData: {
            planId: selectedPlan.id,
            planKey: selectedPlan.plan_key,
            planName: selectedPlan.plan_name,
            validityMonths: selectedPlan.validity_months
          }
        }
      });
      
    } catch (error: any) {
      console.error('Subscription update error:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to process subscription. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setUpgrading(null);
    }
  };

  useEffect(() => {
    if (isInitialized) return; // Prevent multiple initializations
    
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchPlans(), fetchComparisonData(), fetchCurrentSubscription(), checkSubscriptionStatus()]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };
    
    loadData();
  }, [user?.token, isInitialized]); // Only run once per token change

  // Show popup for expired users
  useEffect(() => {
    if (subscriptionStatus === 'expired' && !loading) {
      const hasSeenPopup = sessionStorage.getItem('expiredPopupSeen');
      if (!hasSeenPopup) {
        setShowExpiredPopup(true);
      }
    }
  }, [subscriptionStatus, loading]);

  const handleClosePopup = () => {
    setShowExpiredPopup(false);
    sessionStorage.setItem('expiredPopupSeen', 'true');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      {/* Trial Expired Popup */}
      <TrialExpiredPopup 
        isVisible={showExpiredPopup} 
        onClose={handleClosePopup} 
      />
      
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 py-8 sm:py-12 lg:py-16 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-cyan-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] lg:w-[800px] lg:h-[800px] bg-gradient-to-r from-blue-100/30 to-cyan-100/30 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Trial Active Banner */}
        {subscriptionStatus === 'trial' && currentPlan?.subscription_end_date && (
          <div className="mb-8 max-w-5xl mx-auto">
            <Alert className="border-2 border-green-400 bg-gradient-to-r from-green-100 via-emerald-50 to-green-100 shadow-xl">
              <Zap className="h-6 w-6 text-green-600 animate-pulse" />
              <AlertDescription className="text-center">
                <div className="font-bold text-green-900 text-xl mb-3">
                 Trial Active - Silver Plan
                </div>
                <p className="text-green-800 mb-4 text-lg">
                  You're currently on a free trial! Enjoy full access to our platform.
                </p>
                <div className="flex items-center justify-center gap-3 text-green-700 bg-green-200 rounded-lg p-3 mx-auto max-w-md">
                  <Clock className="h-5 w-5" />
                  <span className="font-semibold">
                    {Math.max(0, Math.ceil((new Date(currentPlan.subscription_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days remaining
                  </span>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Trial Expired Banner */}
        {subscriptionStatus === 'expired' && (
          <div className="mb-8 max-w-5xl mx-auto">
            {/* Main Banner */}
            <Alert className="border-2 border-orange-400 bg-gradient-to-r from-orange-100 via-red-50 to-orange-100 shadow-xl">
              <AlertTriangle className="h-6 w-6 text-orange-600 animate-pulse" />
              <AlertDescription className="text-center">
                <div className="font-bold text-orange-900 text-xl mb-3">
                 Trial Plan Completed Successfully!
                </div>
                <p className="text-orange-800 mb-4 text-lg">
                  You've experienced the power of our platform! Continue your journey with unlimited access to expert consultations and premium features.
                </p>
                <div className="flex items-center justify-center gap-3 text-orange-700 bg-orange-200 rounded-lg p-3 mx-auto max-w-md">
                  <Clock className="h-5 w-5" />
                  <span className="font-semibold">Choose your plan below to restore access</span>
                </div>
              </AlertDescription>
            </Alert>
            
            {/* Feature Restriction Notice */}
            <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
              <div className="flex items-start">
                <X className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
                <div>
                  <h4 className="font-semibold text-red-800 mb-2">Currently Restricted Features:</h4>
                  <ul className="text-red-700 text-sm space-y-1">
                    <li>• Expert consultation calls</li>
                    <li>• Detailed expert profile viewing</li>
                    <li>• Business analysis reports</li>
                    <li>• Premium LMS content</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-sky-600 bg-clip-text text-transparent mb-4 sm:mb-6 lg:mb-8">
            {subscriptionStatus === 'expired' ? 'Select Your New Plan' : 'Choose Your Perfect Plan'}
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed px-4">
            {subscriptionStatus === 'expired' ? (
              <>
                Continue your journey with our expert network and premium tools.
                <br className="hidden sm:block" />
                <span className="text-orange-600 font-semibold">Select a plan to restore access to all features.</span>
              </>
            ) : (
              <>
                Transform your business with our comprehensive suite of tools and expert guidance.
                <br className="hidden sm:block" />
                <span className="text-blue-600 font-semibold">Choose the plan that fits your growth ambitions.</span>
              </>
            )}
          </p>
        </div>
         
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.filter(plan => plan.plan_key !== 'trial').map((plan, index) => {
            const isCurrentPlan = currentPlan?.current_plan_id === plan.id;
            const discountedPrice = plan.price;
            
            return (
              <div
                key={plan.id}
                className="relative transition-all duration-300 hover:shadow-xl h-full"
              >
                <div className={`h-full flex flex-col justify-between bg-white rounded-lg p-6 ${
                  subscriptionStatus === 'expired' && plan.is_most_popular
                    ? 'border-2 border-orange-500 shadow-lg ring-2 ring-orange-200' 
                    : plan.is_most_popular 
                    ? 'border-2 border-blue-600 shadow-md' 
                    : 'border border-gray-200 shadow-sm'
                } hover:shadow-xl transition-all duration-300`}>
                {/* Most Popular Badge */}
                {plan.is_most_popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                    <div className={`${subscriptionStatus === 'expired' ? 'bg-orange-600' : 'bg-blue-600'} text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse`}>
                      {subscriptionStatus === 'expired' ? 'RECOMMENDED' : 'MOST POPULAR'}
                    </div>
                  </div>
                )}
                
                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-2 -right-2 z-20">
                    <div className="bg-green-500 text-white p-2 rounded-full shadow-lg">
                      <Check className="w-4 h-4" />
                    </div>
                  </div>
                )}
                  
                  {/* Header Section */}
                  <div className="text-center mb-6">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                      plan.plan_key === 'silver' ? 'bg-blue-500' :
                      plan.plan_key === 'gold' ? 'bg-cyan-500' :
                      plan.plan_key === 'platinum' ? 'bg-sky-500' :
                      'bg-indigo-500'
                    }`}>
                      {plan.plan_key === 'business' ? <Crown className="w-8 h-8 text-white" /> :
                       plan.plan_key === 'platinum' ? <Zap className="w-8 h-8 text-white" /> :
                       plan.plan_key === 'gold' ? <Crown className="w-8 h-8 text-white" /> :
                       <Star className="w-8 h-8 text-white" />}
                    </div>
                    
                    <h3 className="text-xl font-semibold mb-4 text-gray-900">
                      {plan.plan_name}
                    </h3>
                  </div>
                       
                  {/* Pricing Section */}
                  <div className="text-center mb-6">
                    {plan.plan_key === 'business' ? (
                      <div>
                        <div className="text-2xl font-bold text-gray-900 mb-2">
                          Custom Quote
                        </div>
                        <div className="text-sm font-medium text-blue-600">
                          {plan.validity_display}
                        </div>
                      </div>
                    ) : (
                      <div>
                        {plan.discount_percentage > 0 && (
                          <div className="mb-2 flex items-center justify-center gap-2">
                            <span className="text-sm text-gray-500 line-through">
                              ₹{plan.original_price?.toLocaleString()}
                            </span>
                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                              {plan.discount_percentage}% OFF
                            </span>
                          </div>
                        )}
                        <div className="text-2xl font-bold text-gray-900 mb-2">
                          ₹{discountedPrice?.toLocaleString()}
                        </div>
                        <div className="text-sm font-medium text-blue-600">
                          {plan.validity_display}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Restricted Features Notice */}
                  {subscriptionStatus === 'expired' && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-700 text-sm">
                        <X className="h-4 w-4" />
                        <span className="font-medium">Currently Restricted:</span>
                      </div>
                      <ul className="text-xs text-red-600 mt-2 space-y-1">
                        <li>• Expert consultations</li>
                        <li>• Detailed profile viewing</li>
                        <li>• Premium features</li>
                      </ul>
                    </div>
                  )}

                  {/* Features Section */}
                  <div className="flex-grow mb-6">
                    <div className="space-y-2">
                      {plan.features?.slice(0, 6).map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span className="text-gray-700">{feature.feature_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-auto">
                    {plan.plan_key === 'silver' && !currentPlan?.trial_used && subscriptionStatus !== 'trial' && !isCurrentPlan ? (
                      <div className="space-y-3">
                        <Button
                          onClick={activateTrial}
                          disabled={activatingTrial}
                          className="w-full py-3 font-semibold bg-green-600 hover:bg-green-700 text-white transition-all duration-300"
                        >
                          {activatingTrial ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Starting Trial...
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <Zap className="w-4 h-4" />
                              Start Free Trial(1-week)
                            </div>
                          )}
                        </Button>
                        <Button
                          onClick={() => handlePlanSelection(plan.id)}
                          disabled={upgrading === plan.id}
                          className="w-full py-3 font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300"
                        >
                          {upgrading === plan.id ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Processing...
                            </div>
                          ) : (
                            'Choose Plan'
                          )}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handlePlanSelection(plan.id)}
                        disabled={upgrading === plan.id || (isCurrentPlan && subscriptionStatus !== 'expired')}
                        className={`w-full py-3 font-semibold transition-all duration-300 ${
                          subscriptionStatus === 'expired' && plan.is_most_popular
                            ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg transform hover:scale-105'
                            : isCurrentPlan && subscriptionStatus !== 'expired'
                            ? 'bg-green-500 text-white cursor-not-allowed'
                            : plan.is_most_popular
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300'
                        }`}
                      >
                      {upgrading === plan.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </div>
                      ) : isCurrentPlan && subscriptionStatus !== 'expired' ? (
                        <div className="flex items-center justify-center gap-2">
                          <Check className="w-4 h-4" />
                          Current Plan
                        </div>
                      ) : subscriptionStatus === 'expired' ? (
                        <div className="flex items-center justify-center gap-2">
                          <Zap className="w-4 h-4 animate-pulse" />
                          <span className="font-bold">Restore Full Access</span>
                        </div>
                      ) : (
                        'Choose Plan'
                      )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
           
        {/* Comparison Table Section */}
        <div className="mt-16 sm:mt-20 lg:mt-24 relative z-10">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-4 sm:mb-6">
              Compare All Plans
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4 mb-6">
              See exactly what's included in each plan and find the perfect fit for your business needs.
            </p>
            
            {/* Toggle Button */}
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="group bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-3 mx-auto"
            >
              <span>{showComparison ? 'Hide' : 'View'} Detailed Comparison</span>
              <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${showComparison ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <div className={`overflow-hidden transition-all duration-700 ease-in-out ${showComparison ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto border border-blue-200 transform transition-all duration-500">
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="min-w-[800px] px-4 sm:px-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-blue-200">
                      <th className="text-left py-4 sm:py-6 px-2 sm:px-4 text-sm sm:text-base lg:text-lg font-bold text-gray-800 min-w-[120px]">Features</th>
                      {comparisonData?.plans?.filter((plan: any) => plan.plan_key !== 'trial').map((plan: any) => (
                        <th key={plan.id} className="text-center py-4 sm:py-6 px-2 sm:px-4 min-w-[160px] sm:min-w-[200px]">
                          <div className={`rounded-xl sm:rounded-2xl p-2 sm:p-4 ${
                            plan.is_most_popular 
                              ? 'bg-gradient-to-br from-blue-600 to-cyan-600 text-white' 
                              : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200'
                          }`}>
                            <div className={`text-lg sm:text-xl lg:text-2xl font-bold mb-1 sm:mb-2 ${
                              plan.is_most_popular ? 'text-white' : 'text-gray-800'
                            }`}>
                              {plan.plan_name}
                            </div>
                            {plan.plan_key === 'business' ? (
                              <div className={`text-sm sm:text-base lg:text-lg font-semibold ${
                                plan.is_most_popular ? 'text-blue-100' : 'text-blue-600'
                              }`}>
                                Custom Quote
                              </div>
                            ) : (
                              <div>
                                <div className={`text-lg sm:text-xl lg:text-2xl font-bold ${
                                  plan.is_most_popular ? 'text-white' : 'text-gray-800'
                                }`}>
                                  ₹{plan.price?.toLocaleString()}
                                </div>
                                <div className={`text-xs sm:text-sm ${
                                  plan.is_most_popular ? 'text-blue-100' : 'text-gray-600'
                                }`}>
                                  {plan.validity_display}
                                </div>
                              </div>
                            )}
                            {plan.is_most_popular && (
                              <div className="mt-1 sm:mt-2">
                                <span className="bg-yellow-400 text-yellow-900 text-xs px-2 sm:px-3 py-1 rounded-full font-bold">
                                  POPULAR
                                </span>
                              </div>
                            )}
                            {/* {plan.plan_key === 'silver' && (
                              <div className="mt-2 text-xs text-orange-600 font-medium">
                                Free trial plan is valid for only 1 week (per user, one time).
                              </div>
                            )} */}
                          </div>
                        </th>
                      )) || (
                        <th className="text-center py-4 sm:py-6 px-2 sm:px-4">
                          <div className="text-gray-500">Loading...</div>
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData?.features?.map((feature: any) => (
                      <tr key={feature.id} className="border-b border-blue-100 hover:bg-blue-50/50 transition-colors">
                        <td className="py-3 sm:py-4 px-2 sm:px-4 font-semibold text-gray-700 text-xs sm:text-sm lg:text-base">
                          {feature.feature_name}
                        </td>
                        {comparisonData?.plans?.filter((plan: any) => plan.plan_key !== 'trial').map((plan: any) => {
                          const planFeature = plan.features[feature.feature_key];
                          const isEnabled = planFeature?.enabled;
                          const value = planFeature?.value;
                          
                          return (
                            <td key={plan.id} className="py-3 sm:py-4 px-2 sm:px-4 text-center">
                              {!isEnabled || value === 'false' ? (
                                <X className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 mx-auto" />
                              ) : value === 'true' ? (
                                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                                </div>
                              ) : (
                                <div className="text-xs sm:text-sm font-semibold text-blue-600 bg-blue-100 px-2 sm:px-3 py-1 rounded-full inline-block">
                                  {value}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-500">
                          Loading comparison data...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Action Buttons Row */}
            {/* <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-8 pt-8 border-t-2 border-blue-200">
              <div></div> 
              {plans.map((plan) => {
                const isCurrentPlan = currentPlan?.current_plan_id === plan.id;
                return (
                  <div key={plan.id} className="text-center">
                    <Button
                      className={`w-full py-3 text-base font-bold rounded-xl transition-all duration-300 ${
                        plan.is_most_popular 
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 shadow-lg' 
                          : isCurrentPlan
                          ? 'bg-green-100 text-green-700 cursor-not-allowed border-2 border-green-300'
                          : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 shadow-lg'
                      }`}
                      disabled={upgrading === plan.id || isCurrentPlan}
                      onClick={() => {
                        if (plan.plan_key === 'diamond') {
                          window.open('/contact', '_blank');
                        } else {
                          updateSubscription(plan.id);
                        }
                      }}
                    >
                      {upgrading === plan.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          <span>Processing...</span>
                        </div>
                      ) : isCurrentPlan ? (
                        <div className="flex items-center justify-center gap-2">
                          <Check className="w-4 h-4" />
                          <span>Current</span>
                        </div>
                      ) : plan.plan_key === 'diamond' ? (
                        'Contact Sales'
                      ) : (
                        `Choose ${plan.plan_name}`
                      )}
                    </Button>
                  </div>
                );
              })}
            </div> */}
          </div>
        </div>
        
        {/* Expired User CTA Section */}
        {/* {subscriptionStatus === 'expired' && (
          <div className="text-center mt-12 sm:mt-16 lg:mt-20 relative z-10">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-12 max-w-4xl mx-auto border border-orange-300">
              <div className="mb-6">
                <div className="text-4xl sm:text-5xl lg:text-6xl mb-4">🚀</div>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">Ready to Continue Your Journey?</h3>
                <p className="text-lg sm:text-xl text-orange-100 mb-6">
                  Don't let your progress stop here! Upgrade now and unlock unlimited access to our expert network.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="bg-white/20 rounded-lg p-4">
                  <div className="text-2xl font-bold">3+</div>
                  <div className="text-sm text-orange-100">Expert Calls</div>
                </div>
                <div className="bg-white/20 rounded-lg p-4">
                  <div className="text-2xl font-bold">24/7</div>
                  <div className="text-sm text-orange-100">Support Access</div>
                </div>
                <div className="bg-white/20 rounded-lg p-4">
                  <div className="text-2xl font-bold">100+</div>
                  <div className="text-sm text-orange-100">Premium Features</div>
                </div>
              </div>
              <div className="mt-6">
                <p className="text-orange-100 font-semibold">
                  ⬆️ Scroll up to select your perfect plan ⬆️
                </p>
              </div>
            </div>
          </div>
        )} */}

        {/* Why Choose Section */}
        <div className="text-center mt-12 sm:mt-16 lg:mt-20 relative z-10">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-12 max-w-6xl mx-auto border border-blue-200">
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-6 sm:mb-8">
              {subscriptionStatus === 'expired' ? 'Why Upgrade Now?' : 'Why Choose Our Plans?'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 text-center">
              <div className="group hover:scale-105 transition-transform duration-300">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                  <Check className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h4 className="font-bold text-gray-800 mb-2 sm:mb-3 text-lg sm:text-xl">Expert Guidance</h4>
                <p className="text-gray-600 text-sm sm:text-base">Access to industry experts and personalized consultation sessions</p>
              </div>
              <div className="group hover:scale-105 transition-transform duration-300">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-cyan-500 to-sky-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                  <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h4 className="font-bold text-gray-800 mb-2 sm:mb-3 text-lg sm:text-xl">Comprehensive Tools</h4>
                <p className="text-gray-600 text-sm sm:text-base">Complete business analysis, LMS access, and management software</p>
              </div>
              <div className="group hover:scale-105 transition-transform duration-300 sm:col-span-2 lg:col-span-1">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-sky-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                  <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h4 className="font-bold text-gray-800 mb-2 sm:mb-3 text-lg sm:text-xl">Scalable Solutions</h4>
                <p className="text-gray-600 text-sm sm:text-base">Plans that grow with your business needs and requirements</p>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
};

export default SubscriptionPlans;