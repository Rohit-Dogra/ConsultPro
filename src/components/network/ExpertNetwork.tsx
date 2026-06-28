import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, TrendingUp, Award, ArrowRight, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { fetchFunctionalityViewsSummary } from "@/services/recommendationEngine";

import BusinessStrategy from "../../img/network/Business Strategy and Growth.webp";
import HR from "../../img/network/HR and Workflow.webp";
import Operations from "../../img/network/Operations and Manufacturing.webp";
import Automation from "../../img/network/Automation and Workflow.webp";
import Marketing from "../../img/network/Marketing and Brand Positioning.webp";
import Financial from "../../img/network/Finance and risk advisory.webp";
import Digital from "../../img/network/Digital Transformation and IT.webp";
import CustomerSupport from "../../img/network/Customer Support.webp";
import QualityAssurance from "../../img/network/Quality Assurance.webp";
import SupplyChain from "../../img/network/Supply Chain Mangement.webp";
import ResearchDevelopment from "../../img/network/Research and Development.webp";

interface Service {
  id: number;
  title: string;
  description: string;
  image: string;
  category: string;
  expertCount: number;
  projectsCompleted: number;
}

const getImageForFunctionality = (optionValue: string): string => {
  const imageMap: { [key: string]: string } = {
    'business_strategy': BusinessStrategy,
    'hr_solutions': HR,
    'operations_manufacturing': Operations,
    'automation_workflow': Automation,
    'marketing_brand': Marketing,
    'financial_advisory': Financial,
    'digital_transformation': Digital,
    'customer_support': CustomerSupport,
    'quality_assurance': QualityAssurance,
    'supply_chain': SupplyChain,
    'research_development': ResearchDevelopment
  };
  
  return imageMap[optionValue] || BusinessStrategy;
};

const scrollingDomains = [
  "Automation & Workflow", "Customer Support Excellence", "Quality Assurance",
  "Supply Chain Management", "Research & Development", "Data Analytics",
  "Cybersecurity", "Product Management", "Sales Optimization", "Legal Advisory",
  "Sustainability", "Innovation Management", "Change Management", "Risk Assessment"
];

