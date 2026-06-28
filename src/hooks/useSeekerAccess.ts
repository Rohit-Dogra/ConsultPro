import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

interface AccessResult {
  allowed: boolean;
  reason?: string;
  currentUsage?: number;
  limit?: number;
  upgradeRequired?: boolean;
}

export const useSeekerAccess = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const checkAccess = useCallback(async (featureKey: string): Promise<AccessResult> => {
    if (!user?.token) {
      return { allowed: false, reason: 'Authentication required' };
    }

    setLoading(true);
    try {
      const response = await fetch('/api/subscriptions/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ featureKey })
      });

      const data = await response.json();
      return data.data;
    } catch (error) {
      return { allowed: false, reason: 'Validation failed' };
    } finally {
      setLoading(false);
    }
  }, [user]);

  const validateAndProceed = useCallback(async (featureKey: string, onSuccess: () => void, onBlocked?: (result: AccessResult) => void) => {
    const result = await checkAccess(featureKey);
    
    if (result.allowed) {
      onSuccess();
    } else if (onBlocked) {
      onBlocked(result);
    }
  }, [checkAccess]);

  return { checkAccess, validateAndProceed, loading };
};