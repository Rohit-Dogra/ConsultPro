import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { cn } from "@/lib/utils";
import { 
  Clock, 
  User, 
  MapPin, 
  Video, 
  Phone, 
  MessageSquare,   
  ExternalLink,
  Calendar as CalendarIcon,
  Check, 
  X, 
  CalendarClock,
  Mic
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { toast } from "../components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Calendar } from "../components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { format, addDays, isAfter, isBefore, isSameDay, parseISO } from 'date-fns';
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { requestNotificationPermission } from '../config/firebase';
import { shouldShowSuccessMessage, shouldRunSetup } from '../utils/notificationPermission';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { downloadService } from '../services/downloadService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Booking {
  id: string;
  expert_id: string;
  seeker_id: string;
  expert_name: string;
  seeker_name: string;
  date: string;
  start_time: string;
  end_time: string;
  session_type: 'video' | 'audio' | 'chat';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
  amount: number | string;
  created_at: string;
  notes?: string;
  is_read?: boolean;
  expert_response?: string;
  rejection_reason?: string;
  // Session request fields
  problem_statement?: string;
  desired_solution?: string;
  functionality?: string;
  session_request_id?: string;
}

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  profile_image?: string;
  specialty?: string;
  designation?: string;
  company?: string;
  role?: string;
  bio?: string;
  industry?: string;
}

type UserType = 'expert' | 'seeker';

interface NotificationData {
  type: 'booking_request' | 'booking_accepted' | 'booking_cancelled' | 'booking_rejected' | 'session_reminder' | 'session_completed' | 'session_rescheduled' | 'new_message';
  session_type: string;
  session_time?: string;
  date?: string;
  expert_name?: string;
  seeker_name?: string;
  booking_id?: string;
  sender_name?: string;
  message_preview?: string;
}

const capitalizeFirstLetter = (str: string) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Utility functions for performance optimization
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Normalize time string to 24-hour format
const normalizeTime = (timeStr: string): { hour: number; minute: number } => {
  if (!timeStr) return { hour: 0, minute: 0 };
  
  const timeUpper = timeStr.trim().toUpperCase();
  const hasAmPm = timeUpper.includes('AM') || timeUpper.includes('PM');
  
  if (hasAmPm) {
    // 12-hour format (e.g., "2:30 PM", "10:15 AM")
    const [timePart, meridian] = timeUpper.split(/\s+/);
    const [hours, minutes = '0'] = timePart.split(':');
    let hour = parseInt(hours);
    const minute = parseInt(minutes);
    
    if (meridian === 'PM' && hour < 12) hour += 12;
    if (meridian === 'AM' && hour === 12) hour = 0;
    
    return { hour, minute };
  } else {
    // 24-hour format (e.g., "14:30", "09:15")
    const [hours, minutes = '0'] = timeStr.split(':');
    return { hour: parseInt(hours), minute: parseInt(minutes) };
  }
};

// Format time to 12-hour AM/PM format
const formatTo12Hour = (hour: number, minute: number): string => {
  const hour12 = hour % 12 || 12;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;
};

// Check if booking is expired (end time has passed)
const isBookingExpired = (booking: Booking): boolean => {
  try {
    const now = new Date();
    const endTime = normalizeTime(booking.end_time);
    const bookingEndDate = new Date(booking.date);
    bookingEndDate.setHours(endTime.hour, endTime.minute, 0, 0);
    return bookingEndDate < now;
  } catch {
    return false;
  }
};

const formatTimeRange = (startTime: string, endTime?: string) => {
  if (!startTime) return '';
  
  const start = normalizeTime(startTime);
  const startFormatted = formatTo12Hour(start.hour, start.minute);
  
  if (endTime) {
    const end = normalizeTime(endTime);
    const endFormatted = formatTo12Hour(end.hour, end.minute);
    return `${startFormatted} - ${endFormatted}`;
  } else {
    // Fallback: add 15 minutes
    let endHour = start.hour;
    let endMinute = start.minute + 15;
    if (endMinute >= 60) {
      endHour += Math.floor(endMinute / 60);
      endMinute = endMinute % 60;
    }
    const endFormatted = formatTo12Hour(endHour, endMinute);
    return `${startFormatted} - ${endFormatted}`;
  }
};

const dialogStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  content: {
    position: 'relative',
    width: '90%',
    maxWidth: '500px',
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    padding: '1.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    outline: 'none'
  }
};

interface RescheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onReschedule: (bookingId: string, newDate: string, newStartTime: string, newEndTime: string) => Promise<void>;
  checkBookingAvailability: (
    expertId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: string
  ) => Promise<boolean>;
}

