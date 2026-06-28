import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserRound, Star, Loader2 } from 'lucide-react';
 
export interface ExpertProps {
  id: string;
  name: string;
  lastName: string;
  title: string;
  expertise: string[];
  rating: number;
  reviews: number;
  imageUrl?: string;
  available: boolean;
  work_experience: number;
  areas_of_help: string;
  user_id?: string;
  designation?: string;
  current_organization?: string;
  location?: string;
  loading?: boolean;
  error?: string | null;
  functionalities?: {
    id: number;
    display_name: string;
  }[];
}

const ExpertCard = ({ 
  id,
  name, 
  lastName,
  title, 
  expertise, 
  rating, 
  reviews, 
  imageUrl, 
  available,
  work_experience,
  areas_of_help,
}: ExpertProps) => {
  const navigate = useNavigate();
  const [expertData, setExpertData] = useState<ExpertProps | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExpertData = async () => {
      try {
        setDataLoading(true);
        const API_BASE_URL = import.meta.env.VITE_API_URL;
        const response = await fetch(`${API_BASE_URL}/api/experts/profiles/${id}`);

        if (!response.ok) {
          throw new Error(response.status === 404 ? 'Expert profile not found' : 'Failed to fetch expert data');
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || 'Failed to load expert data');
        }

        setExpertData({
          id: data.data.id,
          name: data.data.first_name,
          lastName: data.data.last_name,
          title: data.data.designation,
          expertise: data.data.expertise?.split(',').map((e: string) => e.trim()) || [],
          rating: parseFloat(data.data.rating) || 0,
          reviews: parseInt(data.data.review_count) || 0,
          imageUrl: data.data.profile_image || '',
          available: Boolean(data.data.is_available),
          work_experience: parseInt(data.data.work_experience) || 0,
          areas_of_help: data.data.areas_of_help || '',
          user_id: data.data.user_id,
          current_organization: data.data.current_organization,
          location: data.data.location,
          functionalities: data.data.functionalities || [],
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching expert:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch expert data');
      } finally {
        setDataLoading(false);
      }
    };

    if (id) {
      fetchExpertData();
    }
  }, [id]);

  if (dataLoading) {
    return (
      <Card className="overflow-hidden transition-all hover:shadow-md">
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="text-sm text-muted-foreground">Loading expert data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="overflow-hidden transition-all hover:shadow-md">
        <CardContent className="p-8">
          <div className="text-center space-y-2">
            <p className="text-red-500 text-sm">{error}</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.reload()}
            >
              Try again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayData = expertData || {
    id,
    name,
    lastName,
    title,
    expertise,
    rating,
    reviews,
    imageUrl,
    available,
    work_experience,
    areas_of_help,
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-gray-100">
              {displayData.imageUrl ? (
                <AvatarImage src={displayData.imageUrl} alt={displayData.name} />
              ) : (
                <AvatarFallback className="bg-blue-50 text-blue-500">
                  <UserRound size={18} />
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <CardDescription className="text-xs">{displayData.title}</CardDescription>
            </div>
          </div>
          <div className="flex items-center text-sm">
            <Star className="h-4 w-4 text-yellow-400 mr-1" />
            <span className="font-medium">{rating.toFixed(1)}</span>
            <span className="text-gray-400 text-xs ml-1">({reviews})</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex flex-wrap gap-1.5 mb-4">
          {expertise.map((skill, index) => (
            <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100">
              {skill}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {displayData.functionalities?.map((func) => (
            <Badge 
              key={func.id} 
              variant="secondary" 
              className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100"
            >
              {func.display_name}
            </Badge>
          ))}
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">About</h3>
          <p className="text-sm text-muted-foreground">
            With {displayData.work_experience} years of experience in {displayData.expertise.join(', ')}, 
            I specialize in providing expert guidance in {displayData.areas_of_help}.
          </p>
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex justify-between items-center">
        {/* <Badge 
          variant={available ? "outline" : "secondary"} 
          className={available ? "text-green-600 border-green-200 bg-green-50" : "text-gray-500"}
        >
          {available ? "Available Now" : "Available in 2-3 days"}
        </Badge> */}
        <Button 
          size="sm" 
          variant="outline" 
          className="text-blue-600 border-blue-200 hover:bg-blue-50"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            navigate(`/experts/${displayData.id}`);
          }}
        >
          View Full Profile
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ExpertCard;
