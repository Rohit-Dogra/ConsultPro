import React, { useEffect, useState } from 'react';
import { useSeekerAccess } from '@/hooks/useSeekerAccess';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Upgrade } from 'lucide-react';

interface AccessGuardProps {
  featureKey: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AccessGuard: React.FC<AccessGuardProps> = ({ 
  featureKey, 
  children, 
  fallback 
}) => {
  const { checkAccess, loading } = useSeekerAccess();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [accessInfo, setAccessInfo] = useState<any>(null);

  useEffect(() => {
    const validateAccess = async () => {
      const result = await checkAccess(featureKey);
      setHasAccess(result.allowed);
      setAccessInfo(result);
    };

    validateAccess();
  }, [featureKey, checkAccess]);

  if (loading || hasAccess === null) {
    return <div className="animate-pulse bg-gray-200 h-20 rounded"></div>;
  }

  if (!hasAccess) {
    return fallback || (
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Lock className="h-5 w-5" />
            Access Restricted
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-orange-700 mb-3">
            {accessInfo?.reason || 'This feature requires a subscription upgrade.'}
          </p>
          {accessInfo?.currentUsage !== undefined && (
            <p className="text-xs text-orange-600 mb-3">
              Usage: {accessInfo.currentUsage}/{accessInfo.limit}
            </p>
          )}
          <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
            <Upgrade className="h-4 w-4 mr-2" />
            Upgrade Plan
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
};