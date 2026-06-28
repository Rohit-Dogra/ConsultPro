import { useState, useEffect } from 'react';
import { useCSRF } from './useCSRF';

interface Plan {
  id: string;
  plan_name: string;
  plan_key: string;
  price_monthly: number;
  price_yearly: number;
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

interface FeatureValidation {
  allowed: boolean;
  reason?: string;
  currentUsage?: number;
  usageLimit?: number;
  remainingUsage?: number;
  unlimited?: boolean;
  suggestedPlans?: Plan[];
  requiresAuth?: boolean;
}

export const useSubscriptionModal = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const { csrfToken, fetchCSRFToken } = useCSRF();

  const API_URL = import.meta.env.VITE_API_URL;

  // Fetch subscription plans
  const fetchPlans = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/api/subscriptions/plans`);
      const data = await response.json();
      
      if (data.success) {
        setPlans(data.data);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch current user subscription
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

      const data = await response.json();
      
      if (data.success) {
        setCurrentPlan(data.data);
      }
    } catch (error) {
      console.error('Error fetching current subscription:', error);
    }
  };

  // Check feature access
  const checkFeatureAccess = async (featureKey: string, amount = 1): Promise<FeatureValidation> => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        return { 
          allowed: false, 
          reason: 'Please log in to access this feature',
          requiresAuth: true 
        };
      }

      const user = JSON.parse(userData);
      if (!user.token) {
        return { 
          allowed: false, 
          reason: 'Invalid session. Please log in again',
          requiresAuth: true 
        };
      }
      
      const token = csrfToken || await fetchCSRFToken();
      
      const response = await fetch(`${API_URL}/api/subscriptions/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ featureKey, amount })
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        if (response.status === 401) {
          return { 
            allowed: false, 
            reason: 'Session expired. Please log in again',
            requiresAuth: true 
          };
        }
        if (response.status === 403) {
          setModalOpen(true); // Show upgrade modal
        }
        return { allowed: false, ...data.data };
      }

      return { allowed: true, ...data.data };
    } catch (error) {
      console.error('Error checking feature access:', error);
      return { allowed: false, reason: 'Validation failed' };
    }
  };

  // Update subscription
  const updateSubscription = async (planId: string, customEndDate?: string) => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('Please log in to upgrade your subscription');
      }

      const user = JSON.parse(userData);
      if (!user.token) {
        throw new Error('Invalid session. Please log in again');
      }
      
      const requestBody: any = { planId };
      if (customEndDate) {
        requestBody.customEndDate = customEndDate;
      }
      
      console.log('Sending subscription update:', requestBody);
      
      const response = await fetch(`${API_URL}/api/subscriptions/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please log in again');
        }
        throw new Error(data.message || `HTTP ${response.status}`);
      }
      
      if (data.success) {
        await fetchCurrentSubscription(); // Refresh current subscription
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error; // Re-throw to let the component handle it
    }
  };

  // Initialize
  useEffect(() => {
    fetchPlans();
    fetchCurrentSubscription();
  }, []);

  return {
    plans,
    modalOpen,
    setModalOpen,
    loading,
    currentPlan,
    checkFeatureAccess,
    updateSubscription,
    fetchCurrentSubscription
  };
};