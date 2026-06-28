import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from "@/components/ui/button";
import DownloadManager from '../components/AIdashboard/DownloadManager';
import GenerationStatus from '../components/AIdashboard/GenerationStatus';
import OverviewTab from '../components/AIdashboard/tabs/OverviewTab';
import MarketTab from '../components/AIdashboard/tabs/MarketTab';
import StrategyTab from '../components/AIdashboard/tabs/StrategyTab';
import FinancialsTab from '../components/AIdashboard/tabs/FinancialsTab';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ExpertsSection from '@/components/ExpertsSection';

const AIdashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [generationProgress, setGenerationProgress] = useState(100);
  const [isSubscribed] = useState(false); // Replace with actual subscription check

  return (
    <>
    <Navbar/>
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Growth & Opportunity Assessment</h1>
          {/* <p className="text-gray-500">Market Pulse</p> */}
        </div>
        {/* <div className="mt-4 md:mt-0">
          <DownloadManager />
        </div> */}
      </div>
  
      {/* <GenerationStatus generationProgress={generationProgress} /> */}

      <div className="relative">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="market">Market Analysis</TabsTrigger>
            <TabsTrigger value="strategy">Strategy</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
          </TabsList>
          
          <div className={`relative ${!isSubscribed ? 'max-h-[500px] overflow-hidden' : ''}`}>
            <TabsContent value="overview" className="space-y-6 animate-fade-up">
              <OverviewTab />
            </TabsContent>
            
            <TabsContent value="market" className="animate-fade-up">
              <MarketTab />
            </TabsContent>
            
            <TabsContent value="strategy" className="animate-fade-up">
              <StrategyTab />
            </TabsContent>
            
            <TabsContent value="financials" className="animate-fade-up">
              <FinancialsTab />
            </TabsContent>

            {!isSubscribed && (
              <div className="absolute inset-0 z-10">
                <div className="h-full bg-gradient-to-b from-transparent via-white/30 to-white">
                  <div className="absolute inset-0 backdrop-blur-[2px]" />
                  <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-center p-8 bg-gradient-to-t from-white via-white/95 to-transparent">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                      Unlock Full Access
                    </h3>
                    <p className="text-gray-600 mb-6 text-center max-w-md">
                      Subscribe to view the complete business plan and detailed analysis
                    </p>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Subscribe Now
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Tabs>
      </div>
      {/* <ExpertsSection /> */}
    </div>
    <Footer/>
  </>
  );
};

export default AIdashboard;
