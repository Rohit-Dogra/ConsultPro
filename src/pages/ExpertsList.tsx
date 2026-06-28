import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardHeader, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import GlassCard from "@/components/ui/GlassCard";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, UserRound, Search, AlertCircle, Play, Phone, MessageCircle, Calendar, MapPin, GraduationCap, Building2, Award, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { LinkedInSearch } from "@/components/features/LinkedInSearch";
import { UserPlus, ExternalLink, Loader2, UserX } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import PreferencesModal from '@/components/modals/PreferencesModal';
import { useCurrencyTimezone } from '@/components/contexts/CurrencyTimezoneContext';
import { API_BASE_URL } from '@/config/api';
import { trackBrowseEngagement, trackExpertBooked, fetchExpertProfileViewCounts } from '@/services/recommendationEngine';
import { useFlowCheckpoint } from '@/hooks/useFlowCheckpoint';

interface SessionRequest {
  id: string;
  problem_statement: string;
  desired_solution: string;
  expert_filter_result?: 'found' | 'not_found';
}

interface Expert {
  id: string;
  user_id: string;
  firstName: string;
  first_name?: string;
  lastName: string;
  last_name?: string;
  designation: string;
  expertise: string[] | string;
  rating: number;
  reviews: number;
  feedbacks?: {
    rating: number;
    review: string;
    created_at: string;
  }[];
  imageUrl?: string;
  image_url?: string;
  work_experience: number; 
  workExperience: number; 
  currentOrganization: string;
  current_organization?: string;
  location: string;
  areas_of_help: string;
  about?: string;
  bio?: string;
  audio_pricing?: number;
  total_sessions?: number;
  years_of_experience?: number;
  highest_education?: string;
  youtube_url?: string;
  profile_image?: string;
}

interface Functionality {
  id: number;
  display_name: string;
  option_value: string;
}

