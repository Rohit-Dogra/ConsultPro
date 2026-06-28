import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface BusinessObjective {
  id: number;
  name: string;
  description: string;
  function_id: number;
}

interface FunctionalityOption {
  id: number;
  option_value: string;
  display_name: string;
}

interface SeekerProfile {
  business_name: string;
  industry: string;
  product_category: string;
  business_description: string;
}

interface FormData {
  businessName: string;
  industry: string;
  productCategory: string;
  businessDescription: string;
  targetAudience: string;
  businessFunction: string;
  is_custom_functionality: boolean;
  customFunctionality: string;
  audienceRegion: 'global' | 'specific';
  specificRegion: string;
  businessChallenge: string;
  selectedObjectives: number[];
}

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    businessName: '',
    industry: '',
    productCategory: '',
    businessDescription: '',
    targetAudience: '',
    businessFunction: '',
    is_custom_functionality: false,
    customFunctionality: '',
    audienceRegion: 'global',
    specificRegion: '',
    businessChallenge: '',
    selectedObjectives: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [functionalityOptions, setFunctionalityOptions] = useState<FunctionalityOption[]>([]);
  const [loadingFunctionalities, setLoadingFunctionalities] = useState(true);
  const [profileData, setProfileData] = useState<SeekerProfile | null>(null);
  const [objectives, setObjectives] = useState<BusinessObjective[]>([]);
  const [loadingObjectives, setLoadingObjectives] = useState(true);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleObjectiveToggle = (objective: number) => {
    setFormData((prev) => {
      const objectives = [...prev.selectedObjectives];
      if (objectives.includes(objective)) {
        return { ...prev, selectedObjectives: objectives.filter(obj => obj !== objective) };
      } else {
        return { ...prev, selectedObjectives: [...objectives, objective] };
      }
    });
  };

  // Updated validateStep function
  const validateStep = () => {
    if (currentStep === 1) {
      if (!formData.businessName || !formData.industry || !formData.businessDescription) {
        toast({
          title: "Missing Information",
          description: "Please complete your profile first with all business details.",
          variant: "destructive",
        });
        return false;
      }
    } else if (currentStep === 2) {
      if (!formData.audienceRegion) {
        toast({
          title: "Missing Information",
          description: "Please select your market coverage.",
          variant: "destructive",
        });
        return false;
      }
      if (formData.audienceRegion === 'specific' && !formData.specificRegion) {
        toast({
          title: "Missing Information",
          description: "Please specify your target regions/countries.",
          variant: "destructive",
        });
        return false;
      }
    } else if (currentStep === 3) {
      if (!formData.businessChallenge) {
        toast({
          title: "Missing Information",
          description: "Please describe your current business situation.",
          variant: "destructive",
        });
        return false;
      }
      if (!formData.industry) {
        toast({
          title: "Missing Information",
          description: "Please select a business function",
          variant: "destructive",
        });
        return false;
      }
      // Validate custom functionality if selected
      if (formData.is_custom_functionality && !formData.customFunctionality.trim()) {
        toast({
          title: "Missing Information",
          description: "Please describe your specific business function",
          variant: "destructive",
        });
        return false;
      }
      if (formData.selectedObjectives.length === 0) {
        toast({
          title: "Missing Information",
          description: "Please select at least one business objective",
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      // Scroll to top smoothly when moving to next step
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
        const userData = localStorage.getItem('user');
        if (!userData) {
            toast({
                title: "Authentication Required",
                description: "Please log in to submit your business plan.",
                variant: "destructive",
            });
            navigate('/auth/seeker');
            return;
        }
        
        const user = JSON.parse(userData);
        const authToken = user.accessToken || user.token;

        // Get the selected functionality ID
        const selectedFunctionality = functionalityOptions.find(
            f => f.option_value === formData.industry
        );

        const API_BASE_URL = import.meta.env.VITE_API_URL;
        
        // Prepare the submission data to match database structure
        const submissionData = {
            business_name: formData.businessName,
            product_description: formData.businessDescription,
            functionality: formData.is_custom_functionality ? formData.customFunctionality : (selectedFunctionality?.option_value || ''),
            is_custom_functionality: formData.is_custom_functionality,
            target_audience: JSON.stringify({
                region: formData.audienceRegion,
                specificRegion: formData.audienceRegion === 'specific' ? formData.specificRegion : null,
                businessChallenge: formData.businessChallenge
            }),
            objectives: JSON.stringify(formData.selectedObjectives)
        };

        console.log('Submitting data:', submissionData);

        const response = await fetch(`${API_BASE_URL}/api/business-plans`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(submissionData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to submit business plan');
        }
        
        if (result.success) {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            
            toast({
                title: "Success",
                description: "Your business plan has been submitted successfully.",
            });
            
            setTimeout(() => {
                navigate('/aidashboard', { 
                    state: { 
                        selectedFunctionality: selectedFunctionality?.id,
                        fromOnboarding: true 
                    }
                });
            }, 1500);
        }
        
    } catch (error) {
        console.error("Submit error:", error);
        toast({
            title: "Submission Failed",
            description: error instanceof Error ? error.message : "Failed to submit business plan",
            variant: "destructive",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => {
    return (
      <div className="flex items-center justify-center space-x-1 mb-10">
        {[1, 2, 3].map((step) => (
          <React.Fragment key={step}>
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === currentStep 
                  ? 'bg-blue-500 text-white' 
                  : step < currentStep 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              {step < currentStep ? <CheckCircle size={16} /> : step}
            </div>
            {step < 3 && (
              <div 
                className={`w-12 h-0.5 ${
                  step < currentStep ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  useEffect(() => {
    const fetchSeekerData = async () => {
        try {
            const userData = localStorage.getItem('user');
            if (!userData) {
                toast({
                    title: "Authentication Required",
                    description: "Please log in to continue.",
                    variant: "destructive",
                });
                navigate('/auth/seeker');
                return;
            }

            const user = JSON.parse(userData);
            const authToken = user.accessToken || user.token;
            const API_BASE_URL = import.meta.env.VITE_API_URL;

            const response = await fetch(`${API_BASE_URL}/api/business-plans/seeker-profile`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Accept': 'application/json'
                }
            });

            if (response.status === 404) {
                toast({
                    title: "Profile Incomplete",
                    description: "Please complete your profile before proceeding",
                    variant: "destructive",
                });
                navigate('/seeker/profile');
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch data');
            }

            const data = await response.json();
            
            if (data.success) {
                const { profile, functionalities, objectives } = data.data;
                setProfileData(profile);
                setFunctionalityOptions(functionalities);
                setObjectives(objectives || []);

                // Pre-fill form data with all fields
                setFormData(prev => ({
                    ...prev,
                    businessName: profile.business_name || '',
                    industry: profile.industry || '',
                    productCategory: profile.product_category || '',
                    businessDescription: profile.business_description || '',
                    // Keep other fields with their defaults
                    targetAudience: prev.targetAudience,
                    businessFunction: prev.businessFunction,
                    is_custom_functionality: prev.is_custom_functionality,
                    customFunctionality: prev.customFunctionality,
                    audienceRegion: prev.audienceRegion,
                    specificRegion: prev.specificRegion,
                    businessChallenge: prev.businessChallenge,
                    selectedObjectives: prev.selectedObjectives
                }));
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast({
                title: "Error",
                description: "Failed to load necessary data",
                variant: "destructive",
            });
        } finally {
            setLoadingFunctionalities(false);
            setLoadingObjectives(false);
        }
    };

    fetchSeekerData();
  }, [navigate]);

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-gray-900 mb-4">Let's Map Your Business</h1>
            <p className="text-gray-600">Provide your business details to build your custom analysis</p>
          </div>
          
          {renderStepIndicator()}
          
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="glass shadow-sm">
              <CardContent className="pt-6">
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-medium text-gray-900 mb-1">Core Company Profile</h2>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="businessName">Company Name</Label>
                        <Input 
                          id="businessName"
                          name="businessName"
                          value={formData.businessName}
                          onChange={handleChange}
                          placeholder="Enter your business name"
                          className="mt-1"
                          disabled
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="industry">Industry</Label>
                        <Input 
                          id="industry"
                          name="industry"
                          value={formData.industry}
                          onChange={handleChange}
                          placeholder="Your industry"
                          className="mt-1"
                          disabled
                        />
                      </div>

                      <div>
                        <Label htmlFor="productCategory">Product Category</Label>
                        <Input 
                          id="productCategory"
                          name="productCategory"
                          value={formData.productCategory}
                          onChange={handleChange}
                          placeholder="Your product category"
                          className="mt-1"
                          disabled
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="businessDescription">Core Competency</Label>
                        <Textarea 
                          id="businessDescription"
                          name="businessDescription"
                          value={formData.businessDescription}
                          onChange={handleChange}
                          placeholder="Describe your business in detail"
                          className="mt-1 min-h-[120px]"
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-medium text-gray-900 mb-1">Market Coverage</h2>
                      <p className="text-sm text-gray-500 mb-4">Define your market reach and target geography.</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="audienceRegion">Market Coverage</Label>
                        <Select 
                          value={formData.audienceRegion} 
                          onValueChange={(value: 'global' | 'specific') => {
                            handleSelectChange('audienceRegion', value);
                          }}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select market reach" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="global">Global Market</SelectItem>
                            <SelectItem value="specific">Specific Region/Country</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {formData.audienceRegion === 'specific' && (
                        <div>
                          <Label htmlFor="specificRegion">Target Regions/Countries</Label>
                          <Textarea 
                            id="specificRegion"
                            name="specificRegion"
                            value={formData.specificRegion}
                            onChange={handleChange}
                            placeholder="Specify your target markets (e.g., South Asia, European Union, United States)"
                            className="mt-1 min-h-[80px]"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-medium text-gray-900 mb-1">Function Areas & Business Challenge</h2>
                      <p className="text-sm text-gray-500 mb-4">Select the business areas where you need help and describe your challenges.</p>
                    </div>
                    
                    <div className="space-y-6">
                      {/* Business Area Section - Moved to top */}
                      <div>
                        <Label htmlFor="functionality">Business Area</Label>
                        <Select 
                          value={formData.industry} 
                          onValueChange={(value) => {
                            console.log('Selected functionality:', value);
                            
                            handleSelectChange('industry', value);
                            setFormData(prev => ({
                              ...prev,
                              industry: value,
                              is_custom_functionality: value === 'others',
                              customFunctionality: value === 'others' ? prev.customFunctionality : ''
                            }));
                          }}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select Business Function" />
                          </SelectTrigger>
                          <SelectContent>
                            {loadingFunctionalities ? (
                              <SelectItem value="" disabled>Loading...</SelectItem>
                            ) : (
                              <>
                                {functionalityOptions.map((option) => (
                                  <SelectItem key={option.id} value={option.option_value}>
                                    {option.display_name}
                                  </SelectItem>
                                ))}
                                <SelectItem value="others">Others</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500 mt-1">
                          Choose the primary area where you're facing problems
                        </p>
                      </div>

                      {formData.is_custom_functionality && (
                        <div>
                          <Label htmlFor="customFunctionality">Specify Business Function *</Label>
                          <Input
                            id="customFunctionality"
                            name="customFunctionality"
                            value={formData.customFunctionality || ''}
                            onChange={handleChange}
                            placeholder="Describe your specific business function"
                            className="mt-1"
                          />
                        </div>
                      )}
                      
                      <div className="border-t pt-6">
                        <Label>Sub-Business Areas</Label>
                        <p className="text-sm text-gray-500 mb-3">
                          Highlight the key areas that you're facing problems — this helps experts tailor their guidance to your business goals.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {loadingObjectives ? (
                            <div className="col-span-2 text-center py-4 text-gray-500">
                              Loading objectives...
                            </div>
                          ) : objectives.length === 0 ? (
                            <div className="col-span-2 text-center py-4 text-gray-500">
                              No objectives found
                            </div>
                          ) : (
                            objectives
                                .filter(obj => {
                                    const selectedFunctionId = functionalityOptions.find(
                                        f => f.option_value === formData.industry
                                    )?.id;
                                    
                                    return obj.function_id === selectedFunctionId;
                                })
                                .map((objective) => (
                                    <div
                                        key={objective.id}
                                        onClick={() => {
                                            const isSelected = formData.selectedObjectives.includes(objective.id);
                                            setFormData(prev => ({
                                                ...prev,
                                                selectedObjectives: isSelected
                                                    ? prev.selectedObjectives.filter(id => id !== objective.id)
                                                    : [...prev.selectedObjectives, objective.id]
                                            }));
                                        }}
                                        className={`p-4 rounded-lg border transition-all cursor-pointer ${
                                            formData.selectedObjectives.includes(objective.id)
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <div className={`mt-1 w-4 h-4 rounded-full flex items-center justify-center ${
                                                formData.selectedObjectives.includes(objective.id)
                                                    ? 'bg-blue-500'
                                                    : 'border-2 border-gray-300'
                                            }`}>
                                                {formData.selectedObjectives.includes(objective.id) && (
                                                    <CheckCircle className="text-white" size={12} />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-gray-900">{objective.name}</h3>
                                                <p className="text-sm text-gray-500 mt-1">{objective.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                          )}
                        </div>
                      </div>

                      {/* Business Challenge Section - Moved to last position */}
                      <div className="border-t pt-6">
                        <Label htmlFor="businessChallenge">Describe Your Business Challenge</Label>
                        <p className="text-sm text-gray-500 mb-3">
                          Based on your selected business areas, describe your specific challenges.
                        </p>
                        <Textarea 
                          id="businessChallenge"
                          name="businessChallenge"
                          value={formData.businessChallenge}
                          onChange={handleChange}
                          placeholder={`Describe your current business situation:
- Key market challenges or opportunities
- Competitive pressures or advantages
- Growth barriers or expansion potential
- Operational inefficiencies or scaling needs
- Market gaps or unmet customer needs`}
                          className="mt-1 min-h-[150px]"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between mt-8">
                  <Button 
                    variant="outline" 
                    onClick={handleBack} 
                    disabled={currentStep === 1}
                    className="flex-1 mr-2"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button 
                    onClick={handleNext} 
                    disabled={isSubmitting}
                    className="flex-1 ml-2"
                  >
                    {isSubmitting ? 'Loading...' : currentStep === 3 ? 'Submit' : 'Next'}
                    {!isSubmitting && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Onboarding;
