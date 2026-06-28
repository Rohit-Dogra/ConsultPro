import { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Star, Crown, Diamond, Award } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import SEOHead from '@/components/SEO/SEOHead';
import { pageSEOConfig } from '@/config/seo';

interface PricingPlan {
  id: string;
  name: string;
  tier: 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  standardPrice: number;
  specialPrice: number;
  discount: number;
  validity: string;
  features: string[];
  isPopular: boolean;
  description: string;
}

export default function PricingPage() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPricingPlans();
  }, []);

  const fetchPricingPlans = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/pricing-plans`);
      if (!response.ok) throw new Error('Failed to fetch pricing plans');
      const data = await response.json();
      setPlans(data.success ? data.data : mockPlans);
    } catch (err) {
      console.error('Error fetching pricing plans:', err);
      setPlans(mockPlans);
    } finally {
      setLoading(false);
    }
  };

  const mockPlans: PricingPlan[] = [
    {
      id: '1',
      name: 'Silver',
      tier: 'Silver',
      standardPrice: 19999,
      specialPrice: 5999,
      discount: 65,
      validity: '3 months',
      features: ['Core Services', 'Case Studies', 'LMS Access', 'Basic Business Analysis Report', '3 × 15 min Consultations (Fixed)', 'Free Trial for 1st Time Users'],
      isPopular: false,
      description: 'Trial users and businesses who want to test the platform'
    },
    {
      id: '2',
      name: 'Gold',
      tier: 'Gold',
      standardPrice: 49999,
      specialPrice: 13999,
      discount: 70,
      validity: '6 months',
      features: ['Everything in Silver', 'Comprehensive Business Analysis', '90 min Expert Consultation (Flexible)', 'Agent Tool Discount', 'M&A/Tech Partner Deals'],
      isPopular: true,
      description: 'Small to medium businesses who want deeper insights'
    },
    {
      id: '3',
      name: 'Platinum',
      tier: 'Platinum',
      standardPrice: 99999,
      specialPrice: 23999,
      discount: 75,
      validity: '1 year',
      features: ['Everything in Gold', '150 min Expert Consultation (Flexible)', 'Strategy Sessions', 'On-site/Virtual Consultation', 'Meeting Documentation', 'Detailed Project Reports', 'Management Fee Discount', 'Business Referral Program'],
      isPopular: false,
      description: 'Growing businesses that need continuous expert support'
    },
    {
      id: '4',
      name: 'Diamond',
      tier: 'Diamond',
      standardPrice: 0,
      specialPrice: 0,
      discount: 0,
      validity: 'Custom',
      features: ['Everything in Platinum', 'Customized Expert Consultation Time', 'Unlimited Advanced Reports', 'Long-term Problem Solving', 'CRM Access', 'Daily Monitoring', 'Tailored Solutions', 'Fully Personalized Plan'],
      isPopular: false,
      description: 'Large enterprises with dedicated, ongoing expert support'
    }
  ];

  const getPlanIcon = (tier: string) => {
    switch (tier) {
      case 'Silver': return <Award className="h-6 w-6" />;
      case 'Gold': return <Star className="h-6 w-6" />;
      case 'Platinum': return <Crown className="h-6 w-6" />;
      case 'Diamond': return <Diamond className="h-6 w-6" />;
      default: return <Star className="h-6 w-6" />;
    }
  };

  const getPlanColor = (tier: string) => {
    switch (tier) {
      case 'Silver': return 'from-gray-400 to-gray-600';
      case 'Gold': return 'from-yellow-400 to-yellow-600';
      case 'Platinum': return 'from-purple-400 to-purple-600';
      case 'Diamond': return 'from-blue-400 to-blue-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto py-20 px-4 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4">Loading pricing plans...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title={pageSEOConfig.pricing.title}
        description={pageSEOConfig.pricing.description}
        keywords={pageSEOConfig.pricing.keywords}
        url="https://expertisestation.com/pricing"
      />
      <Navbar />
      
      <main className="container mx-auto py-20 px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Select the perfect plan for your business needs. All plans include our core features with varying levels of support and resources.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                plan.isPopular ? 'ring-2 ring-primary scale-105' : ''
              }`}
            >
              {plan.isPopular && (
                <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-center py-2 text-sm font-medium">
                  Most Popular
                </div>
              )}
              
              <CardHeader className={`text-center ${plan.isPopular ? 'pt-12' : 'pt-6'}`}>
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${getPlanColor(plan.tier)} flex items-center justify-center text-white`}>
                  {getPlanIcon(plan.tier)}
                </div>
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>

              <CardContent className="text-center">
                {/* Pricing */}
                <div className="mb-6">
                  {plan.tier === 'Diamond' ? (
                    <div className="text-center">
                      <span className="text-3xl font-bold text-blue-600">Custom Pricing</span>
                      <div className="text-sm text-muted-foreground mt-2">
                        Based on requirements
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-3xl font-bold">₹{plan.specialPrice.toLocaleString()}</span>
                        <Badge variant="destructive" className="text-xs">
                          {plan.discount}% OFF
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <span className="line-through">₹{plan.standardPrice.toLocaleString()}</span>
                        <span className="ml-2">for {plan.validity}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-3 text-left">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter>
                <Button 
                  className={`w-full ${plan.isPopular ? 'bg-primary hover:bg-primary/90' : ''}`}
                  variant={plan.isPopular ? 'default' : 'outline'}
                >
                  {plan.tier === 'Diamond' ? 'Contact Sales' : 'Get Started'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-12">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white rounded-lg shadow-lg">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-4 font-semibold">Features</th>
                  {plans.map((plan) => (
                    <th key={plan.id} className="text-center p-4 font-semibold">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  'Expert Consultations',
                  'Business Analysis Report',
                  'LMS Access',
                  'Strategy Sessions',
                  'On-site/Virtual Consultation',
                  'Project Reports',
                  'CRM Access',
                  'Daily Monitoring'
                ].map((feature, index) => (
                  <tr key={index} className="border-t">
                    <td className="p-4 font-medium">{feature}</td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="text-center p-4">
                        {getFeatureValue(feature, plan)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function getFeatureValue(feature: string, plan: PricingPlan) {
  const featureMap: Record<string, Record<string, string | JSX.Element>> = {
    'Expert Consultations': {
      'Silver': '3 × 15 min (Fixed)',
      'Gold': '90 min (Flexible)',
      'Platinum': '150 min (Flexible)',
      'Diamond': 'Unlimited Custom'
    },
    'Business Analysis Report': {
      'Silver': 'Basic',
      'Gold': 'Comprehensive',
      'Platinum': 'Detailed + Strategy',
      'Diamond': 'Unlimited Advanced'
    },
    'LMS Access': {
      'Silver': <Check className="h-4 w-4 text-green-500 mx-auto" />,
      'Gold': <Check className="h-4 w-4 text-green-500 mx-auto" />,
      'Platinum': <Check className="h-4 w-4 text-green-500 mx-auto" />,
      'Diamond': <Check className="h-4 w-4 text-green-500 mx-auto" />
    },
    'Strategy Sessions': {
      'Silver': <X className="h-4 w-4 text-red-500 mx-auto" />,
      'Gold': <X className="h-4 w-4 text-red-500 mx-auto" />,
      'Platinum': <Check className="h-4 w-4 text-green-500 mx-auto" />,
      'Diamond': <Check className="h-4 w-4 text-green-500 mx-auto" />
    },
    'On-site/Virtual Consultation': {
      'Silver': <X className="h-4 w-4 text-red-500 mx-auto" />,
      'Gold': <X className="h-4 w-4 text-red-500 mx-auto" />,
      'Platinum': <X className="h-4 w-4 text-red-500 mx-auto" />,
      'Diamond': <Check className="h-4 w-4 text-green-500 mx-auto" />
    },
    'Project Reports': {
      'Silver': <X className="h-4 w-4 text-red-500 mx-auto" />,
      'Gold': <X className="h-4 w-4 text-red-500 mx-auto" />,
      'Platinum': 'Detailed',
      'Diamond': 'Custom'
    },
    'CRM Access': {
      'Silver': <X className="h-4 w-4 text-red-500 mx-auto" />,
      'Gold': <X className="h-4 w-4 text-red-500 mx-auto" />,
      'Platinum': <X className="h-4 w-4 text-red-500 mx-auto" />,
      'Diamond': <Check className="h-4 w-4 text-green-500 mx-auto" />
    },
    'Daily Monitoring': {
      'Silver': <X className="h-4 w-4 text-red-500 mx-auto" />,
      'Gold': <X className="h-4 w-4 text-red-500 mx-auto" />,
      'Platinum': <X className="h-4 w-4 text-red-500 mx-auto" />,
      'Diamond': <Check className="h-4 w-4 text-green-500 mx-auto" />
    }
  };

  return featureMap[feature]?.[plan.tier] || <X className="h-4 w-4 text-red-500 mx-auto" />;
}