export default function ExpertsList() {
  const { saveCheckpoint } = useFlowCheckpoint();
  // State for storing expert availability
  const [availability, setAvailability] = useState<any[]>([]);
  // State for storing existing bookings for the selected expert
  const [existingBookings, setExistingBookings] = useState<any[]>([]);
  // Fetch expert availability from API
  const fetchAvailability = useCallback(async (userId: string) => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        return;
      }
      const parsedUserData = JSON.parse(userData);
      const token = parsedUserData.token || parsedUserData.accessToken;
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/experts/availability?user_id=${encodeURIComponent(userId)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAvailability(data.data || []);
      } else {
        setAvailability([]);
      }
    } catch (err) {
      setAvailability([]);
    }
  }, []);

  // Fetch existing bookings for expert from API
  const fetchExistingBookings = useCallback(async (expertId: string) => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        return;
      }
      const parsedUserData = JSON.parse(userData);
      const token = parsedUserData.token || parsedUserData.accessToken;
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings/expert/${encodeURIComponent(expertId)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setExistingBookings(data.data);
      } else {
        setExistingBookings([]);
      }
    } catch (err) {
      setExistingBookings([]);
    }
  }, []);

  // Check if a slot is booked (robust logic)
  const getSlotBookingStatus = useCallback((date: string, startTime: string, endTime: string) => {
    const slotDate = date;
    const slotStart = convertTo24Hour(startTime);
    const slotEnd = convertTo24Hour(endTime);
    const overlappingBooking = existingBookings.find(booking => {
      const bookingStart = convertTo24Hour(booking.start_time);
      const bookingEnd = convertTo24Hour(booking.end_time);
      return booking.date === slotDate && (
        (bookingStart <= slotStart && bookingEnd > slotStart) ||
        (bookingStart < slotEnd && bookingEnd >= slotEnd) ||
        (slotStart <= bookingStart && slotEnd >= bookingEnd)
      );
    });
    if (overlappingBooking) {
      // Only block if status is not completed/draft/rejected/cancelled
      if (["completed", "draft", "rejected", "cancelled"].includes(overlappingBooking.status)) return { isBooked: false };
      return { isBooked: true, status: overlappingBooking.status };
    }
    return { isBooked: false };
  }, [existingBookings]);
  // ...existing state and helper function definitions...
    // Helper: convert 12-hour time to 24-hour
    const convertTo24Hour = useCallback((time12h: string): string => {
      if (!time12h) return '';
      const match = time12h.match(/^([0-9]{1,2}):([0-9]{2})\s?(AM|PM)$/i);
      if (!match) return time12h;
      let [_, hourStr, minuteStr, meridian] = match;
      let hour = parseInt(hourStr, 10);
      const minute = minuteStr;
      if (meridian.toUpperCase() === 'PM' && hour < 12) hour += 12;
      if (meridian.toUpperCase() === 'AM' && hour === 12) hour = 0;
      return `${hour.toString().padStart(2, '0')}:${minute}`;
    }, []);
   
    // Generate time slots for a given day (15-minute slots with 10-minute gaps)
    const generateTimeSlots = useCallback((startTime: string, endTime: string): string[] => {
      const slots: string[] = [];
      const start = convertTo24Hour(startTime);
      const end = convertTo24Hour(endTime);
      const [startHour, startMinute] = start.split(':').map(Number);
      const [endHour, endMinute] = end.split(':').map(Number);
      let currentHour = startHour;
      let currentMinute = startMinute;
      while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
        const slotStart = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        slots.push(slotStart);
        // Add 15 minutes (slot duration) + 10 minutes (gap) = 25 minutes total
        currentMinute += 25;
        if (currentMinute >= 60) {
          currentHour += Math.floor(currentMinute / 60);
          currentMinute = currentMinute % 60;
        }
      }
      return slots;
    }, [convertTo24Hour]);

    // Get available slots for selected date
    const getAvailableSlotsForDate = useCallback((date: string) => {
      if (!date) return [];
      const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
      const daySlots = availability.filter(a => a.day_of_week.toLowerCase() === dayOfWeek.toLowerCase());
      let availableSlots: { start_time: string, end_time: string }[] = [];
      
      // Get current date and time for validation
      const now = new Date();
      const selectedDate = new Date(date);
      const isToday = selectedDate.toDateString() === now.toDateString();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      daySlots.forEach(slot => {
        const start = slot.start_time.length === 5 ? slot.start_time : convertTo24Hour(slot.start_time);
        const end = slot.end_time.length === 5 ? slot.end_time : convertTo24Hour(slot.end_time);
        const slotStarts = generateTimeSlots(start, end);
        slotStarts.forEach(startTime => {
          // Skip expired slots if it's today
          if (isToday && startTime <= currentTime) {
            return;
          }
          
          // Calculate end time by adding 15 minutes to start time
          const [startHour, startMinute] = startTime.split(':').map(Number);
          let endHour = startHour;
          let endMinute = startMinute + 15;
          if (endMinute >= 60) {
            endHour += Math.floor(endMinute / 60);
            endMinute = endMinute % 60;
          }
          const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
          availableSlots.push({ start_time: startTime, end_time: endTime });
        });
      });
      return availableSlots;
    }, [availability, generateTimeSlots, convertTo24Hour]);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get("request_id");
  const functionalityId = searchParams.get("functionality_id");
  const objectiveId = searchParams.get("objective_id");

  const [currentRequest, setCurrentRequest] = useState<SessionRequest | null>(null);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [functionalities, setFunctionalities] = useState<Functionality[]>([]);
  // Initialize selectedFunctionality from URL params with memoization
  const [selectedFunctionality, setSelectedFunctionality] = useState<number | null>(() => {
    return functionalityId ? Number(functionalityId) : null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [showLinkedInSearch, setShowLinkedInSearch] = useState(false);
  const [selectedLinkedInProfile, setSelectedLinkedInProfile] = useState(null);
  // Remove autoTriggerSearch state as it's no longer needed
  // const [autoTriggerSearch, setAutoTriggerSearch] = useState(false);
  // Booking dialog states
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ startTime: string; endTime: string; price: number } | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [expandedAbout, setExpandedAbout] = useState<Set<string>>(new Set());
  const [expertProfileViewCounts, setExpertProfileViewCounts] = useState<
    Record<string, number>
  >({});
  const [expertProfileViewsLoading, setExpertProfileViewsLoading] =
    useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isValidatingRole, setIsValidatingRole] = useState(true);

  // Calculate slot price for 15-minute slots
  const calculateSlotPrice = useCallback((startTime: string, endTime: string) => {
    if (!selectedExpert) return 0;
    const hourlyRate = selectedExpert.audio_pricing || 0;
    // 15 minutes = 0.25 hours
    return Math.round(hourlyRate * 0.25);
  }, [selectedExpert]);

  // Booking dialog form state for audio call
  const [bookingForm, setBookingForm] = useState({
    date: '',
    selectedSlot: null,
    sessionType: 'audio',
  });
  // For payment navigation
  const location = window.location;
  // Helper: format date
  const format = useCallback((date, formatStr) => {
    // Simple YYYY-MM-DD formatter
    if (!date) return '';
    const d = new Date(date);
    if (formatStr === 'yyyy-MM-dd') {
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }
    if (formatStr === 'PPP') {
      return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    return d.toISOString();
  }, []);
  // Helper: format time
  const formatTime = useCallback((timeStr) => {
    // Expects HH:mm, returns h:mm AM/PM
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hour = Number(h);
    const min = Number(m);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${String(min).padStart(2,'0')} ${ampm}`;
  }, []);
  // Dummy: getSlotBookingStatus
  // Helper: convert 12-hour time to 24-hour

  // ...existing code...
  const handleSubmitBooking = async () => {
    try {
      setIsBooking(true);
      if (!bookingForm.selectedSlot || !bookingForm.date || !selectedExpert?.id) {
        toast({
          title: "Missing Required Fields",
          description: "Please select a date and time slot before booking.",
          variant: "destructive"
        });
        setIsBooking(false);
        return;
      }
      const API_BASE_URL = import.meta.env.VITE_API_URL;
      const userData = localStorage.getItem('user');
      if (!userData) {
        toast({ title: "Authentication Error", description: "You must be logged in to book a session", variant: "destructive" });
        return;
      }
      let parsedUserData;
      try { parsedUserData = JSON.parse(userData); } catch (e) { console.error("Error parsing user data:", e); toast({ title: "Error", description: "Invalid user data format", variant: "destructive" }); return; }
      const token = parsedUserData.token;
      const seekerName = `${parsedUserData.first_name || ''} ${parsedUserData.last_name || ''}`.trim();
      if (!token) { toast({ title: "Authentication Error", description: "Authentication token not found", variant: "destructive" }); return; }
      // Get session_request_id from URL query params
      const searchParams = new URLSearchParams(location.search);
      const session_request_id = searchParams.get('request_id');
      // Double check if the slot is still available before booking
      const dayOfWeek = new Date(bookingForm.date).toLocaleDateString('en-US', { weekday: 'long' });
      const bookingStatus = getSlotBookingStatus(
        dayOfWeek,
        bookingForm.selectedSlot.startTime,
        bookingForm.selectedSlot.endTime
      );
      if (bookingStatus.isBooked) {
        toast({
          title: "Time Slot Unavailable",
          description: "This time slot has just been booked by someone else. Please choose a different time.",
          variant: "destructive"
        });
        setBookingDialogOpen(false);
        // Refresh bookings to update UI
        if (selectedExpert?.id) {
          await fetchExistingBookings(selectedExpert.id);
        }
        return;
      }
      // Helper to add seconds to time string if missing
      const toHHMMSS = (time: string) => {
        if (!time) return '';
        if (/^\d{2}:\d{2}$/.test(time)) return `${time}:00`;
        if (/^\d{2}:\d{2}:\d{2}$/.test(time)) return time;
        return time; // fallback
      };
      // Create booking payload
      const payload = {
        expert_id: selectedExpert?.user_id,
        seeker_id: parsedUserData.user_id || parsedUserData.id || '',
        seeker_name: seekerName,
        date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : bookingForm.date,
        start_time: toHHMMSS(bookingForm.selectedSlot.startTime),
        end_time: toHHMMSS(bookingForm.selectedSlot.endTime),
        session_type: bookingForm.sessionType,
        amount: bookingForm.selectedSlot.price,
        status: 'pending',
        ...(session_request_id ? { session_request_id } : {})
      };
      // Sanitize payload for security
      const sanitizedPayload = {
        ...payload,
        expert_id: encodeURIComponent(payload.expert_id || ''),
        seeker_id: encodeURIComponent(payload.seeker_id || ''),
        seeker_name: payload.seeker_name?.replace(/[<>"'&]/g, '') || ''
      };
      // Make the booking request
      const response = await fetch(`${API_BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(sanitizedPayload)
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 409) {
          toast({
            title: "Time Slot Unavailable",
            description: data.message || "This time slot has just been booked by someone else. Please choose a different time.",
            variant: "destructive"
          });
          if (selectedExpert?.id) {
            await fetchExistingBookings(selectedExpert.id);
          }
        } else {
          toast({
            title: "Booking Failed",
            description: data.message || "Failed to create booking. Please try again.",
            variant: "destructive"
          });
        }
        setBookingDialogOpen(false);
        return;
      }
      setBookingDialogOpen(false);
      const seekerUid = parsedUserData.user_id || parsedUserData.id;
      const expertUid = selectedExpert?.user_id;
      if (seekerUid && expertUid) {
        trackExpertBooked(String(seekerUid), String(expertUid));
      }
      toast({
        title: "Booking Submitted!",
        description: "Your booking request has been sent to the expert for approval.",
        variant: "default",
        className: "bg-white border-2 border-blue-500 text-blue-600",
      });
      
      // Navigate to appointment log to show the booking
      navigate('/appointment-log');
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsBooking(false);
    }
  };

  // Add these new state variables at the top with your other state variables
  const [linkedInProfiles, setLinkedInProfiles] = useState<any[]>([]);
  const [loadingLinkedIn, setLoadingLinkedIn] = useState(false);
  const [linkedInSearchPerformed, setLinkedInSearchPerformed] = useState(false);
  
  // Add a ref to track if initial load is complete
  const initialLoadComplete = useRef(false);

  // Video modal states
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string>('');
  const [selectedExpertName, setSelectedExpertName] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        // Get user token
        const userData = localStorage.getItem("user");
        if (!userData) {
          throw new Error("User not authenticated");
        }
        const user = JSON.parse(userData);
        
        // Set user role for validation
        if (isMounted) {
          setUserRole(user.role);
          setIsValidatingRole(false);
        }

        // Determine the functionality filter to use (prioritize URL params)
        const filterFunctionalityId = functionalityId ? Number(functionalityId) : selectedFunctionality;
        
        // Update selectedFunctionality state if it differs from URL param
        if (functionalityId && selectedFunctionality !== Number(functionalityId)) {
          setSelectedFunctionality(Number(functionalityId));
        }

        // Fetch session request if requestId exists
        let sessionRequest = null;
        if (requestId) {
          const requestResponse = await fetch(
            `${import.meta.env.VITE_API_URL}/api/session-requests/${requestId}`,
            {
              headers: {
                Authorization: `Bearer ${user.token}`,
              },
            }
          );

          if (requestResponse.ok) {
            const requestResult = await requestResponse.json();
            if (requestResult.success) {
              sessionRequest = requestResult.data;
              if (isMounted) {
                setCurrentRequest(sessionRequest);
              }
            }
          }
        }

        // Fetch experts with the functionality filter
        const expertUrl = new URL(`${import.meta.env.VITE_API_URL}/api/experts/profiles/public`);
        
        if (filterFunctionalityId) {
          expertUrl.searchParams.append('functionality_id', filterFunctionalityId.toString());
        }

        // Add objective filter if provided
        if (objectiveId) {
          expertUrl.searchParams.append('objective_id', objectiveId.toString());
        }

        // Add status filter explicitly
        expertUrl.searchParams.append('status', 'approved');
        expertUrl.searchParams.append('require_complete', 'true');

        console.log('Filtering experts with params:', {
          functionality_id: filterFunctionalityId,
          objective_id: objectiveId,
          status: 'approved',
          require_complete: true
        });
        
        let expertResponse;
        let expertResult;
        
        // Retry logic for expert fetching
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            expertResponse = await fetch(expertUrl.toString(), {
              headers: {
                Authorization: `Bearer ${user.token}`,
              },
              signal: AbortSignal.timeout(10000)
            });
            
            if (expertResponse.status === 503) {
              if (attempt < 2) {
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                continue;
              }
            }
            
            if (!expertResponse.ok) {
              throw new Error(`HTTP ${expertResponse.status}: Failed to fetch expert profiles`);
            }
            
            expertResult = await expertResponse.json();
            break;
          } catch (fetchError) {
            if (attempt === 2) throw fetchError;
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          }
        }
        console.log('Expert Result:', expertResult);
        
        if (expertResult.success && isMounted) {
          // Set experts immediately with basic data to prevent fluctuation
          const baseExperts = expertResult.data.map((expert: any) => ({
            ...expert,
            audio_pricing: expert.audio_pricing ?? expert.audioPricing ?? undefined,
            highest_education: '',
            rating: 0,
            reviews: 0,
            feedbacks: []
          }));
          
          if (isMounted) {
            setExperts(baseExperts);
            initialLoadComplete.current = true;
          }
          
          // Process additional data in background without blocking UI
          const processExpertData = async () => {
            const batchSize = 3;
            const batches = [];
            for (let i = 0; i < expertResult.data.length; i += batchSize) {
              batches.push(expertResult.data.slice(i, i + batchSize));
            }
            
            const processedExperts = [...baseExperts];
            
            for (const batch of batches) {
              if (!isMounted) break;
              
              const batchPromises = batch.map(async (expert: any, batchIndex: number) => {
                const expertIndex = batches.indexOf(batch) * batchSize + batchIndex;
                
                try {
                  const [ratingResponse, educationResponse] = await Promise.allSettled([
                    fetch(`${import.meta.env.VITE_API_URL}/api/session-feedback/expert/${expert.user_id}`, {
                      headers: { Authorization: `Bearer ${user.token}` },
                      signal: AbortSignal.timeout(5000)
                    }),
                    fetch(`${import.meta.env.VITE_API_URL}/api/experts/${expert.user_id}/education`, {
                      headers: { Authorization: `Bearer ${user.token}` },
                      signal: AbortSignal.timeout(5000)
                    })
                  ]);
                  
                  let highestEducation = '';
                  let rating = 0;
                  let reviews = 0;
                  let feedbacks = [];
                  
                  // Process education
                  if (educationResponse.status === 'fulfilled' && educationResponse.value.ok) {
                    try {
                      const educationData = await educationResponse.value.json();
                      if (educationData.success && educationData.data?.length > 0) {
                        const education = educationData.data[0];
                        highestEducation = `${education.degree}${education.field_of_study ? ` in ${education.field_of_study}` : ''}`;
                      }
                    } catch {}
                  }
                  
                  // Fallback education
                  if (!highestEducation && expert.designation) {
                    const designationLower = expert.designation.toLowerCase();
                    if (designationLower.includes('senior') || designationLower.includes('lead') || designationLower.includes('manager')) {
                      highestEducation = 'Master\'s Degree';
                    } else if (designationLower.includes('engineer') || designationLower.includes('developer') || designationLower.includes('analyst')) {
                      highestEducation = 'Bachelor\'s Degree';
                    }
                  }
                  
                  // Process ratings
                  if (ratingResponse.status === 'fulfilled' && ratingResponse.value.ok) {
                    try {
                      const ratingData = await ratingResponse.value.json();
                      if (ratingData.success && ratingData.data) {
                        feedbacks = ratingData.data;
                        reviews = feedbacks.length;
                        rating = calculateAverageRating(feedbacks);
                      }
                    } catch {}
                  }
                  
                  return {
                    index: expertIndex,
                    data: {
                      highest_education: highestEducation,
                      rating: rating,
                      reviews: reviews,
                      feedbacks: feedbacks
                    }
                  };
                } catch {
                  return {
                    index: expertIndex,
                    data: {
                      highest_education: '',
                      rating: 0,
                      reviews: 0,
                      feedbacks: []
                    }
                  };
                }
              });
              
              const batchResults = await Promise.allSettled(batchPromises);
              
              if (isMounted) {
                batchResults.forEach((result) => {
                  if (result.status === 'fulfilled') {
                    const { index, data } = result.value;
                    processedExperts[index] = { ...processedExperts[index], ...data };
                  }
                });
                
                setExperts([...processedExperts]);
              }
            }
          };
          
          processExpertData();
          
          const expertsWithRatings = baseExperts;

          if (isMounted) {
            setExperts(expertsWithRatings);
            initialLoadComplete.current = true;
            
            // Update session request with filter result after experts are set
            if (requestId) {
              const filterResult = expertsWithRatings.length > 0 ? 'found' : 'not_found';
              updateSessionRequestFilterResult(filterResult);
            }
          }
        } else if (isMounted) {
          setExperts([]);
          initialLoadComplete.current = true;
          if (requestId) {
            updateSessionRequestFilterResult('not_found');
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        if (isMounted) {
          // Set a more user-friendly error message
          const errorMessage = err instanceof Error && err.message.includes('503') 
            ? 'Service temporarily unavailable. Please refresh the page.'
            : err instanceof Error ? err.message : 'Failed to load data';
          setError(errorMessage);
          setExperts([]);
          initialLoadComplete.current = true;
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [requestId, functionalityId, objectiveId]); // Removed selectedFunctionality from deps

  useEffect(() => {
    if (!functionalityId) return;
    const fid = Number(functionalityId);
    if (!Number.isFinite(fid) || fid < 1) return;
    void trackBrowseEngagement(fid);
  }, [functionalityId]);

  const expertUserIdsForViewsKey = useMemo(
    () =>
      [
        ...new Set(
          experts
            .map((e) => e.user_id)
            .filter((id): id is string => Boolean(id && String(id).trim())),
        ),
      ]
        .sort()
        .join(","),
    [experts],
  );

  useEffect(() => {
    if (!expertUserIdsForViewsKey) {
      setExpertProfileViewCounts({});
      setExpertProfileViewsLoading(false);
      return;
    }
    const ids = expertUserIdsForViewsKey.split(",").filter(Boolean);
    let cancelled = false;
    setExpertProfileViewsLoading(true);
    void (async () => {
      const counts = await fetchExpertProfileViewCounts(ids);
      if (!cancelled) {
        setExpertProfileViewCounts(counts);
        setExpertProfileViewsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [expertUserIdsForViewsKey]);

  /** Higher unique profile views first; ties keep API order. */
  const expertsSortedByProfileViews = useMemo(() => {
    const viewsFor = (e: Expert) =>
      e.user_id != null && e.user_id !== "" && expertProfileViewCounts[e.user_id] !== undefined
        ? expertProfileViewCounts[e.user_id]
        : 0;
    return [...experts]
      .map((e, index) => ({ e, index }))
      .sort((a, b) => {
        const diff = viewsFor(b.e) - viewsFor(a.e);
        if (diff !== 0) return diff;
        return a.index - b.index;
      })
      .map(({ e }) => e);
  }, [experts, expertProfileViewCounts]);

  useEffect(() => {
    const fetchFunctionalities = async () => {
      try {
        const userData = localStorage.getItem("user");
        if (!userData) return;
        const user = JSON.parse(userData);

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/functionalities`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );
        
        const result = await response.json();
        if (result.success) {
          setFunctionalities(result.data);
        }
      } catch (error) {
        console.error('Error fetching functionalities:', error);
      }
    };

    fetchFunctionalities();
  }, []);

  // Update the functionality select onChange handler
  const handleFunctionalityChange = useCallback((value: string) => {
    const newFunctionalityId = value ? Number(value) : null;
    
    // Reset LinkedIn search state when functionality changes
    setLinkedInSearchPerformed(false);
    setLinkedInProfiles([]);
    setLoading(true);
    
    setSelectedFunctionality(newFunctionalityId);
    
    // Update URL params while preserving request_id
    const newSearchParams = new URLSearchParams(searchParams);
    if (newFunctionalityId) {
      newSearchParams.set('functionality_id', newFunctionalityId.toString());
    } else {
      newSearchParams.delete('functionality_id');
    }
    navigate(`?${newSearchParams.toString()}`);
  }, [searchParams, navigate]);
  
  // Add this helper function
  const calculateAverageRating = useCallback((feedbacks: Expert['feedbacks']) => {
    if (!feedbacks || feedbacks.length === 0) return 0;
    const validRatings = feedbacks.filter(feedback => feedback.rating && !isNaN(feedback.rating));
    if (validRatings.length === 0) return 0;
    const sum = validRatings.reduce((acc, feedback) => acc + Number(feedback.rating), 0);
    return Number((sum / validRatings.length).toFixed(1));
  }, []);

  // New function to update session request with filter result
  const updateSessionRequestFilterResult = useCallback(async (result: 'found' | 'not_found') => {
    // Only proceed if we have a requestId
    if (!requestId) return;
    
    try {
      const userData = localStorage.getItem("user");
      if (!userData) {
        return;
      }
      const user = JSON.parse(userData);
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/session-requests/${requestId}/filter-result`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            expert_filter_result: result,
            functionality_id: functionalityId ? Number(functionalityId) : selectedFunctionality
          })
        }
      );
      
      if (response.ok) {
        console.log(`Updated session request ${requestId} with filter result: ${result}`);
      }
    } catch (error) {
      console.log('Failed to update session request filter result:', error);
    }
  }, [requestId, functionalityId, selectedFunctionality]);

  // Remove the auto-trigger effect as it's now handled in the main LinkedIn search effect
  // useEffect(() => {
  //   if (!loading && 
  //       experts.length === 0 && 
  //       currentRequest?.expert_filter_result === 'not_found' && 
  //       !autoTriggerSearch) {
  //     setAutoTriggerSearch(true);
  //   }
  // }, [loading, experts.length, currentRequest, autoTriggerSearch]);

  // Auto search LinkedIn profiles when no experts are found
  useEffect(() => {
    // Add a delay to ensure expert fetching is complete
    const timeoutId = setTimeout(() => {
      const searchLinkedInProfilesAutomatically = async () => {
        // Only perform search if:
        // 1. Loading is complete
        // 2. No experts were found
        // 3. We haven't already performed a search
        // 4. We have functionalities loaded
        if (
          !loading &&
          experts.length === 0 && 
          !linkedInSearchPerformed && 
          !loadingLinkedIn &&
          functionalities.length > 0 &&
          (currentRequest?.expert_filter_result === 'not_found' || (!currentRequest && !requestId))
        ) {
          setLinkedInSearchPerformed(true);
          setLoadingLinkedIn(true);
          
          try {
            // Get user token
            const userData = localStorage.getItem("user");
            if (!userData) {
              throw new Error("User not authenticated");
            }
            const user = JSON.parse(userData);
            
            // Get the functionality name if available
            const functionalityName = functionalities.find(
              f => f.id === selectedFunctionality
            )?.display_name || '';
            
            // Perform the LinkedIn search
            const response = await fetch(
              `${import.meta.env.VITE_API_URL}/api/experts/linkedin-search`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${user.token}`,
                },
                body: JSON.stringify({
                  name: functionalityName,
                  functionality: functionalityName,
                  experienceYears: 15,
                  limit: 9,
                  requestId: requestId,
                }),
              }
            );
            
            if (!response.ok) {
              throw new Error(`LinkedIn search failed with status ${response.status}`);
            }
            
            const data = await response.json();
            if (data.success) {
              setLinkedInProfiles(data.data || []);
            }
          } catch (error) {
            console.error("LinkedIn search error:", error);
          } finally {
            setLoadingLinkedIn(false);
          }
        }
      };
      
      searchLinkedInProfilesAutomatically();
    }, 1000); // 1 second delay to ensure expert fetching completes
    
    return () => clearTimeout(timeoutId);
  }, [experts.length, loading, currentRequest?.expert_filter_result, linkedInSearchPerformed, loadingLinkedIn, selectedFunctionality, functionalities, requestId]);

  const LinkedInProfileCard = ({ profile }) => (
    <Card className="overflow-hidden">
      {/* Same structure as ExpertCard but with LinkedIn data */}
    </Card>
  );

  const { currency, timezone, setCurrencyAndTimezone, formatCurrency, formatDateTime } = useCurrencyTimezone();

  // Validation function for View Profile button
  const validateViewProfileAccess = useCallback(async (expertId: string) => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        toast({
          title: "Authentication Required",
          description: "Please log in to view expert profiles.",
          variant: "destructive"
        });
        return false;
      }

      const user = JSON.parse(userData);
      
      // Check user role - only solution_seeker allowed
      if (user.role !== 'solution_seeker') {
        toast({
          title: "Access Restricted",
          description: "Only solution seekers can view expert profiles. Please log in with a solution seeker account.",
          variant: "destructive"
        });
        return false;
      }

      return true;
    } catch (error) {
      toast({
        title: "Validation Error",
        description: "Unable to validate access. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  }, []);

  // Validation function for Request Consultation button - Complete Schedule Audio Call flow
  const handleRequestConsultation = useCallback(async (expert: Expert) => {
    try {
      // Step 1: Authentication Check
      const userData = localStorage.getItem('user');
      if (!userData) {
        toast({
          title: "Authentication Required",
          description: "Please log in to request consultation.",
          variant: "destructive"
        });
        return;
      }

      const user = JSON.parse(userData);
      
      // Step 2: User Role Validation (solution_seeker only)
      if (user.role !== 'solution_seeker') {
        toast({
          title: "Access Restricted",
          description: "Only solution seekers can book sessions. Please log in with a solution seeker account.",
          variant: "destructive"
        });
        return;
      }

      // Step 3: Expert User ID Validation
      const expertUserId = expert?.user_id;
      if (!expertUserId) {
        toast({
          title: "Error",
          description: "Expert user ID not found. Please try again later.",
          variant: "destructive"
        });
        return;
      }
      
      // Step 4: Open dialog immediately for better UX
      setSelectedExpert(expert);
      setBookingDialogOpen(true);
      
      // Step 5: Load data asynchronously in background
      const token = user.token || user.accessToken;
      
      // Check subscription status in background
      const subscriptionResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/subscriptions/current`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json();
        const subscriptionStatus = subscriptionData.data?.subscription_status;
        
        // Allow both 'trial' and 'active' status
        if (subscriptionStatus !== 'trial' && subscriptionStatus !== 'active') {
          // Close dialog and redirect to subscription plans
          setBookingDialogOpen(false);
          sessionStorage.setItem('selected_expert_id', expert.user_id);
          saveCheckpoint('subscription_plans', {
            selectedExpertId: expert.user_id,
            expertName: `${expert.firstName || expert.first_name} ${expert.lastName || expert.last_name}`,
            userInfo: user,
            formData: { expert_id: expert.user_id }
          });
          navigate('/subscription-plans');
          return;
        }
      } else {
        setBookingDialogOpen(false);
        toast({
          title: "Subscription Check Failed",
          description: "Unable to verify subscription status. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      // Load availability and bookings data
      await Promise.all([
        fetchAvailability(expertUserId),
        fetchExistingBookings(expertUserId)
      ]);
      
    } catch (error) {
      setBookingDialogOpen(false);
      toast({
        title: "Error",
        description: "Unable to process request. Please try again.",
        variant: "destructive"
      });
    }
  }, [fetchAvailability, fetchExistingBookings, saveCheckpoint, navigate]);

  // Role validation - experts cannot access this page
  if (!isValidatingRole && userRole === 'expert') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
        <Navbar />
        <main className="container mx-auto py-12 px-4 pt-24">
          <div className="text-center py-16">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 max-w-md mx-auto">
             <h2 className="text-xl font-bold text-blue-800 mb-2">Exclusive Access Notice</h2>
              <p className="text-blue-700">You’re logged in as an Expert — thank you for being part of our network of professionals. <br />
  To explore or book sessions, please log in as a Solution Seeker.</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      <Navbar />
      <main className="container mx-auto py-12 px-4 pt-24">
        {/* Current Request Card */}
        {/* {currentRequest && (
          <Card className="mb-8 p-6">
            <h2 className="text-2xl font-semibold mb-4">Your Request</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Problem Statement:</h3>
                <p className="text-muted-foreground">{currentRequest.problem_statement}</p>
              </div>
              <div>
                <h3 className="font-medium">Desired Solution:</h3>
                <p className="text-muted-foreground">{currentRequest.desired_solution}</p>
              </div>
            </div>
          </Card>
        )} */}

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Meet Our Expert Professionals
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Connect with industry-leading experts who will accelerate your growth and help you achieve your goals with proven strategies and personalized guidance.
          </p>
        </div>
        
        {loading ? (
          <div className="text-center py-16">
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <div className="animate-spin h-8 w-8 border-3 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Finding Perfect Matches</h3>
            <p className="text-gray-500">Searching through our network of expert professionals...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="bg-gradient-to-br from-red-100 to-pink-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-10 w-10 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-red-600 mb-2">Something went wrong</h3>
            <p className="text-red-500 max-w-md mx-auto">{error}</p>
          </div>
        ) : experts.length === 0 ? (
          <>
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">Expanding Our Expert Network</h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                We're continuously growing our network of professionals. While we search for the perfect match, explore these LinkedIn professionals who might be able to help.
              </p>
            </div>
            
            {loadingLinkedIn ? (
              <div className="text-center py-16">
                <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Searching LinkedIn</h3>
                <p className="text-gray-500">Finding qualified professionals on LinkedIn...</p>
              </div>
            ) : linkedInProfiles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {linkedInProfiles.map((profile, index) => (
                  // Using the exact same card structure as your expert cards
                  <Card key={index} className="group overflow-hidden hover:shadow-xl transition-all duration-500 bg-gradient-to-br from-white via-orange-50/30 to-yellow-50/20 border-0 shadow-lg rounded-2xl">
                    {/* Header Section */}
                    <div className="relative p-6 pb-4">
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <Avatar className="h-16 w-16 border-3 border-white shadow-lg ring-2 ring-orange-100">
                            {profile.profileImageUrl ? (
                              <AvatarImage src={profile.profileImageUrl} alt={profile.name} />
                            ) : (
                              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-600 text-white font-bold text-lg">
                                <UserRound size={20} />
                              </AvatarFallback>
                            )}
                          </Avatar>
                          {/* LinkedIn indicator */}
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-600 border-2 border-white rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">in</span>
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-gray-900 leading-tight mb-1">
                            {profile.name}
                          </h3>
                          <p className="text-sm text-orange-600 font-medium mb-2 flex items-center gap-1">
                            <Award className="h-3 w-3" />
                            {profile.currentPosition || profile.headline || "LinkedIn Professional"}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {profile.location || 'Remote'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {profile.yearsOfExperience || 15}+ years
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <CardContent className="px-6 pb-6 space-y-4">
                      {/* Company & Skills Chips */}
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 border-orange-200 px-3 py-1 rounded-full text-xs font-medium">
                          <Building2 className="h-3 w-3 mr-1" />
                          {profile.company || 'LinkedIn Professional'}
                        </Badge>
                        <Badge className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-200 px-3 py-1 rounded-full text-xs font-medium">
                          {profile.functionality || "Quality Assurance"}
                        </Badge>
                      </div>

                      {/* Experience Description */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Professional Background</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {profile.currentPosition || profile.headline || `${profile.functionality || "Quality Assurance"} professional with ${profile.yearsOfExperience || 15}+ years of experience`}
                          {profile.company ? ` at ${profile.company}.` : '.'}
                        </p>
                        <p className="text-sm text-gray-600 leading-relaxed mt-2">
                          Experienced in {profile.functionality || "software testing"}, {profile.subcategory || "quality control"}, and end-to-end validation with industry-standard methodologies.
                        </p>
                      </div>

                      {/* Availability Notice */}
                      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600" />
                          <div>
                            <p className="text-sm font-medium text-amber-800 mb-1">Availability Check Required</p>
                            <p className="text-xs text-amber-700">
                              We'll verify this expert's availability and our team will contact you with scheduling options.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="pt-2">
                        <Button 
                          className="w-full h-10 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" 
                          disabled
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Contact for Availability
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="bg-gradient-to-br from-gray-100 to-blue-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                  <UserX className="h-12 w-12 text-gray-500" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-700 mb-3">
                  Expanding Our Network
                </h2>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  We're actively searching for qualified professionals in your area of interest. Our team will reach out once we find suitable matches.
                </p>
                <Button variant="outline" className="rounded-xl">
                  <Search className="h-4 w-4 mr-2" />
                  Notify Me When Available
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {expertsSortedByProfileViews.map((expert) => {
              const experience = expert.workExperience || expert.work_experience || expert.years_of_experience || 0;
              const firstName = expert.firstName || expert.first_name || 'Expert';
              const lastName = expert.lastName || expert.last_name || '';
              const fullName = `${firstName} ${lastName}`.trim();
              const organization = expert.currentOrganization || expert.current_organization || 'Independent';
              const aboutText = expert.about || expert.bio || expert.areas_of_help || '';
              
              return (
                <Card key={expert.id} className="group overflow-hidden hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 border-0 shadow-lg rounded-2xl h-[600px] flex flex-col">
                  {/* Header Section with Avatar and Basic Info */}
                  <div className="relative p-6 pb-4">
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <Avatar className="h-16 w-16 border-3 border-white shadow-lg ring-2 ring-blue-100">
                          {expert.profile_image ? (
                            <AvatarImage 
                              src={`${API_BASE_URL}${expert.profile_image}`} 
                              alt={fullName} 
                              className="object-cover"
                              onError={(e) => {
                                console.error('Image load error:', {
                                  expert: fullName,
                                  profile_image: expert.profile_image,
                                  constructed_url: `${API_BASE_URL}${expert.profile_image}`,
                                  API_BASE_URL
                                });
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : null}
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg">
                            {firstName?.[0]?.toUpperCase() || 'E'}{lastName?.[0]?.toUpperCase() || 'X'}
                          </AvatarFallback>
                        </Avatar>
                        {/* Online status indicator */}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-2 border-white rounded-full"></div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-gray-900 leading-tight mb-1">
                          {fullName}
                        </h3>
                        <p className="text-sm text-blue-600 font-medium mb-2 flex items-center gap-1">
                          <Award className="h-3 w-3" />
                          {expert.designation || 'Professional'}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {expert.location || 'Remote'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {experience}+ years
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Video Section */}
                  {expert.youtube_url && (
                    <div className="px-6 pb-4">
                      <div 
                        className="relative bg-gray-900 rounded-xl overflow-hidden group-hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
                        onClick={() => {
                          setSelectedVideoUrl(expert.youtube_url);
                          setSelectedExpertName(fullName);
                          setVideoModalOpen(true);
                        }}
                      >
                        <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                          <div className="text-center text-white">
                            <Play className="h-12 w-12 mx-auto mb-2 opacity-80" />
                            <p className="text-sm opacity-70">Introduction Video</p>
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-black/20 hover:bg-black/10 transition-colors flex items-center justify-center">
                          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 hover:bg-white/30 transition-colors">
                            <Play className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <CardContent className="px-6 pb-6 flex-1 flex flex-col">
                    <div className="space-y-4 flex-1 flex flex-col">
                    {/* Organization & Education Chips */}
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-200 px-3 py-1 rounded-full text-xs font-medium">
                        <Building2 className="h-3 w-3 mr-1" />
                        {organization}
                      </Badge>
                      {expert.highest_education && (
                        <Badge className="bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border-emerald-200 px-3 py-1 rounded-full text-xs font-medium">
                          <GraduationCap className="h-3 w-3 mr-1" />
                          {expert.highest_education}
                        </Badge>
                      )}
                    </div>

                    {/* Skills Chips */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Specializations</h4>
                      <div className="flex gap-1.5 overflow-hidden">
                        {Array.isArray(expert.expertise) ? expert.expertise.slice(0, 1).map((skill, index) => (
                          <Badge key={index} className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200 px-2 py-1 rounded-lg text-xs whitespace-nowrap">
                            {skill}
                          </Badge>
                        )) : (typeof expert.expertise === 'string') && (
                          (expert.expertise as string).split(',').slice(0, 1).map((skill, index) => (
                            <Badge key={index} className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200 px-2 py-1 rounded-lg text-xs whitespace-nowrap">
                              {skill.trim()}
                            </Badge>
                          ))
                        )}
                        {((Array.isArray(expert.expertise) && expert.expertise.length > 1) || 
                          (!Array.isArray(expert.expertise) && typeof expert.expertise === 'string' && expert.expertise.split(',').length > 1)) && (
                          <Badge variant="outline" className="text-xs px-2 py-1 rounded-lg text-gray-500 border-gray-300 whitespace-nowrap">
                            +{((Array.isArray(expert.expertise) ? expert.expertise.length : (typeof expert.expertise === 'string' ? expert.expertise.split(',').length : 0)) - 1)}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* About Section */}
                    <div className="flex-1 min-h-0 mb-2">
                      {aboutText && (
                        <div className="h-full flex flex-col">
                          <h4 className="text-sm font-semibold text-gray-700 mb-1">About</h4>
                          <div className={`flex-1 ${expandedAbout.has(expert.id) ? 'overflow-y-auto max-h-24' : ''}`}>
                            <p className="text-sm text-gray-600 leading-relaxed">
                              {expandedAbout.has(expert.id) ? aboutText : 
                               (aboutText.length > 120 ? `${aboutText.substring(0, 120)}...` : aboutText)}
                            </p>
                          </div>
                          {aboutText.length > 120 && (
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 h-auto text-xs text-blue-600 hover:text-blue-700 mt-1 flex-shrink-0"
                              onClick={() => {
                                setExpandedAbout(prev => {
                                  const newSet = new Set(prev);
                                  if (newSet.has(expert.id)) {
                                    newSet.delete(expert.id);
                                  } else {
                                    newSet.add(expert.id);
                                  }
                                  return newSet;
                                });
                              }}
                            >
                              {expandedAbout.has(expert.id) ? 'View Less' : 'View More'}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Rating & Pricing Section */}
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-100">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-4 w-4 ${
                                  i < Math.floor(expert.rating || 0) 
                                    ? 'text-yellow-400 fill-current' 
                                    : 'text-gray-300'
                                }`} 
                              />
                            ))}
                          </div>
                          <span className="text-sm font-semibold text-yellow-500">
                            {expert.rating && expert.rating > 0 ? expert.rating.toFixed(1) : 'New'}
                          </span>
                          {expert.reviews && expert.reviews > 0 && (
                            <span className="text-xs text-gray-500">({expert.reviews} review{expert.reviews !== 1 ? 's' : ''})</span>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            {expert.audio_pricing !== undefined ? (
                              <>
                                <span className="line-through text-gray-400 text-sm">{formatCurrency(expert.audio_pricing)}</span>
                                <span className="ml-2">Free</span>
                              </>
                            ) : 'Free'}
                          </div>
                          {/* <div className="text-xs text-gray-500">per hour</div> */}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2 mt-auto items-start">
                      <div className="flex-1 flex flex-col gap-1 min-w-0">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full h-10 rounded-xl border-gray-200 hover:bg-blue-400 font-medium"
                          onClick={async () => {
                            const isValid = await validateViewProfileAccess(expert.id);
                            if (isValid) {
                              navigate(`/experts/${expert.id}`);
                            }
                          }}
                        >
                          <UserRound className="h-4 w-4 mr-2" />
                          View Profile
                        </Button>
                        <div
                          className="flex items-center justify-center gap-1 px-0.5 text-[11px] leading-tight text-gray-500 tabular-nums"
                          title="Unique seekers who opened this expert profile"
                        >
                          <Eye className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
                          {expert.user_id && expertProfileViewsLoading && expertProfileViewCounts[expert.user_id] === undefined ? (
                            <span className="text-gray-400">…</span>
                          ) : expert.user_id && expertProfileViewCounts[expert.user_id] !== undefined ? (
                            <span>
                              {expertProfileViewCounts[expert.user_id].toLocaleString("en-IN")}{" "}
                              profile {expertProfileViewCounts[expert.user_id] === 1 ? "view" : "views"}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        className="flex-1 h-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" 
                        onClick={() => handleRequestConsultation(expert)}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Request Consultation
                      </Button>
                    </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

      {/* Booking Dialog for Audio Call - Animated, scrollable, calendar-based UI */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="max-w-lg w-full h-[80vh] bg-white/90 backdrop-blur-xl shadow-2xl rounded-2xl border-0 p-0 overflow-visible flex flex-col items-center justify-center">
          <VisuallyHidden>
            <DialogTitle>Book Audio Call with {selectedExpert?.firstName} {selectedExpert?.lastName}</DialogTitle>
          </VisuallyHidden>
          {/* AnimatePresence and motion.div require framer-motion. Replace with static if not available. */}
          {isBooking ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 w-full">
              {/* Replace with CheckCircle2 if available */}
              <Star className="h-16 w-16 text-green-500 mb-2 animate-in fade-in zoom-in" />
              <h2 className="text-2xl font-bold text-green-700 mb-1">Booking...</h2>
              <p className="text-gray-600 text-center mb-2">Processing your booking request...</p>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col">
              <div className="w-full text-center pt-6 px-6">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Avatar className="h-12 w-12 border-2 border-blue-100">
                    {selectedExpert?.imageUrl ? (
                      <AvatarImage src={selectedExpert.imageUrl} alt={`${selectedExpert.firstName} ${selectedExpert.lastName}`} />
                    ) : (
                      <AvatarFallback className="bg-blue-50 text-blue-600">
                        <UserRound size={20} />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-bold text-blue-700">Book a Session</h2>
                    <p className="text-sm text-gray-600">with {selectedExpert?.firstName || selectedExpert?.first_name} {selectedExpert?.lastName || selectedExpert?.last_name}</p>
                  </div>
                </div>
              </div>
              {/* Scrollable content area, flex-1 */}
              <div className="flex-1 grid gap-4 py-4 w-full px-4 md:px-8 overflow-y-auto">
                <div className="flex justify-center w-full">
                  <div className="mx-auto" style={{ maxWidth: 360 }}>
                    {/* Replace with Calendar component if available, else use input type="date" */}
                    <input
                      type="date"
                      className="border rounded px-3 py-2 w-full mb-2"
                      value={bookingForm.date}
                      onChange={e => {
                        setBookingForm(prev => ({ ...prev, date: e.target.value, selectedSlot: null }));
                        setSelectedDate(e.target.value ? new Date(e.target.value) : null);
                      }}
                      min={new Date().toISOString().split('T')[0]}
                      placeholder="Select date"
                      title="Select date"
                    />
                  </div>
                </div>
                <div>
                  <div className="font-semibold mb-2 text-center">Available Time Slots for {bookingForm.date ? format(new Date(bookingForm.date), 'PPP') : ''}</div>
                  {bookingForm.date && getAvailableSlotsForDate(bookingForm.date).length === 0 ? (
                    <div className="text-muted-foreground text-sm text-center">No slots available for this date.</div>
                  ) : (
                    <div className="w-full flex flex-wrap gap-3 justify-center items-center overflow-hidden">
                      {bookingForm.date && getAvailableSlotsForDate(bookingForm.date).map((slot, idx) => {
                        const startTimeFormatted = slot.start_time.includes('AM') || slot.start_time.includes('PM') ? slot.start_time : formatTime(slot.start_time);
                        const endTimeFormatted = slot.end_time.includes('AM') || slot.end_time.includes('PM') ? slot.end_time : formatTime(slot.end_time);
                        const isSelected = bookingForm.selectedSlot && bookingForm.selectedSlot.startTime === slot.start_time && bookingForm.selectedSlot.endTime === slot.end_time;
                        const bookingStatus = getSlotBookingStatus(bookingForm.date, slot.start_time, slot.end_time);
                        if (bookingStatus.isBooked) return null;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setBookingForm(prev => ({
                                ...prev,
                                selectedSlot: {
                                  startTime: slot.start_time,
                                  endTime: slot.end_time,
                                  price: Number(calculateSlotPrice(slot.start_time, slot.end_time))
                                },
                                date: bookingForm.date
                              }));
                              setSelectedDate(bookingForm.date ? new Date(bookingForm.date) : null);
                            }}
                            className={`min-w-[120px] max-w-[180px] m-1 px-4 py-3 text-base rounded-xl border font-semibold transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-300 whitespace-nowrap overflow-hidden text-ellipsis
                              ${isSelected
                                ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white border-blue-400 shadow-lg scale-105'
                                : 'bg-white/80 hover:bg-blue-50 text-blue-700 border-blue-200'}
                            `}
                            style={{wordBreak: 'break-word'}}
                          >
                            <span className="font-semibold text-center leading-tight">
                              {startTimeFormatted} - {endTimeFormatted}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4 mt-2">
                  <span className="sm:text-right font-medium">Session Type</span>
                  <div className="sm:col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground items-center">
                    Audio Call (15 minutes) <span className="line-through text-gray-400">{formatCurrency((selectedExpert?.audio_pricing || 0) * 0.25)}</span> <span className="text-green-600 font-semibold">Free</span>
                  </div>
                </div>
                {typeof bookingForm.selectedSlot?.price === 'number' && !isNaN(bookingForm.selectedSlot.price) ? (
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                    <span className="sm:text-right font-medium">Total Price</span>
                    <div className="sm:col-span-3 text-lg font-bold text-primary">
                       <span className="line-through text-gray-400">{formatCurrency(bookingForm.selectedSlot.price)}</span> <span className="text-green-600">Free</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                    <span className="sm:text-right font-medium">Total Price</span>
                    <div className="sm:col-span-3 text-lg font-bold text-primary">
                      <span className="text-green-600">Free</span>
                    </div>
                  </div>
                )}
              </div>
              {/* Sticky footer for actions, always below scrollable content */}
              <div className="w-full bg-white/90 px-4 py-4 flex flex-col sm:flex-row gap-2 sm:gap-4 border-t border-slate-100 z-10 rounded-b-2xl">
                <Button variant="outline" onClick={() => setBookingDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSubmitBooking} disabled={isBooking || !bookingForm.selectedSlot || !bookingForm.date} className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold shadow-md hover:scale-[1.03] transition-transform duration-200">
                  {isBooking ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : null}
                  {isBooking ? "Booking..." : "Book Session"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Video Modal */}
      <Dialog open={videoModalOpen} onOpenChange={setVideoModalOpen}>
        <DialogContent className="max-w-4xl w-full p-0 bg-black rounded-2xl overflow-hidden">
          <VisuallyHidden>
            <DialogTitle>Introduction Video - {selectedExpertName}</DialogTitle>
          </VisuallyHidden>
          <div className="relative aspect-video">
            {selectedVideoUrl && (
              <iframe
                src={selectedVideoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                title={`Introduction video by ${selectedExpertName}`}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
          <div className="absolute top-4 right-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setVideoModalOpen(false)}
              className="bg-black/50 text-white hover:bg-black/70 rounded-full w-10 h-10 p-0"
            >
              ×
            </Button>
          </div>
        </DialogContent>
      </Dialog>
          </div>
        )}
      </main>

      {/* <Dialog open={showLinkedInSearch} onOpenChange={setShowLinkedInSearch}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <VisuallyHidden>
              <DialogTitle>LinkedIn Professional Search</DialogTitle>
            </VisuallyHidden>
            
            <h2 className="text-lg font-semibold">Search LinkedIn Professionals</h2>
            <p className="text-sm text-muted-foreground">
              Find experienced professionals matching your requirements
            </p>
          </DialogHeader>
          
          <LinkedInSearch
            onProfileSelected={(profile) => {
              setSelectedLinkedInProfile(profile);
              setShowLinkedInSearch(false);
              // You can do something with the selected profile here
              console.log("Selected LinkedIn profile:", profile);
            }}
            functionality={functionalities.find(f => f.id === selectedFunctionality)?.display_name}
            requestId={requestId}
            autoStartSearch={autoTriggerSearch}
          />
        </DialogContent>
      </Dialog> */}

      <Footer />
    </div>
  );
}