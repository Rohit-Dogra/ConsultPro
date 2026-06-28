import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle } from "lucide-react";

interface SessionRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Functionality {
  id: number;
  option_value: string;
  display_name: string;
}

interface BusinessObjective {
  id: number;
  name: string;
  description: string;
  function_id: number;
}

export function SessionRequestForm({ isOpen, onClose }: SessionRequestFormProps) {
  const navigate = useNavigate();
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [functionalities, setFunctionalities] = useState<Functionality[]>([]);
  const [objectives, setObjectives] = useState<BusinessObjective[]>([]);
  const [selectedFunctionality, setSelectedFunctionality] = useState("");
  const [customFunctionality, setCustomFunctionality] = useState("");
  const [selectedObjectives, setSelectedObjectives] = useState<number[]>([]);
  const [loadingFunctionalities, setLoadingFunctionalities] = useState(true);
  const [loadingObjectives, setLoadingObjectives] = useState(true);
  const [selectedFunctionalityId, setSelectedFunctionalityId] = useState<number | null>(null);

  const getAuthToken = () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return null;
      
      const user = JSON.parse(userData);
      // Handle different token formats - some systems use token, others use accessToken
      return user.token || user.accessToken || null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = getAuthToken();
      if (!token) {
        console.error('No authentication token found');
        setLoadingFunctionalities(false);
        setLoadingObjectives(false);
        
        // Redirect to login if not authenticated
        navigate('/auth/seeker', { 
          state: { from: window.location.pathname }
        });
        return;
      }

      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL;
        console.log('Fetching with token (first 10 chars):', token.substring(0, 10) + '...');
        
        // Ensure token is properly formatted with Bearer prefix
        const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        
        const response = await fetch(`${API_BASE_URL}/api/business-plans/seeker-profile`, {
          method: 'GET',
          headers: {
            'Authorization': authToken,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        // Log response status for debugging
        console.log('Response status:', response.status, response.statusText);
        
        if (!response.ok) {
          if (response.status === 401) {
            navigate('/auth/seeker', { 
              state: { from: window.location.pathname }
            });
            return;
          }
          
          // Try to get error details from response
          const errorText = await response.text();
          console.error('Error response:', errorText);
          
          throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          const { functionalities, objectives } = data.data;
          
          console.log('Fetched functionalities:', functionalities);
          console.log('Fetched objectives:', objectives);
          
          setFunctionalities(functionalities || []);
          setObjectives(objectives || []);
        } else {
          throw new Error(data.message || 'Failed to fetch data');
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load business areas",
          variant: "destructive",
        });
      } finally {
        setLoadingFunctionalities(false);
        setLoadingObjectives(false);
      }
    };

    // Only fetch data when dialog is open
    if (isOpen) {
      fetchData();
    }
  }, [navigate, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Add smooth scrolling to top immediately when submit is clicked
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Validation
    if (!selectedFunctionality) {
      toast({
        title: "Missing Information",
        description: "Please select a business area",
        variant: "destructive",
      });
      return;
    }

    if (selectedFunctionality === 'others' && !customFunctionality.trim()) {
      toast({
        title: "Missing Information",
        description: "Please specify your business area",
        variant: "destructive",
      });
      return;
    }

    // Only require sub-business areas if they exist for the selected functionality
    if (selectedFunctionality !== 'others' && filteredObjectives.length > 0 && selectedObjectives.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select at least one sub-business area",
        variant: "destructive",
      });
      return;
    }

    if (!problem.trim()) {
      toast({
        title: "Missing Information",
        description: "Please describe your challenges",
        variant: "destructive",
      });
      return;
    }

    if (!solution.trim()) {
      toast({
        title: "Missing Information",
        description: "Please describe your desired solution",
        variant: "destructive",
      });
      return;
    }
    
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    const token = getAuthToken();
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please login to schedule a session",
        variant: "destructive",
      });
      navigate('/auth/seeker', { 
        state: { from: window.location.pathname }
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const isCustom = selectedFunctionality === 'others';
      const functionality = isCustom ? customFunctionality : selectedFunctionality;
      
      // Find the functionality_id for the selected functionality
      let functionalityId = null;
      if (!isCustom) {
        const selectedFunc = functionalities.find(f => f.option_value === selectedFunctionality);
        functionalityId = selectedFunc?.id || null;
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL;
      
      // Prepare data payload according to existing database schema
      const requestData = {
        problem_statement: problem.trim(),
        desired_solution: solution.trim(),
        functionality: functionality,
        is_custom_functionality: isCustom,
        selected_objectives: selectedObjectives,
        functionality_id: functionalityId
      };

      console.log('Submitting session request with data:', requestData);
      
      const response = await fetch(`${API_BASE_URL}/api/session-requests`, {
        method: 'POST',
        headers:
         {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Session request submission failed:', {
          status: response.status,
          statusText: response.statusText,
          result
        });
        throw new Error(result.message || `HTTP ${response.status}: Failed to submit request`);
      }

      if (result.success) {
        console.log('✅ Session request submitted successfully:', {
          requestId: result.data.id,
          functionalityId: selectedFunctionalityId,
          objectivesCount: selectedObjectives.length,
          selectedObjectives: selectedObjectives // Add this for better debugging
        });

        toast({
          title: "Request Submitted Successfully",
          description: `Your request has been submitted with ${selectedObjectives.length} sub-areas selected. Redirecting you to our experts page...`,
        });

        // Clear form data
        setProblem("");
        setSolution("");
        setSelectedFunctionality("");
        setCustomFunctionality("");
        setSelectedObjectives([]);
        setSelectedFunctionalityId(null);

        // Close dialog
        onClose();

        // Redirect to experts page with request context
        setTimeout(() => {
          const queryParams = new URLSearchParams({
            request_id: result.data.id,
            ...(selectedFunctionalityId && { functionality_id: selectedFunctionalityId.toString() }),
            source: 'session_request'
          });
          
          // Navigate to experts page
          navigate(`/experts?${queryParams.toString()}`);
          
          // Add a second timeout to ensure scroll happens after navigation
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 100);
        }, 1000);
        
      } else {
        throw new Error(result.message || 'Failed to submit request');
      }
      
    } catch (error) {
      console.error('❌ Session request submission error:', error);
      
      // Enhanced error handling
      let errorMessage = "Failed to submit request";
      
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          errorMessage = "Session expired. Please login again.";
          navigate('/auth/seeker', { 
            state: { from: window.location.pathname }
          });
          return;
        } else if (error.message.includes('403')) {
          errorMessage = "You don't have permission to submit requests.";
        } else if (error.message.includes('429')) {
          errorMessage = "Too many requests. Please try again later.";
        } else if (error.message.includes('500')) {
          errorMessage = "Server error. Please try again later.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Submission Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFunctionalityChange = (value: string) => {
    setSelectedFunctionality(value);
    // Clear selected objectives when functionality changes
    setSelectedObjectives([]);
    
    if (value !== 'others') {
      // Find the functionality ID from the selected option_value
      const selectedFunc = functionalities.find(f => f.option_value === value);
      setSelectedFunctionalityId(selectedFunc?.id || null);
      setCustomFunctionality('');
    } else {
      setSelectedFunctionalityId(null);
    }
  };

  const handleObjectiveToggle = (objectiveId: number) => {
    setSelectedObjectives(prev => {
      if (prev.includes(objectiveId)) {
        return prev.filter(id => id !== objectiveId);
      } else {
        return [...prev, objectiveId];
      }
    });
  };

  // Filter objectives based on selected functionality
  const filteredObjectives = objectives.filter(obj => {
    const selectedFunctionId = functionalities.find(
      f => f.option_value === selectedFunctionality
    )?.id;
    
    return obj.function_id === selectedFunctionId;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule an Expert Session</DialogTitle>
          <DialogDescription>
            Select your business areas and describe your challenges to get matched with the right expert
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Function Area */}
          <div className="space-y-3">
            <Label htmlFor="functionality">Business Function Area</Label>
            <Select
              value={selectedFunctionality}
              onValueChange={handleFunctionalityChange}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select business function area" />
              </SelectTrigger>
              <SelectContent>
                {loadingFunctionalities ? (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : (
                  <>
                    {functionalities.map((func) => (
                      <SelectItem key={func.id} value={func.option_value}>
                        {func.display_name}
                      </SelectItem>
                    ))}
                    <SelectItem value="others">Others</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Choose the primary area where you're facing problems
            </p>
          </div>

          {/* Custom Functionality */}
          {selectedFunctionality === 'others' && (
            <div className="space-y-2">
              <Label htmlFor="customFunctionality">Specify Your Business Function Area</Label>
              <Textarea
                id="customFunctionality"
                placeholder="Please describe your specific business function area..."
                value={customFunctionality}
                onChange={(e) => setCustomFunctionality(e.target.value)}
                className="min-h-[60px] resize-none"
                required
              />
            </div>
          )}

          {/* Sub-Business Areas */}
          {selectedFunctionality && selectedFunctionality !== 'others' && filteredObjectives.length > 0 && (
            <div className="space-y-4">
              <div>
                <Label>Sub-Business Areas</Label>
                <p className="text-sm text-gray-500 mb-3">
                  Select the specific areas where you need expert guidance
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto">
                {loadingObjectives ? (
                  <div className="text-center py-4 text-gray-500">
                    Loading sub-areas...
                  </div>
                ) : (
                  filteredObjectives.map((objective) => (
                    <div
                      key={objective.id}
                      onClick={() => handleObjectiveToggle(objective.id)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        selectedObjectives.includes(objective.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`mt-1 w-4 h-4 rounded-full flex items-center justify-center ${
                          selectedObjectives.includes(objective.id)
                            ? 'bg-blue-500'
                            : 'border-2 border-gray-300'
                        }`}>
                          {selectedObjectives.includes(objective.id) && (
                            <CheckCircle className="text-white" size={12} />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 text-sm">{objective.name}</h4>
                          <p className="text-xs text-gray-500 mt-1">{objective.description}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Show message if no sub-areas available */}
          {selectedFunctionality && selectedFunctionality !== 'others' && filteredObjectives.length === 0 && !loadingObjectives && (
            <div className="text-center py-4 text-gray-500 border border-gray-200 rounded-lg">
              <p>No sub-areas available for the selected business function.</p>
              <p className="text-sm mt-1">You can continue with describing your challenges below.</p>
            </div>
          )}

          {/* Problem Statement */}
          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="problem">What challenges are you facing?</Label>
            <Textarea
              id="problem"
              placeholder="Based on your selected business areas, describe your specific challenges..."
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              className="min-h-[100px]"
              required
            />
          </div>

          {/* Desired Solution */}
          <div className="space-y-2">
            <Label htmlFor="solution">What solution are you looking for?</Label>
            <Textarea
              id="solution"
              placeholder="Describe your desired outcome or solution..."
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              className="min-h-[100px]"
              maxLength={200}
              required
            />
            <div className="text-sm text-muted-foreground text-right">
              {solution.length}/200 characters
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}