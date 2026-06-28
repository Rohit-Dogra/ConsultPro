import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { Button } from "../components/ui/button";
import { ErrorBoundary } from "react-error-boundary";
import { FaLinkedin, FaVideo, FaPhone, FaComments } from 'react-icons/fa';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "../components/ui/drawer";
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast, useToast } from "../components/ui/use-toast";
import { Calendar } from "../components/ui/calendar";
import { format } from "date-fns";
import { toZonedTime, format as formatTz } from 'date-fns-tz';
import { useCurrencyTimezone } from '../components/contexts/CurrencyTimezoneContext';
import { trackExpertBooked, trackProfileView } from '@/services/recommendationEngine';
import { CheckCircle2, Loader2, Star, MapPin, CalendarIcon, Building2, GraduationCap, Award, Play, Phone, MessageCircle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface Expert {
  id: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  designation: string;
  functionality?: string;
  is_custom_functionality?: boolean;
  date_of_birth?: string;
  phone_number?: string;
  work_experience: string | number;
  current_organization: string;
  location: string;
  expertise: string;
  areas_of_help: string;
  audio_pricing?: number;
  video_pricing?: number;
  chat_pricing?: number;
  linkedin_url?: string;
  instagram_url?: string;
  youtube_url?: string;
  twitter_url?: string;
  // Optional image fields (add both snake_case and camelCase to match API/consumers)
  image_url?: string;
  imageUrl?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  // Formatted fields from backend
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  workExperience?: string | number;
  currentOrganization?: string;
  areasOfHelp?: string;
  audioPricing?: number;
  linkedinUrl?: string;
}

interface Availability {
  day_of_week: string;
  start_time: string;
  end_time: string;
  name?: string;
}

interface SelectedSlot {
  startTime: string;
  endTime: string;
  price: number;
}

interface BookingFormData {
  expertId: string;
  date: string;
  selectedSlot: SelectedSlot | null;
  sessionType: 'audio';
}

interface BookingSlot {
  id?: string;
  expert_id: string;
  seeker_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'draft' | 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled';
  session_type: 'audio';
  created_at?: string;
  seeker_name?: string;
}

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const ExpertProfileContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { currency, formatCurrency } = useCurrencyTimezone();
  
  // Fallback formatCurrency function
  const safeFormatCurrency = (amount: number | string, sourceCurrency?: string) => {
    try {
      return formatCurrency(amount, sourceCurrency);
    } catch (error) {
      const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      if (isNaN(numAmount)) return '₹0';
      return `₹${numAmount.toFixed(2)}`;
    }
  };
  const { id, user_id } = useParams<{ id?: string; user_id?: string }>();
  const expertId = id || user_id;
  const [expert, setExpert] = useState<Expert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [bookingForm, setBookingForm] = useState({
    date: '',
    selectedSlot: null,
    sessionType: 'audio',
  });
  const [selectedSlot, setSelectedSlot] = useState<{ startTime: string; endTime: string; price: number } | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [existingBookings, setExistingBookings] = useState<BookingSlot[]>([]);

  // Payment related states
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentTransactionId, setPaymentTransactionId] = useState<string | null>(null);
  
  // View more/less functionality
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  
  // Ratings state
  const [ratings, setRatings] = useState({ averageRating: 0, totalReviews: 0, reviews: [] });
  const [ratingsLoading, setRatingsLoading] = useState(false);

  // API call cache with longer duration
  const [apiCallCache, setApiCallCache] = useState<Map<string, { timestamp: number; data: any }>>(new Map());
  
  // Fetch ratings for expert from session_feedback API
  const fetchRatings = useCallback(async (expertId: string) => {
    const cacheKey = `ratings-${expertId}`;
    const cached = apiCallCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes cache
      setRatings(cached.data);
      return;
    }
    try {
      setRatingsLoading(true);
      const userData = localStorage.getItem('user');
      if (!userData) return;
      const parsedUserData = JSON.parse(userData);
      const token = parsedUserData.token || parsedUserData.accessToken;
      
      const response = await fetch(`${API_BASE_URL}/api/session-feedback/expert/${expertId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Calculate average rating and total reviews from feedback data
          const feedbacks = data.data.filter(f => f.rating && f.rating > 0);
          const totalReviews = feedbacks.length;
          const averageRating = totalReviews > 0 
            ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalReviews 
            : 0;
          
          const ratingsData = {
            averageRating,
            totalReviews,
            reviews: feedbacks.slice(0, 5) // Show latest 5 reviews
          };
          setRatings(ratingsData);
          setApiCallCache(prev => new Map(prev).set(cacheKey, { timestamp: Date.now(), data: ratingsData }));
        }
      }
    } catch (err) {
      console.error('Error fetching ratings:', err);
    } finally {
      setRatingsLoading(false);
    }
  }, []);
  

  const fetchExpert = async (id: string) => {
    try {
      setLoading(true);

      // Add authentication header for profile fetch
      const userData = localStorage.getItem('user');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (userData) {
        const user = JSON.parse(userData);
        const token = user.token || user.accessToken;
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const response = await fetch(`${API_BASE_URL}/api/experts/profiles/${id}`, {
        headers
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Expert with ID ${id} not found`);
        } else {
          throw new Error(`Failed to fetch expert (Status: ${response.status})`);
        }
      }

      const data = await response.json();

      if (data.success && data.data) {
        console.log('Expert data received:', data.data);
        setExpert(data.data);
      } else {
        throw new Error(data.message || "No expert found");
      }
    } catch (err) {
      console.error("Error fetching expert:", err);
      setError(err instanceof Error ? err.message : "Failed to load expert profile");
    } finally {
      setLoading(false);
    }
  };

  // Fetch expert availability from API
  const fetchAvailability = useCallback(async (userId: string) => {
    const cacheKey = `availability-${userId}`;
    const cached = apiCallCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 180000) { // 3 minutes cache
      setAvailability(cached.data);
      return;
    }
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        console.log('No user data found in localStorage');
        return;
      }
      
      const parsedUserData = JSON.parse(userData);
      const token = parsedUserData.token || parsedUserData.accessToken;
      
      console.log('Fetching availability for userId:', userId);
      console.log('Token available:', !!token);
      console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'none');
      console.log('Full API URL:', `${API_BASE_URL}/api/experts/availability?user_id=${userId}`);
      
      const response = await fetch(`${API_BASE_URL}/api/experts/availability?user_id=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('Availability response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.json();
        console.log('Availability data:', data);
        if (data.success) {
          const availabilityData = data.data || [];
          setAvailability(availabilityData);
          setApiCallCache(prev => new Map(prev).set(cacheKey, { timestamp: Date.now(), data: availabilityData }));
          console.log('Availability slots set:', availabilityData.length);
        } else {
          console.log('API returned success=false:', data.message);
          setAvailability([]);
        }
      } else {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = await response.text();
        }
        console.log('API request failed with status:', response.status);
        console.log('Error response:', errorData);
        
        if (response.status === 401) {
          console.log('Authentication failed - token may be invalid or expired');
        } else if (response.status === 404) {
          console.log('Route not found - check API endpoint');
        }
        
        setAvailability([]);
      }
    } catch (err) {
      console.error('Error fetching availability:', err);
      setAvailability([]);
    }
  }, []);

  const formatTime = (time24: string) => {
    if (!time24 || !time24.includes(':')) return time24;
    const [hourStr, minuteStr] = time24.split(':');
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${minuteStr.padStart(2, '0')} ${ampm}`;
  };

  // Helper function to count characters in text
  const countCharacters = (text: string) => {
    if (!text || text.trim() === '') return 0;
    return text.trim().length;
  };

  // Helper function to truncate text to 150 characters
  const truncateText = (text: string, maxChars: number = 150) => {
    if (!text || text.trim() === '') return text;
    if (text.length <= maxChars) return text;
    return text.substring(0, maxChars) + '...';
  };

  // Toggle expanded state for about section
  const toggleAboutExpansion = () => {
    setIsAboutExpanded(prev => !prev);
  };

  const groupedAvailability = useMemo(() => {
    return daysOfWeek.map(day => ({
      day,
      slots: availability.filter(a => a.day_of_week.toLowerCase() === day.toLowerCase()),
    }));
  }, [availability]);

  // Fetch existing bookings for expert from API
  const fetchExistingBookings = useCallback(async (expertId: string) => {
    const cacheKey = `bookings-${expertId}`;
    const cached = apiCallCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 120000) { // 2 minutes cache
      setExistingBookings(cached.data);
      return;
    }
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return;
      const parsedUserData = JSON.parse(userData);
      const token = parsedUserData.token || parsedUserData.accessToken;
      
      console.log('Fetching existing bookings for expertId:', expertId);
      
      const response = await fetch(`${API_BASE_URL}/api/bookings/expert/${expertId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Bookings response status:', response.status);
      
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setExistingBookings(data.data);
        setApiCallCache(prev => new Map(prev).set(cacheKey, { timestamp: Date.now(), data: data.data }));
        console.log('Existing bookings loaded:', data.data.length);
      }
    } catch (err) {
      console.error('Error fetching existing bookings:', err);
      setExistingBookings([]);
    }
  }, []);

  const getSlotBookingStatus = (dayOrDate: string, startTime: string, endTime: string): { 
    isBooked: boolean; 
    status?: string; 
    message?: string;
    bookingDetails?: {
      sessionType: string;
      seekerName: string;
      status: string;
    };
  } => {
    // Handle both day name and date string inputs
    let dateString: string;
    if (dayOrDate.includes('-')) {
      // It's already a date string (YYYY-MM-DD)
      dateString = dayOrDate;
    } else {
      // It's a day name, calculate the date
      const today = new Date();
      const dayIndex = daysOfWeek.indexOf(dayOrDate);
      const currentDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;
      
      const daysToAdd = dayIndex >= currentDayIndex 
        ? dayIndex - currentDayIndex 
        : 7 - (currentDayIndex - dayIndex);
      
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + daysToAdd);
      dateString = targetDate.toISOString().split('T')[0];
    }
    
    const slotStartTime = convertTo24Hour(startTime);
    const slotEndTime = convertTo24Hour(endTime);
    
    // Find any overlapping booking regardless of session type
    const overlappingBooking = existingBookings.find(booking => {
      const bookingStart = convertTo24Hour(booking.start_time);
      const bookingEnd = convertTo24Hour(booking.end_time);
      
      // Convert booking date to YYYY-MM-DD format for comparison
      const bookingDateOnly = booking.date.includes('T') 
        ? booking.date.split('T')[0] 
        : booking.date;
      
      // Check if the booking is for the same date and has any overlap
      const dateMatch = bookingDateOnly === dateString;
      const timeOverlap = (
        (bookingStart <= slotStartTime && bookingEnd > slotStartTime) ||
        (bookingStart < slotEndTime && bookingEnd >= slotEndTime) ||
        (slotStartTime <= bookingStart && slotEndTime >= bookingEnd)
      );
      
      return dateMatch && timeOverlap;
    });
    
    if (overlappingBooking) {
      // If the booking is completed or in draft status, allow new bookings
      if (overlappingBooking.status === 'completed' || overlappingBooking.status === 'draft') {
        return { isBooked: false };
      }
      
      // For any other status, the slot is booked
      let message = "This time slot is ";
      if (overlappingBooking.status === 'pending') {
        message += `pending approval for a ${overlappingBooking.session_type} session by ${overlappingBooking.seeker_name || 'another seeker'}. Please choose a different time.`;
      } else if (overlappingBooking.status === 'confirmed') {
        message += `already booked for a ${overlappingBooking.session_type} session by ${overlappingBooking.seeker_name || 'another seeker'}. Please choose a different time.`;
      } else if (overlappingBooking.status === 'rejected' || overlappingBooking.status === 'cancelled') {
        return { isBooked: false }; // Allow booking if previous booking was rejected/cancelled
      }
      
      return {
        isBooked: true,
        status: overlappingBooking.status,
        message,
        bookingDetails: {
          sessionType: overlappingBooking.session_type,
          seekerName: overlappingBooking.seeker_name || 'Another seeker',
          status: overlappingBooking.status
        }
      };
    }
    
    return { isBooked: false };
  };

  // Helper to convert 12-hour time with AM/PM to 24-hour "HH:mm"
  const convertTo24Hour = (time12h: string): string => {
    if (!time12h) return '';
    const match = time12h.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
    if (!match) return time12h; // Return as is if format doesn't match
    let [, hourStr, minuteStr, meridian] = match;
    let hour = parseInt(hourStr, 10);
    const minute = minuteStr;
    if (meridian.toUpperCase() === 'PM' && hour < 12) hour += 12;
    if (meridian.toUpperCase() === 'AM' && hour === 12) hour = 0;
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  };

  // Calculate slot price for 15-minute slots
  function calculateSlotPrice(startTime: string, endTime: string) {
    if (!selectedExpert) return 0;
    const hourlyRate = selectedExpert.audio_pricing || selectedExpert.audioPricing || 0;
    // 15 minutes = 0.25 hours
    return Math.round(hourlyRate * 0.25);
  }

  // Helper: format date
  const formatDate = (date: any, formatStr: string) => {
    if (!date) return '';
    const d = new Date(date);
    if (formatStr === 'yyyy-MM-dd') {
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }
    if (formatStr === 'PPP') {
      return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    if (formatStr === 'EEEE, MMM d, yyyy') {
      return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
    }
    return d.toISOString();
  };

  // Generate time slots for a given day (15-minute slots with 10-minute gaps)
  const generateTimeSlots = (startTime: string, endTime: string): string[] => {
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
  };

  // Get available slots for selected date (accepts both Date object and string)
  function getAvailableSlotsForDate(date: Date | string | null) {
    if (!date) {
      console.log('getAvailableSlotsForDate: No date provided');
      return [];
    }
    
    const dayOfWeek = typeof date === 'string' 
      ? new Date(date).toLocaleDateString('en-US', { weekday: 'long' })
      : date.toLocaleDateString('en-US', { weekday: 'long' });
    
    console.log('getAvailableSlotsForDate:', {
      date,
      dayOfWeek,
      availabilityCount: availability.length,
      availability: availability
    });
    
    const daySlots = availability.filter(a => a.day_of_week.toLowerCase() === dayOfWeek.toLowerCase());
    console.log('Filtered day slots:', daySlots);
    
    // Get current date and time for validation
    const now = new Date();
    const selectedDate = typeof date === 'string' ? new Date(date) : date;
    const isToday = selectedDate.toDateString() === now.toDateString();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    let availableSlots: { start_time: string, end_time: string }[] = [];
    daySlots.forEach(slot => {
      const start = slot.start_time.length === 5 ? slot.start_time : convertTo24Hour(slot.start_time);
      const end = slot.end_time.length === 5 ? slot.end_time : convertTo24Hour(slot.end_time);
      const slotStarts = generateTimeSlots(start, end);
      console.log('Generated time slots for', slot, ':', slotStarts);
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
    
    console.log('Final available slots:', availableSlots);
    return availableSlots;
  }

  // Cache for validation results to avoid repeated API calls
  const [validationCache, setValidationCache] = useState<{
    timestamp: number;
    result: boolean;
    subscriptionStatus?: string;
  } | null>(null);

  // Validation function for booking access
  const validateBookingAccess = useCallback(async () => {
    // Check cache first (valid for 2 minutes)
    if (validationCache && Date.now() - validationCache.timestamp < 120000) {
      return validationCache.result;
    }
    try {
      // Step 1: Authentication Check
      const userData = localStorage.getItem('user');
      if (!userData) {
        toast({
          title: "Authentication Required",
          description: "Please log in to book a session.",
          variant: "destructive"
        });
        return false;
      }

      const user = JSON.parse(userData);
      
      // Step 2: User Role Validation (solution_seeker only)
      if (user.role !== 'solution_seeker') {
        toast({
          title: "Access Restricted",
          description: "Only solution seekers can book sessions. Please log in with a solution seeker account.",
          variant: "destructive"
        });
        return false;
      }

      // Step 3: Subscription Status Validation (active required for backend)
      const token = user.token || user.accessToken;
      console.log('Debug - validateBookingAccess token:', token ? token.substring(0, 20) + '...' : 'none');
      console.log('Debug - validateBookingAccess user role:', user.role);
      
      let subscriptionStatus = 'inactive';
      const subscriptionResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/subscriptions/current`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json();
        subscriptionStatus = subscriptionData.data?.subscription_status || 'inactive';
        console.log('Debug - Current subscription status:', subscriptionStatus);
        
        // Allow both 'trial' and 'active' status
        if (subscriptionStatus !== 'trial' && subscriptionStatus !== 'active') {
          toast({
            title: "Subscription Required",
            description: "Please activate a subscription to book sessions.",
            variant: "destructive"
          });
          navigate('/subscription-plans');
          return false;
        }
      } else {
        console.log('Debug - Subscription check failed:', subscriptionResponse.status);
        toast({
          title: "Subscription Check Failed",
          description: "Unable to verify subscription status. Please try again.",
          variant: "destructive"
        });
        return false;
      }

      // Cache successful validation
      const result = true;
      setValidationCache({
        timestamp: Date.now(),
        result,
        subscriptionStatus
      });
      return result;
    } catch (error) {
      console.error('Error validating booking access:', error);
      // Cache failed validation for 5 seconds to prevent spam
      setValidationCache({
        timestamp: Date.now() - 25000, // Shorter cache for failures
        result: false
      });
      toast({
        title: "Validation Error",
        description: "Unable to validate access. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  }, [validationCache, toast, navigate]);

  const handleSubmitBooking = async () => {
    try {
      setIsBooking(true);
      
      // Quick validation checks first (no API calls)
      if (!bookingForm.selectedSlot || !bookingForm.date || !selectedExpert?.id) {
        toast({
          title: "Missing Required Fields",
          description: "Please select a date and time slot before booking.",
          variant: "destructive"
        });
        setIsBooking(false);
        return;
      }
      
      // Validate booking access (with caching)
      const hasAccess = await validateBookingAccess();
      if (!hasAccess) {
        setIsBooking(false);
        return;
      }

      // Pre-compute values to avoid repeated calculations
      const dayOfWeek = new Date(bookingForm.date).toLocaleDateString('en-US', { weekday: 'long' });
      const selectedStartTime24 = convertTo24Hour(bookingForm.selectedSlot.startTime);
      const selectedEndTime24 = convertTo24Hour(bookingForm.selectedSlot.endTime);
      
      // Step 4: Expert Availability Check (optimized)
      const expertAvailable = availability.some(slot => {
        if (slot.day_of_week.toLowerCase() !== dayOfWeek.toLowerCase()) return false;
        const slotStart24 = convertTo24Hour(slot.start_time);
        const slotEnd24 = convertTo24Hour(slot.end_time);
        return slotStart24 <= selectedStartTime24 && slotEnd24 >= selectedEndTime24;
      });
      
      if (!expertAvailable) {
        toast({
          title: "Expert Unavailable",
          description: "The expert is not available during the selected time slot.",
          variant: "destructive"
        });
        setIsBooking(false);
        return;
      }

      // Step 5: Slot Overlap Check (using pre-computed values)
      const bookingStatus = getSlotBookingStatus(
        dayOfWeek,
        bookingForm.selectedSlot.startTime,
        bookingForm.selectedSlot.endTime
      );
      if (bookingStatus.isBooked) {
        toast({
          title: "Time Slot Unavailable",
          description: "This time slot overlaps with an existing booking. Please choose a different time.",
          variant: "destructive"
        });
        setBookingDialogOpen(false);
        if (selectedExpert?.id) {
          await fetchExistingBookings(selectedExpert.id);
        }
        setIsBooking(false);
        return;
      }

      // Validate slot duration is 15 minutes (using pre-computed values)
      const [startHour, startMinute] = selectedStartTime24.split(':').map(Number);
      const [endHour, endMinute] = selectedEndTime24.split(':').map(Number);
      const durationMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
      
      if (durationMinutes !== 15) {
        toast({
          title: "Invalid Slot Duration",
          description: "Only 15-minute slots are allowed for booking.",
          variant: "destructive"
        });
        setIsBooking(false);
        return;
      }

      const userData = localStorage.getItem('user');
      const parsedUserData = JSON.parse(userData);
      const token = parsedUserData.token || parsedUserData.accessToken;
      const seekerName = `${parsedUserData.first_name || ''} ${parsedUserData.last_name || ''}`.trim();
      
      // Get session_request_id from URL query params
      const searchParams = new URLSearchParams(location.search);
      const session_request_id = searchParams.get('request_id');
      
      // Helper to add seconds to time string if missing
      const toHHMMSS = (time: string) => {
        if (!time) return '';
        if (time.match(/^\d{2}:\d{2}$/)) return `${time}:00`;
        if (time.match(/^\d{2}:\d{2}:\d{2}$/)) return time;
        return time; // fallback
      };
      
      // Create booking payload
      const payload = {
        expert_id: selectedExpert?.user_id || selectedExpert?.id,
        seeker_id: parsedUserData.user_id || parsedUserData.id || '',
        seeker_name: seekerName,
        date: selectedDate ? formatDate(selectedDate, 'yyyy-MM-dd') : bookingForm.date,
        start_time: toHHMMSS(bookingForm.selectedSlot.startTime),
        end_time: toHHMMSS(bookingForm.selectedSlot.endTime),
        session_type: bookingForm.sessionType,
        amount: bookingForm.selectedSlot.price,
        status: 'pending',
        ...(session_request_id ? { session_request_id } : {})
      };
      
      console.log('Debug - Booking payload:', payload);
      console.log('Debug - Token for booking:', token ? token.substring(0, 20) + '...' : 'none');
      console.log('Debug - Full user data from localStorage:', parsedUserData);
      console.log('Debug - User data summary:', { 
        role: parsedUserData.role, 
        id: parsedUserData.id, 
        user_id: parsedUserData.user_id,
        token_exists: !!parsedUserData.token,
        accessToken_exists: !!parsedUserData.accessToken
      });
      
      // Make the booking request
      const response = await fetch(`${API_BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      console.log('Debug - Booking response status:', response.status);
      console.log('Debug - Booking response headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log('Debug - Booking response data:', data);
      
      if (!response.ok) {
        console.log('Debug - 403 Error details:', {
          status: response.status,
          error: data.error,
          reason: data.reason,
          message: data.message,
          upgradeRequired: data.upgradeRequired,
          currentUsage: data.currentUsage,
          usageLimit: data.usageLimit
        });
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
      const sid = parsedUserData.user_id || parsedUserData.id;
      const eid = selectedExpert?.user_id || selectedExpert?.id;
      if (sid && eid) {
        trackExpertBooked(String(sid), String(eid));
      }
      toast({
        title: "Booking Submitted",
        description: "Your booking request has been sent to the expert for approval!",
        variant: "default",
        className: "bg-white border-2 border-blue-500 text-blue-600",
      });
      
      // Navigate to appointment log
      navigate('/appointment-log');
    } catch (error) {
      console.error("Error creating booking:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsBooking(false);
    }
  };

  // Check authentication status before fetching data
  useEffect(() => {
    const checkAuth = () => {
      const userData = localStorage.getItem('user');
      if (!userData && id) {
        navigate('/auth/seeker', {
          state: { 
            returnUrl: `/expert-profile/${expertId}`,
            message: 'Please login to view expert details'
          }
        });
        return false;
      }
      return true;
    };

    if (expertId && checkAuth()) {
      fetchExpert(expertId);
    }
  }, [expertId, navigate]);

  useEffect(() => {
    if (expert?.user_id) {
      console.log('useEffect: Fetching data for expert user_id:', expert.user_id);
      fetchExistingBookings(expert.user_id);
      fetchAvailability(expert.user_id);
      fetchRatings(expert.user_id);
    }
  }, [expert, fetchExistingBookings, fetchAvailability, fetchRatings]);

  useEffect(() => {
    if (!expert?.user_id) return;
    const raw = localStorage.getItem("user");
    if (!raw) return;
    try {
      const u = JSON.parse(raw);
      const seekerId = u.user_id || u.id;
      if (seekerId) trackProfileView(String(seekerId), expert.user_id);
    } catch {
      /* ignore */
    }
  }, [expert?.user_id]);

  // Add this useEffect after the other hooks in ExpertProfileContent
  useEffect(() => {
    if (bookingDialogOpen && expert?.user_id) {
      fetchAvailability(expert.user_id);
      fetchExistingBookings(expert.user_id);
    }
  }, [bookingDialogOpen, expert?.user_id, fetchAvailability, fetchExistingBookings]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
        <Navbar />
        <div className="pt-32 pb-16 text-center">
          <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <div className="animate-spin h-8 w-8 border-3 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
          <h3 className="text-2xl font-semibold text-gray-700 mb-2">Loading Expert Profile</h3>
          <p className="text-gray-500">Please wait while we fetch the expert details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !expert) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
        <Navbar />
        <div className="pt-32 pb-16 text-center">
          <div className="bg-gradient-to-br from-red-100 to-pink-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <ExternalLink className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-semibold text-red-600 mb-2">Expert Not Found</h2>
          <p className="text-red-500 max-w-md mx-auto mb-6">{error}</p>
          <Button 
            onClick={() => navigate('/experts')} 
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl"
          >
            Browse Other Experts
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      <Navbar />
      <div className="relative pt-24 pb-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Expert Profile
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Connect with industry professionals for personalized guidance and expertise
            </p>
          </div>

          {/* Main Profile Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Profile Card */}
            <div className="lg:col-span-2">
              <Card className="overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 border-0 shadow-xl rounded-2xl">
                {/* Header Section */}
                <CardHeader className="pb-6">
                  <div className="flex items-start gap-6">
                    <div className="relative">
                      <Avatar className="h-24 w-24 border-4 border-white shadow-lg ring-2 ring-blue-100">
                        <AvatarImage 
                          src={expert?.imageUrl || expert?.image_url} 
                          alt={`${expert?.first_name} ${expert?.last_name}`} 
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-2xl">
                          {expert?.first_name?.[0] || 'E'}{expert?.last_name?.[0] || 'X'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 border-3 border-white rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {expert?.first_name || expert?.firstName} {expert?.last_name || expert?.lastName}
                      </h1>
                      <p className="text-lg text-blue-600 font-medium mb-3 flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        {expert?.designation}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {expert?.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4" />
                          {expert?.work_experience || expert?.workExperience}+ years experience
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          {expert?.current_organization || expert?.currentOrganization}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-8">
                  {/* Video Section */}
                  <div>
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Play className="h-5 w-5 text-blue-600" />
                      Introduction Video
                    </h3>
                    <div className="relative bg-gray-900 rounded-xl overflow-hidden w-full max-w-2xl">
                      <div className="aspect-video">
                        <iframe
                          src="https://www.youtube.com/embed/4bzB2aA0v98?si=kBJv_yjbAlTzWnq-"
                          title={`Introduction video by ${expert?.first_name} ${expert?.last_name}`}
                          className="w-full h-full rounded-xl"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  </div>

                  {/* About Section */}
                  <div>
                    <h3 className="text-xl font-semibold mb-4">About</h3>
                    {(() => {
                      const workExp = expert?.work_experience || expert?.workExperience || 0;
                      const aboutText = `With ${workExp} years of experience in ${expert?.expertise}, I specialize in providing expert guidance in ${expert?.areas_of_help || expert?.areasOfHelp}.`;
                      
                      const charCount = countCharacters(aboutText);
                      const shouldShowToggle = charCount > 150;
                      
                      return (
                        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-100">
                          <p className="text-gray-700 leading-relaxed mb-3">
                            {isAboutExpanded ? aboutText : truncateText(aboutText)}
                          </p>
                          {shouldShowToggle && (
                            <Button
                              variant="link"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700 p-0 h-auto"
                              onClick={toggleAboutExpansion}
                            >
                              {isAboutExpanded ? 'View Less' : 'View More'}
                            </Button>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Skills & Expertise */}
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Areas of Expertise</h3>
                    <div className="flex flex-wrap gap-3">
                      {expert?.expertise?.split(',').map((skill, index) => (
                        <Badge
                          key={index}
                          className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200 px-4 py-2 rounded-full text-sm font-medium"
                        >
                          {skill.trim()}
                        </Badge>
                      )) || (
                        <p className="text-gray-500">No expertise areas specified</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Areas of Help */}
                  {(expert?.areas_of_help || expert?.areasOfHelp) && (
                    <div>
                      <h3 className="text-xl font-semibold mb-4">How I Can Help</h3>
                      <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6 border border-emerald-100">
                        <p className="text-gray-700 leading-relaxed">
                          {expert?.areas_of_help || expert?.areasOfHelp}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Pricing & Booking */}
            <div className="space-y-6">
              {/* Pricing Card */}
              <Card className="overflow-hidden bg-gradient-to-br from-white via-green-50/30 to-emerald-50/20 border-0 shadow-xl rounded-2xl">
                <CardHeader>
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Phone className="h-5 w-5 text-green-600" />
                    Consultation Pricing
                  </h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                          <Phone className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900">Audio Call</span>
                          <div className="text-sm text-gray-600">1-on-1 consultation</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-1">
                        <span className="line-through text-gray-400">{safeFormatCurrency(expert?.audio_pricing || expert?.audioPricing || 0, 'INR')}</span> <span className="text-green-600">Free</span>
                      </div>
                      {/* <div className="text-sm text-gray-600">per 15 minutes</div> */}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Availability & Booking Card */}
              <Card className="overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/20 border-0 shadow-xl rounded-2xl">
                <CardHeader>
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-blue-600" />
                    Availability
                  </h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-4 h-4 rounded-full ${availability.length > 0 ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                      <span className="font-semibold text-gray-900">{availability.length > 0 ? 'Available Now' : 'Setting up schedule'}</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Next Available:</span>
                        <span className="font-medium text-blue-600">
                          {availability.length > 0 ? 
                            `${formatTime(availability[0].start_time)} onwards` : 
                            "Schedule being set up"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Response Time:</span>
                        <span className="font-medium text-blue-600">Within 24 hours</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed" 
                    onClick={async () => {
                      // Debounce rapid clicks (prevent multiple clicks within 1 second)
                      const now = Date.now();
                      if (now - lastClickTime < 1000) {
                        return;
                      }
                      setLastClickTime(now);
                      
                      // Quick validation first
                      const expertUserId = expert?.user_id;
                      if (!expertUserId) {
                        toast({
                          title: "Error",
                          description: "Expert user ID not found. Please try again later.",
                          variant: "destructive"
                        });
                        return;
                      }
                      
                      // Validate booking access (with caching)
                      const hasAccess = await validateBookingAccess();
                      if (!hasAccess) {
                        return;
                      }
                      
                      setSelectedExpert(expert);
                      // Parallel API calls for better performance (cached calls will return immediately)
                      await Promise.all([
                        fetchAvailability(expertUserId),
                        fetchExistingBookings(expertUserId)
                      ]);
                      setBookingDialogOpen(true);
                    }}
                    disabled={!expert || (!expert?.user_id && !expert?.id)}
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    Schedule Audio Call
                  </Button>
                </CardContent>
              </Card>

              {/* Rating Card */}
              <Card className="overflow-hidden bg-gradient-to-br from-white via-yellow-50/30 to-orange-50/20 border-0 shadow-xl rounded-2xl">
                <CardHeader>
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Rating & Reviews
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200 text-center">
                    {ratingsLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-yellow-500" />
                      </div>
                    ) : ratings.totalReviews > 0 ? (
                      <>
                        <div className="flex items-center justify-center gap-2 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-6 w-6 ${
                                i < Math.round(ratings.averageRating) 
                                  ? 'text-yellow-400 fill-current' 
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                          {ratings.averageRating.toFixed(1)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {ratings.totalReviews} review{ratings.totalReviews !== 1 ? 's' : ''}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-center gap-2 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className="h-6 w-6 text-gray-300" 
                            />
                          ))}
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">New Expert</div>
                        <div className="text-sm text-gray-600">Building reputation</div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="max-w-lg w-full h-[80vh] bg-white/90 backdrop-blur-xl shadow-2xl rounded-2xl border-0 p-0 overflow-visible flex flex-col items-center justify-center">
          <DialogHeader className="sr-only">
            <DialogTitle>Book a Session</DialogTitle>
          </DialogHeader>
          <AnimatePresence>
            {isBooking ? (
              <motion.div
                key="booking-success"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="flex flex-col items-center justify-center py-12 px-4 w-full"
              >
                <CheckCircle2 className="h-16 w-16 text-green-500 mb-2 animate-in fade-in zoom-in" />
                <h2 className="text-2xl font-bold text-green-700 mb-1">Booking...</h2>
                <p className="text-gray-600 text-center mb-2">Processing your booking request...</p>
              </motion.div>
            ) : (
              <motion.div
                key="booking-form"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="w-full h-full flex flex-col"
              >
                <div className="w-full text-center pt-6 px-6">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <Avatar className="h-12 w-12 border-2 border-blue-100">
                      {selectedExpert?.imageUrl ? (
                        <AvatarImage src={selectedExpert.imageUrl} alt={`${selectedExpert.firstName} ${selectedExpert.lastName}`} />
                      ) : (
                        <AvatarFallback className="bg-blue-50 text-blue-600">
                          <Phone size={20} />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <h2 className="text-2xl font-bold text-blue-700">Book a Session</h2>
                      <p className="text-sm text-gray-600">with {selectedExpert?.first_name || selectedExpert?.firstName} {selectedExpert?.last_name || selectedExpert?.lastName}</p>
                    </div>
                  </div>
                </div>
                {/* Scrollable content area, flex-1 */}
                <div className="flex-1 grid gap-4 py-4 w-full px-4 md:px-8 overflow-y-auto">
                  <div className="flex justify-center w-full">
                    <div className="mx-auto" style={{ maxWidth: 360 }}>
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
                    <div className="font-semibold mb-2 text-center">Time Slots for {bookingForm.date ? formatDate(new Date(bookingForm.date), 'PPP') : ''}</div>
                    <div className="flex justify-center gap-4 mb-3 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-white border border-blue-200 rounded"></div>
                        <span>Available</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
                        <span>Booked</span>
                      </div>
                    </div>
                    {bookingForm.date && getAvailableSlotsForDate(bookingForm.date).length === 0 ? (
                      <div className="text-muted-foreground text-sm text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="mb-2">No slots available for this date.</p>
                        <p className="text-xs">The expert may not have set up their availability yet, or all slots are booked. Please try a different date or contact the expert directly.</p>
                      </div>
                    ) : (
                      <div className="w-full flex flex-wrap gap-3 justify-center items-center overflow-hidden">
                        {bookingForm.date && getAvailableSlotsForDate(bookingForm.date).map((slot, idx) => {
                          // Calculate 15-minute end time
                          const startParts = slot.start_time.split(':').map(Number);
                          let endHour = startParts[0];
                          let endMinute = startParts[1] + 15;
                          if (endMinute >= 60) {
                            endHour += Math.floor(endMinute / 60);
                            endMinute = endMinute % 60;
                          }
                          const calculatedEndTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
                          
                          // Check if slot is expired (current date and time validation)
                          const now = new Date();
                          const slotDate = new Date(bookingForm.date);
                          const slotDateTime = new Date(slotDate);
                          slotDateTime.setHours(startParts[0], startParts[1], 0, 0);
                          if (slotDateTime <= now) return null;
                          
                          const startTimeFormatted = slot.start_time.includes('AM') || slot.start_time.includes('PM') ? slot.start_time : formatTime(slot.start_time);
                          const endTimeFormatted = formatTime(calculatedEndTime);
                          const isSelected = bookingForm.selectedSlot && bookingForm.selectedSlot.startTime === slot.start_time && bookingForm.selectedSlot.endTime === calculatedEndTime;
                          const bookingStatus = getSlotBookingStatus(bookingForm.date, slot.start_time, calculatedEndTime);
                          const isBooked = bookingStatus.isBooked;
                          

                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={isBooked ? undefined : () => {
                                const price = calculateSlotPrice(slot.start_time, calculatedEndTime);
                                setBookingForm(prev => ({
                                  ...prev,
                                  selectedSlot: {
                                    startTime: slot.start_time,
                                    endTime: calculatedEndTime,
                                    price: price
                                  },
                                  date: bookingForm.date
                                }));
                                setSelectedDate(bookingForm.date ? new Date(bookingForm.date) : null);
                              }}
                              disabled={isBooked}
                              className={`min-w-[120px] max-w-[180px] m-1 px-4 py-3 text-base rounded-xl border font-semibold transition-all flex items-center justify-center focus:outline-none whitespace-nowrap overflow-hidden text-ellipsis
                                ${isBooked
                                  ? 'bg-red-100 text-red-500 border-red-200 cursor-not-allowed opacity-60'
                                  : isSelected
                                    ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white border-blue-400 shadow-lg scale-105 focus:ring-2 focus:ring-blue-300'
                                    : 'bg-white/80 hover:bg-blue-50 text-blue-700 border-blue-200 focus:ring-2 focus:ring-blue-300'}
                              `}
                              style={{wordBreak: 'break-word'}}
                              title={isBooked ? `Booked (${bookingStatus.status})` : undefined}
                            >
                              <span className="font-semibold text-center leading-tight">
                                {startTimeFormatted} - {endTimeFormatted}
                                {isBooked && <span className="block text-xs mt-1">Booked</span>}
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
                      Audio Call (15 minutes) <span className="line-through text-gray-400">{safeFormatCurrency((selectedExpert?.audio_pricing || selectedExpert?.audioPricing || 0) / 4)}</span> <span className="text-green-600 font-semibold">Free</span>
                    </div>
                  </div>
                  {typeof bookingForm.selectedSlot?.price === 'number' && !isNaN(bookingForm.selectedSlot.price) ? (
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                      <span className="sm:text-right font-medium">Total Price</span>
                      <div className="sm:col-span-3 text-lg font-bold text-primary">
                         <span className="line-through text-gray-400">{safeFormatCurrency(bookingForm.selectedSlot.price)}</span> <span className="text-green-600">Free</span>
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
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ExpertProfile = () => {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div role="alert" className="p-4 bg-red-100 text-red-700 rounded">
          <p>Something went wrong:</p>
          <pre className="whitespace-pre-wrap">{error.message}</pre>
          <button
            onClick={resetErrorBoundary}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded"
          >
            Try again
          </button>
        </div>
      )}
    >
      <ExpertProfileContent />
    </ErrorBoundary>
  );
};

export default ExpertProfile;