import ExpertNetwork from "@/components/network/ExpertNetwork";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/SEO/SEOHead";
import { pageSEOConfig } from "@/config/seo";

const Network = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title={pageSEOConfig.network.title}
        description={pageSEOConfig.network.description}
        keywords={pageSEOConfig.network.keywords}
        url="https://expertisestation.com/network"
      />
      <Navbar />
      <div className="pt-2 pb-5">
        <div className="relative">
          {/* Background decoration - subtle grid */}
          <div className="absolute inset-0 bg-[linear-gradient(#f9fafb_2px,transparent_2px),linear-gradient(90deg,#f9fafb_2px,transparent_2px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none -z-10" />
          <ExpertNetwork />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Network;