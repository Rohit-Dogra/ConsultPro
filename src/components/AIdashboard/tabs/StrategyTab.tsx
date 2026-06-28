
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const StrategyTab = () => {
  return (
    <Card className="glass shadow-sm animate-fade-up">
      <CardHeader>
        <CardTitle>Strategic Recommendations</CardTitle>
        <CardDescription>Tailored business strategies based on your specific goals</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Positioning Strategy</h3>
            <p className="text-gray-600">
              Position your business as a premium alternative with superior user experience and advanced features that justify a 15-20% price premium. Emphasize quality, reliability, and the innovative aspects that differentiate your offering from competitors.
            </p>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Growth Opportunities</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-blue-50 border-blue-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Market Expansion</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">
                    Target adjacent markets with similar needs. Consider geographical expansion to regions with high growth potential.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-blue-50 border-blue-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Product Development</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">
                    Develop complementary products or services to increase lifetime value of existing customers.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-blue-50 border-blue-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Strategic Partnerships</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">
                    Form alliances with complementary businesses to expand reach and create bundled offerings.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Implementation Timeline</h3>
            <div className="relative">
              <div className="absolute left-4 h-full w-0.5 bg-blue-100"></div>
              
              <div className="relative pl-12 pb-8">
                <div className="absolute left-0 rounded-full bg-blue-500 text-white w-8 h-8 flex items-center justify-center">Q1</div>
                <h4 className="text-base font-medium mb-1">Initial Market Entry</h4>
                <p className="text-sm text-gray-600">Launch core product, establish brand presence, and begin customer acquisition campaigns.</p>
              </div>
              
              <div className="relative pl-12 pb-8">
                <div className="absolute left-0 rounded-full bg-blue-500 text-white w-8 h-8 flex items-center justify-center">Q2</div>
                <h4 className="text-base font-medium mb-1">Expand Feature Set</h4>
                <p className="text-sm text-gray-600">Release additional features based on early customer feedback and market response.</p>
              </div>
              
              <div className="relative pl-12 pb-8">
                <div className="absolute left-0 rounded-full bg-blue-500 text-white w-8 h-8 flex items-center justify-center">Q3</div>
                <h4 className="text-base font-medium mb-1">Scale Operations</h4>
                <p className="text-sm text-gray-600">Increase marketing budget, expand team, and optimize customer acquisition funnel.</p>
              </div>
              
              <div className="relative pl-12">
                <div className="absolute left-0 rounded-full bg-blue-500 text-white w-8 h-8 flex items-center justify-center">Q4</div>
                <h4 className="text-base font-medium mb-1">Evaluate & Adjust</h4>
                <p className="text-sm text-gray-600">Analyze performance metrics, refine strategy, and prepare for next phase of growth.</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StrategyTab;
