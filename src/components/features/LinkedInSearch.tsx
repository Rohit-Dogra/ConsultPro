import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Search, UserRound, ExternalLink } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface LinkedInProfile {
  name: string;
  headline: string | null;
  location: string | null;
  profileUrl: string;
  currentPosition: string | null;
  company: string | null;
  profileImageUrl: string | null;
}

interface LinkedInSearchProps {
  onProfileSelected?: (profile: LinkedInProfile) => void;
  functionality?: string;
  subcategory?: string;
  autoStartSearch?: boolean;
  requestId?: string;  // Add this prop
}

export function LinkedInSearch({ 
  onProfileSelected, 
  functionality, 
  subcategory,
  autoStartSearch = false,
  requestId
}: LinkedInSearchProps) {
  const [searchTerm, setSearchTerm] = useState(functionality || "");
  const [experienceYears, setExperienceYears] = useState<number>(15);
  const [profiles, setProfiles] = useState<LinkedInProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchComplete, setSearchComplete] = useState(false);
  
  // Auto-trigger search when component mounts if autoStartSearch is true
  useEffect(() => {
    if (autoStartSearch && functionality && !searchComplete) {
      setSearchTerm(functionality);
      handleSearch({ type: 'auto', preventDefault: () => {} } as React.FormEvent);
      setSearchComplete(true);
    }
  }, [autoStartSearch, functionality, searchComplete]);
  
  const handleSearch = async (e: React.FormEvent) => {
    // Prevent form submission if this is a real event (not our synthetic one)
    if (e.type !== 'auto') {
      e.preventDefault();
    }
    
    if (!searchTerm.trim() && !functionality && !subcategory) {
      toast({
        title: "Search parameters required",
        description: "Please enter a name, company, job title, or select a functionality",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Get user token
      const userData = localStorage.getItem("user");
      if (!userData) {
        throw new Error("User not authenticated");
      }
      const user = JSON.parse(userData);
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/experts/linkedin-search`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            name: searchTerm,
            functionality: functionality || searchTerm,
            subcategory: subcategory,
            experienceYears: experienceYears,
            limit: 5,
            requestId: requestId,  // Pass the request ID if available
          }),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setProfiles(data.data);
        
        if (data.data.length === 0) {
          toast({
            title: "No profiles found",
            description: "Try a different search term or adjust the experience filter",
          });
        }
      } else if (data.expertsExist) {
        toast({
          title: "Experts Already Available",
          description: `We found ${data.expertsCount} experts in our database for this functionality.`,
        });
      } else {
        throw new Error(data.message || "Failed to search LinkedIn profiles");
      }
    } catch (error) {
      console.error("LinkedIn search error:", error);
      
      // Handle specific error cases
      if (error.message?.includes('rate limit')) {
        toast({
          title: "Rate limit reached",
          description: "Too many searches. Please try again in a few minutes.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Search failed",
          description: error instanceof Error ? error.message : "Failed to search profiles",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex space-x-2">
        <Input
          placeholder="Search LinkedIn by name, company, or job title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          <span className="ml-2">Search</span>
        </Button>
      </form>
      
      {isLoading ? (
        <div className="text-center py-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2 text-sm text-muted-foreground">Searching LinkedIn profiles...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {profiles.map((profile, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12 border">
                    {profile.profileImageUrl ? (
                      <AvatarImage src={profile.profileImageUrl} alt={profile.name} />
                    ) : (
                      <AvatarFallback>
                        <UserRound className="h-6 w-6" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  <div className="flex-1">
                    <h3 className="font-medium">{profile.name}</h3>
                    {profile.headline && (
                      <p className="text-sm text-muted-foreground">{profile.headline}</p>
                    )}
                    <div className="flex flex-col gap-1 mt-2">
                      {profile.currentPosition && (
                        <p className="text-xs">
                          <span className="font-medium">Current:</span> {profile.currentPosition}
                          {profile.company && ` at ${profile.company}`}
                        </p>
                      )}
                      {profile.location && (
                        <p className="text-xs">
                          <span className="font-medium">Location:</span> {profile.location}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => window.open(profile.profileUrl, "_blank")}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    
                    {onProfileSelected && (
                      <Button
                        size="sm"
                        className="text-xs"
                        onClick={() => onProfileSelected(profile)}
                      >
                        Select
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}