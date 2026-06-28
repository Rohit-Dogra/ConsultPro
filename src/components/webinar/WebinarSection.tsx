import { useState, useEffect } from "react";
import GlassCard from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import Footer from "../layout/Footer";
import Navbar from "../layout/Navbar";
import { toast } from "sonner";

interface FormData {
  name: string;
  profession: string;
  email: string;
  phone: string;
  areaOfInterest: string;
}

const initialFormData: FormData = {
  name: "",
  profession: "",
  email: "",
  phone: "",
  areaOfInterest: ""
};

const areasOfInterest = [
  "AI Analytics",
  "Machine Learning",
  "Neural Networks",
  "Data Science",
  "AI Development",
  "Optimization"
];

const WebinarSection = () => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    let timer: number;
    if (showSuccessPopup && countdown > 0) {
      timer = window.setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [showSuccessPopup, countdown]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const missingFields = Object.entries(formData)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

      if (missingFields.length > 0) {
        toast.error(`Please fill in all fields: ${missingFields.join(", ")}`);
        setIsLoading(false);
        return;
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL;

      const response = await fetch(`${API_BASE_URL}/api/webinar/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          profession: formData.profession,
          email: formData.email,
          phone: formData.phone,
          areaOfInterest: formData.areaOfInterest
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setFormData(initialFormData);
      setShowSuccessPopup(true);
       setCountdown(3);

      setTimeout(() => {
        const whatsappUrl = `https://chat.whatsapp.com/KxIEHoEzq6nBisjU4eEAcD`;
        window.open(whatsappUrl, "_blank");
        setShowSuccessPopup(false);
      }, 3000);

    } catch (error) {
      console.error('Registration error:', error);
      
      if (!navigator.onLine) {
        toast.error('Please check your internet connection');
        return;
      }

      toast.error(error instanceof Error ? error.message : 'Failed to register');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <section id="webinar" className="section-container relative pt-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="badge badge-blue mb-4">Upcoming Webinar</span>
            <h2 className="section-title">
              Experts <span className="text-gradient">Masterclass</span>
            </h2>
            <p className="section-subtitle mx-auto">
              Join our experts-led webinar at Expertise Station to explore business challenges and effective solutions.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
            <GlassCard className="p-8">
              <h3 className="text-2xl font-display font-semibold mb-6">Event Details</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold mb-2">About the Webinar</h4>
                  <p className="text-muted-foreground">
                    "Join our Expertise Station webinar to explore how AI is transforming industries. Learn practical implementation strategies from industry experts in this interactive session, covering cutting-edge AI technologies and their real-world applications."
                  </p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-2">Key Topics</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Latest AI trends and innovations</li>
                    <li>Practical implementation strategies</li>
                    <li>Real-world case studies</li>
                    <li>Q&A session with experts</li>
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Date & Time</h4>
                    <p className="text-muted-foreground">June 07, 2025<br />10:00 AM - 4:00 PM IST</p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Platform</h4>
                    <p className="text-muted-foreground">Zoom Virtual Meeting<br />Link will be shared upon registration</p>
                  </div>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-8">
              <h3 className="text-2xl font-display font-semibold mb-6">Register Now</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    placeholder="Enter your name"
                    name="name"
                    required
                    className="w-full px-4 py-2 rounded-lg bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label htmlFor="profession" className="block text-sm font-medium mb-2">
                    Profession
                  </label>
                  <input
                    type="text"
                    id="profession"
                    placeholder="Enter your profession"
                    name="profession"
                    required
                    className="w-full px-4 py-2 rounded-lg bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={formData.profession}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    placeholder="Enter your email"
                    name="email"
                    required
                    className="w-full px-4 py-2 rounded-lg bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    placeholder="Enter your phone number"
                    name="phone"
                    required
                    className="w-full px-4 py-2 rounded-lg bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label htmlFor="areaOfInterest" className="block text-sm font-medium mb-2">
                    Area of Interest
                  </label>
                  <select
                    id="areaOfInterest"
                    name="areaOfInterest"
                    required
                    className="w-full px-4 py-2 rounded-lg bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={formData.areaOfInterest}
                    onChange={handleInputChange}
                  >
                    <option value="">Select an area</option>
                    {areasOfInterest.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className={cn(
                    "btn-primary w-full py-3 text-center",
                    isLoading && "opacity-50 cursor-not-allowed"
                  )}
                  disabled={isLoading}
                >
                  {isLoading ? "Registering..." : "Register for Webinar"}
                </button>
              </form>
            </GlassCard>
          </div>
        </div>

        {showSuccessPopup && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 md:p-8 max-w-md w-full border border-green-200 shadow-xl animate-fade-in">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-10 md:w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-2 text-gray-800">Registration Successful!</h3>
                <p className="text-sm md:text-base text-gray-600 mb-4">
                  Thank you for registering for our webinar. You'll be redirected to WhatsApp group in {countdown} seconds.
                </p>
                <div className="w-full bg-green-100 rounded-full h-2.5 mb-6">
                  <div 
                    className="bg-green-500 h-2.5 rounded-full" 
                    style={{ width: `${(countdown / 3) * 100}%`, transition: 'width 1s linear' }}
                  ></div>
                </div>
                <button 
                  className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg transition duration-200"
                  onClick={() => {
                    const whatsappUrl = `https://chat.whatsapp.com/KxIEHoEzq6nBisjU4eEAcD`;
                    window.open(whatsappUrl, "_blank");
                    setShowSuccessPopup(false);
                  }}
                >
                  Join WhatsApp Now
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
      <Footer />
    </>
  );
};

export default WebinarSection;