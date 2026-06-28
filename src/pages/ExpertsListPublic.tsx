import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, UserRound, ArrowRight, X, CheckCircle } from "lucide-react";
import { useCurrencyTimezone } from "@/components/contexts/CurrencyTimezoneContext";
import { toast } from "@/hooks/use-toast";
import { useToast } from "@/hooks/use-toast";
import { SessionRequestForm } from "@/components/features/SessionRequestForm";
import { API_BASE_URL } from "@/config/api";
import SEOHead from "@/components/SEO/SEOHead";
import { pageSEOConfig } from "@/config/seo";
import { trackBrowseEngagement } from "@/services/recommendationEngine";

interface Expert {
  id: string;
  user_id: string;
  firstName: string;
  lastName: string;
  designation: string;
  expertise: string[];
  rating: number;
  reviews: number;
  profile_image?: string;
  work_experience: number;
  workExperience: number;
  currentOrganization: string;
  location: string;
  areas_of_help: string;
  audio_pricing?: number;
}

interface Functionality {
  id: number;
  display_name: string;
  option_value: string;
}

export default function ExpertsListPublic() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { formatCurrency } = useCurrencyTimezone();
  const serviceId = searchParams.get("service");
  const functionalityId = searchParams.get("functionality_id");
  const objectiveId = searchParams.get("objective_id");
  const [serviceFunctionalityMapping, setServiceFunctionalityMapping] = useState<{[key: number]: number}>({});
  const [experts, setExperts] = useState<Expert[]>([]);
  const [functionalities, setFunctionalities] = useState<Functionality[]>([]);
  const [selectedFunctionality, setSelectedFunctionality] = useState<number | null>(null);
  
  // Update selectedFunctionality when URL params change
  useEffect(() => {
    if (functionalityId) {
      setSelectedFunctionality(Number(functionalityId));
    } else if (serviceId && serviceFunctionalityMapping[Number(serviceId)]) {
      setSelectedFunctionality(serviceFunctionalityMapping[Number(serviceId)]);
    } else {
      setSelectedFunctionality(null);
    }
  }, [functionalityId, serviceId, serviceFunctionalityMapping]);

  useEffect(() => {
    if (!functionalityId) return;
    const fid = Number(functionalityId);
    if (!Number.isFinite(fid) || fid < 1) return;
    void trackBrowseEngagement(fid);
  }, [functionalityId]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Helper function to calculate average rating
  const calculateAverageRating = (feedbacks: any[]) => {
    if (!feedbacks || feedbacks.length === 0) return 0;
    const validRatings = feedbacks.filter(feedback => feedback.rating && !isNaN(feedback.rating));
    if (validRatings.length === 0) return 0;
    const sum = validRatings.reduce((acc, feedback) => acc + Number(feedback.rating), 0);
    return Number((sum / validRatings.length).toFixed(1));
  };

  // Function to fetch expert ratings
  const fetchExpertRatings = async (expertUserId: string, token?: string) => {
    try {
      // Try authenticated endpoint first if token is available
      if (token) {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/session-feedback/expert/${expertUserId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const rating = calculateAverageRating(data.data);
            const reviews = data.data.length;
            return { rating, reviews, feedbacks: data.data };
          }
        }
      }
      
      // Fallback to public endpoint
      const publicResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/api/session-feedback/expert/${expertUserId}/public`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (publicResponse.ok) {
        const data = await publicResponse.json();
        if (data.success && data.data) {
          const rating = calculateAverageRating(data.data);
          const reviews = data.data.length;
          return { rating, reviews, feedbacks: data.data };
        }
      }
      
      return { rating: 0, reviews: 0, feedbacks: [] };
    } catch (error) {
      console.log(`Failed to fetch ratings for expert ${expertUserId}:`, error);
      return { rating: 0, reviews: 0, feedbacks: [] };
    }
  };

  // Modal states
  const [showGoogleSignup, setShowGoogleSignup] = useState(false);
  const [isSessionFormOpen, setIsSessionFormOpen] = useState(false);
  const [userInfo, setUserInfo] = useState({ email: "", name: "", id: "" });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isValidatingSession, setIsValidatingSession] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const countCharacters = (text: string) => {
    if (!text || text.trim() === '') return 0;
    return text.trim().length;
  };

  const truncateText = (text: string, maxChars: number = 150) => {
    if (!text || text.trim() === '') return text;
    if (text.length <= maxChars) return text;
    return text.substring(0, maxChars) + '...';
  };

  const toggleCardExpansion = (expertId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(expertId)) {
        newSet.delete(expertId);
      } else {
        newSet.add(expertId);
      }
      return newSet;
    });
  };

  // Validate session on component mount
  useEffect(() => {
    validateSession();
  }, []);

  const validateSession = async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (!token || !userData) {
        setIsValidatingSession(false);
        return;
      }

      const user = JSON.parse(userData);
      setUserInfo({
        email: user.email || '',
        name: user.name || '',
        id: user.id || ''
      });
      setUserRole(user.role);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Session validation error:', error);
    } finally {
      setIsValidatingSession(false);
    }
  };

  const handleGetFreeSession = async () => {
    if (isLoggedIn) {
      // For logged-in users, open the session request form directly
      setIsSessionFormOpen(true);
    } else {
      setShowGoogleSignup(true);
    }
  };

  const handleGoogleResponse = async (response) => {
    setIsGoogleLoading(true);
    try {
      const result = await fetch(`${import.meta.env.VITE_API_URL}/api/google-auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential })
      });

      const data = await result.json();
      
      if (data.success && data.data) {
        setUserInfo({
          email: data.data.email,
          name: data.data.name || '',
          id: data.data.id || ''
        });
        
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data));
        
        setShowGoogleSignup(false);
        setIsLoggedIn(true);
        
        // For all users (new and existing), open session form
        setIsSessionFormOpen(true);
      }
    } catch (error) {
      console.error('Google auth error:', error);
      toast({
        title: "Signup failed",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };





  useEffect(() => {
    if (showGoogleSignup) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      document.head.appendChild(script);
      
      script.onload = () => {
        if (window.google) {
          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            callback: handleGoogleResponse
          });
          const buttonContainer = document.getElementById('google-signin-button');
          if (buttonContainer) {
            window.google.accounts.id.renderButton(buttonContainer, {
              theme: 'outline',
              size: 'large',
              width: 350
            });
          }
        }
      };
    }
  }, [showGoogleSignup]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First, try to seed the database if no experts exist
        try {
          const seedResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/experts/debug/seed`, {
            method: 'POST'
          });
          if (seedResponse.ok) {
            const seedResult = await seedResponse.json();
            console.log('Seed result:', seedResult);
          }
        } catch (seedError) {
          console.log('Seed attempt failed (this is normal if data already exists):', seedError);
        }
        
        // Use the current selectedFunctionality state
        const filterFunctionalityId = selectedFunctionality;
        
        console.log('Filtering with:', { 
          filterFunctionalityId, 
          objectiveId, 
          serviceId, 
          functionalityId, 
          selectedFunctionality, 
          serviceFunctionalityMapping 
        });
        
        // Build URL with query parameters
        let expertUrl = `${import.meta.env.VITE_API_URL}/api/experts/profiles/public?status=approved&require_complete=true`;
        
        if (filterFunctionalityId) {
          expertUrl += `&functionality_id=${filterFunctionalityId}`;
        }
        
        if (objectiveId) {
          expertUrl += `&objective_id=${objectiveId}`;
        }
        
        console.log('Fetching from URL:', expertUrl);
        
        const expertResponse = await fetch(expertUrl);
        
        if (expertResponse.ok) {
          const expertResult = await expertResponse.json();
          console.log('Expert response:', expertResult);
          if (expertResult.success && expertResult.data && expertResult.data.length > 0) {
            // Fetch ratings for each expert
            const userData = localStorage.getItem('user');
            let token = null;
            if (userData) {
              try {
                const user = JSON.parse(userData);
                token = user.token || user.accessToken;
              } catch (e) {
                console.log('No valid user token found, using public endpoint');
              }
            }
            
            const expertsWithRatings = await Promise.all(
              expertResult.data.map(async (expert: any) => {
                const ratingData = await fetchExpertRatings(expert.user_id, token);
                return {
                  ...expert,
                  rating: ratingData.rating,
                  reviews: ratingData.reviews,
                  feedbacks: ratingData.feedbacks
                };
              })
            );
            
            setExperts(expertsWithRatings);
          } else {
            console.log('No experts found or empty response');
            setExperts([]);
          }
        } else {
          const errorText = await expertResponse.text();
          console.error('API error:', expertResponse.status, expertResponse.statusText, errorText);
          setError(`Failed to load experts: ${expertResponse.status} ${expertResponse.statusText}`);
          setExperts([]);
        }
        
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to connect to server.');
        setExperts([]);
      } finally {
        setLoading(false);
      }
    };

    // Fetch experts whenever selectedFunctionality or objectiveId changes
    fetchData();
  }, [selectedFunctionality, objectiveId]);

  useEffect(() => {
    const fetchFunctionalities = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/functionalities/public`);
        const result = await response.json();
        if (result.success) {
          setFunctionalities(result.data);
          
          // Create service to functionality mapping
          const serviceMap: {[key: number]: number} = {};
          const optionValueToService = {
            'business_strategy': 1,
            'hr_solutions': 2, 
            'operations_manufacturing': 3,
            'digital_transformation': 4,
            'financial_advisory': 5,
            'marketing_brand': 6
          };
          
          result.data.forEach((func: Functionality) => {
            const serviceId = optionValueToService[func.option_value as keyof typeof optionValueToService];
            if (serviceId) {
              serviceMap[serviceId] = func.id;
            }
          });
          
          setServiceFunctionalityMapping(serviceMap);
        }
      } catch (error) {
        console.error('Error fetching functionalities:', error);
      }
    };

    fetchFunctionalities();
  }, []);

  // Role validation - experts cannot access this page
  if (isLoggedIn && userRole === 'expert') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto py-8 px-4 pt-20">
          <div className="text-center py-16">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 max-w-md mx-auto">
              <h2 className="text-xl font-bold text-blue-800 mb-2">Exclusive Access Notice</h2>
              <p className="text-blue-700">You’re logged in as an Expert — thank you for being part of our network of professionals. <br />
  To explore or book sessions, please log in as a Solution Seeker.</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title={pageSEOConfig.expertsPublic.title}
        description={pageSEOConfig.expertsPublic.description}
        keywords={pageSEOConfig.expertsPublic.keywords}
        url="https://expertisestation.com/experts-public"
      />
      <Navbar />
      
      <main className="container mx-auto py-8 px-4 pt-20">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Expert Professionals</h1>
        </div>
        <p className="text-lg text-gray-600 mb-8">
          Connect with verified experts to accelerate your business growth.
        </p>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading experts...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="bg-red-50 text-red-500 p-4 rounded-lg inline-block">
              {error}
            </div>
          </div>
        ) : experts.length === 0 ? (
          <div className="text-center py-12">
            <UserRound className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Experts Found</h2>
            <p className="text-gray-600 mb-6">We couldn't find any experts matching your criteria.</p>
            <Button onClick={() => navigate('/signup')} className="bg-primary hover:bg-primary/90">
              Join as Expert
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {experts.map((expert) => (
              <Card key={expert.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-xl border-0 shadow-md bg-white/80 backdrop-blur-sm flex flex-col">
                <CardHeader className="pb-6 p-6 flex-shrink-0">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 ring-2 ring-blue-100">
                      {expert.profile_image ? (
                        <AvatarImage 
                          src={`${API_BASE_URL}${expert.profile_image}`} 
                          alt={`${expert.firstName} ${expert.lastName}`}
                          onError={(e) => {
                            console.log('Image load error for:', expert.firstName, expert.lastName);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : null}
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                        <UserRound size={24} />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 leading-tight">{expert.firstName} {expert.lastName}</h3>
                      <p className="text-sm text-gray-600 font-medium mt-1">{expert.designation}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">
                      {expert.workExperience || expert.work_experience} years exp
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-semibold text-yellow-500">
                        {expert.rating && expert.rating > 0 ? expert.rating.toFixed(1) : 'New'}
                      </span>
                      {expert.reviews && expert.reviews > 0 && (
                        <span className="text-xs text-gray-500">({expert.reviews} review{expert.reviews !== 1 ? 's' : ''})</span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="px-6 pb-4 flex-1 flex flex-col">
                  <div className="space-y-4 flex-1 flex flex-col">
                    <div className="min-h-[70px]">
                      <h4 className="text-sm font-semibold text-gray-800 mb-3">Expertise</h4>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(expert.expertise) ? expert.expertise.slice(0, 3).map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border-0 font-medium">
                            {skill}
                          </Badge>
                        )) : (
                          <Badge variant="secondary" className="text-xs px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border-0 font-medium">
                            {expert.expertise}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-h-[90px]">
                      <div className="text-sm text-gray-600 leading-relaxed">
                        {(() => {
                          const aboutText = `Experienced professional specializing in ${Array.isArray(expert.expertise) ? expert.expertise.join(', ') : expert.expertise}. Ready to help with ${expert.areas_of_help || 'various business challenges'}.`;
                          const isExpanded = expandedCards.has(expert.id);
                          const shouldShowToggle = countCharacters(aboutText) > 100;
                          
                          return (
                            <>
                              {isExpanded ? aboutText : truncateText(aboutText, 100)}
                              {shouldShowToggle && (
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-0 h-auto text-xs ml-1 text-blue-600 hover:text-blue-800"
                                  onClick={() => toggleCardExpansion(expert.id)}
                                >
                                  {isExpanded ? 'Less' : 'More'}
                                </Button>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      {expert.audio_pricing ? (
                        <div className="flex justify-between items-center w-full pt-4 border-t border-gray-100">
                          <span className="text-sm text-gray-600 font-medium">Audio Session</span>
                          <div className="text-right">
                            <span className="line-through text-gray-400 text-sm">{formatCurrency(expert.audio_pricing, 'INR')}/hr</span>
                            <span className="font-bold text-lg text-green-600 ml-2">Free</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center w-full pt-4 border-t border-gray-100">
                          <span className="text-sm text-gray-600 font-medium">Audio Session</span>
                          <span className="font-bold text-lg text-green-600">Free</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="pt-6 px-6 pb-6 flex-shrink-0">
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200" 
                    onClick={handleGetFreeSession}
                    disabled={isValidatingSession}
                  >
                    {isValidatingSession ? "Loading..." : "Request Consultation"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
      
      <SessionRequestForm
        isOpen={isSessionFormOpen}
        onClose={() => setIsSessionFormOpen(false)}
      />
      
      <Footer />

      {/* Google Signup Modal */}
      {showGoogleSignup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Get Started</h2>
                <button onClick={() => setShowGoogleSignup(false)} aria-label="Close modal" className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-600 text-center mb-6">
                  Sign up with Google to get your free business strategy report
                </p>
                
                {isGoogleLoading ? (
                  <div className="w-full flex justify-center min-h-[44px] items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Signing in...</span>
                  </div>
                ) : (
                  <div id="google-signin-button" className="w-full flex justify-center min-h-[44px]"></div>
                )}
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or</span>
                  </div>
                </div>
                
                <Button onClick={() => window.location.href = '/auth/seeker'} variant="outline" className="w-full">
                  Continue with Email
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

