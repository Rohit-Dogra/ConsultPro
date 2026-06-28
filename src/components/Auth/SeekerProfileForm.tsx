import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Navbar from '../layout/Navbar';
import Footer from '../layout/Footer';
import './auth.css';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import TermsAndConditions from './SeekerTermCon';
import { useFlowCheckpoint } from '@/hooks/useFlowCheckpoint';

function decodeJWT(token: string) {
  try {
    // Split the token and get the payload part (second part)
    const base64Url = token.split('.')[1];
    // Replace characters that are not valid in URLs but are valid in base64
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    // Decode base64 and parse JSON
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

// Update interfaces to match backend schema
interface UserData {
    id: string;
    name: string;
    email: string;
    mobile_number: string;
    token: string;
    role: 'solution_seeker';
}

interface ProfileRequestData {
    user_id: string;
    name: string;
    email: string;
    company: string;
    position: string;
    experience: string;
    location: string;
    bio: string;
    linkedin_url: string | null;
    website_url: string | null;
    turnover: string | null;
    industry_id: string;
    product_category_id: string;
    seed_segment_code: string | null;
    company_size: string | null;
    date_of_birth: string | null;
}

interface ProfileFormData {
    company: string;
    position: string;
    experience: string;
    location: string;
    bio: string;
    linkedin: string;
    website: string;
    turnover: string;
    industry: string;
    productCategory: string;
    seedSegment: string;
    companySize: string;
    dateOfBirth: string;
}

interface Industry {
    id: string;
    name: string;
}

interface ProductCategory {
    id: string;
    name: string;
    industry_id: string;
}

interface SeedSegment {
    id: string;
    name: string;
    code: string;
}

// Update the LinkedIn URL validation
const validateLinkedInUrl = (url: string): boolean => {
    if (!url) return true; // Optional field
    try {
        // Less restrictive pattern that still ensures valid LinkedIn URLs
        const linkedInRegex = /^https:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/i;
        return linkedInRegex.test(url.trim());
    } catch (error) {
        return false;
    }
};

// Update the experience validation function
const validateExperience = (experience: string): boolean => {
    const numExp = parseInt(experience, 10);
    return !isNaN(numExp) && numExp >= 0 && numExp <= 99;
};

// New function to validate website URL
const validateWebsiteUrl = (url: string): boolean => {
    if (!url) return true; // Optional field
    try {
        const websiteRegex = /^https?:\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?$/;
        return websiteRegex.test(url.trim());
    } catch (error) {
        return false;
    }
};

// Add a type for turnover units
type TurnoverUnit = 'Thousands' | 'Millions';

// Add interface for turnover limits
interface TurnoverLimits {
  Thousands: number;
  Millions: number;
}

// Update turnover limits for USD
const TURNOVER_LIMITS: TurnoverLimits = {
  Thousands: 999999, // $999,999 thousand
  Millions: 10000    // $10,000 million ($10 billion)
};

// Update the turnover validation function
const validateTurnover = (amount: string, unit: TurnoverUnit): boolean => {
  if (!amount) return true; // Allow empty values
  
  const value = parseFloat(amount);
  if (isNaN(value) || value < 0) return false;
  
  return value <= TURNOVER_LIMITS[unit];
};

// Add function to format turnover amount
const formatTurnoverAmount = (amount: string): string => {
  if (!amount) return '';
  
  const value = parseFloat(amount);
  if (isNaN(value)) return '';
  
  // Format with 2 decimal places max
  return value.toFixed(2).replace(/\.?0+$/, '');
};

// First, update the validateProfileData function to be more strict
const validateProfileData = (data: ProfileFormData, userData: UserData | null): string[] => {
    const errors: string[] = [];
    
    // Required field validation
    if (!userData?.id) errors.push('User ID is required');
    if (!userData?.name?.trim()) errors.push('User name is required');
    if (!userData?.email?.trim()) errors.push('User email is required');
    
    // Required fields with trim() check
    if (!data.experience?.trim()) errors.push('Experience is required');
    if (!data.location?.trim()) errors.push('Location is required');
    if (!data.bio?.trim()) errors.push('Professional Bio is required');
    if (!data.industry?.trim()) errors.push('Industry is required');
    if (!data.productCategory?.trim()) errors.push('Product Category is required');

    // String type validation for optional fields
    if (data.company && typeof data.company !== 'string') {
        errors.push('Invalid company format');
    }
    if (data.position && typeof data.position !== 'string') {
        errors.push('Invalid position format');
    }

    // Experience validation
    if (!validateExperience(data.experience?.trim() || '')) {
        errors.push('Experience must be a valid number between 0 and 99 years');
    }

    // URL validations (optional fields)
    if (data.linkedin?.trim() && !validateLinkedInUrl(data.linkedin.trim())) {
        errors.push('LinkedIn URL must be a valid profile URL (e.g., https://linkedin.com/in/username)');
    }
    
    if (data.website?.trim() && !validateWebsiteUrl(data.website.trim())) {
        errors.push('Please enter a valid website URL');
    }

    // Turnover validation (if provided)
    if (data.turnover?.trim()) {
        const [amount, unit] = data.turnover.split(' ');
        if (!validateTurnover(amount, unit as TurnoverUnit)) {
            errors.push(`Invalid turnover amount. Must be between 0 and ${TURNOVER_LIMITS[unit as TurnoverUnit].toLocaleString()} ${unit}`);
        }
    }

    return errors;
};

const SeekerProfileForm: React.FC = () => {
    const navigate = useNavigate();
    const { saveCheckpoint, clearCheckpoint } = useFlowCheckpoint();
    const [isLoading, setIsLoading] = useState(false);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [profileData, setProfileData] = useState<ProfileFormData>({
        company: '',
        position: '',
        experience: '',
        location: '',
        bio: '',
        linkedin: '',
        website: '',
        turnover: '',
        industry: '',
        productCategory: '',
        seedSegment: '',
        companySize: '',
        dateOfBirth: ''
    });
    


    // Add these states
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [industries, setIndustries] = useState<Industry[]>([]);
    const [allProductCategories, setAllProductCategories] = useState<ProductCategory[]>([]);
    const [filteredProductCategories, setFilteredProductCategories] = useState<ProductCategory[]>([]);
    const [seedSegments, setSeedSegments] = useState<SeedSegment[]>([]);
    const [isLoadingOptions, setIsLoadingOptions] = useState(false);
    const [existingProfile, setExistingProfile] = useState<any>(null); // Track existing profile

    // Update the existing useEffect or add a new one
    useEffect(() => {
        const initializeForm = async () => {
            // Get user data from localStorage
            const storedUser = localStorage.getItem('user');
            if (!storedUser) {
                toast.error('Please login first');
                navigate('/auth/seeker');
                return;
            }
            
            try {
                const userData = JSON.parse(storedUser);
                if (!userData.token) {
                    throw new Error('Invalid user data');
                }
                setUserData(userData);
                
                // Fetch dropdown options first
                await fetchDropdownOptions();
                
                // Check for existing profile data
                await fetchExistingProfileData(userData);
                
            } catch (error) {
                console.error('Error initializing form:', error);
                toast.error('Error loading form data');
                navigate('/auth/seeker');
            }
        };

        initializeForm();
    }, [navigate]); // Add any other dependencies if needed

    // Update your fetchDropdownOptions function
    const fetchDropdownOptions = async () => {
        setIsLoadingOptions(true);
        try {
            const API_BASE_URL = import.meta.env.VITE_API_URL;
            console.log('API_BASE_URL:', API_BASE_URL);
            
            // Fetch industries
            console.log('Fetching industries from:', `${API_BASE_URL}/api/industries`);
            const industriesResponse = await fetch(`${API_BASE_URL}/api/industries`);
            console.log('Industries response status:', industriesResponse.status);
            
            if (!industriesResponse.ok) {
                const errorText = await industriesResponse.text();
                console.error('Industries fetch error:', errorText);
                throw new Error(`Failed to fetch industries: ${industriesResponse.status}`);
            }
            
            const industriesData = await industriesResponse.json();
            console.log('Fetched industries:', industriesData);
            setIndustries(industriesData);

            // Fetch seed segments
            console.log('Fetching seed segments from:', `${API_BASE_URL}/api/seed-segments`);
            const seedSegmentsResponse = await fetch(`${API_BASE_URL}/api/seed-segments`);
            console.log('Seed segments response status:', seedSegmentsResponse.status);
            
            if (!seedSegmentsResponse.ok) {
                const errorText = await seedSegmentsResponse.text();
                console.error('Seed segments fetch error:', errorText);
                throw new Error(`Failed to fetch seed segments: ${seedSegmentsResponse.status}`);
            }
            
            const seedSegmentsData = await seedSegmentsResponse.json();
            console.log('Fetched seed segments:', seedSegmentsData);
            setSeedSegments(seedSegmentsData);

            // Don't fetch product categories here anymore
            // We'll fetch them when an industry is selected
        } catch (error) {
            console.error('Error fetching dropdown options:', error);
            toast.error('Failed to load form options: ' + error.message);
        } finally {
            setIsLoadingOptions(false);
        }
    };

    const fetchProductCategories = async (industryId: string) => {
        setIsLoadingOptions(true);
        try {
            const API_BASE_URL = import.meta.env.VITE_API_URL;
            console.log('Fetching product categories for industry:', industryId);
            console.log('URL:', `${API_BASE_URL}/api/product-categories/${industryId}`);
            
            const response = await fetch(`${API_BASE_URL}/api/product-categories/${industryId}`);
            console.log('Product categories response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Product categories fetch error:', errorText);
                throw new Error(`Failed to fetch product categories: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Fetched product categories:', data);
            setFilteredProductCategories(data);
        } catch (error) {
            console.error('Error fetching product categories:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to load product categories');
            setFilteredProductCategories([]);
        } finally {
            setIsLoadingOptions(false);
        }
    };

    const fetchExistingProfileData = async (userData: UserData) => {
        try {
            const API_BASE_URL = import.meta.env.VITE_API_URL;
            const response = await fetch(`${API_BASE_URL}/api/profiles/seeker/${userData.id}`, {
                headers: {
                    'Authorization': `Bearer ${userData.token}`
                }
            });
            
            if (response.status === 404) {
                // Profile doesn't exist yet - this is expected for new users
                return; // Exit early, continue with empty form
            }
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    const profile = data.data;
                    setExistingProfile(profile); // Store existing profile
                    
                    // Populate form with existing data
                    setProfileData({
                        company: profile.company || '',
                        position: profile.position || '',
                        experience: profile.experience || '',
                        location: profile.location || '',
                        bio: profile.bio || '',
                        linkedin: profile.linkedin_url || '',
                        website: profile.website_url || '',
                        turnover: profile.turnover || '',
                        industry: profile.industry_id || '',
                        productCategory: profile.product_category_id || '',
                        seedSegment: profile.seed_segment_code || '',
                        companySize: profile.company_size || '',
                        dateOfBirth: profile.date_of_birth || ''
                    });
                    
                    // If industry exists, fetch product categories
                    if (profile.industry_id) {
                        await fetchProductCategories(profile.industry_id);
                    }
                }
            }
        } catch (error) {
            // Silently handle errors - continue with empty form
        }
    };

    const validateProfileField = (name: string, value: string): string | null => {
        switch (name) {
            case 'experience':
                if (!validateExperience(value)) {
                    return 'Experience must be a valid number between 0 and 99 years';
                }
                break;
            case 'linkedin':
                if (value && !validateLinkedInUrl(value)) {
                    return 'Please enter a valid LinkedIn URL';
                }
                break;
            case 'website':
                if (value && !validateWebsiteUrl(value)) {
                    return 'Please enter a valid website URL';
                }
                break;
            case 'turnover':
                if (value && !validateTurnover(value.split(' ')[0], value.split(' ')[1] as TurnoverUnit)) {
                    return 'Please enter turnover in a valid format';
                }
                break;
        }
        return null;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        // Validate field
        const error = validateProfileField(name, value);
        if (error) {
            toast.error(error);
            return;
        }

        if (name === 'industry') {
            setProfileData(prev => ({
                ...prev,
                [name]: value,
                productCategory: ''
            }));
            
            if (value) {
                fetchProductCategories(value);
            } else {
                setFilteredProductCategories([]);
            }
        } else {
            setProfileData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // Add this new function for handling experience input
    const handleExperienceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Only allow numbers and limit to 2 digits
        if (value === '' || (/^\d{0,2}$/.test(value) && parseInt(value, 10) <= 99)) {
            setProfileData(prev => ({
                ...prev,
                experience: value
            }));
        }
    };

    // Update the handleSubmit function
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading) return;

        if (!acceptedTerms) {
            toast.error('Please accept the terms and conditions to continue');
            return;
        }

        try {
            setIsLoading(true);

            // Basic validation
            if (!userData?.token || !userData?.id) {
                throw new Error('Authentication required');
            }
            
            // Validate form data
            const validationErrors = validateProfileData(profileData, userData);
            if (validationErrors.length > 0) {
                validationErrors.forEach(error => toast.error(error));
                return;
            }

            // Format turnover value
            let formattedTurnover = null;
            if (profileData.turnover?.trim()) {
                const [amount, unit] = profileData.turnover.split(' ');
                formattedTurnover = `${formatTurnoverAmount(amount)} ${unit}`.trim();
            }

            // Prepare request data with strict formatting
            const requestData: ProfileRequestData = {
                user_id: userData.id,
                name: userData.name.trim(),
                email: userData.email.trim(),
                company: profileData.company?.trim() || '',
                position: profileData.position?.trim() || '',
                experience: profileData.experience.trim(),
                location: profileData.location.trim(),
                bio: profileData.bio.trim(),
                linkedin_url: profileData.linkedin?.trim() || null,
                website_url: profileData.website?.trim() || null,
                turnover: formattedTurnover,
                industry_id: profileData.industry || '',
                product_category_id: profileData.productCategory || '',
                seed_segment_code: profileData.seedSegment || null,
                company_size: profileData.companySize?.trim() || null,
                date_of_birth: profileData.dateOfBirth || null
            };

            // Log the request data for debugging
            console.log('Submitting profile data:', {
                ...requestData,
                token: 'HIDDEN' // Hide token in logs
            });

            const API_BASE_URL = import.meta.env.VITE_API_URL;
            if (!API_BASE_URL) {
                throw new Error('API URL not configured');
            }

            // Determine if we're updating existing profile or creating new one
            const isUpdate = existingProfile !== null;
            const endpoint = isUpdate ? `${API_BASE_URL}/api/profiles/seeker/${userData.id}` : `${API_BASE_URL}/api/profiles/seeker`;
            const method = isUpdate ? 'PUT' : 'POST';
            
            const response = await fetch(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userData.token}`
                },
                body: JSON.stringify(requestData)
            });

            // Add detailed error handling
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Server error response:', errorData);
                
                // Check for specific error types
                if (response.status === 404 && errorData.message?.includes('User not found')) {
                    throw new Error('Your user account was not found. Please log out and log in again.');
                }
                
                if (response.status === 409) {
                    throw new Error('A profile already exists for your account.');
                }
                
                throw new Error(errorData.message || `Server error: ${response.status}`);
            }
    
            const responseData = await response.json();

            // Check if there's a selected expert_id and create consultation request
            const selectedExpertId = sessionStorage.getItem('selected_expert_id');
            if (selectedExpertId) {
                try {
                    console.log('Creating consultation request with expert_id:', selectedExpertId);
                    const consultationResponse = await fetch(`${API_BASE_URL}/api/consultation-requests`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            user_id: userData.id,
                            expert_id: selectedExpertId,
                            email: userData.email,
                            name: userData.name,
                            problems: `Industry: ${profileData.industry}, Product Category: ${profileData.productCategory}`,
                            outcomes: `Profile completed for ${profileData.company || 'business'}`,
                            functionality: profileData.position || 'consultation',
                            phone: userData.mobile_number || '000-000-0000'
                        })
                    });
                    
                    if (consultationResponse.ok) {
                        console.log('✅ Consultation request created successfully');
                        sessionStorage.removeItem('selected_expert_id'); // Clean up
                    } else {
                        console.error('Failed to create consultation request:', await consultationResponse.text());
                    }
                } catch (error) {
                    console.error('Error creating consultation request:', error);
                }
            }

            // Mark profile as completed
            const progressKey = `user_progress_${userData.id}`;
            const currentProgress = JSON.parse(localStorage.getItem(progressKey) || '{}');
            localStorage.setItem(progressKey, JSON.stringify({
                ...currentProgress,
                profileCompleted: true
            }));
            
            // Update local storage and navigate
            const updatedUserData = {
                ...userData,
                profile_completed: true
            };
            
            localStorage.setItem('user', JSON.stringify(updatedUserData));
            toast.success('Profile completed successfully!');
            
            // Save checkpoint for seeker dashboard and clear flow checkpoint
            saveCheckpoint('seeker_dashboard', {
                userInfo: updatedUserData,
                profileComplete: true
            });
            clearCheckpoint(); // Clear the flow checkpoint as user has completed the entire flow
            
            navigate('/seekerdashboard');

        } catch (error) {
            console.error('Profile save error:', error);
            if (error instanceof Error) {
                if (error.message.includes('401')) {
                    toast.error('Session expired. Please login again.');
                    navigate('/auth/seeker');
                    return;
                }
                toast.error(error.message);
            } else {
                toast.error('Failed to save profile');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            <div className="pt-20 min-h-screen flex items-center justify-center bg-gray-100">
                <div className="w-full max-w-2xl p-8 bg-white rounded-lg shadow-md">
                    <h1 className="text-2xl font-bold text-center mb-6">Complete Your Profile</h1>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company/Organization</label>
                                <input
                                    type="text"
                                    name="company"
                                    className="auth-input"
                                    value={profileData.company}
                                    onChange={handleInputChange}
                                    placeholder="Enter your company or organization name"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                                <input
                                    type="text"
                                    name="position"
                                    className="auth-input"
                                    value={profileData.position}
                                    onChange={handleInputChange}
                                    placeholder="Enter your current position"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Years of Experience <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="experience"
                                    className="auth-input"
                                    value={profileData.experience}
                                    onChange={handleExperienceChange}
                                    required
                                    pattern="\d{1,2}"
                                    maxLength={2}
                                    title="Please enter a number between 0 and 99"
                                    placeholder="Enter years (0-99)"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Location <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="location"
                                    className="auth-input"
                                    value={profileData.location}
                                    onChange={handleInputChange}
                                    required
                                    title="Your current location"
                                    placeholder="Enter your city and country"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn Profile URL</label>
                                <input
                                    type="url"
                                    name="linkedin"
                                    className="auth-input"
                                    value={profileData.linkedin}
                                    onChange={handleInputChange}
                                    placeholder="https://linkedin.com/in/username"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                                <input
                                    type="url"
                                    name="website"
                                    className="auth-input"
                                    value={profileData.website}
                                    onChange={handleInputChange}
                                    placeholder="https://yourwebsite.com"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Annual Revenue (USD)
                            </label>
                            <div className="flex space-x-2">
                                <div className="relative flex-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                    <input
                                        type="number"
                                        name="turnoverAmount"
                                        className="auth-input pl-8"
                                        title="Annual revenue amount in selected unit"
                                        aria-label="Annual revenue amount"
                                        value={profileData.turnover.split(' ')[0] || ''}
                                        onChange={(e) => {
                                            const amount = e.target.value;
                                            const unit = (profileData.turnover.split(' ')[1] || 'Thousands') as TurnoverUnit;
                                            
                                            // Format and validate the amount
                                            const formattedAmount = formatTurnoverAmount(amount);
                                            if (validateTurnover(formattedAmount, unit)) {
                                                setProfileData(prev => ({
                                                  ...prev,
                                                  turnover: `${formattedAmount} ${unit}`.trim()
                                                }));
                                            } else {
                                                toast.error(`Amount must be between 0 and ${TURNOVER_LIMITS[unit].toLocaleString()} ${unit}`);
                                            }
                                        }}
                                        min="0"
                                        step="0.01"
                                        placeholder="Enter amount"
                                    />
                                </div>
                                <select
                                    className="auth-input w-32"
                                    title="Select unit for annual revenue"
                                    aria-label="Revenue unit"
                                    value={profileData.turnover.split(' ')[1] || 'Thousands'}
                                    onChange={(e) => {
                                        const amount = profileData.turnover.split(' ')[0] || '';
                                        const newUnit = e.target.value as TurnoverUnit;
                                        
                                        if (validateTurnover(amount, newUnit)) {
                                          setProfileData(prev => ({
                                            ...prev,
                                            turnover: `${amount} ${newUnit}`.trim()
                                          }));
                                        } else {
                                          toast.error(`Amount must be between 0 and ${TURNOVER_LIMITS[newUnit].toLocaleString()} ${newUnit}`);
                                        }
                                    }}
                                >
                                    <option value="Thousands">Thousands</option>
                                    <option value="Millions">Millions</option>
                                </select>
                            </div>
                            <p className="mt-1 text-xs text-gray-500 flex items-center gap-2">
                                <span>Maximum limits:</span>
                                <span>${TURNOVER_LIMITS.Thousands.toLocaleString()} Thousands</span>
                                <span>or</span>
                                <span>${TURNOVER_LIMITS.Millions.toLocaleString()} Millions</span>
                                <span>($10B)</span>
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                                Enter your company's approximate annual revenue in USD
                            </p>
                        </div>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Industry Sector <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="industry"
                                    className="auth-input"
                                    value={profileData.industry}
                                    onChange={handleInputChange}
                                    required
                                    title="Select Industry"
                                    aria-label="Select Industry"
                                >
                                    <option value="">Select Industry</option>
                                    {industries.map(industry => (
                                        <option key={industry.id} value={industry.id}>
                                            {industry.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                   Primary Product/Service category <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="productCategory"
                                    className="auth-input"
                                    value={profileData.productCategory}
                                    onChange={handleInputChange}
                                    required
                                    disabled={!profileData.industry || isLoadingOptions}
                                    title="Select Product Category"
                                    aria-label="Product Category"
                                >
                                    <option value="">
                                        {isLoadingOptions 
                                            ? 'Loading categories...' 
                                            : !profileData.industry 
                                                ? 'Please select an industry first'
                                                : filteredProductCategories.length === 0
                                                    ? 'No categories available'
                                                    : 'Select Product Category'
                                        }
                                    </option>
                                    {filteredProductCategories.map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                                {!profileData.industry && (
                                    <p className="mt-1 text-xs text-gray-500">
                                        Select an industry to view available product categories
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                 Segment
                                </label>
                                <select
                                    name="seedSegment"
                                    className="auth-input"
                                    value={profileData.seedSegment}
                                    onChange={handleInputChange}
                                    title="Select Seed Service Segment"
                                    aria-label="Seed Service Segment"
                                >
                                    <option value="">
                                        {isLoadingOptions 
                                            ? 'Loading segments...' 
                                            : seedSegments.length === 0
                                                ? 'No segments available'
                                                : 'Select Seed Service Segment'
                                        }
                                    </option>
                                    {seedSegments.map(segment => (
                                        <option key={segment.id} value={segment.code}>
                                            {segment.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Company Size
                                </label>
                                <input
                                    type="text"
                                    name="companySize"
                                    className="auth-input"
                                    value={profileData.companySize}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 10-50 employees"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date of Birth
                                </label>
                                <input
                                    type="date"
                                    name="dateOfBirth"
                                    className="auth-input"
                                    value={profileData.dateOfBirth}
                                    onChange={handleInputChange}
                                    max={new Date().toISOString().split('T')[0]}
                                    title="Date of birth"
                                    placeholder="YYYY-MM-DD"
                                    aria-label="Date of birth"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tell me about your Business <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="bio"
                                rows={4}
                                className="auth-input min-h-[120px]"
                                value={profileData.bio}
                                onChange={handleInputChange}
                                placeholder="Tell us about yourself and what you're looking for"
                                required
                            />
                        </div>
                        
                        <div className="space-y-4">
                            {/* Terms & Conditions Checkbox */}
                            <div className="flex items-start space-x-3">
                                <Checkbox
                                    id="terms"
                                    checked={acceptedTerms}
                                    onCheckedChange={() => setShowTermsModal(true)}
                                    className="mt-1"
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
                        </div>
                        
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-500">
                                <span className="text-red-500">*</span> Required fields
                            </p>
                            <button 
                                type="submit"
                                className="auth-button"
                                disabled={isLoading || !acceptedTerms}
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            >
                                {isLoading ? 'Saving...' : !acceptedTerms ? 'Accept Terms to Continue' : 'Complete Profile'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default SeekerProfileForm;

