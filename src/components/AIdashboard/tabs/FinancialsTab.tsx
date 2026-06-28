
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const FinancialsTab = () => {
  return (
    <Card className="glass shadow-sm animate-fade-up">
      <CardHeader>
        <CardTitle>Financial Projections</CardTitle>
        <CardDescription>Revenue forecasts and financial analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Revenue Forecast</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { month: 'Jan', projected: 8000, actual: 7500 },
                    { month: 'Feb', projected: 10000, actual: 9500 },
                    { month: 'Mar', projected: 12000, actual: 12500 },
                    { month: 'Apr', projected: 14000, actual: 13800 },
                    { month: 'May', projected: 16000, actual: 16200 },
                    { month: 'Jun', projected: 18000, actual: 17900 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="projected" name="Projected Revenue" fill="#0088FE" />
                  <Bar dataKey="actual" name="Actual Revenue" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Key Financial Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500">CUSTOMER ACQUISITION COST</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">$120</div>
                  <div className="text-sm text-green-500 flex items-center">
                    <span>12% below industry avg.</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500">LIFETIME VALUE</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">$850</div>
                  <div className="text-sm text-green-500 flex items-center">
                    <span>7:1 LTV to CAC ratio</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500">PAYBACK PERIOD</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">4.5 months</div>
                  <div className="text-sm text-green-500 flex items-center">
                    <span>Strong cash flow potential</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Investment Recommendations</h3>
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1">
                  <h4 className="text-base font-medium mb-2">Initial Investment Requirements</h4>
                  <p className="text-sm text-gray-700 mb-4">
                    Based on our analysis, an initial investment of $250,000 is recommended to achieve market entry and early growth objectives.
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Product Development</span>
                      <span className="font-medium">$100,000</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Marketing & Customer Acquisition</span>
                      <span className="font-medium">$80,000</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Operations & Team</span>
                      <span className="font-medium">$50,000</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Contingency</span>
                      <span className="font-medium">$20,000</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1">
                  <h4 className="text-base font-medium mb-2">Expected Returns</h4>
                  <p className="text-sm text-gray-700 mb-4">
                    With proper execution, this investment is projected to yield the following returns:
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Year 1 ROI</span>
                      <span className="font-medium">35%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Year 2 ROI</span>
                      <span className="font-medium">85%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Break-even Point</span>
                      <span className="font-medium">Month 14</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>5-Year Projected Return</span>
                      <span className="font-medium">4.2x</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialsTab;