const RescheduleDialog: React.FC<RescheduleDialogProps> = ({
  isOpen,
  onClose,
  booking,
  onReschedule,
  checkBookingAvailability
}): JSX.Element | null => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedStartTime, setSelectedStartTime] = useState<string>('');
  const [selectedEndTime, setSelectedEndTime] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog opens/closes or booking changes
  useEffect(() => {
    if (isOpen && booking) {
      // Normalize time format to HH:mm for start and end time
      const normalizeTime = (time: string) => {
        if (!time) return '';
        const parts = time.split(':');
        if (parts.length < 2) return time;
        const hours = parts[0].padStart(2, '0');
        const minutes = parts[1].slice(0,2).padStart(2, '0');
        return `${hours}:${minutes}`;
      };

      setSelectedDate(booking.date || '');
      setSelectedStartTime(normalizeTime(booking.start_time) || '');
      setSelectedEndTime(normalizeTime(booking.end_time) || '');
      setError(null);
    } else {
      // Reset state when dialog closes or booking is null
      setSelectedDate('');
      setSelectedStartTime('');
      setSelectedEndTime('');
      setError(null);
    }
  }, [isOpen, booking]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate inputs
      if (!selectedDate || !selectedStartTime || !selectedEndTime) {
        throw new Error('Please fill in all fields');
      }

      // Check if the selected time slot is available
      const isAvailable = await checkBookingAvailability(
        booking.expert_id,
        selectedDate,
        selectedStartTime,
        selectedEndTime,
        booking.id // Exclude current booking from availability check
      );

      if (!isAvailable) {
        throw new Error('This time slot is not available. Please choose another time.');
      }

      await onReschedule(
        booking.id,
        selectedDate,
        selectedStartTime,
        selectedEndTime
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reschedule booking');
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render if dialog is closed or no booking
  if (!isOpen || !booking) {
    return null;
  }

  // Generate 15-minute time slots from 9 AM to 9 PM (21:00)
  const timeSlots = [];
  for (let hour = 9; hour <= 21; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      if (hour === 21 && minute > 0) break; // Stop at 21:00
      timeSlots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }

  // Filter end time slots based on selected start time
  const availableEndTimes = timeSlots.filter(time => {
    if (!selectedStartTime) return true;
    return time > selectedStartTime;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reschedule Booking</DialogTitle>
          <DialogDescription>
            Select a new date and time for your appointment.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="startTime">Start Time</Label>
            <Select
              value={selectedStartTime}
              onValueChange={(value) => {
                setSelectedStartTime(value);
                // Set end time to 15 minutes after start time
                const [startHour, startMinute] = value.split(':').map(Number);
                let endHour = startHour;
                let endMinute = startMinute + 15;
                if (endMinute >= 60) {
                  endHour += Math.floor(endMinute / 60);
                  endMinute = endMinute % 60;
                }
                setSelectedEndTime(`${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select start time" />
              </SelectTrigger>
               <SelectContent className="max-h-[200px] overflow-y-auto">
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endTime">End Time</Label>
            <Select
              value={selectedEndTime}
              onValueChange={setSelectedEndTime}
              disabled={!selectedStartTime}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select end time" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px] overflow-y-auto">
                {availableEndTimes.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="text-sm text-red-500 mt-2 p-2 bg-red-50 rounded border">
              {error}
            </div>
          )}

           <DialogFooter className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Rescheduling...' : 'Reschedule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Add these predefined rejection reasons at the top of your component
const REJECTION_REASONS = [
  "Unfortunately, I am not available during the time slot you have requested.",
  "The problem statement appears to be outside my current area of expertise.",
  "I would require additional clarity regarding the problem or specific requirements before proceeding.",
  "Certain technical constraints are preventing me from taking this session at the moment."
];

// Update the RejectDialog component
interface RejectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reason: string;
  onReasonChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const RejectDialog: React.FC<RejectDialogProps> = ({
  isOpen,
  onClose,
  reason,
  onReasonChange,
  onSubmit,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState('');
  const prevIsOpenRef = useRef(false);

  // Reset state when dialog opens/closes
  useEffect(() => {
    // Only reset if dialog was closed and is now open
    if (isOpen && !prevIsOpenRef.current) {
      setSelectedReason('');
      setCustomReason('');
    }
    // Update the ref for the next render cycle
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  // Update the combined reason when selections change
  useEffect(() => {
    let finalReason = selectedReason;
    if (customReason.trim()) {
      finalReason = selectedReason ? `${selectedReason}\n\n${customReason.trim()}` : customReason.trim();
    }
    onReasonChange(finalReason);
  }, [selectedReason, customReason, onReasonChange]);

  const handleReasonSelect = (reasonText: string) => {
    setSelectedReason(reasonText);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason && !customReason.trim()) {
      return; // Don't submit if no reason is selected or provided
    }
    onSubmit(e);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Reject Booking</h2>
          <p className="text-sm text-gray-500 mt-1">
            Please select one reason for rejecting this booking. Additional comments are optional.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Predefined Reasons */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Reason *:
            </label>
            <div className="space-y-3">
              {REJECTION_REASONS.map((reasonText, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <input
                    type="radio"
                    id={`reason-${index}`}
                    name="rejection-reason"
                    checked={selectedReason === reasonText}
                    onChange={() => handleReasonSelect(reasonText)}
                    className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                  />
                  <label 
                    htmlFor={`reason-${index}`}
                    className="text-sm text-gray-700 cursor-pointer leading-5"
                  >
                    {reasonText}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Reason */}
          <div className="mb-6">
            <label 
              htmlFor="custom-reason" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Additional Comments (Optional)
            </label>
            <textarea
              id="custom-reason"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Add any additional details..."
              className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
              rows={4}
            />
          </div>

          {/* Selected Reason Preview */}
          {/* {(selectedReason || customReason.trim()) && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
              <div className="text-sm text-gray-600 whitespace-pre-line">
                {selectedReason}
                {selectedReason && customReason.trim() && '\n\n'}
                {customReason.trim()}
              </div>
            </div>
          )} */}

          <div className="flex justify-end gap-3">
            <button
              aria-label="Close rejection dialog"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedReason && !customReason.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Reject Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Update the main component state management
const AppointmentLog = () => {

  const [seekerBookings, setSeekerBookings] = useState<Booking[]>([]);
  const [expertBookings, setExpertBookings] = useState<Booking[]>([]);
  const [userType, setUserType] = useState<UserType>(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userRole = (user.role || '').toLowerCase();
      return userRole.includes('expert') ? 'expert' : 'seeker';
    } catch {
      return 'seeker';
    }
  });
  const [userId, setUserId] = useState<string | null>(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.user_id || user.id || null;
    } catch {
      return null;
    }
  });
  const [loadingSeeker, setLoadingSeeker] = useState(false);
  const [loadingExpert, setLoadingExpert] = useState(false);
  const [errorSeeker, setErrorSeeker] = useState<string | null>(null);
  const [errorExpert, setErrorExpert] = useState<string | null>(null);
  const [uniqueContacts, setUniqueContacts] = useState<UserProfile[]>([]);
  const [expertAvailability, setExpertAvailability] = useState<any[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Reschedule dialog states
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Add new state for query dialog
  const [isQueryDialogOpen, setIsQueryDialogOpen] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<string | null>(null);

  // Add new state for available time slots
  const [availableTimeSlots, setAvailableTimeSlots] = useState<{ [key: string]: string[] }>({});

  // Add new state for reject dialog
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [selectedBookingForReject, setSelectedBookingForReject] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Add new state for rejection reason dialog
  const [isRejectionReasonDialogOpen, setIsRejectionReasonDialogOpen] = useState(false);
  const [selectedRejectionReason, setSelectedRejectionReason] = useState<string | null>(null);

  // Add this near the top of the component with other state variables
  const [activeTab, setActiveTab] = useState('pending');
  const location = useLocation();

  // Add these state variables at the top with other state declarations
  const [wsConnectionStatus, setWsConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 3; // Reduced from 5 to 3
  const RECONNECT_DELAY = 30000; // Increased from 5 seconds to 30 seconds

  // Add a function to check if feedback exists for a booking
  const [bookingsWithFeedback, setBookingsWithFeedback] = useState<Set<string>>(new Set());
  
  // Cache for API calls to prevent repeated requests
  const apiCache = useRef(new Map<string, { data: any; timestamp: number; ttl: number }>());
  
  // Function to get cached data or make API call
  const getCachedData = useCallback(async (key: string, fetcher: () => Promise<any>, ttl: number = 300000) => {
    const cached = apiCache.current.get(key);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < cached.ttl) {
      return cached.data;
    }
    
    try {
      const data = await fetcher();
      apiCache.current.set(key, { data, timestamp: now, ttl });
      return data;
    } catch (error) {
      console.error(`Error fetching ${key}:`, error);
      return cached?.data || null;
    }
  }, []);

  // Function to check if a booking has feedback (memoized)
  const checkBookingFeedback = useCallback(async (bookingId: string) => {
    return getCachedData(`feedback-${bookingId}`, async () => {
      const userData = localStorage.getItem('user');
      if (!userData) return false;
      
      const user = JSON.parse(userData);
      const token = user.token || user.accessToken;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/session-feedback/booking/${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.feedbacks && data.feedbacks.length > 0;
      }
      return false;
    }, 120000); // Cache for 2 minutes
  }, [getCachedData]);

  // Function to check all bookings for feedback (memoized and throttled)
  const checkAllBookingsFeedback = useCallback(
    throttle(async () => {
      const allBookings = [...seekerBookings, ...expertBookings];
      const bookingsWithFeedbackSet = new Set<string>();

      // Process bookings in batches to avoid overwhelming the API
      const batchSize = 5;
      for (let i = 0; i < allBookings.length; i += batchSize) {
        const batch = allBookings.slice(i, i + batchSize);
        const promises = batch.map(async (booking) => {
          const hasFeedback = await checkBookingFeedback(booking.id);
          if (hasFeedback) {
            bookingsWithFeedbackSet.add(booking.id);
            
            // Update local booking status to completed if it has feedback
            if (booking.status !== 'completed') {
              setSeekerBookings(prev => prev.map(b => 
                b.id === booking.id ? { ...b, status: 'completed' } : b
              ));
              setExpertBookings(prev => prev.map(b => 
                b.id === booking.id ? { ...b, status: 'completed' } : b
              ));
            }
          }
        });
        
        await Promise.all(promises);
        // Small delay between batches to prevent API overload
        if (i + batchSize < allBookings.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      setBookingsWithFeedback(bookingsWithFeedbackSet);
    }, 5000), // Throttle to once every 5 seconds
    [seekerBookings, expertBookings, checkBookingFeedback]
  );

  // Memoized helper functions to prevent unnecessary recalculations
  const getInitials = useCallback((name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  }, []);

  const formatDate = useCallback((dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  }, []);

  const getTimeUntil = useCallback((dateString: string) => {
    const appointmentDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(appointmentDate.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `In ${diffDays} days`;
    if (diffDays < 30) return `In ${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
    return `In ${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''}`;
  }, []);

  const getStatusBadge = useCallback((status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border border-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'completed':
        return 'bg-orange-100 text-orange-800 border border-orange-300';
      case 'rejected':
        return 'bg-red-100 text-red-700 border border-red-300';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  }, []);

  const getSessionTypeIcon = useCallback((type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4 mr-1" />;
      case 'audio':
        return <Phone className="h-4 w-4 mr-1" />;
      case 'chat':
        return <MessageSquare className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  }, []);

  // Get bookings with a specific contact
  const getBookingsWithContact = (contactId: string) => {
    if (userType === 'seeker') {
      return expertBookings.filter(booking => booking.expert_id === contactId);
    } else if (userType === 'expert') {
      return seekerBookings.filter(booking => booking.seeker_id === contactId);
    }
    return [];
  };

  // Helper to check if session started within last 20 minutes
  const isWithinTwentyMinutesAfterStart = (dateStr: string, startTimeStr: string): boolean => {
    const now = new Date();
    const sessionStart = parseDateTime(dateStr, startTimeStr);
    const twentyMinutesAfter = new Date(sessionStart.getTime() + 20 * 60 * 1000);
    return now >= sessionStart && now <= twentyMinutesAfter;
  };

  // Add this function before getUpcomingCount
  const isUpcomingBooking = (booking: Booking): boolean => {
    const now = new Date();
    const bookingDate = new Date(booking.date);
    const [hours, minutes] = booking.start_time.split(':').map(Number);
    bookingDate.setHours(hours, minutes, 0, 0);
    return bookingDate > now && booking.status !== 'completed' && booking.status !== 'cancelled' && booking.status !== 'rejected';
  };

  // Get upcoming count for badge
  const getUpcomingCount = () => {
    const bookings = userType === 'seeker' ? seekerBookings : expertBookings;
    return bookings.filter(isUpcomingBooking).length;
  };

  // Get past count for badge
  const getPastCount = () => {
    const bookings = userType === 'seeker' ? seekerBookings : expertBookings;
    const now = new Date();
    return bookings.filter(booking => {
      const dateOnly = booking.date.split('T')[0];
      const bookingEnd = parseDateTime(dateOnly, booking.end_time);
      return bookingEnd < now || booking.status === 'completed' || booking.status === 'cancelled';
    }).length;
  };

  // Loading and error state
  const loading = loadingSeeker || loadingExpert;
  const error = errorSeeker || errorExpert;

  // Memoized bookings to display based on userType
  const bookings = useMemo(() => {
    return userType === 'seeker' ? seekerBookings : expertBookings;
  }, [userType, seekerBookings, expertBookings]);
  
  // Memoized booking filters to prevent unnecessary recalculations
  const bookingFilters = useMemo(() => ({
    pending: bookings.filter(booking => 
      booking.status === 'pending' && !isBookingExpired(booking)
    ),
    confirmed: bookings.filter(booking => {
      if (bookingsWithFeedback.has(booking.id)) return false;
      return booking.status === 'confirmed' && !isBookingExpired(booking);
    }),
    rejected: bookings.filter(booking => booking.status === 'rejected'),
    completed: bookings.filter(booking => 
      booking.status === 'completed' || bookingsWithFeedback.has(booking.id)
    )
  }), [bookings, bookingsWithFeedback]);

  // Add this useEffect for debugging after bookings declaration
  useEffect(() => {
    if (userId) {
      // console.log('Current user ID:', userId);
      // console.log('User type:', userType);
      // console.log('All bookings:', bookings);
      // console.log('Confirmed bookings:', bookings.filter(b => b.status === 'confirmed'));
      // console.log('Rejected bookings:', bookings.filter(b => b.status === 'rejected'));
    }
  }, [userId, userType, bookings]);

  // Update the fetchSeekerBookings function (memoized)
  const fetchSeekerBookings = useCallback(async (seekerId: string) => {
    if (!seekerId) return;
    
    setLoadingSeeker(true);
    setErrorSeeker(null);
    
    try {
      const processedBookings = await getCachedData(`seeker-bookings-${seekerId}`, async () => {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings/seeker/${seekerId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) { 
          throw new Error(`Failed to fetch seeker bookings: ${response.status}`);
        }

        const responseData = await response.json();
        
        // Process the bookings data
        const bookingsData = Array.isArray(responseData) ? responseData : 
                            (responseData.data && Array.isArray(responseData.data)) ? responseData.data : 
                            [];
        
        // Ensure each booking has the required fields
        return bookingsData.map((booking: any) => ({
          id: booking.id || `temp-${Math.random()}`,
          expert_id: booking.expert_id || '',
          seeker_id: booking.seeker_id || seekerId,
          expert_name: booking.expert_name || 'Unknown Expert',
          seeker_name: booking.seeker_name || 'You',
          date: booking.date || booking.appointment_date || '',
          start_time: booking.start_time || '',
          end_time: booking.end_time || '',
          session_type: booking.session_type || 'video',
          status: (booking.status || 'pending').toLowerCase(),
          amount: booking.amount || 0,
          created_at: booking.created_at || new Date().toISOString(),
          notes: booking.notes || '',
          rejection_reason: booking.rejection_reason || '',
          is_read: booking.is_read || false
        }));
      }, 180000); // Cache for 3 minutes

      setSeekerBookings(processedBookings || []);
    } catch (error) {
      console.error('Error fetching seeker bookings:', error);
      setErrorSeeker('Failed to fetch bookings. Please try again.');
      setSeekerBookings([]);
    } finally {
      setLoadingSeeker(false);
    }
  }, [getCachedData]);

  // Update the fetchExpertBookings function (memoized)
  const fetchExpertBookings = useCallback(async (expertId: string) => {
    if (!expertId) return;
    
    setLoadingExpert(true);
    setErrorExpert(null);
    
    try {
      const processedBookings = await getCachedData(`expert-bookings-${expertId}`, async () => {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings/expert/${expertId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch expert bookings: ${response.status}`);
        }

        const responseData = await response.json();
        
        // Process the bookings data
        const bookingsData = Array.isArray(responseData) ? responseData : 
                            (responseData.data && Array.isArray(responseData.data)) ? responseData.data : 
                            [];
        
        // Ensure each booking has the required fields
        return bookingsData.map((booking: any) => ({
          id: booking.id || `temp-${Math.random()}`,
          expert_id: booking.expert_id || expertId,
          seeker_id: booking.seeker_id || '',
          expert_name: booking.expert_name || 'You',
          seeker_name: booking.seeker_name || 'Unknown Seeker',
          date: booking.date || booking.appointment_date || '',
          start_time: booking.start_time || '',
          end_time: booking.end_time || '',
          session_type: booking.session_type || 'video',
          status: (booking.status || 'pending').toLowerCase(),
          amount: booking.amount || 0,
          created_at: booking.created_at || new Date().toISOString(),
          notes: booking.notes || '',
          rejection_reason: booking.rejection_reason || '',
          is_read: booking.is_read || false
        }));
      }, 180000); // Cache for 3 minutes

      setExpertBookings(processedBookings || []);
    } catch (error) {
      console.error('Error fetching expert bookings:', error);
      setErrorExpert('Failed to fetch bookings. Please try again.');
      setExpertBookings([]);
    } finally {
      setLoadingExpert(false);
    }
  }, [getCachedData]);

  // Helper function to decode JWT token payload
  const decodeJwtPayload = (token: string): any | null => {
    try {
      const payloadBase64 = token.split('.')[1];
      const payloadJson = atob(payloadBase64);
      return JSON.parse(payloadJson);
    } catch (error) {
      console.error('Failed to decode JWT token payload:', error);
      return null;
    }
  };

  // Handle URL parameters for tab selection
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && ['pending', 'confirmed', 'rejected', 'completed'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  // Check authentication and set user info (optimized)
  const checkAuth = useCallback(async () => {
    try {
      const userDataRaw = localStorage.getItem('user') || '{}';
      let userId = null;
      let userRole = null;
      let token = null;
      
      try {
        const user = JSON.parse(userDataRaw);
        const hasToken = user.token || user.accessToken;
        token = hasToken;
        userId = user.user_id || user.id;
        
        if (!userId && hasToken) {
          const payloadBase64 = hasToken.split('.')[1];
          const payloadJson = atob(payloadBase64);
          const payload = JSON.parse(payloadJson);
          userId = payload.user_id || payload.id || null;
        }
        
        userRole = (user.role || '').toLowerCase();
      } catch (e) {
        console.error("Error parsing user data or token:", e);
      }
      
      if (userId && token) {
        // Set user data immediately to prevent login button flash
        setUserId(userId);
        if (userRole && userRole.includes('expert')) {
          setUserType('expert');
        } else if (userRole && (userRole.includes('seeker') || userRole.includes('client'))) {
          setUserType('seeker');
        } else {
          setUserType('seeker');
        }
        
        // Check subscription status for solution seekers (cached) - non-blocking
        if (userRole && (userRole.includes('seeker') || userRole.includes('client'))) {
          try {
            const subscriptionStatus = await getCachedData(`subscription-${userId}`, async () => {
              const API_BASE_URL = import.meta.env.VITE_API_URL;
              const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
              
              const userResponse = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
                headers: {
                  'Authorization': authToken,
                  'Content-Type': 'application/json'
                }
              });

              if (userResponse.ok) {
                const userData = await userResponse.json();
                return userData.subscription_status;
              }
              return null;
            }, 600000); // Cache for 10 minutes
            
            if (subscriptionStatus && subscriptionStatus !== 'trial' && subscriptionStatus !== 'active') {
              navigate('/subscription-plans');
              return;
            }
          } catch (error) {
            console.error('Error checking subscription status:', error);
            // Continue without blocking if subscription check fails
          }
        }
      } else {
        setUserId(null);
        setUserType('seeker');
      }
    } catch (e) {
      console.error("Error parsing user data:", e);
      setUserId(null);
      setUserType('seeker');
    }
  }, [navigate, getCachedData]);
  
  // Initialize auth state immediately from localStorage
  useEffect(() => {
    const userDataRaw = localStorage.getItem('user') || '{}';
    try {
      const user = JSON.parse(userDataRaw);
      const hasToken = user.token || user.accessToken;
      const userId = user.user_id || user.id;
      const userRole = (user.role || '').toLowerCase();
      
      if (userId && hasToken) {
        setUserId(userId);
        if (userRole && userRole.includes('expert')) {
          setUserType('expert');
        } else {
          setUserType('seeker');
        }
      }
    } catch (e) {
      // Ignore parsing errors, checkAuth will handle it
    }
    
    checkAuth();
  }, [checkAuth]);

  // Fetch bookings when userId changes (debounced)
  const fetchBookingsDebounced = useCallback(
    debounce((id: string) => {
      if (!id) return;
      fetchSeekerBookings(id);
      fetchExpertBookings(id);
    }, 300),
    [fetchSeekerBookings, fetchExpertBookings]
  );
  
  useEffect(() => {
    if (userId) {
      fetchBookingsDebounced(userId);
    }
  }, [userId, fetchBookingsDebounced]);

  // Generate unique contacts list
  useEffect(() => {
    const contactsMap = new Map<string, UserProfile>();

    seekerBookings.forEach(booking => {
      if (booking.expert_id && !contactsMap.has(booking.expert_id)) {
        const nameParts = booking.expert_name ? booking.expert_name.split(' ') : ['Expert'];
        contactsMap.set(booking.expert_id, {
          id: booking.expert_id,
          first_name: nameParts[0] || 'Expert',
          last_name: nameParts.slice(1).join(' ') || '',
          email: '',
          role: 'expert',
          specialty: 'Expert'
        });
      }
    });

    expertBookings.forEach(booking => {
      if (booking.seeker_id && !contactsMap.has(booking.seeker_id)) {
        const nameParts = booking.seeker_name ? booking.seeker_name.split(' ') : ['Client'];
        contactsMap.set(booking.seeker_id, {
          id: booking.seeker_id,
          first_name: nameParts[0] || 'Client',
          last_name: nameParts.slice(1).join(' ') || '',
          email: '',
          role: 'seeker',
          company: 'Client'
        });
      }
    });

    setUniqueContacts(Array.from(contactsMap.values()));
  }, [seekerBookings, expertBookings]);

  // Handle accepting a booking (experts only)
  const handleAcceptBooking = async (bookingId: string) => {
    try {
      const userData = localStorage.getItem('user');
      let token = '';
      if (userData) {
        const user = JSON.parse(userData);
        token = user.token || user.accessToken || '';
      }
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'confirmed' })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to accept booking');
      }
      setExpertBookings(prev => prev.map(booking => booking.id === bookingId ? {...booking, status: 'confirmed'} : booking));
      setSeekerBookings(prev => prev.map(booking => booking.id === bookingId ? {...booking, status: 'confirmed'} : booking));
      toast({
        title: "Booking accepted",
        description: "The client has been notified",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to accept booking",
        variant: "destructive",
      });
    }
  };

  // Add a simple RejectionBox component
  const RejectionBox = ({ reason }: { reason: string | null }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!reason) return null;

    return (
      <>
        <div 
          className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => setIsOpen(true)}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">View Response</span>
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
            {reason}
          </p>
        </div>

        {isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Response Details</h3>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700" 
                  aria-label="Close dialog"
                >
                  <span className="sr-only">Close dialog</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {reason}
                </p>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  // Update the handleReject function to ensure rejection reason is sent
  const handleReject = async () => {
    if (!selectedBookingForReject || !rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/bookings/${selectedBookingForReject}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            status: "rejected",
            rejection_reason: rejectionReason.trim(),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reject booking");
      }

      toast({
        title: "Success",
        description: "Booking rejected successfully",
      });

      setIsRejectDialogOpen(false);
      setSelectedBookingForReject(null);
      setRejectionReason('');

      // Refresh bookings based on user type
      if (userId) {
        if (userType === "seeker") {
          await fetchSeekerBookings(userId);
        } else {
          await fetchExpertBookings(userId);
        }
      }
    } catch (error) {
      console.error("Rejection error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to reject booking",
        variant: "destructive",
      });
    }
  };

  // Update the handleReschedule function to match the RescheduleDialog props type
  const handleReschedule = async (
    bookingId: string,
    newDate: string,
    newStartTime: string,
    newEndTime: string
  ): Promise<void> => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) throw new Error('User data not found');
      
      const user = JSON.parse(userData);
      const token = user.token || user.accessToken;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings/${bookingId}/reschedule`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: newDate,
          start_time: newStartTime,
          end_time: newEndTime
        })
      });

      if (!response.ok) {
        throw new Error('Failed to reschedule booking');
      }

      // Refresh bookings
      if (userId) {
        if (userType === 'seeker') {
          await fetchSeekerBookings(userId);
        } else {
          await fetchExpertBookings(userId);
        }
      }

      toast({
        title: "Success",
        description: "Booking rescheduled successfully"
      });
    } catch (error) {
      console.error('Reschedule error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reschedule booking",
        variant: "destructive"
      });
      throw error; // Re-throw to let the dialog handle the error
    }
  };

  // Add function to fetch expert availability
  const fetchExpertAvailability = async (expertId: string) => {
    setAvailabilityLoading(true);
    setAvailabilityError(null);
    
    try {
      const userData = localStorage.getItem('user');
      if (!userData) throw new Error('User data not found');
      
      const user = JSON.parse(userData);
      const token = user.token || user.accessToken;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/experts/availability/${expertId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch availability');

      const result = await response.json();
      setExpertAvailability(result.data);
    } catch (error) {
      setAvailabilityError('Failed to load expert availability');
      console.error('Error fetching availability:', error);
    } finally {
      setAvailabilityLoading(false);
    }
  };

  // Add function to generate time slots
  const generateTimeSlots = (start: string, end: string): string[] => {
    const slots: string[] = [];
    const [startHour, startMinute = 0] = start.split(":").map(Number);
    const [endHour, endMinute = 0] = end.split(":").map(Number);
    let currentHour = startHour;
    let currentMinute = startMinute;
    // Handle case where end time is on the next day
    const isNextDay = endHour < startHour || (endHour === startHour && endMinute < startMinute);
    const maxHour = isNextDay ? endHour + 24 : endHour;
    const maxMinute = endMinute;
    while (
      currentHour < maxHour || (currentHour === maxHour && currentMinute < maxMinute)
    ) {
      const slotStart = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      // Calculate end of 15-minute slot
      let endSlotHour = currentHour;
      let endSlotMinute = currentMinute + 15;
      if (endSlotMinute >= 60) {
        endSlotHour += Math.floor(endSlotMinute / 60);
        endSlotMinute = endSlotMinute % 60;
      }
      if (endSlotHour >= 24) endSlotHour = endSlotHour % 24;
      const slotEnd = `${endSlotHour.toString().padStart(2, '0')}:${endSlotMinute.toString().padStart(2, '0')}`;
      // Only add slot if it's within the availability window
      if (
        (isNextDay && (endSlotHour < maxHour || (endSlotHour === maxHour && endSlotMinute <= maxMinute))) ||
        (!isNextDay && (endSlotHour < maxHour || (endSlotHour === maxHour && endSlotMinute <= maxMinute)))
      ) {
        slots.push(slotStart);
      } else {
        break;
      }
      // Move to next slot start: add 15 minutes
      currentMinute += 15;
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
      }
      if (currentHour >= 24) currentHour = currentHour % 24;
    }
    return slots;
  };

  // Add the checkBookingAvailability function
  const checkBookingAvailability = async (
    expertId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: string
  ): Promise<boolean> => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) throw new Error('User data not found');
      
      const user = JSON.parse(userData);
      const token = user.token || user.accessToken;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings/check-availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          expert_id: expertId,
          date,
          start_time: startTime,
          end_time: endTime,
          exclude_booking_id: excludeBookingId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to check availability');
      }

      const data = await response.json();
      return data.available;
    } catch (error) {
      console.error('Error checking availability:', error);
      return false;
    }
  };

  // Add function to check if a session is in the past
  const isSessionInPast = (dateStr: string, endTimeStr: string): boolean => {
    try {
      const now = new Date();
      const bookingDate = new Date(dateStr);
      const [hours, minutes] = endTimeStr.split(':').map(Number);
      bookingDate.setHours(hours, minutes, 0, 0);
      return bookingDate < now;
    } catch (error) {
      console.error('Error in isSessionInPast:', error);
      return false;
    }
  };

  // Update the booking card to fix the See Response click handling
  const renderBookingCard = (booking: Booking) => {
    const isPast = isSessionInPast(booking.date, booking.end_time);
    // If booking has feedback, it should always show as completed
    const displayStatus = bookingsWithFeedback.has(booking.id) ? 'completed' : (isPast ? 'completed' : booking.status);
    const isViewingAsSeeker = userType === 'seeker';
    const otherUserName = isViewingAsSeeker ? booking.expert_name : booking.seeker_name;
    const sessionCompleted = isSessionCompleted(booking.date, booking.end_time);
    const canJoinSession = !sessionCompleted && (isWithinFiveMinutesBeforeStart(booking.date, booking.start_time) || new Date() >= new Date(`${booking.date}T${booking.start_time}`));

    // Add handleJoinSession function inside renderBookingCard
    const handleJoinSession = async () => {
      try {
        // For video and audio sessions, request media permissions
        if (booking.session_type === 'video' || booking.session_type === 'audio') {
          await navigator.mediaDevices.getUserMedia({ 
            video: booking.session_type === 'video',
            audio: true 
          });
        }

        // Navigate to the appropriate session page based on session type
        switch (booking.session_type) {
          case 'video':
            navigate(`/video-call/${booking.id}`);
            break;
          case 'audio':
            navigate(`/audio-session/${booking.id}`);
            break;
          case 'chat':
            navigate(`/chat-session/${booking.id}`);
            break;
          default:
            toast({
              title: "Error",
              description: "Invalid session type",
              variant: "destructive",
            });
        }
      } catch (err) {
        toast({
          title: "Permission Denied",
          description: booking.session_type === 'chat' 
            ? "Failed to join chat session"
            : "Please allow camera and microphone access to join the session.",
          variant: "destructive",
        });
      }
    };

    const getTimeDisplay = (startTime: string, endTime?: string) => {
      return formatTimeRange(startTime, endTime);
    };

    return (
      <Card key={booking.id} id={`booking-${booking.id}`} className="mb-4">
        {/* Header Section */}
        <CardHeader className="pb-2">
          <div className="space-y-2">
            {/* Name and Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="bg-gray-100 border border-gray-200 shadow-sm w-12 h-12 flex items-center justify-center">
                  {/* Show initials if available, otherwise fallback to neutral icon */}
                  {getInitials(otherUserName) ? (
                    <span className="text-lg font-semibold text-gray-700">{getInitials(otherUserName)}</span>
                  ) : (
                    <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.25a7.75 7.75 0 1115.5 0v.25a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75v-.25z" />
                    </svg>
                  )}
                </Avatar>
                <CardTitle className="text-base"></CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getStatusBadge(displayStatus)}>
                  {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
                </Badge>
              </div>
            </div>

            {/* Date, Time and Session Type */}
            <div className="flex flex-col space-y-1">
              <p className='font-medium'> Booking ID: {booking.id}</p> 
              <div className="flex items-center text-sm text-muted-foreground">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {formatDate(booking.date)}
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-2" />
                {formatTimeRange(booking.start_time, booking.end_time)}
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                {booking.session_type === 'video' && <Video className="h-4 w-4 mr-2" />}
                {booking.session_type === 'audio' && <Mic className="h-4 w-4 mr-2" />}
                {booking.session_type === 'chat' && <MessageSquare className="h-4 w-4 mr-2" />}
                {booking.session_type.charAt(0).toUpperCase() + booking.session_type.slice(1)} Session
              </div>
            </div>

            {/* Expert's Response for Seeker */}
            {isViewingAsSeeker && booking.expert_response && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">Expert's Response</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedQuery(booking.expert_response);
                      setIsQueryDialogOpen(true);
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    See Response
                  </Button>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {booking.expert_response}
                </p>
              </div>
            )}

            {/* Session Request Details for Seeker */}
            {isViewingAsSeeker && (booking.problem_statement || booking.desired_solution) && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm text-blue-800">Your Session Request</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const sessionRequestText = `Problem: ${booking.problem_statement || 'Not specified'}\n\nDesired Solution: ${booking.desired_solution || 'Not specified'}`;
                      setSelectedQuery(sessionRequestText);
                      setIsQueryDialogOpen(true);
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
                <div className="space-y-2">
                  {booking.problem_statement && (
                    <div>
                      <p className="text-xs font-medium text-blue-700">Problem:</p>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {booking.problem_statement}
                      </p>
                    </div>
                  )}
                  {booking.desired_solution && (
                    <div>
                      <p className="text-xs font-medium text-blue-700">Desired Solution:</p>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {booking.desired_solution}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        {/* Two Boxes Section */}
        {!isViewingAsSeeker && booking.status !== 'rejected' && (
          <CardContent className="pb-2">
            {displayStatus === 'completed' ? (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex flex-col">
                  <h4 className="font-medium text-sm mb-2">Seeker's Query</h4>
                  <div className="flex-grow">
                    {(booking.problem_statement || booking.desired_solution) ? (
                      <div className="space-y-2">
                        {booking.problem_statement && (
                          <div>
                            <p className="text-xs font-medium text-gray-700">Problem:</p>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {booking.problem_statement}
                            </p>
                          </div>
                        )}
                        {booking.desired_solution && (
                          <div>
                            <p className="text-xs font-medium text-gray-700">Desired Solution:</p>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {booking.desired_solution}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {booking.notes || ''}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    onClick={async () => {
                      if (userType === 'expert') {
                        await fetchSessionRequestDetails(booking.id);
                      }
                      const sessionRequestText = (booking.problem_statement || booking.desired_solution) 
                        ? `Problem: ${booking.problem_statement || 'Not specified'}\n\nDesired Solution: ${booking.desired_solution || 'Not specified'}`
                        : (booking.notes || '');
                      setSelectedQuery(sessionRequestText);
                      setIsQueryDialogOpen(true);
                    }}
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    View Details
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {/* Left Box - Reschedule */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-[80px] flex flex-col items-center justify-center gap-2"
                    onClick={() => {
                      setSelectedBooking(booking);
                      setIsRescheduleOpen(true);
                    }}
                  >
                    <CalendarClock className="h-5 w-5" />
                    <span className="text-sm">Reschedule Session</span>
                  </Button>
                </div>

                {/* Right Box - Seeker's Query */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex flex-col h-[80px]">
                    <h4 className="font-medium text-sm mb-1">Seeker's Query</h4>
                    <div className="flex-grow">
                      {(booking.problem_statement || booking.desired_solution) ? (
                        <div className="space-y-1">
                          {booking.problem_statement && (
                            <div>
                              <p className="text-xs font-medium text-gray-700">Problem:</p>
                              <p className="text-xs text-gray-600 line-clamp-1">
                                {booking.problem_statement}
                              </p>
                            </div>
                          )}
                          {booking.desired_solution && (
                            <div>
                              <p className="text-xs font-medium text-gray-700">Solution:</p>
                              <p className="text-xs text-gray-600 line-clamp-1">
                                {booking.desired_solution}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {booking.notes || ''}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      onClick={async () => {
                        if (userType === 'expert') {
                          await fetchSessionRequestDetails(booking.id);
                        }
                        const sessionRequestText = (booking.problem_statement || booking.desired_solution) 
                          ? `Problem: ${booking.problem_statement || 'Not specified'}\n\nDesired Solution: ${booking.desired_solution || 'Not specified'}`
                          : (booking.notes || '');
                        setSelectedQuery(sessionRequestText);
                        setIsQueryDialogOpen(true);
                      }}
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        )}

        {/* For rejected bookings - Only show Seeker's Query */}
        {!isViewingAsSeeker && booking.status === 'rejected' && (
          <CardContent className="pb-2">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex flex-col">
                <h4 className="font-medium text-sm mb-2">Seeker's Query</h4>
                <div className="flex-grow">
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {booking.notes || ''}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                  onClick={async () => {
                    if (userType === 'expert') {
                      await fetchSessionRequestDetails(booking.id);
                    }
                    setSelectedQuery(booking.notes || null);
                    setIsQueryDialogOpen(true);
                  }}
                >
                  <MessageSquare className="h-3 w-3 mr-1" />
                  View Details
                </Button>
              </div>
            </div>
          </CardContent>
        )}

        {/* Footer Section */}
        <CardFooter className="pt-2">
          {!isViewingAsSeeker && booking.status === 'pending' && (
            <div className="flex gap-2 w-full">
              <Button
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => handleAcceptBooking(booking.id)}
              >
                Accept
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  setSelectedBookingForReject(booking.id);
                  setIsRejectDialogOpen(true);
                }}
              >
                Reject
              </Button>
            </div>
          )}
          {booking.status === 'confirmed' && !bookingsWithFeedback.has(booking.id) && (
            (() => {
              const sessionStartTime = parseBookingTime(booking.date, booking.start_time);
              const sessionEndTime = parseBookingTime(booking.date, booking.end_time);
              const joinTime = new Date(sessionStartTime.getTime() - 5 * 60 * 1000); // 5 minutes before
              const isJoinable = currentTime >= joinTime && currentTime < sessionEndTime;
              const isSessionEnded = currentTime >= sessionEndTime;
              if (isSessionEnded) {
                const userData = localStorage.getItem('user') || localStorage.getItem('userData') || '{}';
                let userRole = '';
                try {
                  const parsedUserData = JSON.parse(userData);
                  userRole = parsedUserData.role || '';
                } catch {}
                const badgeMsg = userRole === 'expert'
                  ? 'Session Ended (You may need to reschedule it at a convenient time.)'
                  : 'Session Ended (The expert will reschedule your session.)';
                return (
                  <div className="flex justify-center items-center w-full my-2">
                    <span className="bg-[#C6F6D5] text-[#2F855A] px-4 py-2 rounded-full text-base font-semibold shadow-md">
                      {badgeMsg}
                    </span>
                  </div>
                );
              }
              return (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div style={{ display: 'inline-block', cursor: !isJoinable ? 'not-allowed' : 'pointer' }}>
                        <Button
                          size="sm"
                          className={`w-full bg-green-600 hover:bg-green-700 ${!isJoinable ? 'pointer-events-none' : ''}`}
                          onClick={() => handleJoinSession()}
                          disabled={!isJoinable}
                        >
                          Join Session
                        </Button>
                      </div>
                    </TooltipTrigger>
                    {!isJoinable && (
                      <TooltipContent>
                        <p>You can join 5 minutes before the session starts.</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              );
            })()
          )}
          {booking.status === 'rejected' && (
            <div className="w-full space-y-3">
              {userType === 'seeker' ? (
                <button
                  onClick={() => handleRejectionReasonClick(booking)}
                  className="w-full bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-left"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-red-50 rounded-full">
                          <svg
                            className="w-5 h-5 text-red-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Booking Rejected</h4>
                          <p className="text-sm text-gray-500">Click to view expert's response</p>
                        </div>
                      </div>
                    
                    </div>
                  </div>
                </button>
              ) : (
                <div className="text-sm text-red-500 font-medium">This booking has been rejected</div>
              )}
            </div>
          )}
          {displayStatus === 'completed' && (
            <Button
              size="sm"
              className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold mt-2"
              onClick={() => {
                setSelectedInvoiceBooking(booking);
                setIsInvoiceDialogOpen(true);
              }}
            >
              Download Invoice
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };



  const showNotification = (title: string, options: NotificationOptions & { data?: any }) => {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/logo.png',
        badge: '/logo.png',
        ...options
      });

      // Handle notification click
      notification.onclick = () => {
        window.focus();
        if (options.data?.url) {
          window.location.href = options.data.url;
        }
        notification.close();
      };
    }
  };

  // Add this service worker registration function after the imports
  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        // Check if service worker is already registered
        const existingRegistration = await navigator.serviceWorker.getRegistration();
        if (existingRegistration) {
          // console.log('Service Worker already registered:', existingRegistration.scope);
          return existingRegistration;
        }

        // Register new service worker
        const registration = await navigator.serviceWorker.register('/notification-worker.js', {
          scope: '/'
        });
        
        // console.log('Service Worker registered successfully:', registration.scope);
        
        // Wait for the service worker to be ready
        await navigator.serviceWorker.ready;
        // console.log('Service Worker is ready');
        
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        return null;
      }
    }
    // console.log('Service Workers not supported');
    return null;
  };

  // Optimized WebSocket connection setup with connection management
  const wsSetupRef = useRef(false);
  const wsCleanupRef = useRef<(() => void) | null>(null);
  const wsInstanceRef = useRef<WebSocket | null>(null);
  const userIdRef = useRef(userId);
  const userTypeRef = useRef(userType);
  
  // Update refs when values change
  useEffect(() => {
    userIdRef.current = userId;
    userTypeRef.current = userType;
  }, [userId, userType]);
  
  useEffect(() => {
    // Prevent multiple WebSocket setups or if already connected
    if (wsSetupRef.current || wsInstanceRef.current?.readyState === WebSocket.OPEN) return;
    wsSetupRef.current = true;
    
    let ws: WebSocket | null = null;
    let serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isIntentionallyClosed = false;

    const setupNotifications = async () => {
      try {
        // Register service worker first (cached)
        serviceWorkerRegistration = await getCachedData('service-worker', registerServiceWorker, 3600000); // Cache for 1 hour
        
        // Check notification permission (don't request automatically)
        if (Notification.permission !== 'granted') {
          return;
        }

        // Fix the WebSocket URL construction
        const baseUrl = import.meta.env.VITE_API_URL;
        if (!baseUrl) {
          return;
        }

        // Skip WebSocket connection in development or if server is not available
        if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1') || baseUrl.includes('192.168.')) {
          return;
        }

        const wsProtocol = baseUrl.startsWith('https') ? 'wss' : 'ws';
        const wsUrl = `${wsProtocol}://${new URL(baseUrl).host}/ws/notifications`;

        const connectWebSocket = () => {
          // Prevent multiple connection attempts
          if (isIntentionallyClosed || 
              wsInstanceRef.current?.readyState === WebSocket.CONNECTING || 
              wsInstanceRef.current?.readyState === WebSocket.OPEN ||
              wsConnectionStatus === 'connecting') {
            return;
          }
          
          // Close existing connection if any
          if (wsInstanceRef.current) {
            wsInstanceRef.current.close();
          }
          
          ws = new WebSocket(wsUrl);
          wsInstanceRef.current = ws;
          setWsConnectionStatus('connecting');

          ws.onopen = () => {
            setWsConnectionStatus('connected');
            reconnectAttemptsRef.current = 0;
            const token = localStorage.getItem('token');
            if (token) {
              ws?.send(JSON.stringify({ type: 'auth', token }));
            }
          };

          ws.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data) as NotificationData;
              const currentUserId = userIdRef.current;
              const currentUserType = userTypeRef.current;
              
              // Only refresh bookings for booking-related notifications (throttled)
              if (currentUserId && data.type && (
                data.type === 'booking_request' ||
                data.type === 'booking_accepted' ||
                data.type === 'booking_cancelled' ||
                data.type === 'session_reminder' ||
                data.type === 'session_completed' ||
                data.type === 'session_rescheduled'
              )) {
                // Clear cache for affected bookings to force refresh
                apiCache.current.delete(`seeker-bookings-${currentUserId}`);
                apiCache.current.delete(`expert-bookings-${currentUserId}`);
                
                if (currentUserType === 'seeker') {
                  fetchSeekerBookings(currentUserId);
                } else if (currentUserType === 'expert') {
                  fetchExpertBookings(currentUserId);
                }
                handleNotificationClick(data);
              }
              // Service worker notification
              if (serviceWorkerRegistration && serviceWorkerRegistration.active) {
                const notificationTitle = (data as any).title || 'Notification';
                const notificationBody = (data as any).body || '';
                const notificationTag = (data as any).tag || '';
                const notificationColor = (data as any).color || '#008069';
                serviceWorkerRegistration.active.postMessage({
                  type: 'SHOW_NOTIFICATION',
                  notification: {
                    title: notificationTitle,
                    body: notificationBody,
                    icon: '/logo.png',
                    badge: '/logo.png',
                    tag: notificationTag,
                    requireInteraction: true,
                    data: {
                      url: window.location.origin,
                      color: notificationColor,
                      bookingId: data.booking_id
                    }
                  }
                });
              }
            } catch (error) {
              console.error('Error processing notification:', error);
            }
          };

          ws.onerror = () => {
            setWsConnectionStatus('error');
          };

          ws.onclose = (event) => {
            setWsConnectionStatus('disconnected');
            
            // Only attempt reconnection if not intentionally closed, within retry limits, and not a permanent failure
            if (!isIntentionallyClosed && 
                reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS &&
                event.code !== 1006 && // Abnormal closure - don't retry immediately
                !baseUrl.includes('localhost') && 
                !baseUrl.includes('127.0.0.1') && 
                !baseUrl.includes('192.168.')) {
              reconnectAttemptsRef.current++;
              reconnectTimeout = setTimeout(() => {
                if (!isIntentionallyClosed) {
                  connectWebSocket();
                }
              }, RECONNECT_DELAY * reconnectAttemptsRef.current); // Exponential backoff
            }
          };
        };

        connectWebSocket();
      } catch (error) {
        setWsConnectionStatus('error');
      }
    };

    setupNotifications();

    // Store cleanup function
    wsCleanupRef.current = () => {
      isIntentionallyClosed = true;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (wsInstanceRef.current) {
        wsInstanceRef.current.close();
        wsInstanceRef.current = null;
      }
      if (ws) {
        ws.close();
      }
      wsSetupRef.current = false;
    };

    return wsCleanupRef.current;
  }, []); // Remove all dependencies to prevent reinitialization

  // Update the booking filters
  const isPendingBooking = (booking: Booking): boolean => {
    return booking.status === 'pending';
  };

  const isConfirmedBooking = (booking: Booking): boolean => {
    // If booking has feedback, it should be considered completed
    if (bookingsWithFeedback.has(booking.id)) {
      return false;
    }
    return booking.status === 'confirmed';
  };

  const isRejectedBooking = (booking: Booking): boolean => {
    return booking.status === 'rejected';
  };

  const isCompletedBooking = (booking: Booking): boolean => {
    // Include bookings that are marked as completed OR have feedback
    return booking.status === 'completed' || bookingsWithFeedback.has(booking.id);
  };

  // Add a function to mark booking as read
  const markBookingAsRead = async (bookingId: string) => {
    try {
      const userData = localStorage.getItem('user');
      let token = '';
      if (userData) {
        const user = JSON.parse(userData);
        token = user.token || user.accessToken || '';
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings/${bookingId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to mark booking as read');
      }

      // Update local state
      setSeekerBookings(prev => prev.map(booking => 
        booking.id === bookingId ? { ...booking, is_read: true } : booking
      ));
      setExpertBookings(prev => prev.map(booking => 
        booking.id === bookingId ? { ...booking, is_read: true } : booking
      ));

    } catch (error) {
      console.error('Error marking booking as read:', error);
    }
  };

  
// Add QueryDialog component
  const QueryDialog = () => (
    <Dialog open={isQueryDialogOpen} onOpenChange={setIsQueryDialogOpen}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Seeker's Query</DialogTitle>
          <DialogDescription>
            The question or topic the seeker wants to discuss
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {isSessionRequestLoading ? (
            <div className="text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              Loading session details...
            </div>
          ) : sessionRequestDetails ? (
            <>
              <div className="mb-4">
                <div className="font-semibold text-gray-700 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  What challenges Seeker is facing?
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-gray-800 whitespace-pre-line break-words" style={{wordBreak: 'break-word'}}>
                  {sessionRequestDetails.problem_statement || 'Not provided.'}
                </div>
              </div>
              <div>
                <div className="font-semibold text-gray-700 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  What solution the Seeker is looking for?
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-gray-800 whitespace-pre-line break-words" style={{wordBreak: 'break-word'}}>
                  {sessionRequestDetails.desired_solution || 'Not provided.'}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 text-sm">No session details available</p>
              <p className="text-gray-400 text-xs mt-1">The seeker may not have provided detailed information</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => setIsQueryDialogOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Add function to fetch expert's bookings for a specific date
  const fetchExpertBookingsForDate = async (expertId: string, date: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings/expert/${expertId}/date/${date}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch bookings');
      const data = await response.json();
      return data.bookings || [];
    } catch (error) {
      console.error('Error fetching expert bookings:', error);
      return [];
    }
  };

  // Add function to check if a time slot is available
  const isTimeSlotAvailable = (bookings: any[], date: string, time: string) => {
    return !bookings.some(booking => 
      booking.date === date && 
      booking.start_time === time && 
      booking.status !== 'cancelled'
    );
  };

  // Modify getAvailableTimeSlots to return proper time format
  const getAvailableTimeSlots = async (expertId: string, date: string) => {
    const bookings = await fetchExpertBookingsForDate(expertId, date);
    const allTimeSlots = [];
    // Generate 15-minute slots from 9 AM to 9 PM
    for (let hour = 9; hour <= 21; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        if (hour === 21 && minute > 0) break; // Stop at 21:00
        allTimeSlots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    }
    
    const availableSlots = allTimeSlots.filter(time => isTimeSlotAvailable(bookings, date, time));
    return availableSlots;
  };

  // Add the RejectionReasonDialog component
  const RejectionReasonDialog = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      if (isRejectionReasonDialogOpen && selectedRejectionReason) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    }, [isRejectionReasonDialogOpen, selectedRejectionReason]);

    if (!isVisible || !selectedRejectionReason) return null;

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setIsRejectionReasonDialogOpen(false);
          }
        }}
      >
        <div 
          className="bg-white rounded-lg p-6 max-w-lg w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Expert's Response</h3>
              <p className="text-sm text-gray-500 mt-1">Reason for rejecting the booking</p>
            </div>
            <button 
              onClick={() => setIsRejectionReasonDialogOpen(false)}
              className="text-gray-500 hover:text-gray-700 p-1"
              aria-label="Close dialog" // Added aria-label for accessibility
              title="Close dialog" // Added title attribute
            >
              <span className="sr-only">Close dialog</span> {/* Added screen reader text */}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700 whitespace-pre-wrap">
              {selectedRejectionReason}
            </p>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setIsRejectionReasonDialogOpen(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Add function to check if a session is completed
  const isSessionCompleted = (dateStr: string, endTimeStr: string): boolean => {
    try {
      const now = new Date();
      const [hours, minutes] = endTimeStr.split(':').map(Number);
      const sessionEnd = new Date(dateStr);
      sessionEnd.setHours(hours, minutes, 0, 0);
      return sessionEnd < now;
    } catch (error) {
      console.error('Error in isSessionCompleted:', error);
      return false;
    }
  };

  // Add function to check if current time is within 5 minutes before session start
  const isWithinFiveMinutesBeforeStart = (dateStr: string, startTimeStr: string): boolean => {
    try {
      const now = new Date();
      const [hours, minutes] = startTimeStr.split(':').map(Number);
      const sessionStart = new Date(dateStr);
      sessionStart.setHours(hours, minutes, 0, 0);
      const fiveMinutesBefore = new Date(sessionStart.getTime() - 5 * 60 * 1000);
      return now >= fiveMinutesBefore && now <= sessionStart;
    } catch (error) {
      console.error('Error in isWithinFiveMinutesBeforeStart:', error);
      return false;
    }
  };

  // Add this function after the markBookingAsRead function
  const handleNotificationClick = async (notification: NotificationData) => {
    try {
      // Mark the notification as read
      if (notification.booking_id) {
        await markBookingAsRead(notification.booking_id);
      }

      // Navigate to the appropriate tab based on notification type
      let targetTab = 'pending';
      if (notification.type === 'booking_accepted') {
        targetTab = 'confirmed';
      } else if (notification.type === 'booking_cancelled' || notification.type === 'session_completed') {
        targetTab = 'completed';
      } else if (notification.type === 'booking_request') {
        targetTab = 'pending';
      }

      // Set the active tab
      setActiveTab(targetTab);

      // If there's a specific booking ID, scroll to it
      if (notification.booking_id) {
        const bookingElement = document.getElementById(`booking-${notification.booking_id}`);
        if (bookingElement) {
          bookingElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add a highlight effect
          bookingElement.classList.add('highlight-booking');
          setTimeout(() => {
            bookingElement.classList.remove('highlight-booking');
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
      toast({
        title: "Error",
        description: "Failed to process notification",
        variant: "destructive",
      });
    }
  };

  // Add this CSS class to your styles
  const styles = `
    @keyframes highlight-booking {
      0% { background-color: rgba(var(--primary-rgb), 0.1); }
      50% { background-color: rgba(var(--primary-rgb), 0.2); }
      100% { background-color: transparent; }
    }

    .highlight-booking {
      animation: highlight-booking 2s ease-in-out;
    }
  `;

  // Add the styles to the document
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);

  // Check for feedback when bookings change (debounced)
  const checkFeedbackDebounced = useCallback(
    debounce(() => {
      checkAllBookingsFeedback();
    }, 1000),
    [checkAllBookingsFeedback]
  );
  
  useEffect(() => {
    if (seekerBookings.length > 0 || expertBookings.length > 0) {
      checkFeedbackDebounced();
    }
  }, [seekerBookings, expertBookings, checkFeedbackDebounced]);

  // Add a function to refresh bookings and feedback status (memoized)
  const refreshBookingsAndFeedback = useCallback(async () => {
    if (!userId) return;
    
    try {
      // Clear relevant cache entries
      apiCache.current.delete(`seeker-bookings-${userId}`);
      apiCache.current.delete(`expert-bookings-${userId}`);
      
      // Refresh bookings
      if (userType === 'seeker') {
        await fetchSeekerBookings(userId);
      } else if (userType === 'expert') {
        await fetchExpertBookings(userId);
      }
      
      // Check for feedback after a short delay to ensure bookings are updated
      setTimeout(() => {
        checkAllBookingsFeedback();
      }, 1000);
    } catch (error) {
      console.error('Error refreshing bookings:', error);
    }
  }, [userId, userType, fetchSeekerBookings, fetchExpertBookings, checkAllBookingsFeedback]);

  // Add an effect to refresh when returning to the page (optimized)
  const handleVisibilityChange = useCallback(
    throttle(() => {
      if (!document.hidden && userId) {
        // Clear cache to force fresh data when user returns
        apiCache.current.delete(`seeker-bookings-${userId}`);
        apiCache.current.delete(`expert-bookings-${userId}`);
        refreshBookingsAndFeedback();
      }
    }, 5000), // Throttle to once every 5 seconds
    [userId, refreshBookingsAndFeedback]
  );
  
  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  // Add periodic refresh for feedback status (optimized)
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(() => {
      // Only check if there are bookings and user is active
      if ((seekerBookings.length > 0 || expertBookings.length > 0) && !document.hidden) {
        checkAllBookingsFeedback();
      }
    }, 30000); // Reduced frequency to every 30 seconds

    return () => clearInterval(interval);
  }, [userId, checkAllBookingsFeedback, seekerBookings.length, expertBookings.length]);

  // Add function to fetch rejection reason for a specific booking
  const fetchRejectionReason = async (bookingId: string): Promise<string | null> => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return null;
      
      const user = JSON.parse(userData);
      const token = user.token || user.accessToken;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings/${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // The API returns { success: true, data: { ... } } structure
        return data.data?.rejection_reason || data.rejection_reason || null;
      }
      return null;
    } catch (error) {
      console.error('Error fetching rejection reason:', error);
      return null;
    }
  };

  // Add function to handle rejection reason click
  const handleRejectionReasonClick = async (booking: Booking) => {
    try {
      let rejectionReason = booking.rejection_reason;
      
      // If rejection reason is not available in local state, fetch it from database
      if (!rejectionReason || rejectionReason.trim() === '') {
        // console.log('Fetching rejection reason from database for booking:', booking.id);
        rejectionReason = await fetchRejectionReason(booking.id);
      }
      
      if (rejectionReason && rejectionReason.trim() !== '') {
        setSelectedRejectionReason(rejectionReason);
        setIsRejectionReasonDialogOpen(true);
      } else {
        toast({
          title: "No Response Available",
          description: "The expert has not provided a rejection reason.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error handling rejection reason click:', error);
      toast({
        title: "Error",
        description: "Failed to load rejection reason. Please try again.",
        variant: "destructive",
      });
    }
  };

  // 1. Add state for session request details
  const [sessionRequestDetails, setSessionRequestDetails] = useState<{problem_statement?: string, desired_solution?: string} | null>(null);
  const [isSessionRequestLoading, setIsSessionRequestLoading] = useState(false);

  // 2. Add function to fetch session request details by booking ID (memoized)
  const fetchSessionRequestDetails = useCallback(async (bookingId: string) => {
    setIsSessionRequestLoading(true);
    setSessionRequestDetails(null);
    
    try {
      const details = await getCachedData(`session-request-${bookingId}`, async () => {
        const userData = localStorage.getItem('user');
        if (!userData) return null;
        const user = JSON.parse(userData);
        const token = user.token || user.accessToken;
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/session-requests/booking/${bookingId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          return {
            problem_statement: data.data?.problem_statement,
            desired_solution: data.data?.desired_solution
          };
        }
        return null;
      }, 300000); // Cache for 5 minutes
      
      setSessionRequestDetails(details);
    } catch (e) {
      setSessionRequestDetails(null);
    } finally {
      setIsSessionRequestLoading(false);
    }
  }, [getCachedData]);

  useEffect(() => {
    if (!userId) return;

    const setupFcmNotifications = async () => {
      try {
        // Request permission and get FCM token
        const token = await requestNotificationPermission();
        if (token) {
          // Store token in backend
          const API_BASE_URL = import.meta.env.VITE_API_URL;
          const storedUser = localStorage.getItem('user');
          let authToken = null;
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              authToken = parsedUser.token || parsedUser.accessToken || parsedUser.jwt || parsedUser.jwtToken;
            } catch (e) {
              console.error('Error parsing user data for token storage:', e);
            }
          }
          if (!authToken) {
            authToken = localStorage.getItem('token') || 
                      localStorage.getItem('accessToken') || 
                      localStorage.getItem('jwt') || 
                      localStorage.getItem('jwtToken');
          }
          if (!authToken) {
            console.error('No authentication token found for storing notification token');
            return;
          }
          const response = await fetch(`${API_BASE_URL}/api/notifications/users/${userId}/notification-token`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ token })
          });
          if (!response.ok) {
            throw new Error('Failed to store notification token');
          }
          // Show success toast only if not shown before
          if (shouldShowSuccessMessage()) {
            toast({
              title: 'Notifications Enabled',
              description: 'You will now receive notifications for new messages and updates.',
              variant: 'default',
            });
          }
        } else {
          toast({
            title: 'Notifications Disabled',
            description: 'Please enable notifications in your browser settings to receive updates.',
            variant: 'destructive',
          });
        }
      } catch (err) {
        console.error('Error setting up notifications:', err);
        toast({
          title: 'Error',
          description: 'Failed to setup notifications. Please try again.',
          variant: 'destructive',
        });
      }
    };
    // Only run if permission is already granted and setup should be run
    if (shouldRunSetup()) {
      setupFcmNotifications();
    }
  }, [userId]);

  // Add this state and effect at the top level of the component
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000); // Update every 30 seconds
    return () => clearInterval(timer);
  }, []);

  // Helper to parse booking time
  const parseBookingTime = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return new Date(0);
    const [time, meridian] = timeStr.split(' ');
    if (!time || !meridian) return new Date(0);
    let [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return new Date(0);
    if (meridian.toUpperCase() === 'PM' && hours < 12) hours += 12;
    if (meridian.toUpperCase() === 'AM' && hours === 12) hours = 0;
    const date = new Date(dateStr);
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  // Add state for invoice dialog
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<Booking | null>(null);
  const [userDisplayName, setUserDisplayName] = useState('');

  useEffect(() => {
    // Get the real name of the logged-in user
    const userDataRaw = localStorage.getItem('user') || '{}';
    try {
      const user = JSON.parse(userDataRaw);
      setUserDisplayName(`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.name || user.email || 'User');
    } catch {
      setUserDisplayName('User');
    }
  }, []);

  const getInvoiceName = () => userDisplayName;
  const getSessionTypeLabel = (type: string) => {
    switch (type) {
      case 'video': return 'Video Session';
      case 'audio': return 'Audio Session';
      case 'chat': return 'Chat Session';
      default: return 'Session';
    }
  };
  const InvoiceDialog = () => {
    if (!selectedInvoiceBooking) return null;
    const booking = selectedInvoiceBooking;
    const name = getInvoiceName();
    const sessionType = getSessionTypeLabel(booking.session_type);
    const amount = Number(booking.amount) || 0;
    const gst = 0; // Update if GST is needed
    const total = amount + gst;
    const today = new Date();
    const issueDate = today.toLocaleDateString('en-GB');
    const dueDate = booking.date ? new Date(booking.date).toLocaleDateString('en-GB') : issueDate;
    const billingAddress = '418, Vipul Business Park, Central Park II, Sector 48, Gurugram, Haryana 122018';
    const userRole = userType === 'seeker' ? 'Seeker' : 'Expert';

    const handleDownload = () => {
      const doc = new jsPDF('p', 'pt', 'a4');
      const logoUrl = window.location.origin + '/images.png';
      const img = new window.Image();
      img.src = logoUrl;
      img.onload = () => {
        doc.addImage(img, 'PNG', 40, 30, 80, 60);
        drawRest();
        doc.save(`invoice-${booking.id}.pdf`);
      };
      img.onerror = () => {
        drawRest();
        doc.save(`invoice-${booking.id}.pdf`);
      };
      function drawRest() {
        doc.setFontSize(22);
        doc.setTextColor('#333');
        doc.text('Expertise-Station', 140, 60);
        doc.setFontSize(12);
        doc.setTextColor('#1976d2');
        doc.textWithLink('expertisestation.com', 140, 80, { url: 'https://www.expertisestation.com/' });
        doc.setFontSize(16);
        doc.setTextColor('#888');
        doc.text(`Invoice #${booking.id}`, 420, 50);
        doc.setFontSize(10);
        doc.setTextColor('#333');
        doc.text(`Issue date: ${issueDate}`, 420, 70);
        doc.text(`Due date: ${dueDate}`, 420, 85);
        doc.text(`Session: ${sessionType}`, 420, 100);
        // Billing To
        doc.setFontSize(12);
        doc.setTextColor('#222');
        doc.text('BILL TO', 40, 120);
        doc.setFontSize(11);
        doc.text(`${userRole}: ${name}`, 40, 135);
        doc.text('Expertise-Station', 40, 150);
        doc.text(`Address: ${billingAddress}`, 40, 165, { maxWidth: 250 });
        // Table
        autoTable(doc, {
          startY: 190,
          head: [['Description of Service ', 'Hours', 'Unit price (₹)', 'Amount (₹)']],
          body: [
            ['Expert Consultation', '1', amount.toFixed(2), amount.toFixed(2)],
            ['GST', '', '', gst.toFixed(2)],
            [{ content: 'Total', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } }, total.toFixed(2)],
          ],
          theme: 'grid',
          headStyles: { fillColor: [34, 197, 94], textColor: 255, fontStyle: 'bold' },
          bodyStyles: { textColor: 30 },
          styles: { fontSize: 11, cellPadding: 6 },
          columnStyles: { 0: { cellWidth: 200 }, 1: { cellWidth: 80 }, 2: { cellWidth: 100 }, 3: { cellWidth: 100 } },
        });
        // Fix: Use (doc as any).lastAutoTable.finalY for TypeScript
        let y = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : 250;
        doc.setFontSize(10);
      
        doc.setDrawColor(150);
        doc.line(150, y + 2, 300, y + 2);
        y += 30;
        doc.setFontSize(9);
        doc.setTextColor('#888');
        doc.textWithLink('Expertise-Station, https://www.expertisestation.com/, info@expertisestation.com', 40, y, { url: 'https://www.expertisestation.com/' });
      }
    };
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2">
        <div className="relative w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 scale-100 animate-in fade-in-0 zoom-in-95 max-h-[85vh]">
          {/* Close Button */}
          <button
            onClick={() => setIsInvoiceDialogOpen(false)}
            className="absolute top-4 right-4 z-20 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 group"
            aria-label="Close Invoice"
          >
            <svg className="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header Section */}
          <div className="relative bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-600 px-4 py-6">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl mb-3 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white mb-1">Invoice</h1>
              <p className="text-white/90 text-sm">Expertise-Station</p>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-4 max-h-[50vh] overflow-y-auto custom-scrollbar">
            {/* Invoice Header Info */}
            <div className="flex justify-between items-start mb-4 gap-2">
              <div className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">
                Invoice #{booking.id}
              </div>
              <div className="text-right space-y-1">
                <div className="text-xs text-gray-600">Issue: {issueDate}</div>
                <div className="text-xs text-gray-600">Session: {dueDate}</div>
              </div>
            </div>

            {/* Billing Information */}
            <div className="space-y-3 mb-4">
              <div className="bg-gray-50 rounded-xl p-3">
                <h3 className="text-xs font-semibold text-gray-600 uppercase mb-2">Bill To</h3>
                <div className="text-sm font-bold text-gray-900">{name}</div>
                <div className="text-xs text-gray-600">{userRole} • {sessionType}</div>
              </div>
            </div>

            {/* Invoice Table */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm mb-4">
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">Service Details</h3>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-900">Expert Consultation</span>
                  </div>
                  <span className="text-sm font-semibold">₹{amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-900">GST</span>
                  </div>
                  <span className="text-sm font-semibold">₹{gst.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-emerald-600">₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Info
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="flex flex-col items-center gap-1 text-xs text-gray-600">
                <a href="https://expertisestation.com" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 transition-colors">
                  www.expertisestation.com
                </a>
                <a href="mailto:info@expertisestation.com" className="hover:text-emerald-600 transition-colors">
                  info@expertisestation.com
                </a>
              </div>
            </div> */}
          </div>

          {/* Download Button */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-3">
            <button
              onClick={handleDownload}
              className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
              </svg>
              Download PDF
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Add this just before the return statement of the AppointmentLog component
  const customScrollbarStyle = `
    /* iOS-specific fixes */
    html {
      height: -webkit-fill-available;
    }
    body {
      min-height: 100vh;
      min-height: -webkit-fill-available;
      -webkit-overflow-scrolling: touch;
    }
    
    .custom-scrollbar {
      scrollbar-width: none;
      -ms-overflow-style: none;
      overflow-y: auto;
      overflow-x: hidden;
      max-height: 70vh;
      -webkit-overflow-scrolling: touch;
    }
    .custom-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .custom-scrollbar:hover,
    .custom-scrollbar:active,
    .custom-scrollbar:focus,
    .custom-scrollbar:focus-within {
      scrollbar-width: thin;
    }
    .custom-scrollbar:hover::-webkit-scrollbar,
    .custom-scrollbar:active::-webkit-scrollbar,
    .custom-scrollbar:focus::-webkit-scrollbar,
    .custom-scrollbar:focus-within::-webkit-scrollbar {
      display: block;
      width: 8px;
      background: #f3f3f3;
    }
    .custom-scrollbar:hover::-webkit-scrollbar-thumb,
    .custom-scrollbar:active::-webkit-scrollbar-thumb,
    .custom-scrollbar:focus::-webkit-scrollbar-thumb,
    .custom-scrollbar:focus-within::-webkit-scrollbar-thumb {
      background: #a3a3a3;
      border-radius: 8px;
      transition: background 0.2s;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    
    /* iOS button and input fixes */
    button, input, select, textarea {
      -webkit-appearance: none;
      border-radius: 0;
    }
    
    /* Prevent zoom on input focus for iOS */
    input[type="text"], input[type="email"], input[type="password"], input[type="date"], textarea, select {
      font-size: 16px;
    }
    
    @keyframes animate-in {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
    
    .animate-in {
      animation: animate-in 0.3s ease-out;
    }
    
    .fade-in-0 {
      animation: fadeIn 0.3s ease-out;
    }
    
    .zoom-in-95 {
      animation: zoomIn 0.3s ease-out;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes zoomIn {
      from { transform: scale(0.95); }
      to { transform: scale(1); }
    }
  `;

  // Cleanup effect to prevent memory leaks and session breaks
  useEffect(() => {
    return () => {
      // Clear all timeouts and intervals
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      // Close WebSocket connection properly
      if (wsCleanupRef.current) {
        wsCleanupRef.current();
      }
      
      // Clear API cache on unmount to prevent stale data
      apiCache.current.clear();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background" style={{ minHeight: '-webkit-fill-available' }}>
      <Navbar />
      <div className="container mx-auto py-4 sm:py-8 px-2 sm:px-4 pt-16 sm:pt-20" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {/* Header Section - Made responsive */}
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Appointment Log</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Manage your {userType === 'seeker' ? 'bookings with experts' : 'client appointments'}
            </p>
          </div>
          {userType && (
            <Badge variant="outline" className="text-xs sm:text-sm px-2 sm:px-3 py-1 self-center sm:self-auto">
              {userType === 'seeker' ? 'Seeker View' : 'Expert View'}
            </Badge>
          )}
        </div>

        {/* Rest of the existing logic remains the same */}
        {!userId ? (
          <Card className="text-center py-8 sm:py-12 mx-2 sm:mx-0">
            <CardContent className="px-4 sm:px-6">
              <div className="space-y-4">
                <div className="text-muted-foreground text-base sm:text-lg">
                  Please log in to view your appointments
                </div>
                <Button onClick={() => navigate('/auth/expert')} size="lg" className="w-full sm:w-auto">
                  Log In
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-sm sm:text-base text-muted-foreground">Loading appointments...</p>
          </div>
        ) : error ? (
          <Card className="text-center py-8 sm:py-12 mx-2 sm:mx-0">
            <CardContent className="px-4 sm:px-6">
              <div className="space-y-4">
                <div className="text-red-500 text-sm sm:text-lg">{errorSeeker || errorExpert}</div>
                <Button 
                  onClick={() => {
                    if (userId) {
                      fetchSeekerBookings(userId);
                      fetchExpertBookings(userId);
                    }
                  }} 
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
            {/* Responsive Tabs List */}
            <div className="overflow-x-auto">
              <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-muted rounded-lg">
                <TabsTrigger 
                  value="pending" 
                  className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 sm:px-4 text-xs sm:text-sm data-[state=active]:bg-yellow-100 data-[state=active]:text-yellow-800 data-[state=active]:font-bold"
                >
                  <span className="truncate">Pending</span>
                  {bookingFilters.pending.length > 0 && (
                    <Badge variant="secondary" className="text-xs px-1 py-0 min-w-[1.2rem] h-4 bg-yellow-100 text-yellow-800 border border-yellow-300">
                      {bookingFilters.pending.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="confirmed" 
                  className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 sm:px-4 text-xs sm:text-sm data-[state=active]:bg-green-100 data-[state=active]:text-green-800 data-[state=active]:font-bold"
                >
                  <span className="truncate">Confirmed</span>
                  {bookingFilters.confirmed.length > 0 && (
                    <Badge variant="secondary" className="text-xs px-1 py-0 min-w-[1.2rem] h-4 bg-green-100 text-green-800 border border-green-300">
                      {bookingFilters.confirmed.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="rejected" 
                  className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 sm:px-4 text-xs sm:text-sm data-[state=active]:bg-red-100 data-[state=active]:text-red-700 data-[state=active]:font-bold"
                >
                  <span className="truncate">Rejected</span>
                  {bookingFilters.rejected.length > 0 && (
                    <Badge variant="secondary" className="text-xs px-1 py-0 min-w-[1.2rem] h-4 bg-red-100 text-red-700 border border-red-300">
                      {bookingFilters.rejected.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="completed" 
                  className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 sm:px-4 text-xs sm:text-sm data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800 data-[state=active]:font-bold"
                >
                  <span className="truncate">Completed</span>
                  {bookingFilters.completed.length > 0 && (
                    <Badge variant="secondary" className="text-xs px-1 py-0 min-w-[1.2rem] h-4 bg-orange-100 text-orange-800 border border-orange-300">
                      {bookingFilters.completed.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>
            
            {/* All Tab Content sections with responsive grid */}
            <TabsContent value="pending" className="space-y-4">
              {bookingFilters.pending.length === 0 ? (
                <Card className="text-center py-8 sm:py-12 mx-2 sm:mx-0">
                  <CardContent>
                    <div className="text-sm sm:text-lg text-muted-foreground">
                      No pending appointments
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="custom-scrollbar grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3" style={{ WebkitOverflowScrolling: 'touch', minHeight: '0', height: 'auto' }}>
                  {bookingFilters.pending
                    .sort((a, b) => {
                      const dateA = new Date(`${a.date}T${a.start_time}`);
                      const dateB = new Date(`${b.date}T${b.start_time}`);
                      return dateA.getTime() - dateB.getTime();
                    })
                    .map(renderBookingCard)}
                </div>
              )}
            </TabsContent>
            
            {/* Repeat similar structure for other tabs with same responsive grid */}
            <TabsContent value="confirmed" className="space-y-4">
              {bookingFilters.confirmed.length === 0 ? (
                <Card className="text-center py-8 sm:py-12 mx-2 sm:mx-0">
                  <CardContent>
                    <div className="text-sm sm:text-lg text-muted-foreground">
                      No confirmed appointments
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="custom-scrollbar grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  {bookingFilters.confirmed
                    .sort((a, b) => {
                      const dateA = new Date(`${a.date}T${a.start_time}`);
                      const dateB = new Date(`${b.date}T${b.start_time}`);
                      return dateA.getTime() - dateB.getTime();
                    })
                    .map(renderBookingCard)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="rejected" className="space-y-4">
              {bookingFilters.rejected.length === 0 ? (
                <Card className="text-center py-8 sm:py-12 mx-2 sm:mx-0">
                  <CardContent>
                    <div className="text-sm sm:text-lg text-muted-foreground">
                      No rejected appointments
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="custom-scrollbar grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  {bookingFilters.rejected
                    .sort((a, b) => {
                      const dateA = new Date(`${a.date}T${a.start_time}`);
                      const dateB = new Date(`${b.date}T${b.start_time}`);
                      return dateB.getTime() - dateA.getTime();
                    })
                    .map(renderBookingCard)}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="completed" className="space-y-4">
              {bookingFilters.completed.length === 0 ? (
                <Card className="text-center py-8 sm:py-12 mx-2 sm:mx-0">
                  <CardContent>
                    <div className="text-sm sm:text-lg text-muted-foreground">
                      No completed appointments
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="custom-scrollbar grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  {bookingFilters.completed
                    .sort((a, b) => {
                      const dateA = new Date(`${a.date}T${a.start_time}`);
                      const dateB = new Date(`${b.date}T${b.start_time}`);
                      return dateB.getTime() - dateA.getTime();
                    })
                    .map(renderBookingCard)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
      <Footer />

      {/* Reschedule Dialog */}
      <RescheduleDialog
        isOpen={isRescheduleOpen}
        onClose={() => {
          setIsRescheduleOpen(false);
          setSelectedBooking(null);
        }}
        booking={selectedBooking}
        onReschedule={handleReschedule}
        checkBookingAvailability={checkBookingAvailability} // <-- add this line
      />

      {/* Add QueryDialog to the component */}
      <QueryDialog />

      {/* Add RejectDialog to the component */}
      <RejectDialog
        isOpen={isRejectDialogOpen}
        onClose={() => {
          setIsRejectDialogOpen(false);
          setRejectionReason('');
        }}
        reason={rejectionReason}
        onReasonChange={setRejectionReason}
        onSubmit={(e) => {
          e.preventDefault();
          handleReject();
        }}
      />

      {/* Add RejectionReasonDialog to the component */}
      {isRejectionReasonDialogOpen && <RejectionReasonDialog />}

      {/* Render InvoiceDialog modal */}
      {isInvoiceDialogOpen && <InvoiceDialog />}

      <style>{customScrollbarStyle}</style>
    </div>
  );
};

function parseDateTime(date: string, time: string) {
  // Handles ISO date string with time and timezone, and "HH:mm AM/PM" or "HH:mm" 24-hour format time string
  if (!date || !time) return new Date(date);
  const baseDate = new Date(date); // parse full ISO date string with timezone
  if (isNaN(baseDate.getTime())) return new Date(date); // fallback if invalid date
  let hours = 0;
  let minutes = 0;
  const timeParts = time.trim().split(' ');
  if (timeParts.length === 2) {
    // 12-hour format with AM/PM
    const [rawTime, modifier] = timeParts;
    [hours, minutes] = rawTime.split(':').map(Number);
    if (modifier.toLowerCase() === 'pm' && hours < 12) hours += 12;
    if (modifier.toLowerCase() === 'am' && hours === 12) hours = 0;
  } else {
    // 24-hour format without AM/PM
    [hours, minutes] = time.split(':').map(Number);
  }
  baseDate.setHours(hours, minutes, 0, 0);
  return baseDate;
}

// Add these helper functions
const parseTime = (timeString: string): Date => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const addHours = (date: Date, hours: number): string => {
  const newDate = new Date(date);
  newDate.setHours(date.getHours() + hours);
  return format(newDate, 'HH:mm');
};

export default AppointmentLog;