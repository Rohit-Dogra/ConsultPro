import React, { useEffect, useState } from 'react';
import { useCallTracking } from '@/hooks/useCallTracking';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface CallLimitDisplayProps {
  featureKey: string;
  className?: string;
}

export const CallLimitDisplay: React.FC<CallLimitDisplayProps> = ({ 
  featureKey, 
  className = '' 
}) => {
  const { checkCallLimit, loading } = useCallTracking();
  const [usage, setUsage] = useState<any>(null);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const result = await checkCallLimit(featureKey);
        setUsage(result);
      } catch (error) {
        console.error('Failed to fetch usage:', error);
      }
    };

    fetchUsage();
  }, [featureKey, checkCallLimit]);

  if (loading || !usage) return null;

  const { currentCount, limit, unlimited } = usage;
  const percentage = unlimited ? 100 : (currentCount / limit) * 100;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Call Usage</span>
        <Badge variant={percentage > 80 ? 'destructive' : 'secondary'}>
          {unlimited ? 'Unlimited' : `${currentCount}/${limit}`}
        </Badge>
      </div>
      {!unlimited && (
        <Progress value={percentage} className="h-2" />
      )}
    </div>
  );
};