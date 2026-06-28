import React, { useEffect, useState } from 'react';
import { useSeekerLimits } from '@/hooks/useSeekerLimits';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock } from 'lucide-react';

interface LimitGuardProps {
  featureKey: string;
  children: React.ReactNode;
  onUpgrade?: () => void;
}

export const LimitGuard: React.FC<LimitGuardProps> = ({ 
  featureKey, 
  children, 
  onUpgrade 
}) => {
  const { checkLimit } = useSeekerLimits();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [usage, setUsage] = useState<any>(null);

  useEffect(() => {
    checkLimit(featureKey).then(result => {
      setHasAccess(result.allowed);
      setUsage(result);
    });
  }, [featureKey, checkLimit]);

  if (hasAccess === null) return <div className="animate-pulse h-20 bg-gray-200 rounded" />;

  if (!hasAccess) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <Lock className="h-4 w-4" />
        <AlertDescription>
          {usage?.reason} ({usage?.currentUsage}/{usage?.limit} used)
          <Button size="sm" className="ml-2" onClick={onUpgrade}>
            Upgrade Plan
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
};