const ExpertNetwork = () => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showExpertSignup, setShowExpertSignup] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileViewsByFunctionality, setProfileViewsByFunctionality] = useState<
    Record<number, number>
  >({});

  // Fetch services from database
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/functionalities`);
        const data = await response.json();
        
        if (data.success) {
          // Fetch expert counts for each functionality
          const servicesWithCounts = await Promise.all(
            data.data.map(async (option: any) => {
              try {
                const expertResponse = await fetch(
                  `${import.meta.env.VITE_API_URL}/api/experts/profiles/public?functionality_id=${option.id}&status=approved&require_complete=true`
                );
                const expertData = await expertResponse.json();
                const expertCount = expertData.success ? expertData.data.length : 0;
                
                return {
                  id: option.id,
                  title: option.display_name,
                  description: `Professional ${option.display_name.toLowerCase()} consulting services`,
                  image: getImageForFunctionality(option.option_value),
                  category: option.option_value,
                  expertCount: expertCount,
                  projectsCompleted: Math.floor(Math.random() * 200) + 50
                };
              } catch (error) {
                console.error(`Error fetching experts for ${option.display_name}:`, error);
                return {
                  id: option.id,
                  title: option.display_name,
                  description: `Professional ${option.display_name.toLowerCase()} consulting services`,
                  image: getImageForFunctionality(option.option_value),
                  category: option.option_value,
                  expertCount: 0,
                  projectsCompleted: 0
                };
              }
            })
          );
          
          setServices(servicesWithCounts);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  useEffect(() => {
    if (!services.length) return;
    const ids = services.map((s) => s.id);
    let cancelled = false;
    (async () => {
      const map = await fetchFunctionalityViewsSummary(ids);
      if (!cancelled) setProfileViewsByFunctionality(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [services]);

  // Check authentication status on component mount
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setIsLoggedIn(true);
        setUserRole(user.role);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const scroll = () => {
      if (scrollContainer.scrollLeft >= scrollContainer.scrollWidth - scrollContainer.clientWidth) {
        scrollContainer.scrollLeft = 0;
      } else {
        scrollContainer.scrollLeft += 1;
      }
    };

    const interval = setInterval(scroll, 30);
    return () => clearInterval(interval);
  }, []);

  const handleExploreService = (functionalityId: number) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate(`/experts-public?functionality_id=${functionalityId}`);
  };

  const handleExpertGoogleResponse = async (response: any) => {
    setIsGoogleLoading(true);
    try {
      const result = await fetch(`${import.meta.env.VITE_API_URL}/api/google-auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          credential: response.credential,
          role: 'expert'
        })
      });

      const data = await result.json();
      
      if (data.success && data.data) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data));
        
        setShowExpertSignup(false);
        
        if (data.data.is_new_user) {
          toast({
            title: "Welcome to our Expert Network!",
            description: "Please complete your expert profile."
          });
          navigate('/auth/ExpertProfileForm');
        } else {
          // Returning user - check role and profile completion
          if (data.data.role === 'expert') {
            const isProfileComplete = data.data.profile_completed === 1 || data.data.profile_completed === true;
            if (isProfileComplete) {
              navigate('/dashboard');
            } else {
              navigate('/auth/ExpertProfileForm');
            }
          }
        }
      }
    } catch (error) {
      console.error('Expert Google auth error:', error);
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
    if (showExpertSignup) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      document.head.appendChild(script);
      
      script.onload = () => {
        if (window.google) {
          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            callback: handleExpertGoogleResponse
          });
          const buttonContainer = document.getElementById('expert-google-signin-button');
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
  }, [showExpertSignup]);

  return (
    <section className="section-container relative overflow-hidden py-12">
      <div className="text-center mb-8">
        <span className="badge badge-blue mb-4 text-2xl">Expert Network</span>
        <h2 className="section-title">
          Professional <span className="text-gradient">Services</span> & Expertise
        </h2>
        <p className="section-subtitle mx-auto">
          Connect with industry-leading experts across diverse business domains and specializations.
        </p>
      </div>

      {/* Modern Non-Traditional Service Cards - Auto Scrolling */}
      <div className="mb-8">
        <div className="relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10" />
          
          <div className="flex gap-6 py-4 animate-[scroll_60s_linear_infinite]" style={{ width: 'max-content' }}>
            {loading ? (
              <div className="flex items-center justify-center w-full py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              [...services, ...services].map((service, index) => (
                <div
                  key={`${service.id}-${index}`}
                  className="group bg-gradient-card rounded-2xl overflow-hidden shadow-card hover:shadow-premium transition-all duration-500 hover:-translate-y-3 border border-border hover:border-primary/20 cursor-pointer flex-shrink-0 w-80 flex flex-col h-[480px]"
                >
                {/* Service Image */}
                <div className="relative overflow-hidden h-48 flex-shrink-0">
                  <img
                    src={service.image}
                    alt={`${service.category} consulting expert`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent group-hover:from-background/40 transition-all duration-500" />
                  
                  {/* Category Badge */}
                  {/* <div className="absolute top-4 left-4 transform group-hover:scale-110 transition-transform duration-300">
                    <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm border border-primary/10 group-hover:bg-primary/30 transition-all duration-300">
                      {service.category}
                    </span>
                  </div> */}
                </div>

                {/* Service Content */}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex-1">
                    <h3 className="text-lg font-serif font-semibold text-foreground group-hover:text-primary transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors duration-300 mt-2">
                      {service.description}
                    </p>
                  </div>

                  {/* Service Stats */}
                  <div className="flex flex-col gap-2 text-sm text-muted-foreground pt-4 border-t border-border group-hover:border-primary/20 transition-colors duration-300 mt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1 group-hover:text-primary transition-colors duration-300">
                        <Users className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                        <span>{service.expertCount} Experts</span>
                      </div>
                      <div className="flex items-center space-x-1 group-hover:text-primary transition-colors duration-300">
                        <Award className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                        <span>{service.projectsCompleted} Projects</span>
                      </div>
                    </div>
                    <div
                      className="flex items-center justify-center gap-1.5 text-xs text-slate-500 group-hover:text-primary/90"
                      title="Distinct visitors who opened an expert profile in this area (from analytics)"
                    >
                      <Eye className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                      <span>
                        {profileViewsByFunctionality[service.id] ?? "—"} profile views
                      </span>
                    </div>
                  </div>

                  {/* Find Expert Button */}
                  <Button 
                    onClick={() => handleExploreService(service.id)}
                    className="w-full mt-4 group/btn hover:scale-105 transition-all duration-300"
                    variant="outline"
                    size="sm"
                  >
                    Find Expert
                    <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
                  </Button>
                </div>
              </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Auto-Scrolling Business Domains */}
      <div className="relative">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Additional Business Domains</h3>
          <p className="text-gray-600">Explore more specialized areas of expertise</p>
        </div>

        <div className="relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10" />
          
          <div
            ref={scrollRef}
            className="flex space-x-6 overflow-hidden py-4"
            style={{ scrollBehavior: 'auto' }}
          >
            {[...scrollingDomains, ...scrollingDomains].map((domain, index) => (
              <div
                key={index}
                className="flex-shrink-0 bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 rounded-xl border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer group"
              >
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-5 h-5 text-blue-500 group-hover:text-blue-600 transition-colors" />
                  <span className="text-gray-800 font-medium whitespace-nowrap group-hover:text-blue-800 transition-colors">
                    {domain}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="mt-8 text-center">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Transform Your Knowledge into Impactful Consulting.
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Leverage your knowledge and expand your reach—join the platform where businesses seek expert guidance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* <button 
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                navigate('/get-started');
              }}
              className="btn-primary"
            >
              Get Started Today
            </button> */}
            <Button
              onClick={() => {
                if (isLoggedIn && userRole === 'expert') {
                  navigate('/dashboard');
                } else {
                  setShowExpertSignup(true);
                }
              }}
              variant="outline"
              className="border-2 border-purple-300 text-purple-700 hover:bg-purple-500 hover:border-purple-400 px-6 py-2"
            >
              {isLoggedIn && userRole === 'expert' ? 'Go to Dashboard' : 'Become an Expert?'}
            </Button>
          </div>
        </div>
      </div>

      {/* Expert Google Signup Modal */}
      {showExpertSignup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Join as Expert</h2>
                <button 
                  onClick={() => setShowExpertSignup(false)} 
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close signup modal"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-600 text-center mb-6">
                  Share your expertise and help businesses grow
                </p>
                
                {isGoogleLoading ? (
                  <div className="w-full flex justify-center min-h-[44px] items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Signing up...</span>
                  </div>
                ) : (
                  <div id="expert-google-signin-button" className="w-full flex justify-center min-h-[44px]"></div>
                )}
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or</span>
                  </div>
                </div>
                
                <Button onClick={() => navigate('/auth/expert')} variant="outline" className="w-full">
                  Continue with Email
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ExpertNetwork;