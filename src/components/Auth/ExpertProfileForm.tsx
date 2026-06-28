import React, { useState, useEffect, JSX } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { differenceInYears, format } from 'date-fns';
import { z } from 'zod';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EducationModal } from '../modals/EducationModal';
import { ExperienceModal } from '../modals/ExperienceModal';
import { AwardsModal } from '../modals/AwardsModal';
import { PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react';

// UI Components
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from '../layout/Navbar';
import Footer from '../layout/Footer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import TermsAndConditions from './ExpertTermCon';
import { createWorker } from 'tesseract.js';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2, X } from 'lucide-react';

// Add TypeScript declaration for PDF.js at the top level
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

// Update the API_BASE_URL constant
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface Education {
  id: number;
  school: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
}

interface Experience {
  id: number;
  title: string;
  company: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  employment_type?: string;
  location?: string;
  industry?: string;
  description?: string;
}

interface Award {
  id: number;
  title: string;
  issuer: string;
  issue_date: string;
  description?: string;
}

interface ExpertProfileFormData {
    firstName: string;
    lastName: string;
    designation: string;
    dateOfBirth: Date;
    phoneNumber: string;
    workExperience: string;
    currentOrganization: string;
    location: string;
    expertise: string;
    areasOfHelp: string;
    linkedinUrl: string | null;
    functionality: string;
    customFunctionality?: string;
}

// Validation schema
const expertProfileSchema = z.object({
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters')
    .regex(/^[a-zA-Z\s]*$/, 'First name can only contain letters and spaces')
    .transform(val => val.trim()),

  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name cannot exceed 50 characters')
    .regex(/^[a-zA-Z\s]*$/, 'Last name can only contain letters and spaces')
    .transform(val => val.trim()),

  designation: z.string()
    .min(3, 'Designation must be at least 3 characters')
    .max(100, 'Designation cannot exceed 100 characters')
    .regex(/^[a-zA-Z\s\-,.()]+$/, 'Designation can only contain letters, spaces, and basic punctuation')
    .transform(val => val.trim()),

  dateOfBirth: z.date()
    .refine(date => {
      const age = differenceInYears(new Date(), date);
      return age >= 18 && age <= 100;
    }, 'You must be between 18 and 100 years old'),

  phoneNumber: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number cannot exceed 15 digits')
    .regex(/^[0-9]+$/, 'Phone number can only contain numbers')
    .transform(val => val.replace(/\D/g, '')),

  workExperience: z.string()
    .regex(/^[0-9]{1,2}$/, 'Work experience must be a 1-2 digit number')
    .transform(Number)
    .refine(val => val >= 0 && val <= 50, {
      message: 'Work experience must be between 0 and 50 years'
    }),

  currentOrganization: z.string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name cannot exceed 100 characters')
    .regex(/^[a-zA-Z0-9\s\-,.&()]+$/, 'Organization name can only contain letters, numbers, spaces, and basic punctuation')
    .transform(val => val.trim()),

  location: z.string()
    .min(2, 'Location must be at least 2 characters')
    .max(100, 'Location cannot exceed 100 characters')
    .regex(/^[a-zA-Z\s,.-]+$/, 'Location can only contain letters, spaces, and basic punctuation')
    .transform(val => val.trim()),

  expertise: z.string()
    .min(3, 'Expertise must be at least 3 characters')
    .max(500, 'Expertise cannot exceed 500 characters')
    .transform(val => val.trim())
    .refine(val => val.length > 0, 'Expertise is required'),

  areasOfHelp: z.string()
    .min(10, 'Areas of help must be at least 10 characters')
    .max(1000, 'Areas of help cannot exceed 1000 characters')
    .transform(val => val.trim())
    .refine(val => val.length > 0, 'Areas of help is required'),

  linkedinUrl: z.string()
    .url('Must be a valid LinkedIn URL')
    .regex(/^https:\/\/(www\.)?linkedin\.com\/.*$/, 'Must be a LinkedIn URL')
    .min(1, "LinkedIn URL is required"),

  functionality: z.string()
    .min(1, 'Functionality is required')
    .max(100, 'Functionality cannot exceed 100 characters'),

  customFunctionality: z.string()
    .max(100, 'Custom functionality cannot exceed 100 characters')
    .optional()
    .transform(val => val?.trim())
    .refine(val => !val || val.length >= 3, {
      message: 'Custom functionality must be at least 3 characters if provided'
    })
}).refine(data => {
  if (data.functionality === 'others' && !data.customFunctionality) {
    return false;
  }
  return true;
}, {
  message: 'Custom functionality is required when "Others" is selected',
  path: ['customFunctionality']
});

