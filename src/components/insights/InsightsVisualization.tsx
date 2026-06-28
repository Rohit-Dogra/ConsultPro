import { useEffect, useRef, useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import { Brain, LineChart, TrendingUp } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";

// Mock data for visualizations
const insightCategories = [
  {
    id: "market",
    label: "Market Trends",
    description: "Analyze current market movements and future projections",
    icon: <TrendingUp className="w-5 h-5" />,
  },
  {
    id: "competitor",
    label: "Competitor Analysis",
    description: "Compare your performance against industry competitors",
    icon: <LineChart className="w-5 h-5" />,
  },
  {
    id: "innovation",
    label: "Innovation Opportunities",
    description: "Discover emerging trends and potential disruptions",
    icon: <Brain className="w-5 h-5" />,
  },
];

// Simplified data visualization component
const DataVisualization = ({ activeCategory }: { activeCategory: string }) => {
  return (
    <div className="h-80 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 relative overflow-hidden">
      {/* Visual elements based on category */}
      {activeCategory === "market" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full">
            {/* Animated graph */}
            <svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="marketGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(79, 70, 229, 0.5)" />
                  <stop offset="100%" stopColor="rgba(79, 70, 229, 0)" />
                </linearGradient>
              </defs>
              <path 
                d="M0,150 C50,120 100,160 150,100 C200,40 250,80 300,60 C350,40 400,80 400,90" 
                fill="none" 
                stroke="rgb(79, 70, 229)" 
                strokeWidth="3"
                className="animate-draw"
              />
              <path 
                d="M0,150 C50,120 100,160 150,100 C200,40 250,80 300,60 C350,40 400,80 400,90 L400,200 L0,200 Z" 
                fill="url(#marketGradient)"
                className="animate-fade-in"
              />
            </svg>
            
            {/* Data points */}
            <div className="absolute left-[12%] top-[60%] w-4 h-4 bg-primary rounded-full animate-pulse-slow" />
            <div className="absolute left-[37%] top-[50%] w-4 h-4 bg-primary rounded-full animate-pulse-slow [animation-delay:0.2s]" />
            <div className="absolute left-[62%] top-[30%] w-4 h-4 bg-primary rounded-full animate-pulse-slow [animation-delay:0.4s]" />
            <div className="absolute left-[87%] top-[45%] w-4 h-4 bg-primary rounded-full animate-pulse-slow [animation-delay:0.6s]" />
          </div>
        </div>
      )}
      
      {activeCategory === "competitor" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="grid grid-cols-3 gap-6 w-full h-full p-4">
            {[
              { label: "Your Company", value: 78, color: "rgb(79, 70, 229)" },
              { label: "Competitor A", value: 65, color: "rgb(99, 102, 241)" },
              { label: "Competitor B", value: 45, color: "rgb(129, 140, 248)" },
            ].map((item, index) => (
              <div key={index} className="flex flex-col items-center justify-end h-full">
                <div 
                  className="w-full bg-white/80 rounded-lg relative"
                  style={{ 
                    height: `${item.value}%`,
                    backgroundColor: item.color,
                    transition: "height 1s ease-out",
                    animationDelay: `${index * 200}ms`
                  }}
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full bg-white px-2 py-1 rounded text-xs font-bold">
                    {item.value}%
                  </div>
                </div>
                <div className="mt-2 text-xs text-center font-medium">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {activeCategory === "innovation" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full">
            {/* Nodes and connections */}
            <svg width="100%" height="100%" viewBox="0 0 400 300">
              <defs>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              
              {/* Connections */}
              <line x1="200" y1="150" x2="100" y2="75" stroke="rgba(79, 70, 229, 0.5)" strokeWidth="2" />
              <line x1="200" y1="150" x2="300" y2="75" stroke="rgba(79, 70, 229, 0.5)" strokeWidth="2" />
              <line x1="200" y1="150" x2="100" y2="225" stroke="rgba(79, 70, 229, 0.5)" strokeWidth="2" />
              <line x1="200" y1="150" x2="300" y2="225" stroke="rgba(79, 70, 229, 0.5)" strokeWidth="2" />
              
              {/* Nodes */}
              <circle cx="200" cy="150" r="25" fill="rgb(79, 70, 229)" filter="url(#glow)" />
              <circle cx="100" cy="75" r="15" fill="rgb(99, 102, 241)" className="animate-pulse-slow" />
              <circle cx="300" cy="75" r="15" fill="rgb(99, 102, 241)" className="animate-pulse-slow [animation-delay:0.5s]" />
              <circle cx="100" cy="225" r="15" fill="rgb(99, 102, 241)" className="animate-pulse-slow [animation-delay:1s]" />
              <circle cx="300" cy="225" r="15" fill="rgb(99, 102, 241)" className="animate-pulse-slow [animation-delay:1.5s]" />
              
              {/* Labels */}
              <text x="200" y="155" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">AI</text>
              <text x="100" y="80" textAnchor="middle" fill="white" fontSize="8">ML</text>
              <text x="300" y="80" textAnchor="middle" fill="white" fontSize="8">IoT</text>
              <text x="100" y="230" textAnchor="middle" fill="white" fontSize="8">AR</text>
              <text x="300" y="230" textAnchor="middle" fill="white" fontSize="8">VR</text>
            </svg>
          </div>
        </div>
      )}
      
      {/* Loading animation overlay */}
      <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 animate-fade-out [animation-fill-mode:forwards]">
        <div className="loading-dots flex">
          <div className="w-2 h-2 bg-primary rounded-full mr-1"></div>
          <div className="w-2 h-2 bg-primary rounded-full mr-1"></div>
          <div className="w-2 h-2 bg-primary rounded-full mr-1"></div>
          <div className="w-2 h-2 bg-primary rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

const InsightsVisualization = () => {
  const [activeCategory, setActiveCategory] = useState("market");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCustomReport = async () => {
    const userSession = localStorage.getItem('user');
    
    if (!userSession) {
      navigate('/subscription-plans');
      return;
    }

    try {
      const user = JSON.parse(userSession);
      const userId = user.user_id || user.id;
      const token = user.token;
      
      // Fetch current subscription status from database
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const userData = await response.json();
        const subscriptionStatus = userData.subscription_status;
        
        // Only allow trial or active users
        if (subscriptionStatus === 'trial' || subscriptionStatus === 'active') {
          navigate('/onboarding');
        } else {
          navigate('/subscription-plans');
        }
      } else {
        navigate('/subscription-plans');
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      navigate('/subscription-plans');
    }
  };

  return (
    <section id="insights" className="section-container relative py-12">
      <div className="text-center mb-8">
        <span className="badge badge-blue mb-4  text-2xl">AI Insights</span>
        <h2 className="section-title">
          Data-Driven <span className="text-gradient">Intelligence</span>
        </h2>
        <p className="section-subtitle mx-auto">
          Our AI-powered platform analyzes vast amounts of industry data to provide 
          actionable insights and recommendations tailored to your needs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Categories sidebar */}
        <div className="lg:col-span-2">
          <GlassCard className="p-6">
            <h3 className="text-xl font-display font-semibold mb-6">
              Insight Categories
            </h3>
            
            <div className="space-y-4">
              {insightCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={cn(
                    "w-full text-left p-4 rounded-lg transition-all flex items-start",
                    activeCategory === category.id
                      ? "bg-primary/10 border-l-4 border-primary"
                      : "hover:bg-secondary"
                  )}
                >
                  <div className={cn(
                    "mr-4 p-2 rounded-lg",
                    activeCategory === category.id
                      ? "bg-primary text-white"
                      : "bg-secondary"
                  )}>
                    {category.icon}
                  </div>
                  
                  <div>
                    <h4 className="font-medium">{category.label}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {category.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="mt-8 p-4 bg-secondary/50 rounded-lg">
              <h4 className="font-medium mb-2">Custom Insights</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Need specialized analysis for your industry? 
                Request a custom insight report from our experts.
              </p>
              <button 
                className="btn-outline text-sm w-full"
                onClick={handleCustomReport}
              >
                AI Business Analysis
              </button>
            </div>
          </GlassCard>
        </div>
        
        {/* Visualization area */}
        <div className="lg:col-span-3">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-display font-semibold">
                {insightCategories.find(c => c.id === activeCategory)?.label} Visualization
              </h3>
              
              <div className="flex space-x-2">
                <button title="Download visualization" aria-label="Download visualization" className="p-2 rounded-lg hover:bg-secondary transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
                
                <button title="Refresh visualization" aria-label="Refresh visualization" className="p-2 rounded-lg hover:bg-secondary transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Dynamic visualization based on selected category */}
            <DataVisualization activeCategory={activeCategory} />
            
            <div className="mt-6">
              <h4 className="font-medium mb-2">Key Takeaways</h4>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-primary mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>AI-generated insights based on analysis of recent industry data</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-primary mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>Trends identified from patterns across multiple data sources</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-primary mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>Recommendations tailored to your specific industry challenges</span>
                </li>
              </ul>
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  );
};

export default InsightsVisualization;
