import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

interface ValidationResult {
  allowed: boolean;
  reason?: string;
  currentUsage?: number;
  usageLimit?: number;
  suggestedPlans?: any[];
}

interface SubscriptionValidation {
  validateFeature: (featureKey: string, amount?: number) => Promise<ValidationResult>;
  isLoading: boolean;
  error: string | null;
}

export const useSubscriptionValidation = (): SubscriptionValidation => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const validateFeature = useCallback(async (featureKey: string, amount: number = 1): Promise<ValidationResult> => {
    if (!user) {
      return {
        allowed: false,
        reason: 'User not authenticated'
      };
    }

    // Input validation
    if (!featureKey || typeof featureKey !== 'string') {
      return {
        allowed: false,
        reason: 'Invalid feature key'
      };
    }

    if (amount < 1 || amount > 100) {
      return {
        allowed: false,
        reason: 'Invalid amount (must be 1-100)'
      };
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/subscriptions/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          featureKey: featureKey.trim(),
          amount
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Validation failed');
      }

      const data = await response.json();
      return data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Validation failed';
      setError(errorMessage);
      return {
        allowed: false,
        reason: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return {
    validateFeature,
    isLoading,
    error
  };
};