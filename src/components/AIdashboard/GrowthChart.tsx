
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const growthData = [
  { name: 'Jan', revenue: 4000, customers: 2400 },
  { name: 'Feb', revenue: 3000, customers: 1398 },
  { name: 'Mar', revenue: 2000, customers: 9800 },
  { name: 'Apr', revenue: 2780, customers: 3908 },
  { name: 'May', revenue: 1890, customers: 4800 },
  { name: 'Jun', revenue: 2390, customers: 3800 },
];

const GrowthChart = () => {
  return (
    <Card className="glass shadow-sm">
      <CardHeader>
        <CardTitle>Growth Projection</CardTitle>
        <CardDescription>Projected revenue and customer growth</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={growthData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="revenue" fill="#0088FE" name="Revenue" />
            <Bar dataKey="customers" fill="#00C49F" name="Customers" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default GrowthChart;