const ExpertProfileForm: React.FC = () => {
  const navigate = useNavigate();
  
  // ALL STATE HOOKS MUST BE DECLARED FIRST - NO CONDITIONS
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [functionalityOptions, setFunctionalityOptions] = useState<Array<{
    id: number;
    option_value: string;
    display_name: string;
  }>>([]);
  const [loadingFunctionalities, setLoadingFunctionalities] = useState(true);
  const [showEducationModal, setShowEducationModal] = useState(false);
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [showAwardsModal, setShowAwardsModal] = useState(false);
  const [educationEntries, setEducationEntries] = useState<Education[]>([]);
  const [experienceEntries, setExperienceEntries] = useState<Experience[]>([]);
  const [awardsEntries, setAwardsEntries] = useState<Award[]>([]);
  const [calendarView, setCalendarView] = useState<'days' | 'months' | 'years'>('days');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);
  const [selectedFunctionality, setSelectedFunctionality] = useState<{
    id: number | null;
    value: string;
  }>({
    id: null,
    value: ''
  });
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [extractedText, setExtractedText] = useState<string>('');
  const [debugMode, setDebugMode] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);

  // FORM HOOK - ALWAYS CALL AFTER STATE HOOKS
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ExpertProfileFormData>({
    defaultValues: {
      dateOfBirth: new Date('1990-01-01'),
      workExperience: '0',
      linkedinUrl: null
    },
    resolver: zodResolver(expertProfileSchema)
  });

  // HELPER FUNCTIONS (non-hooks)
  const years = Array.from({ length: 74 }, (_, i) => new Date().getFullYear() - 73 + i);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const generateEntryId = () => Date.now() + Math.floor(Math.random() * 1000);

  const formatDateSafely = (dateString: string | null | undefined, formatStr: string = 'yyyy-MM-dd'): string => {
    if (!dateString) return 'Present';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return format(date, formatStr);
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  const verifySession = () => {
    const userData = localStorage.getItem('user');
    const signupData = localStorage.getItem('expertSignupData');
    if (!userData && !signupData) {
      throw new Error('No session found');
    }
    return JSON.parse(userData || signupData);
  };

  const formatDateForMySQL = (dateString: string | Date) => {
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Date formatting error:', error);
      return null;
    }
  };

  const validateEntries = () => {
    let isValid = true;
    
    if (educationEntries.length === 0) {
      toast.error('Please add at least one education entry');
      isValid = false;
    }
    
    if (experienceEntries.length === 0) {
      toast.error('Please add at least one experience entry');
      isValid = false;
    }
    
    return isValid;
  };

  // RESUME PROCESSING FUNCTIONS
  const extractTextFromImage = async (file: File): Promise<string> => {
    const worker = await createWorker();
    
    try {
      await worker.load();
      await worker.reinitialize('eng');
      
      // Better OCR parameters for resume parsing
      await worker.setParameters({
        tessedit_pageseg_mode: 3, // Fully automatic page segmentation, but no OSD
        tessedit_ocr_engine_mode: '2', // Legacy + LSTM engines
        preserve_interword_spaces: '1',
      });
      
      const { data: { text } } = await worker.recognize(
        file,
        {},
        undefined,
        progress => {
          if (progress.status === 'recognizing text') {
            setProcessingProgress(Math.round(progress.progress * 100));
          }
        }
      );
      return text as string; // Type 'string' is already explicit in the function return type
      
    } finally {
      await worker.terminate();
    }
  };

  // Enhanced extractTextFromPDF function
  const extractTextFromPDF = async (file: File): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        
        if (!window.pdfjsLib) {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
          script.onload = () => {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
              'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            processPDF();
          };
          document.head.appendChild(script);
        } else {
          processPDF();
        }

        async function processPDF() {
          try {
            const loadingTask = window.pdfjsLib.getDocument({ 
              data: arrayBuffer,
              // Enhanced options for better text extraction
              disableFontFace: false,
              useSystemFonts: true,
              // Add CMap support for better character encoding
              cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
              cMapPacked: true
            });
            const pdf = await loadingTask.promise;
            
            let fullText = '';
            const totalPages = pdf.numPages;
            
            // Process pages sequentially for better text extraction
            for (let i = 1; i <= totalPages; i++) {
              setProcessingProgress(Math.round((i / totalPages) * 100));
              const page = await pdf.getPage(i);
              
              // Get text content with enhanced options
              const textContent = await page.getTextContent({
                normalizeWhitespace: true,
                disableCombineTextItems: false
              });
              
              // Enhanced text extraction with position awareness
              let pageText = '';
              let lastY = null;
              let line = '';
              
              // Sort items by Y position (top to bottom) then X position (left to right)
              const sortedItems = textContent.items.sort((a: any, b: any) => {
                if (Math.abs(a.transform[5] - b.transform[5]) < 5) {
                  return a.transform[4] - b.transform[4]; // Same line, sort by X
                }
                return b.transform[5] - a.transform[5]; // Different lines, sort by Y (top to bottom)
              });
              
              for (const item of sortedItems) {
                const currentY = item.transform[5];
                
                // Check if we're on a new line
                if (lastY !== null && Math.abs(currentY - lastY) > 5) {
                  if (line.trim()) {
                    pageText += line.trim() + '\n';
                  }
                  line = '';
                }
                
                line += item.str + ' ';
                lastY = currentY;
              }
              
              // Add the last line
              if (line.trim()) {
                pageText += line.trim() + '\n';
              }
              
              fullText += pageText + '\n';
            }
            
            resolve(fullText);
          } catch (error) {
            reject(error);
          }
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  // Enhanced parseResumeText function with education and experience extraction
  const parseResumeText = (text: string) => {
    console.log('Raw extracted text:', text);
    
    // More aggressive text cleaning and normalization
    const cleanText = text
      .replace(/\r\n/g, '\n')
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .replace(/[^\w\s@.:/()-]/g, ' ') // Remove special characters but keep essential ones
      .trim();
    
    console.log('Cleaned text for parsing:', cleanText.substring(0, 500) + '...');
    
    // Helper function to find text after keywords
    const findAfterKeyword = (keywords: string[], text: string): string => {
      for (const keyword of keywords) {
        const regex = new RegExp(`${keyword}\\s*:?\\s*([^\\n]+)`, 'i');
        const match = text.match(regex);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
      return '';
    };
    
    // Helper function to extract sections
    const extractSection = (sectionName: string, text: string): string => {
      const sectionRegex = new RegExp(`\\b(${sectionName})\\b[\\s\\S]*?(?=\\b(?:education|experience|skills|projects|awards|certifications|references|contact|summary|objective)\\b|$)`, 'i');
      const match = text.match(sectionRegex);
      return match ? match[0] : '';
    };
    
    // 1. ENHANCED NAME EXTRACTION
    let firstName = '', lastName = '';
    
    const nameStrategies = [
      // Strategy 1: Look for "Name:" pattern
      () => {
        const match = cleanText.match(/(?:name|full name|your name)[\s:]+([a-z]+ [a-z]+(?:\s+[a-z]+)?)/i);
        return match ? match[1] : null;
      },
      
      // Strategy 2: First line that looks like a name
      () => {
        const lines = cleanText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        for (const line of lines.slice(0, 5)) { // Check first 5 lines
          if (/^[A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)?$/.test(line) && 
              line.length < 50 &&
              !/\d/.test(line) && // No numbers
              !/(?:resume|cv|profile|address|email|phone)/i.test(line)) {
            return line;
          }
        }
        return null;
      },
      
      // Strategy 3: Look for capitalized words at the beginning
      () => {
        const match = cleanText.match(/^([A-Z][A-Z\s]{5,30}?)(?:\s|$)/);
        if (match) {
          const name = match[1].trim();
          if (name.split(' ').length >= 2 && name.split(' ').length <= 4) {
            return name.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
          }
        }
        return null;
      }
    ];
    
    for (const strategy of nameStrategies) {
      const result = strategy();
      if (result) {
        const parts = result.split(/\s+/);
        firstName = parts[0] || '';
        lastName = parts.slice(1).join(' ') || '';
        if (firstName.length > 1 && lastName.length > 0) {
          console.log('✓ Found name:', firstName, lastName);
          break;
        }
      }
    }
    
    // 2. ENHANCED EMAIL EXTRACTION
    const emailMatch = cleanText.match(/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/);
    const email = emailMatch ? emailMatch[0].toLowerCase() : '';
    console.log('✓ Found email:', email);
    
    // 3. ENHANCED PHONE EXTRACTION
    let phone = '';
    const phonePatterns = [
      /(?:phone|mobile|tel|contact|cell)[\s:]*(\+?[\d\s\-\(\)\.]{10,15})/i,
      /\b(\+91[\s\-]?[6-9]\d{9})\b/,
      /\b(\+1[\s\-]?\d{3}[\s\-]?\d{3}[\s\-]?\d{4})\b/,
      /\b(\d{10})\b/,
      /\b(\(\d{3}\)[\s\-]?\d{3}[\s\-]?\d{4})\b/
    ];
    
    for (const pattern of phonePatterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        phone = match[1].replace(/[^\d+]/g, '');
        if (phone.length >= 10 && phone.length <= 15) {
          console.log('✓ Found phone:', phone);
          break;
        }
      }
    }
    
    // 4. ENHANCED LINKEDIN EXTRACTION
    let linkedIn = '';
    const linkedInPatterns = [
      /(?:linkedin|linked in)[\s:]*(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([\w\-%.]+)/i,
      /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([\w\-%.]+)/i,
      /linkedin\.com\/in\/([\w\-%.]+)/i
    ];
    
    for (const pattern of linkedInPatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        if (match[0].includes('http')) {
          linkedIn = match[0];
        } else if (match[1]) {
          linkedIn = `https://www.linkedin.com/in/${match[1]}`;
        }
        console.log('✓ Found LinkedIn:', linkedIn);
        break;
      }
    }
    
    // 5. ENHANCED DESIGNATION EXTRACTION
    let designation = '';
    const designationStrategies = [
      // Strategy 1: Look after name
      () => {
        if (firstName && lastName) {
          const nameRegex = new RegExp(`${firstName}\\s+${lastName}[\\s\\n]+([^\\n]{10,80})`, 'i');
          const match = cleanText.match(nameRegex);
          if (match && match[1]) {
            const title = match[1].trim();
            if (!/\d{4}|@|phone|email|address/i.test(title)) {
              return title;
            }
          }
        }
        return null;
      },
      
      // Strategy 2: Look for explicit titles
      () => {
        const match = cleanText.match(/(?:position|title|role|designation|current role|job title)[\s:]+([^\\n]{5,80})/i);
        return match ? match[1].trim() : null;
      },
      
      // Strategy 3: Common job titles
      () => {
        const jobTitles = [
          'Software Engineer', 'Senior Software Engineer', 'Full Stack Developer',
          'Frontend Developer', 'Backend Developer', 'DevOps Engineer',
          'Data Scientist', 'Product Manager', 'Project Manager', 'Team Lead',
          'Technical Lead', 'Senior Developer', 'Junior Developer',
          'Software Architect', 'System Architect', 'Principal Engineer',
          'Engineering Manager', 'Senior Manager', 'Director', 'VP'
        ];
        
        for (const title of jobTitles) {
          const regex = new RegExp(`\\b${title.replace(/\s+/g, '\\s+')}\\b`, 'i');
          if (regex.test(cleanText)) {
            return title;
          }
        }
        return null;
      }
    ];
    
    for (const strategy of designationStrategies) {
      const result = strategy();
      if (result && result.length > 3 && result.length < 100) {
        designation = result;
        console.log('✓ Found designation:', designation);
        break;
      }
    }
    
    // 6. ENHANCED ORGANIZATION EXTRACTION
    let currentOrg = '';
    const orgStrategies = [
      // Strategy 1: After "at" keyword
      () => {
        if (designation) {
          const match = cleanText.match(new RegExp(`${designation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+(?:at|@)\\s+([^\\n,]{3,50})`, 'i'));
          if (match && match[1]) {
            return match[1].trim();
          }
        }
        return null;
      },
      
      // Strategy 2: Explicit company keywords
      () => {
        const match = cleanText.match(/(?:company|organization|employer|currently at|working at)[\s:]+([^\\n,]{3,50})/i);
        return match ? match[1].trim() : null;
      },
      
      // Strategy 3: Look for company suffixes
      () => {
        const match = cleanText.match(/\b([A-Z][a-zA-Z\s&]{2,30}(?:Inc|LLC|Corp|Ltd|Company|Technologies|Solutions|Systems|Services|Group)\.?)/);
        return match ? match[1].trim() : null;
      }
    ];
    
    for (const strategy of orgStrategies) {
      const result = strategy();
      if (result && result.length > 2 && result.length < 100 && !/^\d+$/.test(result)) {
        currentOrg = result;
        console.log('✓ Found organization:', currentOrg);
        break;
      }
    }
    
    // 7. ENHANCED WORK EXPERIENCE EXTRACTION
    let workExperience = '';
    const expPatterns = [
      /(\d+)[\s]*(?:\+)?\s*(?:years?|yrs?)[\s]*(?:of)?[\s]*(?:experience|exp)/i,
      /(?:experience|exp)[\s:]*(\d+)[\s]*(?:years?|yrs?)/i,
      /(?:total|overall)[\s]*(?:experience|exp)[\s:]*(\d+)/i
    ];
    
    for (const pattern of expPatterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        const years = parseInt(match[1]);
        if (years >= 0 && years <= 50) {
          workExperience = years.toString();
          console.log('✓ Found work experience:', workExperience);
          break;
        }
      }
    }
    
    // 8. ENHANCED LOCATION EXTRACTION
    let location = '';
    const locationPatterns = [
      /(?:location|address|based in|city|state|residence)[\s:]+([^\\n,]{3,50})(?:,\s*([^\\n]{2,30}))?/i,
      /\b([A-Z][a-zA-Z\s]+),\s*([A-Z]{2}|[A-Z][a-zA-Z\s]+)(?:,\s*\d{5,6})?\b/,
      /\b([A-Z][a-zA-Z\s]+ \d{6})\b/ // For Indian pincodes
    ];
    
    for (const pattern of locationPatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        if (match[2]) {
          location = `${match[1].trim()}, ${match[2].trim()}`;
        } else if (match[1]) {
          location = match[1].trim();
        }
        
        if (location.length > 3 && !/\d{10}/.test(location)) { // Not a phone number
          console.log('✓ Found location:', location);
          break;
        }
      }
    }
    
    // 9. ENHANCED SKILLS EXTRACTION
    let skills = '';
    const skillsPatterns = [
      /(?:skills|technical skills|technologies|programming languages|tech stack)[\s:]*([^\\n]{10,200})/i,
      /(?:proficient in|expert in|experienced with)[\s:]*([^\\n]{10,200})/i,
      /(?:languages|frameworks|tools|platforms)[\s:]*([^\\n]{10,200})/i
    ];
    
    for (const pattern of skillsPatterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        skills = match[1].trim().replace(/\s+/g, ' ');
        if (skills.length > 5 && skills.length < 500) {
          console.log('✓ Found skills:', skills);
          break;
        }
      }
    }
    
    // 10. ENHANCED AREAS OF HELP EXTRACTION
    let areasOfHelp = '';
    const areasPatterns = [
      /(?:areas of help|can help with|mentoring|expertise|specialization)[\s:]*([^\\n]{15,300})/i,
      /(?:objective|summary|profile)[\s:]*([^\\n]{20,300})/i,
      /(?:passionate about|interested in|focus on)[\s:]*([^\\n]{15,300})/i
    ];
    
    for (const pattern of areasPatterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        areasOfHelp = match[1].trim().replace(/\s+/g, ' ');
        if (areasOfHelp.length > 10 && areasOfHelp.length < 1000) {
          console.log('✓ Found areas of help:', areasOfHelp);
          break;
        }
      }
    }
    
    // If no specific areas found, use skills as fallback
    if (!areasOfHelp && skills) {
      areasOfHelp = `I can help with ${skills} and related technologies`;
      console.log('✓ Generated areas of help from skills:', areasOfHelp);
    }
    
    // 11. ENHANCED EDUCATION EXTRACTION
    const education: any[] = [];
    
    // Split text into sections first
    const sections = cleanText.split(/\b(?:education|experience|work history|employment|skills|projects|awards|certifications)\b/i);
    let educationSection = '';
    
    // Find education section with stricter boundaries
    const educationMatch = cleanText.match(/\b(education|academic background|qualifications?)\b[\s\S]*?(?=\b(?:experience|work history|employment|professional experience|career|skills|technical skills|projects|awards|certifications|references|contact|summary|objective)\b|$)/i);
    if (educationMatch) {
      educationSection = educationMatch[0];
      // Clean up education section - remove non-education content
      educationSection = educationSection.replace(/\b(?:skills?|technologies?|programming|languages?|frameworks?|tools?|platforms?)\b[\s\S]*$/i, '');
      console.log('Found education section:', educationSection.substring(0, 200) + '...');
      
      // Pattern to match education entries
      const educationPatterns = [
        // Pattern: Degree in Field from School (Year - Year)
        /([A-Z][a-zA-Z\s.]*(?:degree|bachelor|master|phd|diploma|certificate|b\.tech|m\.tech|bca|mca|mba|be|me))[^\n]*in\s+([A-Z][a-zA-Z\s]+)[^\n]*(?:from|at)\s+([A-Z][a-zA-Z\s,.-]+)[\s]*(?:\(?\s*(\d{4})\s*-?\s*(\d{4}|present|current)?\s*\)?)?/gi,
        // Pattern: School - Degree (Year - Year)
        /([A-Z][a-zA-Z\s,.-]+)[\s]*-[\s]*([A-Z][a-zA-Z\s.]*(?:degree|bachelor|master|phd|diploma|certificate|b\.tech|m\.tech|bca|mca|mba|be|me))[^\n]*[\s]*(?:\(?\s*(\d{4})\s*-?\s*(\d{4}|present|current)?\s*\)?)?/gi,
        // Pattern: University/College name with degree
        /((?:university|college|institute|school)[^\n,]*)[,\n\s]+([a-zA-Z\s.]*(?:degree|bachelor|master|phd|diploma|certificate|b\.tech|m\.tech|bca|mca|mba|be|me))[^\n]*[\s]*(?:\(?\s*(\d{4})\s*-?\s*(\d{4}|present|current)?\s*\)?)?/gi
      ];
      
      for (const pattern of educationPatterns) {
        let match;
        while ((match = pattern.exec(educationSection)) !== null) {
          const [fullMatch, field1, field2, field3, startYear, endYear] = match;
          
          // Determine which fields are degree, school, and field of study
          let degree = '', school = '', fieldOfStudy = '';
          
          if (pattern === educationPatterns[0]) {
            degree = field1.trim();
            fieldOfStudy = field2.trim();
            school = field3.trim();
          } else if (pattern === educationPatterns[1]) {
            school = field1.trim();
            degree = field2.trim();
            fieldOfStudy = 'General'; // Default if not specified
          } else {
            school = field1.trim();
            degree = field2.trim();
            fieldOfStudy = 'General'; // Default if not specified
          }
          
          // Clean up and validate
          if (degree.length > 3 && school.length > 3) {
            const startDate = startYear ? `${startYear}-01-01` : '2020-01-01';
            const endDate = endYear && endYear !== 'present' && endYear !== 'current' ? `${endYear}-12-31` : null;
            const isCurrent = !endYear || endYear === 'present' || endYear === 'current';
            
            education.push({
              id: Math.floor(Math.random() * 1000000),
              school: school,
              degree: degree,
              field_of_study: fieldOfStudy,
              start_date: startDate,
              end_date: endDate,
              is_current: isCurrent
            });
            
            console.log('✓ Found education:', { degree, school, fieldOfStudy, startYear, endYear });
          }
        }
      }
    }
    
    // 12. ENHANCED EXPERIENCE EXTRACTION
    const experience: any[] = [];
    
    // Find experience section separately
    const experienceMatch = cleanText.match(/\b(experience|work history|employment|career|professional)[\s\S]*?(?=\b(?:education|skills|projects|awards|certifications|references|contact)\b|$)/i);
    let experienceSection = '';
    
    if (experienceMatch) {
      experienceSection = experienceMatch[0];
      console.log('Found experience section:', experienceSection.substring(0, 200) + '...');
      
      // Pattern to match experience entries
      const experiencePatterns = [
        // Pattern: Title at Company (Month Year - Month Year)
        /([A-Z][a-zA-Z\s]+(?:engineer|developer|manager|analyst|consultant|specialist|lead|director|associate|intern|trainee))[^\n]*(?:at|@)\s+([A-Z][a-zA-Z\s,.-]+)[\s]*(?:\(?\s*([A-Z][a-z]+)?\s*(\d{4})\s*-?\s*([A-Z][a-z]+)?\s*(\d{4}|present|current)?\s*\)?)?/gi,
        // Pattern: Company - Title (Date range)
        /([A-Z][a-zA-Z\s,.-]+)[\s]*-[\s]*([A-Z][a-zA-Z\s]+(?:engineer|developer|manager|analyst|consultant|specialist|lead|director|associate|intern|trainee))[^\n]*[\s]*(?:\(?\s*([A-Z][a-z]+)?\s*(\d{4})\s*-?\s*([A-Z][a-z]+)?\s*(\d{4}|present|current)?\s*\)?)?/gi
      ];
      
      for (const pattern of experiencePatterns) {
        let match;
        while ((match = pattern.exec(experienceSection)) !== null) {
          const [fullMatch, field1, field2, startMonth, startYear, endMonth, endYear] = match;
          
          // Determine which fields are title and company
          let title = '', company = '';
          
          if (pattern === experiencePatterns[0]) {
            title = field1.trim();
            company = field2.trim();
          } else {
            company = field1.trim();
            title = field2.trim();
          }
          
          // Clean up and validate
          if (title.length > 3 && company.length > 3) {
            const startDate = startYear ? `${startYear}-${startMonth ? getMonthNumber(startMonth) : '01'}-01` : '2020-01-01';
            const endDate = endYear && endYear !== 'present' && endYear !== 'current' ? 
              `${endYear}-${endMonth ? getMonthNumber(endMonth) : '12'}-31` : null;
            const isCurrent = !endYear || endYear === 'present' || endYear === 'current';
            
            experience.push({
              id: Math.floor(Math.random() * 1000000),
              title: title,
              company: company,
              start_date: startDate,
              end_date: endDate,
              is_current: isCurrent,
              employment_type: 'Full-time',
              location: location || 'Not specified',
              industry: 'Technology',
              description: `${title} role at ${company}`
            });
            
            console.log('✓ Found experience:', { title, company, startYear, endYear });
          }
        }
      }
    }
    
    // Helper function to convert month name to number
    const monthsMap = {
      'january': '01', 'jan': '01',
      'february': '02', 'feb': '02',
      'march': '03', 'mar': '03',
      'april': '04', 'apr': '04',
      'may': '05',
      'june': '06', 'jun': '06',
      'july': '07', 'jul': '07',
      'august': '08', 'aug': '08',
      'september': '09', 'sep': '09',
      'october': '10', 'oct': '10',
      'november': '11', 'nov': '11',
      'december': '12', 'dec': '12'
    };
    
    function getMonthNumber(monthName: string): string {
      return monthsMap[monthName.toLowerCase()] || '01';
    }
    
    const result = {
      firstName,
      lastName,
      phone,
      linkedIn,
      skills,
      currentOrg,
      workExperience,
      location,
      designation,
      areasOfHelp,
      email,
      education,
      experience
    };
    
    console.log('📋 Final parsed data:', result);
    return result;
  };

  // Enhanced processFile function with education and experience auto-population
  const processFile = async (file: File) => {
    setIsProcessing(true);
    setProcessingProgress(0);
    
    try {
      let extractedText = '';
      
      console.log(`🔄 Processing ${file.type} file: ${file.name}`);
      
      if (file.type === 'application/pdf') {
        extractedText = await extractTextFromPDF(file);
      } else if (file.type.startsWith('image/')) {
        extractedText = await extractTextFromImage(file);
      } else {
        throw new Error('Unsupported file type. Please upload PDF or image files only.');
      }
      
      console.log(`📄 Extracted ${extractedText.length} characters of text`);
      setExtractedText(extractedText);
      
      if (extractedText.length < 50) {
        console.warn('⚠️ Very little text extracted');
        throw new Error('Very little text was extracted. Please ensure the file is clear and readable.');
      }
      
      const parsedData = parseResumeText(extractedText);
      
      // Enhanced form filling with detailed logging
      let fieldsUpdated = 0;
      const updateLog: string[] = [];
      
      // Helper function to update field if valid and empty
      const updateField = (fieldName: string, value: string, validator?: (val: string) => boolean) => {
        if (!value || value.trim() === '') {
          console.log(`❌ ${fieldName}: No value extracted`);
          return false;
        }
        
        if (validator && !validator(value)) {
          console.log(`❌ ${fieldName}: Invalid value - ${value}`);
          return false;
        }
        
        const currentValue = watch(fieldName as keyof ExpertProfileFormData);
        if (currentValue && currentValue.toString().trim() !== '' && currentValue.toString().trim() !== '0') {
          console.log(`⏭️ ${fieldName}: Field already has value (${currentValue}), skipping`);
          return false;
        }
        
        try {
          setValue(fieldName as keyof ExpertProfileFormData, value as any, { 
            shouldValidate: false,
            shouldDirty: true,
            shouldTouch: true
          });
          fieldsUpdated++;
          updateLog.push(`✅ ${fieldName}: ${value}`);
          console.log(`✅ Updated ${fieldName}: ${value}`);
          return true;
        } catch (error) {
          console.error(`❌ Error updating ${fieldName}:`, error);
          return false;
        }
      };
      
      // Update basic form fields with correct mapping
      if (parsedData.firstName) updateField('firstName', parsedData.firstName, (val) => val.length > 1 && val.length < 50);
      if (parsedData.lastName) updateField('lastName', parsedData.lastName, (val) => val.length > 1 && val.length < 50);
      if (parsedData.phone) updateField('phoneNumber', parsedData.phone, (val) => val.length >= 10 && val.length <= 15 && /^\d+$/.test(val));
      if (parsedData.linkedIn) updateField('linkedinUrl', parsedData.linkedIn, (val) => val.includes('linkedin.com/in/'));
      if (parsedData.skills) updateField('expertise', parsedData.skills, (val) => val.length > 5 && val.length < 500);
      if (parsedData.currentOrg) updateField('currentOrganization', parsedData.currentOrg, (val) => val.length > 2 && val.length < 100);
      if (parsedData.workExperience) updateField('workExperience', parsedData.workExperience, (val) => !isNaN(parseInt(val)) && parseInt(val) >= 0 && parseInt(val) <= 50);
      if (parsedData.location) updateField('location', parsedData.location, (val) => val.length > 3 && val.length < 100);
      if (parsedData.designation) updateField('designation', parsedData.designation, (val) => val.length > 3 && val.length < 100);
      if (parsedData.areasOfHelp) updateField('areasOfHelp', parsedData.areasOfHelp, (val) => val.length > 10 && val.length < 1000);
      
      // Auto-populate education entries
      if (parsedData.education && parsedData.education.length > 0) {
        console.log(`🎓 Found ${parsedData.education.length} education entries`);
        const newEducationEntries: Education[] = [];
        
        for (const edu of parsedData.education) {
          try {
            if (!edu.school || !edu.degree || edu.school.trim() === '' || edu.degree.trim() === '') {
              console.log('❌ Skipping education entry with missing required fields:', edu);
              continue;
            }
            
            const formattedEdu: Education = {
              id: Date.now() + Math.random() * 1000,
              school: edu.school.trim(),
              degree: edu.degree.trim(),
              field_of_study: edu.field_of_study?.trim() || 'General Studies',
              start_date: edu.start_date || '2020-01-01',
              end_date: edu.is_current ? null : (edu.end_date || null),
              is_current: Boolean(edu.is_current)
            };

            const schoolLength = Math.min(10, formattedEdu.school.length);
            const existingInCurrent = educationEntries.find(entry => {
              const entrySchoolLength = Math.min(10, entry.school.length);
              return entry.school.toLowerCase().slice(0, entrySchoolLength).includes(formattedEdu.school.toLowerCase().slice(0, schoolLength)) ||
                     formattedEdu.school.toLowerCase().slice(0, schoolLength).includes(entry.school.toLowerCase().slice(0, entrySchoolLength));
            });
            
            const existingInNew = newEducationEntries.find(entry => {
              const entrySchoolLength = Math.min(10, entry.school.length);
              return entry.school.toLowerCase().slice(0, entrySchoolLength).includes(formattedEdu.school.toLowerCase().slice(0, schoolLength)) ||
                     formattedEdu.school.toLowerCase().slice(0, schoolLength).includes(entry.school.toLowerCase().slice(0, entrySchoolLength));
            });
            
            if (!existingInCurrent && !existingInNew) {
              newEducationEntries.push(formattedEdu);
              fieldsUpdated++;
              updateLog.push(`✅ Education: ${formattedEdu.degree} from ${formattedEdu.school}`);
              console.log('✅ Added education entry:', formattedEdu);
            }
          } catch (error) {
            console.error('❌ Error formatting education entry:', error, edu);
          }
        }
        
        if (newEducationEntries.length > 0) {
          setEducationEntries(prevEntries => [...prevEntries, ...newEducationEntries]);
          console.log(`✅ Added ${newEducationEntries.length} education entries to state`);
        }
      }
      
      // Auto-populate experience entries
      if (parsedData.experience && parsedData.experience.length > 0) {
        console.log(`💼 Found ${parsedData.experience.length} experience entries`);
        const newExperienceEntries: Experience[] = [];
        
        for (const exp of parsedData.experience) {
          try {
            if (!exp.title || !exp.company || exp.title.trim() === '' || exp.company.trim() === '') {
              console.log('❌ Skipping experience entry with missing required fields:', exp);
              continue;
            }
            
            const formattedExp: Experience = {
              id: Date.now() + Math.random() * 1000,
              title: exp.title.trim(),
              company: exp.company.trim(),
              start_date: exp.start_date || '2020-01-01',
              end_date: exp.is_current ? null : (exp.end_date || null),
              is_current: Boolean(exp.is_current),
              employment_type: exp.employment_type?.trim() || 'Full-time',
              location: exp.location?.trim() || 'Not specified',
              industry: exp.industry?.trim() || 'Technology',
              description: exp.description?.trim() || `${exp.title.trim()} role at ${exp.company.trim()}`
            };

            const companyLength = Math.min(10, formattedExp.company.length);
            const existingInCurrent = experienceEntries.find(entry => {
              const entryCompanyLength = Math.min(10, entry.company.length);
              return entry.company.toLowerCase().slice(0, entryCompanyLength).includes(formattedExp.company.toLowerCase().slice(0, companyLength)) ||
                     formattedExp.company.toLowerCase().slice(0, companyLength).includes(entry.company.toLowerCase().slice(0, entryCompanyLength));
            });
            
            const existingInNew = newExperienceEntries.find(entry => {
              const entryCompanyLength = Math.min(10, entry.company.length);
              return entry.company.toLowerCase().slice(0, entryCompanyLength).includes(formattedExp.company.toLowerCase().slice(0, companyLength)) ||
                     formattedExp.company.toLowerCase().slice(0, companyLength).includes(entry.company.toLowerCase().slice(0, entryCompanyLength));
            });
            
            if (!existingInCurrent && !existingInNew) {
              newExperienceEntries.push(formattedExp);
              fieldsUpdated++;
              updateLog.push(`✅ Experience: ${formattedExp.title} at ${formattedExp.company}`);
              console.log('✅ Added experience entry:', formattedExp);
            }
          } catch (error) {
            console.error('❌ Error formatting experience entry:', error, exp);
          }
        }
        
        if (newExperienceEntries.length > 0) {
          setExperienceEntries(prevEntries => [...prevEntries, ...newExperienceEntries]);
          console.log(`✅ Added ${newExperienceEntries.length} experience entries to state`);
        }
      }
      
      // Show detailed results
      if (fieldsUpdated > 0) {
        console.log(`🎉 Successfully updated ${fieldsUpdated} fields:`, updateLog);
        
        // Trigger form validation after all fields are updated
        setTimeout(() => {
          // Validate all updated fields
          ['firstName', 'lastName', 'phoneNumber', 'linkedinUrl', 'expertise', 'currentOrganization', 'workExperience', 'location', 'designation', 'areasOfHelp'].forEach(fieldName => {
            const currentValue = watch(fieldName as keyof ExpertProfileFormData);
            if (currentValue && currentValue.toString().trim() !== '') {
              setValue(fieldName as keyof ExpertProfileFormData, currentValue, { shouldValidate: true });
            }
          });
        }, 500);
        
        const educationCount = parsedData.education?.length || 0;
        const experienceCount = parsedData.experience?.length || 0;
        
        toast.success(
          `Resume processed successfully! ${fieldsUpdated} fields auto-filled including ${educationCount} education and ${experienceCount} experience entries. Please review and edit as needed.`,
          { duration: 8000 }
        );
      } else {
        console.warn('⚠️ No fields could be auto-filled');
        toast.error('Resume processed but no fields could be auto-filled. Please check if the text is clear and try again.');
        
        if (debugMode) {
          console.log('🔍 Extracted data for debugging:', parsedData);
          console.log('🔍 Raw extracted text (first 1000 chars):', extractedText.substring(0, 1000));
        }
      }
      
    } catch (error) {
      console.error('💥 Error processing file:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process file. Please fill the form manually.');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  // DROPZONE HOOK - MUST BE CALLED UNCONDITIONALLY
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    onDrop: async (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        toast.error('Please upload only PDF or image files (max 10MB)');
        return;
      }
      
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setUploadedFile(file);
        await processFile(file);
      }
    }
  });

  // ALL useEffect HOOKS - MUST BE CALLED UNCONDITIONALLY
  useEffect(() => {
    const verifySession = () => {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          if (user.token && user.id) {
            return {
              token: user.token,
              id: user.id
            };
          }
        }

        const signupData = localStorage.getItem('expertSignupData');
        if (signupData) {
          const data = JSON.parse(signupData);
          if (data.token && (data.id || data.user_id)) {
            return {
              token: data.token,
              id: data.id || data.user_id
            };
          }
        }

        throw new Error('No valid session found');
      } catch (error) {
        console.error('Session verification failed:', error);
        throw new Error('Session verification failed');
      }
    };

    try {
      const session = verifySession();
      
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        if (user.name) {
          const [firstName, lastName] = user.name.split(' ');
          setValue('firstName', firstName);
          setValue('lastName', lastName || '');
        }
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Session verification error:', error);
      navigate('/login');
    }
  }, [navigate, setValue]);

  useEffect(() => {
    const fetchFunctionalities = async () => {
      setLoadingFunctionalities(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/experts/functionalities`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        if (result.success) {
            setFunctionalityOptions(result.data);
        } else {
            throw new Error(result.message || 'Failed to load functionalities');
        }
      } catch (error) {
        console.error('Error:', error);
        setError(error instanceof Error ? error.message : 'Failed to load functionalities');
        toast.error('Failed to load business functions. Please refresh.');
      } finally {
        setLoadingFunctionalities(false);
      }
    };

    fetchFunctionalities();
  }, []);

  useEffect(() => {
    const fetchEntries = async () => {
      setIsLoadingEntries(true);
      try {
        const session = JSON.parse(localStorage.getItem('user') || localStorage.getItem('expertSignupData') || '{}');
        if (!session?.token) {
          console.warn('No valid session found');
          return;
        }

        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`
        };

        const [educationRes, experienceRes, awardsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/experts/education/${session.id || session.user_id}`, { headers }),
          fetch(`${API_BASE_URL}/api/experts/experience/${session.id || session.user_id}`, { headers }),
          fetch(`${API_BASE_URL}/api/experts/awards/${session.id || session.user_id}`, { headers })
        ]);

        const results = await Promise.all([
          educationRes.ok ? educationRes.json() : { success: false, data: [] },
          experienceRes.ok ? experienceRes.json() : { success: false, data: [] },
          awardsRes.ok ? awardsRes.json() : { success: false, data: [] }
        ]);

        const [educationData, experienceData, awardsData] = results;

        if (educationData.success) {
          setEducationEntries(educationData.data);
        }
        if (experienceData.success) {
          setExperienceEntries(experienceData.data);
        }
        if (awardsData.success) {
          setAwardsEntries(awardsData.data);
        }

      } catch (error) {
        console.error('Error fetching entries:', error);
        toast.error('Failed to load some profile sections');
      } finally {
        setIsLoadingEntries(false);
      }
    };

    fetchEntries();
  }, []);

  // FORM SUBMISSION HANDLER
  const onSubmit: SubmitHandler<ExpertProfileFormData> = async (data) => {
    try {
      if (!validateEntries()) {
        return;
      }

      setIsSubmitting(true);
      const session = verifySession();

      const formattedEducation = educationEntries.map(({ id, ...entry }) => ({
        ...entry,
        start_date: formatDateForMySQL(entry.start_date),
        end_date: entry.end_date ? formatDateForMySQL(entry.end_date) : null
      }));

      const formattedExperience = experienceEntries.map(({ id, ...entry }) => ({
        ...entry,
        start_date: formatDateForMySQL(entry.start_date),
        end_date: entry.end_date ? formatDateForMySQL(entry.end_date) : null
      }));

      const formattedAwards = awardsEntries.map(({ id, ...entry }) => ({
        ...entry,
        issue_date: formatDateForMySQL(entry.issue_date)
      }));

      const payload = {
        user_id: session.id.toString(),
        first_name: data.firstName.trim(),
        last_name: data.lastName.trim(),
        designation: data.designation.trim(),
        date_of_birth: formatDateForMySQL(data.dateOfBirth),
        phone_number: data.phoneNumber.trim(),
        work_experience: parseInt(data.workExperience),
        current_organization: data.currentOrganization.trim(),
        location: data.location.trim(),
        expertise: data.expertise.trim(),
        areas_of_help: data.areasOfHelp.trim(),
        audio_pricing: 0,
        linkedin_url: data.linkedinUrl?.trim() || '',
        functionality: selectedFunctionality.value === 'others' ? 
          data.customFunctionality?.trim() : selectedFunctionality.value,
        functionality_id: selectedFunctionality.value === 'others' ? 
          null : selectedFunctionality.id,
        is_custom_functionality: selectedFunctionality.value === 'others' ? 1 : 0,
        education: formattedEducation,
        experience: formattedExperience,
        awards: formattedAwards
      };

      const response = await fetch(`${API_BASE_URL}/api/experts/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to save profile');
      }

      toast.success('Profile saved successfully!');
      navigate('/dashboard');

    } catch (error) {
      console.error('Submission error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  // EARLY RETURNS (after all hooks are called)
  if (loadingFunctionalities) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // MAIN COMPONENT RENDER
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 mt-3">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold mt-4">Expert Profile Setup</h1>
          <Dialog open={showResumeModal} onOpenChange={setShowResumeModal}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Resume
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload Your Resume</DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
                  <CardContent className="p-0">
                    <div 
                      {...getRootProps()} 
                      className={cn(
                        "flex flex-col items-center justify-center p-8 cursor-pointer transition-colors",
                        isDragActive ? "bg-blue-50 border-blue-300" : "hover:bg-gray-50",
                        isProcessing && "pointer-events-none opacity-50"
                      )}
                    >
                      <input {...getInputProps()} disabled={isProcessing} />
                      
                      {isProcessing ? (
                        <div className="text-center">
                          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-700 mb-2">Processing Resume...</h3>
                          <div className="w-full bg-gray-200 rounded-full h-3 max-w-xs mx-auto mb-2">
                            <div 
                              className="bg-blue-500 h-3 rounded-full transition-all duration-300" 
                              style={{ width: `${processingProgress}%` }}
                            />
                          </div>
                          <p className="text-sm text-gray-500">{processingProgress}% complete</p>
                        </div>
                      ) : uploadedFile ? (
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-4">
                            <FileText className="h-12 w-12 text-green-500 mr-3" />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setUploadedFile(null);
                                setExtractedText('');
                              }}
                              className="text-red-500 hover:text-red-700 p-1"
                              type="button"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-700 mb-2">File Processed</h3>
                          <p className="text-sm text-gray-600 mb-2">{uploadedFile.name}</p>
                          <p className="text-xs text-green-600">
                            ✓ Resume data has been extracted and form fields have been auto-filled
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            You can review and edit any field as needed
                          </p>
                          <div className="mt-4">
                            <Button 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowResumeModal(false);
                              }}
                              className="w-full"
                              type="button"
                            >
                              Close and Continue
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-700 mb-2">Upload Your Resume</h3>
                          <p className="text-gray-600 mb-2">
                            {isDragActive 
                              ? "Drop your resume here..." 
                              : "Drag & drop your resume here, or click to browse"
                            }
                          </p>
                          <p className="text-sm text-gray-500 mb-2">
                            Supports PDF and image files (PNG, JPG, JPEG)
                          </p>
                          <p className="text-xs text-gray-400">
                            We'll automatically fill the form based on your resume content
                          </p>
                          <div className="mt-4">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                // This will trigger the file input
                                const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                                if (input) input.click();
                              }}
                            >
                              Choose File
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <form 
          onSubmit={handleSubmit(onSubmit)} 
          className="space-y-8"
          noValidate
        >
          {/* Name and Designation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
              <div className="space-y-2">
                <Input 
                  id="firstName" 
                  {...register('firstName')} 
                  placeholder="John" 
                  disabled={isSubmitting}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-500">{errors.firstName.message}</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
              <Input 
                id="lastName" 
                {...register('lastName')} 
                placeholder="Doe" 
                disabled={isSubmitting}
              />
              {errors.lastName && (
                <p className="text-sm text-red-500">{errors.lastName.message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="designation">Designation <span className="text-red-500">*</span></Label>
              <div className="space-y-2">
                <Input 
                  id="designation" 
                  {...register('designation')} 
                  placeholder="e.g. Software Engineer" 
                  disabled={isSubmitting}
                />
                {errors.designation && (
                  <p className="text-sm text-red-500">{errors.designation.message}</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth <span className="text-red-500">*</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={cn("w-full justify-start text-left", {
                      "opacity-70": isSubmitting
                    })}
                    disabled={isSubmitting}
                  >
                    {watch('dateOfBirth')
                      ? format(new Date(watch('dateOfBirth')), 'MMMM dd, yyyy')
                      : 'Select date of birth'}
                    <CalendarIcon className="w-5 h-5 ml-2" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <div className="p-2">
                    {/* View toggle buttons */}
                    <div className="flex justify-center mb-2 space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCalendarView('years')}
                        className={calendarView === 'years' ? 'bg-primary text-primary-foreground' : ''}
                      >
                        Year
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCalendarView('months')}
                        className={calendarView === 'months' ? 'bg-primary text-primary-foreground' : ''}
                      >
                        Month
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCalendarView('days')}
                        className={calendarView === 'days' ? 'bg-primary text-primary-foreground' : ''}
                      >
                        Day
                      </Button>
                    </div>

                    {/* Navigation header */}
                    <div className="flex items-center justify-between px-2 py-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (calendarView === 'years') {
                            setSelectedYear(prev => prev - 12);
                          } else if (calendarView === 'months') {
                            setSelectedYear(prev => prev - 1);
                          } else {
                            const date = new Date(selectedYear, selectedMonth - 1);
                            date.setMonth(date.getMonth() - 1);
                            setSelectedYear(date.getFullYear());
                            setSelectedMonth(date.getMonth());
                          }
                        }}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="font-semibold">
                        {calendarView === 'years' && `${selectedYear - 11} - ${selectedYear}`}
                        {calendarView === 'months' && selectedYear}
                        {calendarView === 'days' && `${months[selectedMonth]} ${selectedYear}`}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (calendarView === 'years') {
                            setSelectedYear(prev => prev + 12);
                          } else if (calendarView === 'months') {
                            setSelectedYear(prev => prev + 1);
                          } else {
                            const date = new Date(selectedYear, selectedMonth + 1);
                            setSelectedYear(date.getFullYear());
                            setSelectedMonth(date.getMonth());
                          }
                        }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Calendar body */}
                    <div className="p-2">
                      {calendarView === 'years' && (
                        <div className="grid grid-cols-4 gap-2">
                          {Array.from({ length: 12 }, (_, i) => selectedYear - 11 + i).map(year => (
                            <Button
                              key={year}
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedYear(year);
                                setCalendarView('months');
                              }}
                              className={cn(
                                'w-full',
                                year === selectedYear && 'bg-primary text-primary-foreground'
                              )}
                              disabled={year > new Date().getFullYear() - 18}
                            >
                              {year}
                            </Button>
                          ))}
                        </div>
                      )}

                      {calendarView === 'months' && (
                        <div className="grid grid-cols-3 gap-2">
                          {months.map((month, index) => (
                            <Button
                              key={month}
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedMonth(index);
                                setCalendarView('days');
                              }}
                              className={cn(
                                'w-full',
                                index === selectedMonth && 'bg-primary text-primary-foreground'
                              )}
                            >
                              {month.slice(0, 3)}
                            </Button>
                          ))}
                        </div>
                      )}

                      {calendarView === 'days' && (
                        <Calendar
                          mode="single"
                          selected={watch('dateOfBirth')}
                          month={new Date(selectedYear, selectedMonth)}
                          onSelect={(date) => {
                            if (date) {
                              setValue('dateOfBirth', date);
                              setSelectedYear(date.getFullYear());
                              setSelectedMonth(date.getMonth());
                            }
                          }}
                          disabled={(date) => 
                            date > new Date() || 
                            differenceInYears(new Date(), date) < 18
                          }
                          initialFocus
                        />
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              {errors.dateOfBirth && (
                <p className="mt-2 text-sm text-red-600">{errors.dateOfBirth.message}</p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phoneNumber">Phone Number <span className="text-red-500">*</span></Label>
              <div className="space-y-2">
                <Input 
                  id="phoneNumber" 
                  {...register('phoneNumber')} 
                  placeholder="e.g. 1234567890" 
                  disabled={isSubmitting}
                  onKeyPress={(e) => {
                    // Allow only numbers
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  maxLength={15}
                />
                {errors.phoneNumber && (
                  <p className="text-sm text-red-500">{errors.phoneNumber.message}</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="linkedinUrl">LinkedIn URL <span className="text-red-500">*</span></Label>
              <div className="space-y-2">
                <Input 
                  id="linkedinUrl" 
                  {...register('linkedinUrl')} 
                  placeholder="https://www.linkedin.com/in/yourprofile" 
                  disabled={isSubmitting}
                />
                {errors.linkedinUrl && (
                  <p className="text-sm text-red-500">{errors.linkedinUrl.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Work Experience and Current Organization */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="workExperience">Work Experience (in years) <span className="text-red-500">*</span></Label>
              <div className="space-y-2">
                <Input 
                  id="workExperience" 
                  {...register('workExperience')} 
                  placeholder="e.g. 5" 
                  disabled={isSubmitting}
                  onKeyPress={(e) => {
                    // Allow only numbers and check length
                    if (!/[0-9]/.test(e.key) || 
                        (e.target as HTMLInputElement).value.length >= 2) {
                      e.preventDefault();
                    }
                  }}
                  maxLength={2}
                />
                {errors.workExperience && (
                  <p className="text-sm text-red-500">{errors.workExperience.message}</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="currentOrganization">Current Organization <span className="text-red-500">*</span></Label>
              <div className="space-y-2">
                <Input 
                  id="currentOrganization" 
                  {...register('currentOrganization')} 
                  placeholder="e.g. ABC Corp" 
                  disabled={isSubmitting}
                />
                {errors.currentOrganization && (
                  <p className="text-sm text-red-500">{errors.currentOrganization.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Location and Expertise */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Location <span className="text-red-500">*</span></Label>
              <div className="space-y-2">
                <Input 
                  id="location" 
                  {...register('location')} 
                  placeholder="e.g. New York, USA" 
                  disabled={isSubmitting}
                />
                {errors.location && (
                  <p className="text-sm text-red-500">{errors.location.message}</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="expertise">Expertise <span className="text-red-500">*</span></Label>
              <div className="space-y-2">
                <Input 
                  id="expertise" 
                  {...register('expertise')} 
                  placeholder="e.g. React, Node.js" 
                  disabled={isSubmitting}
                />
                {errors.expertise && (
                  <p className="text-sm text-red-500">{errors.expertise.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Areas of Help and Audio Pricing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="areasOfHelp">Areas of Help <span className="text-red-500">*</span></Label>
              <div className="space-y-2">
                <Textarea 
                  id="areasOfHelp" 
                  {...register('areasOfHelp')} 
                  placeholder="e.g. Mentorship, Code Review" 
                  disabled={isSubmitting}
                  rows={2}
                />
                {errors.areasOfHelp && (
                  <p className="text-sm text-red-500">{errors.areasOfHelp.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Functionality and Custom Functionality */}
          <div>
            <Label htmlFor="functionality">Functionality <span className="text-red-500">*</span></Label>
            <Select
              value={selectedFunctionality.value}
              onValueChange={(value) => {
                const option = functionalityOptions.find(opt => opt.option_value === value);
                setSelectedFunctionality({
                  id: option ? option.id : null,
                  value: value
                });
                setValue('functionality', value, { shouldValidate: true });
                if (value !== 'others') {
                  setValue('customFunctionality', '', { shouldValidate: true });
                }
              }}
            >
              <SelectTrigger id="functionality" className="w-full">
                <SelectValue placeholder="Select functionality" />
              </SelectTrigger>
              <SelectContent>
                {functionalityOptions.map((option) => (
                  <SelectItem 
                    key={option.id} 
                    value={option.option_value}
                  >
                    {option.display_name}
                  </SelectItem>
                ))}
                <SelectItem value="others">Others</SelectItem>
              </SelectContent>
            </Select>
            {errors.functionality && (
              <p className="mt-2 text-sm text-red-600">{errors.functionality.message}</p>
            )}
          </div>

          {/* Custom Functionality Field - Add this after the functionality Select */}
          {selectedFunctionality.value === 'others' && (
            <div className="mt-4">
              <Label htmlFor="customFunctionality">Custom Functionality <span className="text-red-500">*</span></Label>
              <Input
                id="customFunctionality"
                {...register('customFunctionality')}
                placeholder="Enter your custom functionality"
                disabled={isSubmitting}
              />
              {errors.customFunctionality && (
                <p className="mt-2 text-sm text-red-600">{errors.customFunctionality.message}</p>
              )}
            </div>
          )}

          {/* Education, Experience, Awards sections */}
          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Education <span className="text-red-500">*</span></Label>
                <Button 
                  variant="outline" 
                  onClick={(e) => {
                    e.preventDefault();
                    setShowEducationModal(true);
                  }} 
                  disabled={isSubmitting}
                  type="button"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add Education
                </Button>
              </div>
              <div className="mt-4">
                {educationEntries.length === 0 ? (
                  <p className="text-sm text-red-500">
                    Education entries are required. Please add your education.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {educationEntries.map((entry) => (
                      <Card 
                        key={`edu-${entry.id}`} // Add unique key with prefix
                        className="p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <CardContent>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <h3 className="text-md font-semibold">{entry.degree} in {entry.field_of_study}</h3>
                              <p className="text-sm text-muted-foreground">
                                {entry.school} - {formatDateSafely(entry.start_date, 'yyyy')} to {
                                  entry.is_current ? 'Present' : formatDateSafely(entry.end_date, 'yyyy')
                                }
                              </p>
                            </div>
                            <div className="mt-2 sm:mt-0 sm:ml-4">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                  setEducationEntries(educationEntries.filter(e => e.id !== entry.id));
                                  toast.success('Education entry removed');
                                }}
                                disabled={isSubmitting}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Experience <span className="text-red-500">*</span></Label>
                <Button 
                  variant="outline" 
                  onClick={(e) => {
                    e.preventDefault();
                    setShowExperienceModal(true);
                  }} 
                  disabled={isSubmitting}
                  type="button"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add Experience
                </Button>
              </div>
              <div className="mt-4">
                {experienceEntries.length === 0 ? (
                  <p className="text-sm text-red-500">
                    Experience entries are required. Please add your experience.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {experienceEntries.map((entry) => (
                      <Card 
                        key={`exp-${entry.id}`} // Add unique key with prefix
                        className="p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <CardContent>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <h3 className="text-md font-semibold">{entry.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {entry.company} - {formatDateSafely(entry.start_date, 'yyyy')} to {
                                  entry.is_current ? 'Present' : formatDateSafely(entry.end_date, 'yyyy')
                                }
                              </p>
                            </div>
                            <div className="mt-2 sm:mt-0 sm:ml-4">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                  setExperienceEntries(experienceEntries.filter(e => e.id !== entry.id));
                                  toast.success('Experience entry removed');
                                }}
                                disabled={isSubmitting}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Awards</Label>
                <Button 
                  variant="outline" 
                  onClick={(e) => {
                    e.preventDefault();
                    setShowAwardsModal(true);
                  }} 
                  disabled={isSubmitting}
                  type="button"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add Award
                </Button>
              </div>
              <div className="mt-4">
                {awardsEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No awards added yet. You can add your awards or honors here.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {awardsEntries.map((entry) => (
                      <Card 
                        key={`award-${entry.id}`} // Add unique key with prefix
                        className="p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <CardContent>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <h3 className="text-md font-semibold">{entry.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {entry.issuer} - {formatDateSafely(entry.issue_date, 'yyyy')}
                              </p>
                            </div>
                            <div className="mt-2 sm:mt-0 sm:ml-4">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                  setAwardsEntries(awardsEntries.filter(e => e.id !== entry.id));
                                  toast.success('Award entry removed');
                                }}
                                disabled={isSubmitting}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="mt-8">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={() => setShowTermsModal(true)}
                className="mt-1"
                disabled={isSubmitting}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Accept Terms & Conditions <span className="text-red-500">*</span>
                </label>
                {!acceptedTerms && (
                  <p className="text-sm text-red-500">
                    Please accept the terms and conditions to continue
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-6">
            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting || !acceptedTerms}
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 mr-3 animate-spin" />
              ) : (
                'Save and Continue'
              )}
            </Button>
          </div>
        </form>

        {/* Modals */}
        <EducationModal 
          isOpen={showEducationModal} 
          onClose={() => setShowEducationModal(false)} 
          onSave={async (newEntry) => {
            const entryWithId: Education = {
              ...newEntry,
              id: generateEntryId(),
              end_date: newEntry.end_date || null
            };
            setEducationEntries(prev => [...prev, entryWithId]);
            setShowEducationModal(false);
            toast.success('Education entry added');
            return Promise.resolve();
          }}
          isSubmitting={isSubmitting}
        />
        <ExperienceModal 
          isOpen={showExperienceModal} 
          onClose={() => setShowExperienceModal(false)} 
          onSave={async (newEntry) => {
            const entryWithId: Experience = {
              ...newEntry,
              id: generateEntryId(),
              end_date: newEntry.end_date || null
            };
            setExperienceEntries(prev => [...prev, entryWithId]);
            setShowExperienceModal(false);
            toast.success('Experience entry added');
            return Promise.resolve();
          }}
          isSubmitting={isSubmitting}
        />
        <AwardsModal 
          isOpen={showAwardsModal} 
          onClose={() => setShowAwardsModal(false)} 
          onSave={async (newEntry) => {
            const entryWithId = {
              ...newEntry,
              id: generateEntryId()
            };
            setAwardsEntries(prev => [...prev, entryWithId]);
            setShowAwardsModal(false);
            toast.success('Award entry added');
            return Promise.resolve();
          }}
          isSubmitting={isSubmitting}
        />

        {/* Terms Modal */}
        <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
          <DialogContent className="max-w-2xl p-0 overflow-hidden">
            <TermsAndConditions 
              onAccept={() => {
                setAcceptedTerms(true);
                setShowTermsModal(false);
              }}
              onDecline={() => {
                setAcceptedTerms(false);
                setShowTermsModal(false);
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Debug Panel - Add after upload section */}
        {debugMode && extractedText && (
          <Card className="mb-8">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4">Debug Information</h3>
              <div className="space-y-4 text-sm">
                <details>
                  <summary className="cursor-pointer font-medium mb-2">Raw Extracted Text ({extractedText.length} chars)</summary>
                  <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-60 whitespace-pre-wrap">
                    {extractedText.substring(0, 3000)}...
                  </pre>
                </details>
                
                <details>
                  <summary className="cursor-pointer font-medium mb-2">Current Education Entries ({educationEntries.length})</summary>
                  <pre className="mt-2 p-3 bg-blue-50 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(educationEntries, null, 2)}
                  </pre>
                </details>
                
                <details>
                  <summary className="cursor-pointer font-medium mb-2">Current Experience Entries ({experienceEntries.length})</summary>
                  <pre className="mt-2 p-3 bg-green-50 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(experienceEntries, null, 2)}
                  </pre>
                </details>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ExpertProfileForm;
