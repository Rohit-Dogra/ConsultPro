
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, Check } from 'lucide-react';

interface InsightSectionProps {
  title: string;
  icon: React.ReactNode;
  insights: string[];
}

const InsightSection = ({ title, icon, insights }: InsightSectionProps) => {
  return (
    <Card className="glass shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
            {icon}
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {insights.map((insight, index) => (
            <motion.li 
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-start"
            >
              <Check size={16} className="text-green-500 mt-1 mr-2 flex-shrink-0" />
              <span className="text-sm text-gray-700">{insight}</span>
            </motion.li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="pt-0">
        <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-700 p-0">
          View detailed analysis <ChevronRight size={16} className="ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default InsightSection;
