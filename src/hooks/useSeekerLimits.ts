import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

interface UsageLimit {
  allowed: boolean;
  currentUsage: number;
  limit: number;
  reason?: string;
}

export const useSeekerLimits = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const checkLimit = useCallback(async (featureKey: string): Promise<UsageLimit> => {
    setLoading(true);
    try {
      const response = await fetch('/api/subscriptions/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({ featureKey })
      });
      
      const data = await response.json();
      return data.data;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const withLimitCheck = useCallback(async (featureKey: string, action: () => void) => {
    const result = await checkLimit(featureKey);
    if (result.allowed) {
      action();
    } else {
      throw new Error(result.reason || 'Limit exceeded');
    }
  }, [checkLimit]);

  return { checkLimit, withLimitCheck, loading };
};