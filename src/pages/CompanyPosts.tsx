import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';

interface Deal {
  id: string;
  title: string;
  deal_type: string;
  company_name: string;
  year_establishment: string;
  headquarters: string;
  ownership_type: string;
  current_scale: string;
  certifications: string;
  sector: string;
  primary_products: string;
  key_markets: string;
  major_customers: string;
  competitive_advantages: string;
  type_requirement: string;
  size_scale: string;
  geographic_preference: string;
  objective_deal: string;
  specific_assets: string;
  current_turnover: string;
  ebitda_range: string;
  asset_size: string;
  deal_size_range: string;
  funding_support: string;
  profile_ideal_partner: string;
  experience_required: string;
  geography_market_access: string;
  technology_capabilities: string;
  other_expectations: string;
  confidentiality_level: string;
  status_process: string;
  how_to_engage: string;
  created_at: string;
  updated_at: string;
}

const CompanyPosts = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      const apiUrl = `${import.meta.env.VITE_API_URL}/api/deals`;
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setDeals(data || []);
    } catch (error) {
      setDeals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (dealId: string) => {
    const userData = localStorage.getItem('user');
    
    if (!userData) {
      toast.error('Please login to view deal details');
      navigate('/auth/seeker');
      return;
    }

    try {
      const user = JSON.parse(userData);
      
      // Fetch current subscription status from API
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/subscriptions/current`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        toast.error('Unable to verify subscription status');
        return;
      }
      
      const subscriptionData = await response.json();
      const subscriptionStatus = subscriptionData.data?.subscription_status;
      
      if (subscriptionStatus !== 'trial' && subscriptionStatus !== 'active') {
        toast.error('Subscription required to view full deal details');
        sessionStorage.setItem('selected_deal_id', dealId);
        navigate('/subscription-plans');
        return;
      }

      navigate(`/company-posts/${dealId}`);
    } catch (error) {
      console.error('Subscription check error:', error);
      toast.error('Please login again');
      navigate('/auth/seeker');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">Loading deals...</div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30"></div>
        <div className="relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-block p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                  </svg>
                </div>
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">Business Deals</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">Discover investment opportunities, partnerships, and business deals</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {deals.map((deal) => (
                <Card key={deal.id} className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 bg-white/90 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 0 100-2H9z" />
                        </svg>
                      </div>
                      <span className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full font-medium">{deal.deal_type || 'Deal'}</span>
                    </div>
                    
                    <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">{deal.title}</h2>
                    <p className="text-gray-600 mb-4 font-medium">{deal.company_name}</p>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-4">
                      <div><span className="font-medium">Sector:</span> {deal.sector || 'N/A'}</div>
                      <div><span className="font-medium">Est:</span> {deal.year_establishment || 'N/A'}</div>
                      <div className="col-span-2"><span className="font-medium">Location:</span> {deal.headquarters || 'Not specified'}</div>
                    </div>
                    
                    {deal.status_process && (
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-sm font-medium text-gray-700">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          deal.status_process === 'Actively Looking' ? 'bg-green-100 text-green-800' :
                          deal.status_process === 'Open to Offers' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {deal.status_process}
                        </span>
                      </div>
                    )}
                  </CardHeader>
                  
                  <CardContent>
                    <Button 
                      onClick={() => handleViewDetails(deal.id)}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      View Full Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {deals.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No deals available at the moment.</p>
             
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CompanyPosts;