import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useState } from "react";
import { toast } from "sonner";
import { MapPin } from "lucide-react";
import SEOHead from "@/components/SEO/SEOHead";
import { pageSEOConfig } from "@/config/seo";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const [errors, setErrors] = useState({
    name: '',
    email: '',
    phone: '', // Added phone to error state
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Form validation
  const validateForm = () => {
    let isValid = true;
    const newErrors = { name: '', email: '', phone: '', message: '' };
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }
    
    // Add validation for phone field
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
      isValid = false;
    } else if (!/^[\d\s\+\-\(\)]{6,20}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
      isValid = false;
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  // Update the handleSubmit function for better error handling
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL;
      
      // Format data according to database schema
      const formPayload = {
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone.trim(),
        message: formData.message.trim()
      };

      console.log('Submitting contact form:', formPayload);

      const response = await fetch(`${API_BASE_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formPayload)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('Server response:', result);
        throw new Error(result.message || 'Failed to send message');
      }
      
      // Success handling
      toast.success("Thank you! Your message has been sent successfully.");
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: ''
      });
      
      setErrors({
        name: '',
        email: '',
        phone: '',
        message: ''
      });

    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : "Failed to send message. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title={pageSEOConfig.contact.title}
        description={pageSEOConfig.contact.description}
        keywords={pageSEOConfig.contact.keywords}
        url="https://expertisestation.com/contact"
      />
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Background decoration - subtle grid */}
          <div className="absolute inset-0 bg-[linear-gradient(#f9fafb_2px,transparent_2px),linear-gradient(90deg,#f9fafb_2px,transparent_2px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none -z-10" />
          
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Get in Touch</h1>
            <p className="mt-4 text-lg text-foreground/70">Have questions? We're here to help!</p>
          </div>

          <div className="mt-12 max-w-lg mx-auto">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground/80">Name</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  value={formData.name}
                  onChange={handleChange}
                  aria-required="true"
                  placeholder="Enter your full name"
                  className={`mt-1 block w-full rounded-md border ${errors.name ? 'border-red-500' : 'border-foreground/20'} bg-background px-3 py-2 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary`}
                />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground/80">Email</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email"
                  value={formData.email} 
                  onChange={handleChange}
                  aria-required="true"
                  placeholder="example@email.com"
                  className={`mt-1 block w-full rounded-md border ${errors.email ? 'border-red-500' : 'border-foreground/20'} bg-background px-3 py-2 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary`}
                />
                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-foreground/80">Phone Number</label>
                <input 
                  type="tel" 
                  id="phone" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g., +91 123 456 7890"
                  aria-required="true"
                  className={`mt-1 block w-full rounded-md border ${errors.phone ? 'border-red-500' : 'border-foreground/20'} bg-background px-3 py-2 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary`} 
                />
                {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-foreground/80">Message</label>
                <textarea 
                  id="message" 
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4} 
                  aria-required="true"
                  placeholder="Type your message here..."
                  className={`mt-1 block w-full rounded-md border ${errors.message ? 'border-red-500' : 'border-foreground/20'} bg-background px-3 py-2 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary`}
                />
                {errors.message && <p className="mt-1 text-sm text-red-500">{errors.message}</p>}
              </div>
              
              <div>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
          <div className="mt-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold mb-8 text-center text-foreground">Find Us On Maps</h2>
            
            {/* World Map Container */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">A Unified Network of Excellence</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-gray-700">🇨🇦 Canada</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-gray-700">🇮🇳 India</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-700">🇦🇺 Australia</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700">🇩🇪 Germany</span>
                  </div>
                </div>
              </div>
              
              {/* Interactive World Map */}
              <div className="relative w-full h-64 sm:h-80 lg:h-96 rounded-lg overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3502.123456789!2d77.035029!3d28.4226457!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d18758a92a4b5%3A0x34ae74e508e6d8a7!2sVipul%20Business%20Park!5e0!3m2!1sen!2sin!4v1640995200000!5m2!1sen!2sin"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="rounded-lg"
                  title="Office Locations Map"
                ></iframe>
              </div>
              
              {/* Individual Office Map Links */}
              <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
                <a 
                  href="https://www.google.com/maps/place/22+Adelaide+St+W,+Toronto,+ON+M5H+4E3,+Canada/@43.6532260,-79.3831843,17z" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-sm"
                >
                  <MapPin className="w-4 h-4 text-red-600" />
                  <span className="text-red-700 font-medium">Toronto Office</span>
                </a>
                <a 
                  href="https://www.google.com/maps/place/Vipul+Business+Park,+Sector+48,+Gurugram,+Haryana+122018,+India/@28.4226457,77.0350290,17z" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-sm"
                >
                  <MapPin className="w-4 h-4 text-orange-600" />
                  <span className="text-orange-700 font-medium">Gurugram Office</span>
                </a>
                <a 
                  href="https://www.google.com/maps/place/6+Limpet+Way,+Perth+WA+6122,+Australia/@-32.0569,115.8975,17z" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-sm"
                >
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-700 font-medium">Perth Office</span>
                </a>
                <a 
                  href="https://www.google.com/maps/place/Borgloher+Senke+27,+49176+Hilter,+Germany/@52.1205333,8.1461259,17z" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-sm"
                >
                  <MapPin className="w-4 h-4 text-green-600" />
                  <span className="text-green-700 font-medium">Hilter Office</span>
                </a>
              </div>
            </div>
          </div>

          {/* Office Addresses */}
          <div className="mt-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold mb-8 text-center text-foreground">Our Offices</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Canada Address */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300 h-full">
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Canada</h3>
                  </div>
                  <div className="text-sm text-gray-600 leading-relaxed flex-grow">
                    <p>22 Adelaide Street,</p>
                    <p>Suite 3600, Toronto,</p>
                    <p>Ontario, M5H 4E3</p>
                    <p className="font-medium mt-2 text-gray-800">🇨🇦 Canada</p>
                  </div>
                </div>
              </div>

              {/* India Address */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300 h-full">
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-orange-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">India</h3>
                  </div>
                  <div className="text-sm text-gray-600 leading-relaxed flex-grow">
                    <p>418, Vipul Business Park,</p>
                    <p>Sector-48, Gurugram,</p>
                    <p>Haryana- 122018</p>
                    <p className="font-medium mt-2 text-gray-800">🇮🇳 India</p>
                  </div>
                </div>
              </div>

              {/* Australia Address */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300 h-full">
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Australia</h3>
                  </div>
                  <div className="text-sm text-gray-600 leading-relaxed flex-grow">
                    <p>6 Limpet Way,</p>
                    <p>Perth, Western Australia 6122</p>
                    <p className="font-medium mt-2 text-gray-800">🇦🇺 Australia</p>
                  </div>
                </div>
              </div>

              {/* Germany Address */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300 h-full">
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Germany</h3>
                  </div>
                  <div className="text-sm text-gray-600 leading-relaxed flex-grow">
                    <p>Borgloher Senke 27,</p>
                    <p>49176 Hilter</p>
                    <p className="font-medium mt-2 text-gray-800">🇩🇪 Germany</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;