import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

interface CallUsage {
  allowed: boolean;
  currentCount: number;
  limit: number;
  remaining: number;
  unlimited?: boolean;
}

export const useCallTracking = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const checkCallLimit = useCallback(async (featureKey: string): Promise<CallUsage> => {
    if (!user?.token) throw new Error('Not authenticated');
    
    setLoading(true);
    try {
      const response = await fetch(`/api/call-tracking/usage/${featureKey}`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      
      const data = await response.json();
      return data.data;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const startCall = useCallback(async (featureKey: string) => {
    if (!user?.token) throw new Error('Not authenticated');
    
    const response = await fetch('/api/call-tracking/start-consultation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      },
      body: JSON.stringify({ featureKey })
    });
    
    return response.json();
  }, [user]);

  return { checkCallLimit, startCall, loading };
};