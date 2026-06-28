
import React from 'react';
import { BarChartIcon, TrendingUp, Users } from 'lucide-react';
import MarketShareChart from '../MarketShareChart';
import GrowthChart from '../GrowthChart';
import InsightSection from '../InsightSection';
import ExpertsSection from '../../ExpertsSection';

const OverviewTab = () => {
  return (
    <div className="space-y-6 animate-fade-up">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MarketShareChart />
        <GrowthChart />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InsightSection
          title="Market Insights" 
          icon={<BarChartIcon size={20} className="text-blue-500" />}
          insights={[
            "Market size estimated at $2.5 billion with 12% annual growth",
            "Identified 3 primary competitors with similar offerings",
            "Customer acquisition cost is 20% lower than industry average"
          ]}
        />
        
        <InsightSection
          title="Strategy Recommendations" 
          icon={<TrendingUp size={20} className="text-blue-500" />}
          insights={[
            "Focus on premium segment with higher profit margins",
            "Develop partnership with complementary service providers",
            "Implement subscription-based revenue model"
          ]}
        />
        
        <InsightSection
          title="Customer Insights" 
          icon={<Users size={20} className="text-blue-500" />}
          insights={[
            "Primary demographic: professionals aged 25-45",
            "Customer retention rate projected at 65%",
            "Key acquisition channels: social media and referrals"
          ]}
        />
      </div>
      
      <ExpertsSection />
    </div>
  );
};

export default OverviewTab;
