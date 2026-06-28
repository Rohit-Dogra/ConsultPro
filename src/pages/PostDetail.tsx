import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, Building, MapPin, Calendar, DollarSign } from 'lucide-react';
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
}

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDeal(id);
    }
  }, [id]);

  const fetchDeal = async (dealId: string) => {
    try {
      console.log('Fetching deal:', dealId);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/deals/${dealId}`);
      const data = await response.json();
      console.log('Received deal:', data);
      setDeal(data);
    } catch (error) {
      console.error('Error fetching deal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length <= 10) {
      setFormData({...formData, phone: value});
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deal) return;
    
    if (formData.phone.length !== 10) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/deal-inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deal_id: deal.id,
          ...formData
        }),
      });

      if (response.ok) {
        toast.success('Inquiry sent successfully!');
        setFormData({ name: '', email: '', phone: '', description: '' });
      } else {
        toast.error('Failed to send inquiry');
      }
    } catch (error) {
      toast.error('Failed to send inquiry');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">Loading deal...</div>
        </div>
        <Footer />
      </>
    );
  }

  if (!deal) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Deal not found</h2>
            <Link to="/company-posts">
              <Button>Back to Deals</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-40"></div>
        <div className="relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <Link to="/company-posts">
                <Button variant="ghost" className="mb-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Deals
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Side - Deal Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Header Card */}
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full">
                        <Building className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">{deal.title}</h1>
                        <p className="text-lg text-gray-600">{deal.company_name}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {deal.headquarters || 'N/A'}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        Est. {deal.year_establishment || 'N/A'}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <DollarSign className="w-4 h-4" />
                        {deal.current_turnover || 'N/A'}
                      </div>
                      <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {deal.deal_type || 'Deal'}
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Company Overview */}
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader>
                    <h2 className="text-xl font-bold text-gray-800">Company Overview</h2>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-2">Sector</h3>
                        <p className="text-gray-600">{deal.sector || 'Not specified'}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-2">Ownership Type</h3>
                        <p className="text-gray-600">{deal.ownership_type || 'Not specified'}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-2">Current Scale</h3>
                        <p className="text-gray-600">{deal.current_scale || 'Not specified'}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-2">Certifications</h3>
                        <p className="text-gray-600">{deal.certifications || 'Not specified'}</p>
                      </div>
                    </div>
                    {deal.primary_products && (
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-2">Primary Products</h3>
                        <p className="text-gray-600">{deal.primary_products}</p>
                      </div>
                    )}
                    {deal.key_markets && (
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-2">Key Markets</h3>
                        <p className="text-gray-600">{deal.key_markets}</p>
                      </div>
                    )}
                    {deal.major_customers && (
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-2">Major Customers</h3>
                        <p className="text-gray-600">{deal.major_customers}</p>
                      </div>
                    )}
                    {deal.competitive_advantages && (
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-2">Competitive Advantages</h3>
                        <p className="text-gray-600">{deal.competitive_advantages}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Financial Information */}
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader>
                    <h2 className="text-xl font-bold text-gray-800">Financial Information</h2>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-2">Current Turnover</h3>
                        <p className="text-gray-600">{deal.current_turnover || 'Not disclosed'}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-2">EBITDA Range</h3>
                        <p className="text-gray-600">{deal.ebitda_range || 'Not disclosed'}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-2">Deal Size Range</h3>
                        <p className="text-gray-600">{deal.deal_size_range || 'Not specified'}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-2">Asset Size</h3>
                        <p className="text-gray-600">{deal.asset_size || 'Not specified'}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-2">Funding Support</h3>
                        <p className="text-gray-600">{deal.funding_support || 'Not specified'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Deal Requirements */}
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader>
                    <h2 className="text-xl font-bold text-gray-800">Deal Requirements</h2>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-2">Type Requirement</h3>
                        <p className="text-gray-600">{deal.type_requirement || 'Not specified'}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-2">Size Scale</h3>
                        <p className="text-gray-600">{deal.size_scale || 'Not specified'}</p>
                      </div>
                    </div>
                    {deal.objective_deal && (
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-2">Objective</h3>
                        <p className="text-gray-600">{deal.objective_deal}</p>
                      </div>
                    )}
                    {deal.specific_assets && (
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-2">Specific Assets</h3>
                        <p className="text-gray-600">{deal.specific_assets}</p>
                      </div>
                    )}
                    {deal.geographic_preference && (
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-2">Geographic Preference</h3>
                        <p className="text-gray-600">{deal.geographic_preference}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Partner Requirements */}
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader>
                    <h2 className="text-xl font-bold text-gray-800">Partner Requirements</h2>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {deal.profile_ideal_partner && (
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-2">Ideal Partner Profile</h3>
                        <p className="text-gray-600">{deal.profile_ideal_partner}</p>
                      </div>
                    )}
                    {deal.experience_required && (
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-2">Experience Required</h3>
                        <p className="text-gray-600">{deal.experience_required}</p>
                      </div>
                    )}
                    {deal.geography_market_access && (
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-2">Geography Market Access</h3>
                        <p className="text-gray-600">{deal.geography_market_access}</p>
                      </div>
                    )}
                    {deal.technology_capabilities && (
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-2">Technology Capabilities</h3>
                        <p className="text-gray-600">{deal.technology_capabilities}</p>
                      </div>
                    )}
                    {deal.other_expectations && (
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-2">Other Expectations</h3>
                        <p className="text-gray-600">{deal.other_expectations}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Process Information */}
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader>
                    <h2 className="text-xl font-bold text-gray-800">Process Information</h2>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-2">Confidentiality Level</h3>
                        <p className="text-gray-600">{deal.confidentiality_level || 'Not specified'}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-2">Status Process</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          deal.status_process === 'Actively Looking' ? 'bg-green-100 text-green-800' :
                          deal.status_process === 'Open to Offers' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {deal.status_process || 'Not specified'}
                        </span>
                      </div>
                    </div>
                    {deal.how_to_engage && (
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-2">How to Engage</h3>
                        <p className="text-gray-600">{deal.how_to_engage}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Side - Contact Form */}
              <div className="lg:col-span-1">
                {/* Desktop Fixed Form */}
                <div className="hidden lg:block">
                  <div className="sticky top-24">
                    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
                      <CardHeader>
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Contact Us</h3>
                        <p className="text-gray-600">Interested in this deal? Get in touch!</p>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <Input
                            placeholder="Your Name"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            required
                          />
                          <Input
                            type="email"
                            placeholder="Your Email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            required
                          />
                          <Input
                            type="tel"
                            placeholder="Phone Number (10 digits)"
                            value={formData.phone}
                            onChange={handlePhoneChange}
                            maxLength={10}
                            required
                          />
                          <Textarea
                            placeholder="Your Message"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            required
                            rows={4}
                          />
                          <Button 
                            type="submit" 
                            disabled={submitting}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            {submitting ? 'Sending...' : 'Send Message'}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Mobile Form */}
                <div className="lg:hidden">
                  <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
                    <CardHeader>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Contact Us</h3>
                      <p className="text-gray-600">Interested in this deal? Get in touch!</p>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                          placeholder="Your Name"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          required
                        />
                        <Input
                          type="email"
                          placeholder="Your Email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          required
                        />
                        <Input
                          type="tel"
                          placeholder="Phone Number (10 digits)"
                          value={formData.phone}
                          onChange={handlePhoneChange}
                          maxLength={10}
                          required
                        />
                        <Textarea
                          placeholder="Your Message"
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          required
                          rows={4}
                        />
                        <Button 
                          type="submit" 
                          disabled={submitting}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          {submitting ? 'Sending...' : 'Send Message'}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PostDetail;