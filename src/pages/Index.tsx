import HeroSection from "@/components/hero/HeroSection";
import ExpertNetwork from "@/components/network/ExpertNetwork";
import FeatureCards from "@/components/features/FeatureCards";
import InsightsVisualization from "@/components/insights/InsightsVisualization";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AIChat from "@/components/AIChat";
import SEOHead from "@/components/SEO/SEOHead";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Expertisestation | Connect with Industry Experts"
        description="Your premier destination for professional expertise. Connect with industry experts, share knowledge, and accelerate your professional development journey."
        keywords="expertise platform, industry experts, professional development, knowledge sharing, business consultation, expert network, skill development"
        url="https://expertisestation.com"
        type="website"
      />
      <Navbar />
      <HeroSection />
      
      <div className="relative -mt-16">
        {/* Background decoration - subtle grid */}
        <div className="absolute inset-0 bg-[linear-gradient(#f9fafb_2px,transparent_2px),linear-gradient(90deg,#f9fafb_2px,transparent_2px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none -z-10" />
        <div className="space-y-8">
          <ExpertNetwork />
          <FeatureCards />
          <InsightsVisualization />
          <AIChat />
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Index;
