import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Footer from '../layout/Footer';
import Navbar from '../layout/Navbar';
import SEOHead from '../SEO/SEOHead';
import { pageSEOConfig } from '@/config/seo';

const GetStarted: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    userType: '',
    whatsappConsent: false,
    termsAccepted: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.mobile.trim()) newErrors.mobile = 'Mobile number is required';
    else if (!/^\d{10,15}$/.test(formData.mobile.replace(/\D/g, ''))) {
      newErrors.mobile = 'Please enter a valid mobile number';
    }
    if (!formData.userType) newErrors.userType = 'Please select your role';
    if (!formData.termsAccepted) newErrors.terms = 'Please accept T&C and Privacy Policy';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${API_BASE_URL}/api/consultations/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          mobile: formData.mobile,
          userType: formData.userType,
          whatsappConsent: formData.whatsappConsent,
          termsAccepted: formData.termsAccepted
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Thank you! Your consultation request has been submitted successfully. Team Expertise Station will connect with you soon.');
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          mobile: '',
          userType: '',
          whatsappConsent: false,
          termsAccepted: false
        });
        setErrors({});
      } else {
        throw new Error(result.message || 'Failed to submit consultation request');
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div>
      <SEOHead 
        title={pageSEOConfig.getStarted.title}
        description={pageSEOConfig.getStarted.description}
        keywords={pageSEOConfig.getStarted.keywords}
        url="https://expertisestation.com/get-started"
      />
    <Navbar/>
    <div 
      className="min-h-screen relative"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(147, 197, 253, 0.8)), url('https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 mt-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-stretch min-h-screen">
          {/* Left Side - Heading, Subheading, and Form */}
          <div className="flex flex-col justify-center space-y-6 sm:space-y-8 order-2 lg:order-1">
            <div className="text-center lg:text-left px-2 sm:px-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 leading-tight">
                Professional Consulting for Growth & Success
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-blue-100 leading-relaxed">
                Connect with experts to drive your business and career forward. Book your personalized consultation today.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 w-full max-w-lg mx-auto lg:mx-0">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Name Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name*</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="mt-1"
                    />
                    {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name*</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="mt-1"
                    />
                    {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <Label htmlFor="email">Email Address*</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="mt-1"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                {/* Mobile Field */}
                <div>
                  <Label htmlFor="mobile">Mobile Number*</Label>
                  <Input
                    id="mobile"
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => handleInputChange('mobile', e.target.value)}
                    className="mt-1"
                  />
                  {errors.mobile && <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>}
                </div>

                {/* User Type Selection */}
                <div>
                  <Label htmlFor="userType">I am a*</Label>
                  <Select
                    value={formData.userType}
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, userType: value }));
                      if (errors.userType) {
                        setErrors(prev => ({ ...prev, userType: '' }));
                      }
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solution-seeker">Solution Seeker</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                      <SelectItem value="aspiring-entrepreneur">Aspiring Entrepreneur</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.userType && <p className="text-red-500 text-sm mt-1">{errors.userType}</p>}
                </div>

                {/* Checkboxes */}
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="whatsapp"
                      checked={formData.whatsappConsent}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, whatsappConsent: !!checked }))
                      }
                      className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500 mt-0.5 flex-shrink-0"
                    />
                    <div className="flex items-start space-x-2">
                      <MessageCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <Label htmlFor="whatsapp" className="text-sm leading-relaxed">
                        I agree to WhatsApp communication
                      </Label>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="terms"
                      checked={formData.termsAccepted}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, termsAccepted: !!checked }))
                      }
                      className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500 mt-0.5 flex-shrink-0"
                    />
                    <Label htmlFor="terms" className="text-sm leading-relaxed">
                      I accept{' '}
                      <a 
                        href="/termofservice" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        T&C
                      </a>
                      {' '}and{' '}
                      <a 
                        href="/privacypolicy" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Privacy Policy
                      </a>
                    </Label>
                  </div>
                  {errors.terms && <p className="text-red-500 text-sm">{errors.terms}</p>}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg py-3 text-base sm:text-lg font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Book a Consultation'
                  )}
                </Button>
              </form>
            </div>
          </div>
          
          {/* Right Side - Image */}
          <div className="flex items-center justify-center order-1 lg:order-2 mb-4 lg:mb-0">
            <div className="w-full flex items-center justify-center">
              <img 
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                alt="Professional business consulting team" 
                className="w-full h-48 sm:h-64 sm:mt-5 md:h-80 lg:h-auto lg:min-h-[500px] lg:max-h-[700px] rounded-2xl shadow-xl object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    <Footer/>
  </div>
  );
};

export default GetStarted;