import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X, Crown, Star, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

interface SubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: Plan[];
  currentPlan?: any;
  onUpgrade: (planId: string) => Promise<boolean>;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  open,
  onOpenChange,
  plans,
  currentPlan,
  onUpgrade
}) => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleUpgrade = async (planId: string) => {
    setLoading(true);
    try {
      const success = await onUpgrade(planId);
      if (success) {
        toast({
          title: "Subscription Updated",
          description: "Your subscription has been updated successfully!",
          variant: "default"
        });
        onOpenChange(false);
      } else {
        toast({
          title: "Update Failed",
          description: "Failed to update subscription. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Subscription upgrade error:', error);
      toast({
        title: "Error",
        description: error.message || "An error occurred while updating your subscription.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getPlanIcon = (planKey: string) => {
    switch (planKey) {
      case 'silver': return <Star className="w-5 h-5" />;
      case 'gold': return <Crown className="w-5 h-5" />;
      case 'platinum': return <Zap className="w-5 h-5" />;
      case 'diamond': return <Crown className="w-5 h-5 text-purple-500" />;
      default: return <Star className="w-5 h-5" />;
    }
  };

  const getPlanColor = (planKey: string) => {
    switch (planKey) {
      case 'silver': return 'from-gray-400 to-gray-600';
      case 'gold': return 'from-yellow-400 to-yellow-600';
      case 'platinum': return 'from-blue-400 to-blue-600';
      case 'diamond': return 'from-purple-400 to-purple-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const renderFeatureValue = (feature: Feature) => {
    if (!feature.is_enabled) {
      return <X className="w-4 h-4 text-red-500" />;
    }

    if (feature.feature_type === 'boolean') {
      return <Check className="w-4 h-4 text-green-500" />;
    }

    return (
      <span className="text-sm font-medium text-green-600">
        {feature.feature_value}
      </span>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Choose Your Plan
          </DialogTitle>
          <p className="text-center text-gray-600">
            Unlock powerful features to grow your business
          </p>
        </DialogHeader>



        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan?.current_plan_id === plan.id;
            
            return (
              <Card
                key={plan.id}
                className={`relative transition-all duration-200 hover:shadow-lg ${
                  plan.is_most_popular ? 'ring-2 ring-blue-500' : ''
                } ${selectedPlan === plan.id ? 'ring-2 ring-purple-500' : ''}`}
              >
                {plan.is_most_popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white">Most Popular</Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className={`mx-auto w-12 h-12 rounded-full bg-gradient-to-r ${getPlanColor(plan.plan_key)} flex items-center justify-center text-white mb-2`}>
                    {getPlanIcon(plan.plan_key)}
                  </div>
                  <CardTitle className="text-xl">{plan.plan_name}</CardTitle>
                  
                  {plan.plan_key === 'diamond' ? (
                    <div className="text-center">
                      <p className="text-2xl font-bold">Custom</p>
                      <p className="text-sm text-gray-600">Contact us for pricing</p>
                      <p className="text-sm font-semibold text-blue-600 mt-2">{plan.validity_display}</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-3xl font-bold">₹{plan.price_yearly?.toLocaleString()}</p>
                      <p className="text-sm font-semibold text-blue-600 mt-2">{plan.validity_display}</p>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="space-y-3">
                  {plan.features?.map((feature) => (
                    <div key={feature.feature_key} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{feature.feature_name}</span>
                      {renderFeatureValue(feature)}
                    </div>
                  ))}

                  <Button
                    className="w-full mt-4"
                    variant={plan.is_most_popular ? "default" : "outline"}
                    disabled={loading || isCurrentPlan}
                    onClick={() => {
                      if (plan.plan_key === 'diamond') {
                        // Handle custom plan contact
                        window.open('/contact', '_blank');
                      } else {
                        handleUpgrade(plan.id);
                      }
                    }}
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </div>
                    ) : isCurrentPlan ? (
                      'Current Plan'
                    ) : plan.plan_key === 'diamond' ? (
                      'Contact Us'
                    ) : (
                      'Upgrade Now'
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center text-sm text-gray-500 mt-6">
          All plans include 24/7 support and can be canceled anytime
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionModal;