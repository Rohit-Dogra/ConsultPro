
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface GenerationStatusProps {
  generationProgress: number;
}

const GenerationStatus = ({ generationProgress }: GenerationStatusProps) => {
  return (
    <Card className="mb-8 glass shadow-sm">
      <CardHeader>
        <CardTitle>Generation Status</CardTitle>
        <CardDescription>Your business plan has been successfully generated</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Generation Progress</span>
            <span className="text-sm text-gray-500">{generationProgress}%</span>
          </div>
          <Progress value={generationProgress} className="h-2" />
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-green-700">MARKET ANALYSIS</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-green-700">STRATEGY</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-green-700">MARKETING PLAN</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-green-700">FINANCIALS</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GenerationStatus;
