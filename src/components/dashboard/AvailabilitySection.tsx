import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Clock } from 'lucide-react';
import jwt_decode from 'jwt-decode';

interface UserData {
  id: string;  
  token?: string;
  accessToken?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  email: string;
  role?: string;
}

interface ExpertAvailability {
  id?: string;
  user_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  name?: string;
}

interface AvailabilitySectionProps {
  selectedDay: string;
  setSelectedDay: (day: string) => void;
  startTime: string;
  endTime: string;
  onTimeChange: (type: 'start' | 'end', value: string) => void;
  onUpdateAvailability: () => void;
  WEEKDAYS: string[];
  TIME_OPTIONS: string[];
}

interface DecodedToken {
  user_id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const AvailabilitySection: React.FC<AvailabilitySectionProps> = ({
  selectedDay,
  setSelectedDay,
  startTime,
  endTime,
  onTimeChange,
  onUpdateAvailability,
  WEEKDAYS,
  TIME_OPTIONS,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [availabilityData, setAvailabilityData] = useState<ExpertAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Update the getValidatedUserId function to include more debugging
  const getValidatedUserId = (): string => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
        throw new Error('User session not found');
    }

    const user = JSON.parse(storedUser);
    const token = user.token || user.accessToken;

    if (!token) {
        throw new Error('Auth token not found');
    }

    const decoded: DecodedToken = jwt_decode(token);
    
    console.log('Debug - Token validation:', {
        storedId: user.id,
        tokenUserId: decoded.user_id,
        tokenRole: decoded.role,
        tokenEmail: decoded.email
    });

    // Always use the token's user_id
    if (user.id !== decoded.user_id) {
        console.log('Syncing user ID with token');
        user.id = decoded.user_id;
        localStorage.setItem('user', JSON.stringify(user));
    }

    return decoded.user_id;
};

  const fetchAvailability = async () => {
    try {
        setIsLoading(true);
        const userId = getValidatedUserId();
        const storedUser = localStorage.getItem('user');
        
        if (!storedUser) {
            throw new Error('User session not found');
        }

        const user = JSON.parse(storedUser);
        const token = user.token || user.accessToken;

        console.log('Debug - Fetching availability:', {
            userId,
            token: token ? `${token.substring(0, 10)}...` : null,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'X-User-Id': userId
            }
        });

        // Updated to include user_id as query parameter
        const response = await fetch(`${API_BASE_URL}/api/experts/availability?user_id=${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'X-User-Id': userId
            }
        });

        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
            console.error('Invalid content type:', contentType);
            throw new Error('Invalid response from server');
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch availability');
        }

        const result = await response.json();

        if (Array.isArray(result.data)) {
            console.log('✅ Found availability slots:', {
                count: result.data.length,
                userId,
                slots: result.data
            });
            setAvailabilityData(result.data);
        }

    } catch (error) {
        console.error('❌ Error fetching availability:', error);
        toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to load availability",
            variant: "destructive",
        });
    } finally {
        setIsLoading(false);
    }
};

  const handleUpdateAvailability = async () => {
    if (!selectedDay || !startTime || !endTime) {
      toast({
        title: "Error",
        description: "Please select all time slot details",
        variant: "destructive",
      });
      return;
    }

    if (startTime >= endTime) {
      toast({
        title: "Error",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);

    try {
        const userId = getValidatedUserId();
        const storedUser = localStorage.getItem('user');
        
        if (!storedUser) {
            throw new Error('User session not found');
        }

        const user = JSON.parse(storedUser);
        const token = user.token || user.accessToken;

        console.log('Debug - Updating availability:', {
            userId,
            day: selectedDay,
            startTime,
            endTime
        });

        const response = await fetch(`${API_BASE_URL}/api/experts/availability`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-User-Id': userId
            },
            body: JSON.stringify({
                user_id: userId, // Use the validated ID from token
                day_of_week: selectedDay,
                start_time: startTime,
                end_time: endTime,
                name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim()
            })
        });

        // Add error handling for non-JSON responses
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
            throw new Error('Invalid response from server');
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update availability');
        }

        const result = await response.json();

        toast({
            title: "Success",
            description: result.message || `Availability for ${selectedDay} updated successfully`
        });

        await fetchAvailability();
        onUpdateAvailability();

    } catch (error) {
        console.error('❌ Error updating availability:', error);
        toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to update availability",
            variant: "destructive",
        });
    } finally {
        setIsUpdating(false);
    }
};

  useEffect(() => {
    fetchAvailability();
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Select value={selectedDay} onValueChange={setSelectedDay}>
          <SelectTrigger>
            <SelectValue placeholder="Select day" />
          </SelectTrigger>
          <SelectContent>
            {WEEKDAYS.map((day) => (
              <SelectItem key={day} value={day}>{day}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={startTime} onValueChange={(value) => onTimeChange('start', value)}>
          <SelectTrigger>
            <Clock className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Start time" />
          </SelectTrigger>
          <SelectContent>
            {TIME_OPTIONS.map((time) => (
              <SelectItem key={time} value={time}>{time}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={endTime} onValueChange={(value) => onTimeChange('end', value)}>
          <SelectTrigger>
            <Clock className="mr-2 h-4 w-4" />
            <SelectValue placeholder="End time" />
          </SelectTrigger>
          <SelectContent>
            {TIME_OPTIONS.map((time) => (
              <SelectItem key={time} value={time}>{time}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button onClick={handleUpdateAvailability} disabled={!selectedDay || isUpdating} className="w-full">
        {isUpdating ? (
          <>
            <span className="animate-spin mr-2">⌛</span> Updating...
          </>
        ) : (
          'Update Availability'
        )}
      </Button>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">Current Availability</h3>
        {isLoading ? (
          <div className="text-center py-4">Loading schedule...</div>
        ) : availabilityData.length > 0 ? (
          <div className="space-y-2">
            {availabilityData.map((slot) => (
              <div key={slot.day_of_week} className="flex justify-between items-center p-3 bg-secondary rounded-lg">
                <div className="space-y-1">
                  <div className="font-medium">{slot.day_of_week}</div>
                </div>
                <div className="text-muted-foreground">{slot.start_time} - {slot.end_time}</div>
              </div>
            ))}
          </div>    
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            No availability schedule found. Add your first schedule above.
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailabilitySection;
