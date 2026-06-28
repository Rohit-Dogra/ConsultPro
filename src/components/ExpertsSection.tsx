import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import ExpertCard, { ExpertProps } from './ExpertCard';
import { useLocation } from 'react-router-dom';

interface LocationState {
  selectedFunctionality?: number | null;
  fromOnboarding?: boolean;
}

const ExpertsSection = () => {
  const location = useLocation();
  const { selectedFunctionality, fromOnboarding } = location.state as LocationState || {};
  
  const [experts, setExperts] = useState<ExpertProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add functionality filter state
  const [currentFunctionality, setCurrentFunctionality] = useState<number | null>(
    selectedFunctionality || null
  );

  useEffect(() => {
    const fetchExperts = async () => {
      const API_BASE_URL = import.meta.env.VITE_API_URL;
      try {
        // Add functionality filter to URL if present
        const url = new URL(`${API_BASE_URL}/api/experts/profiles`);
        if (currentFunctionality) {
          url.searchParams.append('functionality_id', currentFunctionality.toString());
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error('Failed to fetch expert profiles');
        }
        
        const result = await response.json();
        if (result.success) {
          const transformedExperts = result.data.map((expert: any) => ({
            id: expert.id,
            firstName: expert.first_name,
            lastName: expert.last_name,
            title: expert.designation,
            expertise: expert.expertise.split(',').map((area: string) => area.trim()),
            rating: parseFloat(expert.rating || "New"),
            reviews: parseInt(expert.reviews || "0"),
            imageUrl: expert.imageUrl,
            available: expert.available || Math.random() > 0.5,
            work_experience: expert.work_experience,
            areas_of_help: expert.areas_of_help,
            currentOrganization: expert.current_organization,
            location: expert.location,
            functionalities: expert.functionalities || []
          }));
          setExperts(transformedExperts);
        } else {
          throw new Error(result.message || 'Failed to load expert profiles');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load expert profiles');
        setExperts(sampleExperts);
      } finally {
        setLoading(false);
      }
    };

    fetchExperts();
  }, [currentFunctionality]); // Add currentFunctionality as dependency

  // Add useEffect to handle initial functionality from navigation
  useEffect(() => {
    if (fromOnboarding && selectedFunctionality) {
      setCurrentFunctionality(selectedFunctionality);
    }
  }, [fromOnboarding, selectedFunctionality]);

  if (loading) {
    return (
      <Card className="glass shadow-sm">
        <CardContent className="flex justify-center items-center min-h-[300px]">
          <div className="animate-pulse text-center">
            <p className="text-muted-foreground">Loading experts...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="glass shadow-sm">
        <CardContent className="flex justify-center items-center min-h-[300px]">
          <div className="text-center text-red-500">
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Update the card header to show filtered status
  return (
    <Card className="glass shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-medium">
            {currentFunctionality ? 'Filtered Experts' : 'Suggested Experts'}
          </CardTitle>
          <CardDescription>
            {currentFunctionality 
              ? 'Experts matching your business function'
              : 'Business professionals who can help refine your plan'}
          </CardDescription>
        </div>
        {currentFunctionality && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setCurrentFunctionality(null)}
            className="text-blue-500 hover:text-blue-700 p-0"
          >
            
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {experts.slice(0, 6).map((expert) => (
            <ExpertCard
              key={expert.id}
              {...expert}
              lastName={expert.lastName}
              work_experience={expert.work_experience}
              areas_of_help={expert.areas_of_help}
            />
          ))}
        </div>
      </CardContent>
      
    </Card>
  );
};

// Fallback sample data
const sampleExperts: ExpertProps[] = [
  {
    id: '1',
    name: 'Sarah',
    lastName: 'Chen',
    title: 'Market Strategy Consultant',
    expertise: ['Market Analysis', 'Growth Strategy', 'Competitive Intelligence'],
    rating: 4.9,
    reviews: 124,
    imageUrl: undefined,
    available: true,
    work_experience: 15,
    areas_of_help: 'Strategic Planning, Market Research, Competitive Analysis',
    current_organization: 'Strategic Consulting Inc.',
    location: 'San Francisco, CA'
  },
  {
    id: '2',
    name: 'Marcus',
    lastName: 'Johnson',
    title: 'Financial Advisor',
    expertise: ['Financial Projections', 'Investment Planning', 'Funding'],
    rating: 4.8,
    reviews: 98,
    imageUrl: undefined,
    available: false,
    work_experience: 10,
    areas_of_help: 'Investment Strategies, Risk Management, Portfolio Diversification',
    current_organization: 'Wealth Management LLC',
    location: 'New York, NY'
  },
  {
    id: '3',
    name: 'Amelia',
    lastName: 'Rodriguez',
    title: 'Marketing Specialist',
    expertise: ['Digital Marketing', 'Brand Strategy', 'Customer Acquisition'],
    rating: 4.7,
    reviews: 87,
    imageUrl: undefined,
    available: true,
    work_experience: 8,
    areas_of_help: 'SEO, Content Marketing, Social Media Strategy',
    current_organization:  'Creative Agency',
    location: 'Los Angeles, CA'
  }
];

export default ExpertsSection;
