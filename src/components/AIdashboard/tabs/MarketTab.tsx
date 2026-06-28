
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';

const MarketTab = () => {
  return (
    <Card className="glass shadow-sm animate-fade-up">
      <CardHeader>
        <CardTitle>Detailed Market Analysis</CardTitle>
        <CardDescription>Comprehensive market data and competitive landscape</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Market Overview</h3>
            <p className="text-gray-600">
              The market for this product/service is estimated at $2.5 billion annually with a projected growth rate of 12% over the next five years. Key drivers include technological adoption, changing consumer preferences, and regulatory changes favoring innovative solutions.
            </p>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Competitive Landscape</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Competitor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Market Share</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Strengths</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weaknesses</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Competitor A</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">35%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Strong brand, wide distribution</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Higher pricing, slower innovation</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Competitor B</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">20%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Innovative features, good UX</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Limited market presence, weaker support</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Competitor C</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">10%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Lower pricing, good customer service</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Limited features, smaller team</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Market Trends</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <Zap size={16} className="text-blue-500 mt-1 mr-2 flex-shrink-0" />
                <span className="text-gray-600">Increasing demand for digital-first solutions with mobile capabilities</span>
              </li>
              <li className="flex items-start">
                <Zap size={16} className="text-blue-500 mt-1 mr-2 flex-shrink-0" />
                <span className="text-gray-600">Growing emphasis on sustainability and ethical business practices</span>
              </li>
              <li className="flex items-start">
                <Zap size={16} className="text-blue-500 mt-1 mr-2 flex-shrink-0" />
                <span className="text-gray-600">Shift towards subscription-based models and recurring revenue</span>
              </li>
              <li className="flex items-start">
                <Zap size={16} className="text-blue-500 mt-1 mr-2 flex-shrink-0" />
                <span className="text-gray-600">Integration of AI and machine learning for personalized experiences</span>
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketTab;
