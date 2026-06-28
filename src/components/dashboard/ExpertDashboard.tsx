import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../layout/Navbar';
import Footer from '../layout/Footer';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Save, X, Pencil, BookOpen, TrendingUp, Star, Users, Calendar, Activity, Clock, Wallet, Loader2, RefreshCcw, Plus, Trash2, Upload, Camera } from 'lucide-react';
import AvailabilitySection from './AvailabilitySection';
import { API_BASE_URL } from '@/config/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import ReactStars from 'react-rating-stars-component';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from '@/lib/utils';
import CurrencyTimezoneDialog from '@/components/modals/CurrencyTimezoneDialog';
import PreferencesModal from '@/components/modals/PreferencesModal';
import { useCurrencyTimezone } from '@/components/contexts/CurrencyTimezoneContext';

// Extend the Window interface to include preferencesDismissFunc
declare global {
  interface Window {
    preferencesDismissFunc?: (() => void) | null;
  }
}

// All interfaces remain the same...
interface StoredUserData {
  id: string;
  token: string;
  email: string;
  role: 'expert';
  profile_completed?: boolean;
}

interface ExpertProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  designation: string;
  expertise: string;
  areas_of_help: string;
  email: string;
  phone_number: string;
  current_organization: string;
  location: string;
  work_experience: number;
  audio_pricing: number;
  profile_completed?: boolean;
  status?: 'Pending' | 'Approved' | 'Rejected';
  rejection_reason?: string;
  profile_image?: string;
}

interface ProfileUpdatePayload {
  section: string;
  data: Partial<ExpertProfile>;
}

interface EditingState {
  personal: boolean;
  contact: boolean;
  pricing: boolean;
  education: boolean;
  experience: boolean;
  awards: boolean;
}

interface AvailabilityData {
  day_of_week: string;
  start_time: string;
  end_time: string;
}

interface BookingStats {
  totalSessions: number;
  pendingBookings: number;
}

interface Booking {
  id: string;
  expert_id: string;
  seeker_id: string;
  expert_name: string;
  seeker_name: string;
  date: string;
  start_time: string;
  end_time: string;
  session_type: 'audio';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
  amount: number;
  created_at: string;
}

interface Feedback {
  id?: string;
  booking_id: string;
  rating: number;
  review: string;
  message: string;
  created_at: string;
}

interface Earning {
  id: string;
  created_at: string;
  session_type: string;
  amount: number;
}

interface Education {
  id: number;
  school: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date?: string;
  grade?: string;
  activities?: string;
  description?: string;
}

interface Experience {
  id: number;
  title: string;
  employment_type?: string;
  company: string;
  location?: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  industry?: string;
  description?: string;
}

interface Award {
  id: number;
  title: string;
  issuer?: string;
  issue_date?: string;
  description?: string;
}

interface UpcomingMeeting {
  id: string;
  seeker_name: string;
  display_date: string;
  start_time: string;
  end_time: string;
  session_type: string;
  status: 'confirmed';
    date: string;
}

// Utility to recursively clean payloads (replace undefined with null)
function deepClean(obj) {
  if (Array.isArray(obj)) {
    return obj.map(deepClean);
  } else if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, v === undefined ? null : deepClean(v)])
    );
  }
  return obj;
}

// Education Edit Form Component
const EducationEditForm = ({ educationDetails, setEducationDetails, onSave, onCancel, expertId, token }) => {
  const [editedEducation, setEditedEducation] = useState([...educationDetails]);
  const [newEducation, setNewEducation] = useState({
    school: '',
    degree: '',
    field_of_study: '',
    start_date: '',
    end_date: '',
    grade: '',
    activities: '',
    description: ''
  });
  const [saving, setSaving] = useState(false);

  const addEducation = () => {
    if (newEducation.school && newEducation.degree && newEducation.start_date) {
      const educationToAdd = {
        ...newEducation,
        id: Date.now() // Temporary ID for new items
      };
      setEditedEducation([...editedEducation, educationToAdd]);
      setNewEducation({
        school: '',
        degree: '',
        field_of_study: '',
        start_date: '',
        end_date: '',
        grade: '',
        activities: '',
        description: ''
      });
    } else {
      toast.error('Please fill in required fields: School, Degree, and Start Date');
    }
  };

  const removeEducation = (index) => {
    const updated = editedEducation.filter((_, i) => i !== index);
    setEditedEducation(updated);
  };

  const updateEducation = (index, field, value) => {
    const updated = [...editedEducation];
    updated[index] = { ...updated[index], [field]: value };
    setEditedEducation(updated);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const response = await fetch(`${API_BASE_URL}/api/experts/education-details/${expertId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ education: editedEducation })
      });

      if (!response.ok) {
        throw new Error('Failed to update education details');
      }

      const result = await response.json();
      if (result.success) {
        setEducationDetails(editedEducation);
        onSave(editedEducation);
        toast.success('Education details updated successfully!');
      } else {
        throw new Error(result.message || 'Failed to update education');
      }
    } catch (error) {
      console.error('Error updating education:', error);
      toast.error('Failed to update education details');
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="space-y-6">
      {editedEducation.map((edu, index) => (
        <div key={edu.id || index} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-medium text-blue-800">Education {index + 1}</h4>
            <Button
              onClick={() => removeEducation(index)}
              variant="outline"
              size="sm"
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="School/University *" value={edu.school} onChange={(e) => updateEducation(index, 'school', e.target.value)} required />
            <Input placeholder="Degree *" value={edu.degree} onChange={(e) => updateEducation(index, 'degree', e.target.value)} required />
            <Input placeholder="Field of Study" value={edu.field_of_study} onChange={(e) => updateEducation(index, 'field_of_study', e.target.value)} />
            <Input placeholder="Grade/CGPA" value={edu.grade || ''} onChange={(e) => updateEducation(index, 'grade', e.target.value)} />
            <Input type="date" placeholder="Start Date *" value={edu.start_date} onChange={(e) => updateEducation(index, 'start_date', e.target.value)} required />
            <Input type="date" placeholder="End Date" value={edu.end_date || ''} onChange={(e) => updateEducation(index, 'end_date', e.target.value)} />
            <Input placeholder="Activities" value={edu.activities || ''} onChange={(e) => updateEducation(index, 'activities', e.target.value)} />
            <Textarea placeholder="Description" value={edu.description || ''} onChange={(e) => updateEducation(index, 'description', e.target.value)} rows={2} />
          </div>
        </div>
      ))}

      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <h4 className="font-medium text-green-800 mb-3">Add New Education</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input placeholder="School/University *" value={newEducation.school} onChange={(e) => setNewEducation({ ...newEducation, school: e.target.value })} />
          <Input placeholder="Degree *" value={newEducation.degree} onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })} />
          <Input placeholder="Field of Study" value={newEducation.field_of_study} onChange={(e) => setNewEducation({ ...newEducation, field_of_study: e.target.value })} />
          <Input placeholder="Grade/CGPA" value={newEducation.grade} onChange={(e) => setNewEducation({ ...newEducation, grade: e.target.value })} />
          <Input type="date" placeholder="Start Date *" value={newEducation.start_date} onChange={(e) => setNewEducation({ ...newEducation, start_date: e.target.value })} />
          <Input type="date" placeholder="End Date" value={newEducation.end_date} onChange={(e) => setNewEducation({ ...newEducation, end_date: e.target.value })} />
          <Input placeholder="Activities" value={newEducation.activities} onChange={(e) => setNewEducation({ ...newEducation, activities: e.target.value })} />
          <Textarea placeholder="Description" value={newEducation.description} onChange={(e) => setNewEducation({ ...newEducation, description: e.target.value })} rows={2} />
        </div>
        <Button onClick={addEducation} className="mt-3" size="sm">
          <Plus className="h-4 w-4 mr-2" /> Add Education
        </Button>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} className="flex-1" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save All Changes
        </Button>
        <Button onClick={onCancel} variant="outline" className="flex-1">
          <X className="h-4 w-4 mr-2" /> Cancel
        </Button>
      </div>
    </div>
  );
};

// Other modal components remain the same...
const EarningsDetailModal = ({ isOpen, onClose, history, loading }) => {
  const { formatCurrency } = useCurrencyTimezone();
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Earnings History</DialogTitle>
          <DialogDescription>
            Here is a detailed breakdown of your earnings from completed sessions.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
             <div className="flex justify-center items-center py-10">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
             </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Session Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length > 0 ? history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{item.session_type}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.amount)}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">No earnings records found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const UpdatePasswordModal = ({ isOpen, onClose, onConfirm }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }
    setIsUpdating(true);
    await onConfirm(oldPassword, newPassword);
    setIsUpdating(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Your Password</DialogTitle>
          <DialogDescription>
            Enter your old password and a new password below.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input 
            type="password"
            placeholder="Old Password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
          <Input 
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input 
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isUpdating}>
            {isUpdating && <Save className="animate-spin h-4 w-4 mr-2" />}
            Update Password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Utility to clean payloads (replace undefined with null)
function cleanPayload(obj) {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v === undefined ? null : v])
  );
}

// Experience Edit Form Component
const ExperienceEditForm = ({ experienceDetails, setExperienceDetails, onSave, onCancel, expertId, token }) => {
  const [editedExperience, setEditedExperience] = React.useState([...experienceDetails]);
  const [newExperience, setNewExperience] = React.useState({
    title: '',
    employment_type: '',
    company: '',
    location: '',
    start_date: '',
    end_date: '',
    is_current: false,
    industry: '',
    description: ''
  });
  const [saving, setSaving] = React.useState(false);

  const addExperience = () => {
    if (newExperience.title && newExperience.company && newExperience.start_date) {
      const expToAdd = {
        ...newExperience,
        id: Date.now()
      };
      setEditedExperience([...editedExperience, expToAdd]);
      setNewExperience({
        title: '',
        employment_type: '',
        company: '',
        location: '',
        start_date: '',
        end_date: '',
        is_current: false,
        industry: '',
        description: ''
      });
    } else {
      toast.error('Please fill in required fields: Title, Company, and Start Date');
    }
  };

  const removeExperience = (index) => {
    const updated = editedExperience.filter((_, i) => i !== index);
    setEditedExperience(updated);
  };

  const updateExperience = (index, field, value) => {
    const updated = [...editedExperience];
    updated[index] = { ...updated[index], [field]: value };
    setEditedExperience(updated);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(`${API_BASE_URL}/api/experts/experience-details/${expertId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ experience: deepClean(editedExperience) })
      });
      if (!response.ok) throw new Error('Failed to update experience details');
      const result = await response.json();
      if (result.success) {
        setExperienceDetails(editedExperience);
        onSave(editedExperience);
        toast.success('Experience details updated successfully!');
      } else {
        throw new Error(result.message || 'Failed to update experience');
      }
    } catch (error) {
      console.error('Error updating experience:', error);
      toast.error('Failed to update experience details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {editedExperience.map((exp, index) => (
        <div key={exp.id || index} className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-medium text-green-800">Experience {index + 1}</h4>
            <Button onClick={() => removeExperience(index)} variant="outline" size="sm" className="text-red-600 hover:bg-red-50">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="Title *" value={exp.title} onChange={e => updateExperience(index, 'title', e.target.value)} required />
            <Input placeholder="Company *" value={exp.company} onChange={e => updateExperience(index, 'company', e.target.value)} required />
            <Input placeholder="Employment Type" value={exp.employment_type || ''} onChange={e => updateExperience(index, 'employment_type', e.target.value)} />
            <Input placeholder="Location" value={exp.location || ''} onChange={e => updateExperience(index, 'location', e.target.value)} />
            <Input type="date" placeholder="Start Date *" value={exp.start_date} onChange={e => updateExperience(index, 'start_date', e.target.value)} required />
            <Input type="date" placeholder="End Date" value={exp.end_date || ''} onChange={e => updateExperience(index, 'end_date', e.target.value)} />
            <Input placeholder="Industry" value={exp.industry || ''} onChange={e => updateExperience(index, 'industry', e.target.value)} />
            <Textarea placeholder="Description" value={exp.description || ''} onChange={e => updateExperience(index, 'description', e.target.value)} rows={2} />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!exp.is_current}
                onChange={e => updateExperience(index, 'is_current', e.target.checked)}
                title="Is this your current position?"
                id={`experience-current-${index}`}
              />
              <label htmlFor={`experience-current-${index}`} className="ml-2">Current</label>
            </div>
          </div>
        </div>
      ))}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-800 mb-3">Add New Experience</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input placeholder="Title *" value={newExperience.title} onChange={e => setNewExperience({ ...newExperience, title: e.target.value })} />
          <Input placeholder="Company *" value={newExperience.company} onChange={e => setNewExperience({ ...newExperience, company: e.target.value })} />
          <Input placeholder="Employment Type" value={newExperience.employment_type} onChange={e => setNewExperience({ ...newExperience, employment_type: e.target.value })} />
          <Input placeholder="Location" value={newExperience.location} onChange={e => setNewExperience({ ...newExperience, location: e.target.value })} />
          <Input type="date" placeholder="Start Date *" value={newExperience.start_date} onChange={e => setNewExperience({ ...newExperience, start_date: e.target.value })} />
          <Input type="date" placeholder="End Date" value={newExperience.end_date} onChange={e => setNewExperience({ ...newExperience, end_date: e.target.value })} />
          <Input placeholder="Industry" value={newExperience.industry} onChange={e => setNewExperience({ ...newExperience, industry: e.target.value })} />
          <Textarea placeholder="Description" value={newExperience.description} onChange={e => setNewExperience({ ...newExperience, description: e.target.value })} rows={2} />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!newExperience.is_current}
              onChange={e => setNewExperience({ ...newExperience, is_current: e.target.checked })}
              id="new-experience-current"
              title="Is this your current position?"
            />
            <label htmlFor="new-experience-current" className="ml-2">Current</label>
          </div>
        </div>
        <Button onClick={addExperience} className="mt-3" size="sm">
          <Plus className="h-4 w-4 mr-2" /> Add Experience
        </Button>
      </div>
      <div className="flex gap-2">
        <Button onClick={handleSave} className="flex-1" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save All Changes
        </Button>
        <Button onClick={onCancel} variant="outline" className="flex-1">
          <X className="h-4 w-4 mr-2" /> Cancel
        </Button>
      </div>
    </div>
  );
};

// Awards Edit Form Component
const AwardsEditForm = ({ awardsDetails, setAwardsDetails, onSave, onCancel, expertId, token }) => {
  const [editedAwards, setEditedAwards] = React.useState([...awardsDetails]);
  const [newAward, setNewAward] = React.useState({
    title: '',
    issuer: '',
    issue_date: '',
    description: ''
  });
  const [saving, setSaving] = React.useState(false);

  const addAward = () => {
    if (newAward.title) {
      const awardToAdd = {
        ...newAward,
        id: Date.now()
      };
      setEditedAwards([...editedAwards, awardToAdd]);
      setNewAward({ title: '', issuer: '', issue_date: '', description: '' });
    } else {
      toast.error('Please fill in required field: Title');
    }
  };

  const removeAward = (index) => {
    const updated = editedAwards.filter((_, i) => i !== index);
    setEditedAwards(updated);
  };

  const updateAward = (index, field, value) => {
    const updated = [...editedAwards];
    updated[index] = { ...updated[index], [field]: value };
    setEditedAwards(updated);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(`${API_BASE_URL}/api/experts/awards-details/${expertId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ awards: deepClean(editedAwards) })
      });
      if (!response.ok) throw new Error('Failed to update awards details');
      const result = await response.json();
      if (result.success) {
        setAwardsDetails(editedAwards);
        onSave(editedAwards);
        toast.success('Awards updated successfully!');
      } else {
        throw new Error(result.message || 'Failed to update awards');
      }
    } catch (error) {
      console.error('Error updating awards:', error);
      toast.error('Failed to update awards details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {editedAwards.map((award, index) => (
        <div key={award.id || index} className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-medium text-amber-800">Award {index + 1}</h4>
            <Button onClick={() => removeAward(index)} variant="outline" size="sm" className="text-red-600 hover:bg-red-50">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="Title *" value={award.title} onChange={e => updateAward(index, 'title', e.target.value)} required />
            <Input placeholder="Issuer" value={award.issuer || ''} onChange={e => updateAward(index, 'issuer', e.target.value)} />
            <Input type="date" placeholder="Issue Date" value={award.issue_date || ''} onChange={e => updateAward(index, 'issue_date', e.target.value)} />
            <Textarea placeholder="Description" value={award.description || ''} onChange={e => updateAward(index, 'description', e.target.value)} rows={2} />
          </div>
        </div>
      ))}
      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <h4 className="font-medium text-green-800 mb-3">Add New Award</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input placeholder="Title *" value={newAward.title} onChange={e => setNewAward({ ...newAward, title: e.target.value })} />
          <Input placeholder="Issuer" value={newAward.issuer} onChange={e => setNewAward({ ...newAward, issuer: e.target.value })} />
          <Input type="date" placeholder="Issue Date" value={newAward.issue_date} onChange={e => setNewAward({ ...newAward, issue_date: e.target.value })} />
          <Textarea placeholder="Description" value={newAward.description} onChange={e => setNewAward({ ...newAward, description: e.target.value })} rows={2} />
        </div>
        <Button onClick={addAward} className="mt-3" size="sm">
          <Plus className="h-4 w-4 mr-2" /> Add Award
        </Button>
      </div>
      <div className="flex gap-2">
        <Button onClick={handleSave} className="flex-1" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save All Changes
        </Button>
        <Button onClick={onCancel} variant="outline" className="flex-1">
          <X className="h-4 w-4 mr-2" /> Cancel
        </Button>
      </div>
    </div>
  );
};

// Enhanced ProfileHeader with proper edit functionality
const ProfileHeader = ({
  profile,
  editedProfile,
  isEditing,
  handleEdit,
  handleUpdateField,
  handleProfileUpdate,
  handleCancelEdit,
  educationDetails,
  experienceDetails,
  awardsDetails,
  setIsEditing,
  setEducationDetails,
  setExperienceDetails,
  setAwardsDetails,
  expertId,
  token,
  onImageUpload,
  uploadingImage
}) => (
  <div className="bg-white rounded-lg shadow-xl border-0 overflow-hidden">
    {/* Banner Background */}
    <div className="bg-gradient-to-r from-blue-400 to-cyan-400 h-32"></div>

    {/* Profile Content */}
    <div className="relative px-6 pb-6 -mt-16">
      <div className="flex flex-col items-left">
        {/* Avatar */}
        <div className="relative">
          <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center text-3xl font-bold text-blue-600 shadow-lg border-4 border-white overflow-hidden">
            {profile.profile_image ? (
              <img 
                src={`${API_BASE_URL}${profile.profile_image}`} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{profile.first_name?.[0]}{profile.last_name?.[0]}</span>
            )}
          </div>
          <input
            type="file"
            id="profile-image-upload"
            accept="image/*"
            onChange={onImageUpload}
            className="hidden"
          />
          <label
            htmlFor="profile-image-upload"
            className="absolute bottom-0 left-1 h-6 w-6 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-md border-2 border-white"
          >
            {uploadingImage ? (
              <Loader2 className="h-3 w-3 text-white animate-spin" />
            ) : (
              <Camera className="h-3 w-3 text-white" />
            )}
          </label>
        </div>

        {/* Name and Title */}
        <div className="mt-3 text-left">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            {profile.first_name} {profile.last_name}
          </h1>
          <p className="text-blue-600 font-medium">
            {profile.designation || 'Intern'}
          </p>
        </div>

        {/* Edit Button for Profile Header - Floating on top right */}
        <div className="absolute top-0 right-4">
          {!isEditing.personal && (
            <Button
              onClick={() => handleEdit('personal')}
              variant="outline"
              size="sm"
              className="bg-white/90 text-blue-600 border-blue-200 hover:bg-blue-400"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>

        {/* Profile Details */}
        <div className="w-full max-w-full mt-6 space-y-4">
          {/* Personal Info Edit Form */}
          {isEditing.personal ? (
            <div className="w-full bg-white/90 p-4 rounded-lg border border-blue-100 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="First Name"
                  value={profile.first_name}
                  readOnly
                  disabled 
                />
                <Input
                  placeholder="Last Name"
                  value={profile.last_name}
                  readOnly
                  disabled
                />
              </div>
              <Input
                placeholder="Designation"
                value={editedProfile.designation}
                onChange={(e) => handleUpdateField('designation', e.target.value)}
                required
              />
              <Input
                placeholder="Expertise"
                value={editedProfile.expertise}
                onChange={(e) => handleUpdateField('expertise', e.target.value)}
                required
              />
              <Textarea
                placeholder="Areas of Help"
                value={editedProfile.areas_of_help}
                onChange={(e) => handleUpdateField('areas_of_help', e.target.value)}
                required
                rows={3}
                className="whitespace-pre-line"
              />
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => handleProfileUpdate('personal')}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button
                  onClick={() => handleCancelEdit('personal')}
                  variant="outline"
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Display Mode */}
              <div className="text-left">
                <h3 className="text-blue-600 font-medium mb-1">Expertise</h3>
                <p className="text-slate-700">{profile.expertise || 'AI'}</p>
              </div>

              <div className="text-left">
                <h3 className="text-blue-600 font-medium mb-1">Areas of Help</h3>
                <p className="text-slate-700 whitespace-pre-line">
                  {profile.areas_of_help || 'I am interested in Tech'}
                </p>
              </div>
            </>
          )}

          {/* Education Section */}
          <div className="w-full max-w-full mt-6">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-blue-600 font-medium">Education</h3>
                {!isEditing.education && (
                  <Button
                    onClick={() => handleEdit('education')}
                    variant="outline"
                    size="sm"
                    className="text-blue-600 hover:bg-blue-400"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>

              {isEditing.education ? (
                <EducationEditForm
                  educationDetails={educationDetails}
                  setEducationDetails={setEducationDetails}
                  onSave={() => setIsEditing(prev => ({...prev, education: false}))}
                  onCancel={() => setIsEditing(prev => ({...prev, education: false}))}
                  expertId={expertId}
                  token={token}
                />
              ) : (
                <div className="space-y-3">
                  {educationDetails.length > 0 ? (
                    educationDetails.map((edu) => (
                      <div
                        key={edu.id}
                        className="w-full bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">{edu.school}</span>
                            {edu.grade && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                {edu.grade}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                              {edu.degree}
                            </span>
                            {edu.field_of_study && (
                              <span className="px-3 py-1 bg-cyan-100 text-cyan-700 text-sm rounded-full">
                                {edu.field_of_study}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-slate-600">
                            {new Date(edu.start_date).getFullYear()} -
                            {edu.end_date ? new Date(edu.end_date).getFullYear() : 'Present'}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-slate-500">No education details available</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Experience Section */}
            <div className="w-full mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-blue-600 font-medium">Experience</h3>
                {!isEditing.experience && (
                  <Button
                    onClick={() => handleEdit('experience')}
                    variant="outline"
                    size="sm"
                    className="text-blue-600 hover:bg-blue-400"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>

              {isEditing.experience ? (
                <ExperienceEditForm
                  experienceDetails={experienceDetails}
                  setExperienceDetails={setExperienceDetails}
                  onSave={() => setIsEditing(prev => ({...prev, experience: false}))}
                  onCancel={() => setIsEditing(prev => ({...prev, experience: false}))}
                  expertId={expertId}
                  token={token}
                />
              ) : (
                <div className="space-y-3">
                  {experienceDetails.length > 0 ? (
                    experienceDetails.map((exp) => (
                      <div
                        key={exp.id}
                        className="w-full bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-900">{exp.title}</span>
                            {exp.is_current && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm rounded-full">
                              {exp.company}
                            </span>
                            {exp.employment_type && (
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                                {exp.employment_type}
                              </span>
                            )}
                            {exp.industry && (
                              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                                {exp.industry}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-slate-600">
                            {new Date(exp.start_date).toLocaleDateString()} -
                            {exp.end_date ? new Date(exp.end_date).toLocaleDateString() : 'Present'}
                            {exp.location && ` • ${exp.location}`}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-slate-500">No experience details available</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Awards Section */}
            <div className="w-full">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-blue-600 font-medium">Awards & Achievements</h3>
                {!isEditing.awards && (
                  <Button
                    onClick={() => handleEdit('awards')}
                    variant="outline"
                    size="sm"
                    className="text-blue-600 hover:bg-blue-400"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>

              {isEditing.awards ? (
                <AwardsEditForm
                  awardsDetails={awardsDetails}
                  setAwardsDetails={setAwardsDetails}
                  onSave={() => setIsEditing(prev => ({...prev, awards: false}))}
                  onCancel={() => setIsEditing(prev => ({...prev, awards: false}))}
                  expertId={expertId}
                  token={token}
                />
              ) : (
                <div className="space-y-3">
                  {awardsDetails.length > 0 ? (
                    awardsDetails.map((award) => (
                      <div
                        key={award.id}
                        className="w-full bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">{award.title}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {award.issuer && (
                              <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm rounded-full">
                                {award.issuer}
                              </span>
                            )}
                            {award.issue_date && (
                              <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full">
                                {new Date(award.issue_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {award.description && (
                            <p className="text-sm text-slate-600 mt-2">{award.description}</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-slate-500">No awards available</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ExpertDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ExpertProfile | null>(null);
  const [editedProfile, setEditedProfile] = useState<ExpertProfile | null>(null);
  const [isEditing, setIsEditing] = useState<EditingState>({
    personal: false,
    contact: false,
    pricing: false,
    education: false,
    experience: false,
    awards: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expertId, setExpertId] = useState<string | null>(null);
  const [bookingStats, setBookingStats] = useState<BookingStats>({
    totalSessions: 0,
    pendingBookings: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Availability states
  const [availability, setAvailability] = useState<AvailabilityData[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | undefined>(undefined);
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('17:00');

  // Constants for availability
  const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const TIME_OPTIONS = [
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
    '22:00', '22:30', '23:00'
  ];

  // Add these state variables with your other useState declarations
  const [profileStatus, setProfileStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  // Add this with your other useState declarations around line 250
const [approvedAlertShown, setApprovedAlertShown] = useState(false);

  // Add these state variables inside the ExpertDashboard component
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // States for Earnings & Wallet
  const [walletBalance, setWalletBalance] = useState('0');
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [earningsHistory, setEarningsHistory] = useState<Earning[]>([]);
  const [isEarningsModalOpen, setIsEarningsModalOpen] = useState(false);
  const [loadingEarnings, setLoadingEarnings] = useState(true);

  // Add these states
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Expanded state for feedbacks
  const [expandedFeedbacks, setExpandedFeedbacks] = useState<{ [key: number]: boolean }>({});

  // Upcoming meetings and activities states
  const [upcomingMeetings, setUpcomingMeetings] = useState<UpcomingMeeting[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [todaysMeetings, setTodaysMeetings] = useState<UpcomingMeeting[]>([]);
  
  // Add this state in the ExpertDashboard component
  const [educationDetails, setEducationDetails] = useState<Education[]>([]);
  // Add these state variables in ExpertDashboard component
  const [experienceDetails, setExperienceDetails] = useState<Experience[]>([]);
  const [awardsDetails, setAwardsDetails] = useState<Award[]>([]);

  // Add new state for currency/timezone preferences modal
  const [preferencesModalOpen, setPreferencesModalOpen] = useState(false);
  
  // Use the currency/timezone context
  const { currency, timezone, setCurrencyAndTimezone, formatCurrency, formatDateTime } = useCurrencyTimezone();

  // Image upload state
  const [uploadingImage, setUploadingImage] = useState(false);


  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId || !token) return;

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Image size must be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      
      const formData = new FormData();
      formData.append('profileImage', file);
      formData.append('userId', userId);

      console.log('Uploading image:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        userId: userId
      });

      const response = await fetch(`${API_BASE_URL}/api/experts/upload-image/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      console.log('Upload response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload error response:', errorText);
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Upload result:', result);
      
      if (result.success) {
        // Update profile with new image URL
        const imageUrl = result.data.imageUrl || result.data.profile_image;
        setProfile(prev => prev ? { ...prev, profile_image: imageUrl } : null);
        setEditedProfile(prev => prev ? { ...prev, profile_image: imageUrl } : null);
        toast.success('Profile image updated successfully!');
      } else {
        throw new Error(result.message || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload profile image');
    } finally {
      setUploadingImage(false);
    }
  };

  // Add this function to handle saving preferences
const handleSavePreferences = async (newCurrency: string, newTimezone: string) => {
  try {
    console.log(`ExpertDashboard: Saving preferences - Currency: ${newCurrency}, Timezone: ${newTimezone}`);
    
    await setCurrencyAndTimezone(newCurrency, newTimezone);
    console.log('ExpertDashboard: Preferences saved successfully');
    
    setPreferencesModalOpen(false);
    toast(
      <div>
        <div className="font-semibold mb-1">Preferences updated</div>
        <div>Your currency and timezone settings have been saved.</div>
      </div>
    );
  
  } catch (error: any) {
    console.error('ExpertDashboard: Error saving preferences:', error);
    
    // toast(
    //   <div>
    //     <div className="font-semibold mb-1 text-red-700">Error saving preferences</div>
    //     <div>{error.message || "There was an error saving your preferences. Please try again."}</div>
    //   </div>,
    //   { className: "bg-red-50 text-red-900", duration: 5000 }
    // );
  }
};

 // Add this effect to prompt users to set preferences if not already set
const preferencesPromptShown = React.useRef(false);

// Add this state to track if the preferences toast is showing
const [preferencesToastShowing, setPreferencesToastShowing] = useState(false);

// Replace your existing preferences useEffect with this version
// useEffect(() => {
//   // Check if preferences are not set AND profile is loaded
//   if (!loading && !error && profile && (!currency.code || !timezone)) {
//     // Only show one toast at a time
//     if (!preferencesToastShowing) {
//       setPreferencesToastShowing(true);
      
//       // Show a persistent toast that can't be dismissed until preferences are set
//       const toastId = toast(
//         <div>
//           <div className="font-semibold mb-1 text-red-700">Required Setup</div>
//           <div className="mb-2">You must set your currency and timezone preferences to continue using the dashboard.</div>
//           <Button variant="secondary" onClick={() => setPreferencesModalOpen(true)}>
//             Set Now
//           </Button>
//         </div>,
//         {
//           duration: 1000000,
//           className: "bg-red-50 text-red-900",
//           onDismiss: () => {
//             // If preferences are still not set, immediately show the toast again
//             if (!currency.code || !timezone) {
//               setTimeout(() => setPreferencesToastShowing(false), 300);
//             }
//           },
//         }
//       );
      
//       // Store dismiss function to use later
//       window.preferencesDismissFunc = () => toast.dismiss(toastId);
//     }
//   } else if (currency.code && timezone && preferencesToastShowing) {
//     // When preferences are set, update the state and dismiss any existing toast
//     setPreferencesToastShowing(false);
//     if (window.preferencesDismissFunc) {
//       window.preferencesDismissFunc();
//       window.preferencesDismissFunc = null;
//     }
//   }
// }, [loading, error, profile, currency.code, timezone, preferencesToastShowing]);

  // Get user data from localStorage on component mount
  useEffect(() => {
    const userData = localStorage.getItem('user') || localStorage.getItem('userData') || '{}';
    try {
      const parsedData = JSON.parse(userData);
      setUserId(parsedData.user_id || parsedData.id);
      setToken(parsedData.token || parsedData.accessToken);
    } catch (err) {
      console.error('Error parsing user data:', err);
    }
  }, []);

  // Add this useEffect hook with your other useEffect hooks
// useEffect(() => {
//   // Extract the status from the profile data when it's loaded
//   if (profile) {
//     // Convert the status to lowercase to match our state type
//     const status = profile.status?.toLowerCase() as 'pending' | 'approved' | 'rejected';
//     setProfileStatus(status || 'pending');
//     setRejectionReason(profile.rejection_reason || null);
//   }
// }, [profile]);

// Replace your existing useEffect around line 680-686 with this enhanced version
useEffect(() => {
  // Extract the status from the profile data when it's loaded
  if (profile) {
    // Convert the status to lowercase to match our state type
    const status = profile.status?.toLowerCase() as 'pending' | 'approved' | 'rejected';
    const currentStatus = status || 'pending';
    setProfileStatus(currentStatus);
    setRejectionReason(profile.rejection_reason || null);
    
    // Check if this is the first time seeing 'approved' status
    if (currentStatus === 'approved' && expertId) {
      const alertKey = `approved_alert_shown_${expertId}`;
      const hasShownApprovedAlert = localStorage.getItem(alertKey);
      
      if (!hasShownApprovedAlert) {
        // First time seeing approved status - show the alert
        setApprovedAlertShown(false);
        // Mark it as shown in localStorage
        localStorage.setItem(alertKey, 'true');
      } else {
        // Already shown before - don't show again
        setApprovedAlertShown(true);
      }
    } else {
      // For pending/rejected status, always show the alert
      setApprovedAlertShown(false);
    }
  }
}, [profile, expertId]);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const userData = localStorage.getItem('user');
        if (!userData) {
          throw new Error('No user data found');
        }

        const user = JSON.parse(userData);
        if (!user.token || !user.role || user.role !== 'expert') {
          throw new Error('Invalid user data');
        }

        const userId = user.id || user.user_id;
        if (!userId) {
          throw new Error('User ID not found');
        }

        setExpertId(userId);

        const API_BASE_URL = import.meta.env.VITE_API_URL;
        
        const response = await fetch(`${API_BASE_URL}/api/experts/profile/${userId}`, {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 404) {
            // Make sure we include the email from user data
            const comprehensiveProfile: ExpertProfile = {
              id: userId,
              user_id: userId,
              first_name: user.name?.split(' ')[0] || user.first_name || 'Expert',
              last_name: user.name?.split(' ')[1] || user.last_name || 'User',
              designation: user.functionality || user.designation || 'Domain Expert',
              expertise: user.functionality || user.expertise || 'Business Consulting',
              areas_of_help: user.areas_of_help || 'Business Strategy, Operations, Consulting',
              email: user.email || '',  // Ensure email is set from user data
              phone_number: user.mobile_number || user.phone_number || '',
              current_organization: user.current_organization || 'Professional Consultant',
              location: user.location || 'Available Online',
              work_experience: user.work_experience || 5,
              audio_pricing: user.audio_pricing || 1500,
              profile_completed: true
            };
            
            setProfile(comprehensiveProfile);
            setEditedProfile(comprehensiveProfile);
            setLoading(false);
            return;
          }
          if (response.status === 401) {
            localStorage.removeItem('user');
            throw new Error('Session expired');
          }
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.message || 'Failed to fetch profile');
        }

        // Make sure the email is included in the profile data
        const profileData = {
          ...result.data,
          email: result.data.email || user.email || ''
        };

        setProfile(profileData);
        setEditedProfile(profileData);
        setLoading(false);

      } catch (error) {
        console.error('Profile fetch error:', error);
        setError(error instanceof Error ? error.message : 'Failed to load profile');
        setLoading(false);
        
        if (error instanceof Error && 
            (error.message.includes('No user data') || 
             error.message.includes('Invalid user') ||
             error.message.includes('Session expired'))) {
          localStorage.removeItem('user');
          navigate('/auth/expert');
        }
      }
    };

    fetchProfile();
  }, [navigate]);

  // Fetch booking stats
  const fetchBookingStats = async (expertId: string) => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) throw new Error('User data not found');

      const { token } = JSON.parse(userData);
      const API_BASE_URL = import.meta.env.VITE_API_URL;

      const response = await fetch(`${API_BASE_URL}/api/bookings/expert/${expertId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch bookings');

      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        const bookings: Booking[] = data.data;
        const completedBookings = bookings.filter(b => b.status === 'completed');

        setBookingStats({
          totalSessions: bookings.length,
          pendingBookings: bookings.filter(b => b.status === 'pending').length
        });

        // Filter today's confirmed meetings
        const today = new Date().toISOString().split('T')[0];
        console.log('Today\'s date:', today);
        console.log('All bookings:', bookings);
        
        const todaysConfirmedMeetings = bookings.filter(booking => {
          const bookingDate = booking.date?.split('T')[0] || booking.date;
          const isToday = bookingDate === today;
          const isConfirmed = booking.status === 'confirmed';
          console.log(`Booking ${booking.id}: date=${bookingDate}, status=${booking.status}, isToday=${isToday}, isConfirmed=${isConfirmed}`);
          return isConfirmed && isToday;
        }).map(booking => ({
          id: booking.id,
          seeker_name: booking.seeker_name || 'Unknown User',
          display_date: booking.date,
          start_time: booking.start_time,
          end_time: booking.end_time,
          session_type: booking.session_type,
          status: booking.status as 'confirmed',
          date: booking.date
        }));
        
        console.log('Today\'s confirmed meetings:', todaysConfirmedMeetings);
        setTodaysMeetings(todaysConfirmedMeetings);


        const billableBookings = bookings.filter(b => b.status === 'completed');
        const total = billableBookings.reduce((sum, b) => sum + Number(b.amount), 0);
        setTotalEarnings(total);

        const history: Earning[] = billableBookings.map(b => ({
          id: b.id,
          created_at: b.date,
          session_type: b.session_type,
          amount: Number(b.amount)
        }));
        setEarningsHistory(history);
        setLoadingEarnings(false);
      }
    } catch (error) {
      console.error('Error fetching booking stats:', error);
      toast.error('Failed to fetch booking statistics');
      setLoadingEarnings(false);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (expertId && token) {
      setLoadingEarnings(true);
      fetchBookingStats(expertId);
      
      const interval = setInterval(() => {
        fetchBookingStats(expertId);
      }, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [expertId, token]);

  // Handle field updates
  const handleUpdateField = (field: keyof ExpertProfile, value: string | number) => {
    setEditedProfile(prev => prev ? { ...prev, [field]: value } : null);
  };

  // Handle profile section updates
  const handleProfileUpdate = async (section: keyof EditingState) => {
    try {
      if (!editedProfile || !expertId) {
        throw new Error('Profile data or expert ID is missing');
      }

      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('User data not found');
      }

      const user = JSON.parse(userData);
      const API_BASE_URL = import.meta.env.VITE_API_URL;

      // Validate the data before sending
      let sectionData: any = {};
      
      switch(section) {
        case 'personal':
          if (!editedProfile.first_name || !editedProfile.last_name) {
            throw new Error('First name and last name are required');
          }
          sectionData = {
            first_name: editedProfile.first_name.trim(),
            last_name: editedProfile.last_name.trim(),
            designation: editedProfile.designation?.trim() || '',
            expertise: editedProfile.expertise?.trim() || '',
            areas_of_help: editedProfile.areas_of_help?.trim() || ''
          };
          break;
          
        case 'contact':
          // Use the fast contact API
          try {
            console.log('Frontend sending contact update:', { expertId, userData: user });
            const response = await fetch(`${API_BASE_URL}/api/experts/contact/${expertId}`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${user.token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({
                phone_number: editedProfile.phone_number?.trim() || '',
                current_organization: editedProfile.current_organization?.trim() || '',
                location: editedProfile.location?.trim() || '',
                work_experience: Number(editedProfile.work_experience) || 0
              })
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => null);
              throw new Error(
                errorData?.message || 
                `Failed to update contact information (Status: ${response.status})`
              );
            }

            const result = await response.json();
            
            if (!result.success) {
              throw new Error(result.message || 'Contact update failed');
            }

            // Update local state with the returned data
            setProfile(result.data);
            setEditedProfile(result.data);
            
            // Reset edit mode for this section
            setIsEditing(prev => ({
              ...prev,
              [section]: false
            }));

            toast.success('Contact information updated successfully');
            return; // Exit early since we handled this case
          } catch (error) {
            console.error('Contact update error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to update contact information');
            return; // Exit early since we handled this case
          }
          break;
          
        case 'pricing':
          const audioPrice = Number(editedProfile.audio_pricing);
          if (isNaN(audioPrice) || audioPrice < 0) {
            throw new Error('Invalid pricing value');
          }
          sectionData = {
            audio_pricing: audioPrice
          };
          break;
          
        default:
          throw new Error('Invalid section');
      }

      // Log the request payload for debugging
      console.log('Update request payload:', {
        section,
        data: sectionData
      });

      const response = await fetch(`${API_BASE_URL}/api/experts/profile/${expertId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          section,
          data: deepClean(sectionData)
        })
      });

      // Log the response status and headers for debugging
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Error response:', errorData);
        throw new Error(
          errorData?.message || 
          `Failed to update ${section} section (Status: ${response.status})`
        );
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Update failed');
      }

      // Update local state with the returned data
      setProfile(result.data);
      setEditedProfile(result.data);
      
      // Reset edit mode for this section
      setIsEditing(prev => ({
        ...prev,
        [section]: false
      }));

      toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} section updated successfully`);

    } catch (error) {
      console.error('Profile update error:', error);
      
      // Show more detailed error message
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
      
      // Keep edit mode active when there's an error
      setIsEditing(prev => ({
        ...prev,
        [section]: true
      }));
    }
  };

  // Handle edit mode toggle
  const handleEdit = (section: keyof EditingState) => {
    setIsEditing(prev => ({ ...prev, [section]: true }));
  };

  // Handle cancel edit
  const handleCancelEdit = (section: keyof EditingState) => {
    setEditedProfile(profile);
    setIsEditing(prev => ({ ...prev, [section]: false }));
  };

  // Handle availability time change
  const handleTimeChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') {
      setStartTime(value);
    } else {
      setEndTime(value);
    }
  };

  // Handle availability update
  const handleUpdateAvailability = async () => {
    try {
        if (!selectedDay || !expertId) {
            toast.error("Please select a day and ensure you're logged in", {
                description: "All fields are required"
            });
            return;
        }

        const storedUserData = localStorage.getItem('user');
        if (!storedUserData) {
            toast.error("Authentication Error", {
                description: "Please login again"
            });
            return;
        }

        const user = JSON.parse(storedUserData);
        const token = user.token || user.accessToken;

        setIsUpdating(true);

        const response = await fetch(`${API_BASE_URL}/api/experts/availability`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                user_id: expertId,
                day_of_week: selectedDay,
                start_time: startTime,
                end_time: endTime,
                name: profile?.first_name || 'Expert'
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update availability');
        }

        const result = await response.json();

        setAvailability(prev => {
            const filtered = prev.filter(item => item.day_of_week !== selectedDay);
            return [...filtered, { 
                day_of_week: selectedDay, 
                start_time: startTime, 
                end_time: endTime 
            }];
        });

        await fetchAvailability();

        setSelectedDay(undefined);
        setStartTime('09:00');
        setEndTime('17:00');

    } catch (error) {
        console.error('Error updating availability:', error);
        toast.error("Error", {
            description: error instanceof Error ? error.message : 'Failed to update availability'
        }); 
    } finally {
        setIsUpdating(false);
    }
  };

  // Fetch availability when userId and token are available
  useEffect(() => {
    if (userId && token) {
      fetchFeedbacks();
      fetchAvailability();
    }
  }, [userId, token]);

  // Update the fetchFeedbacks function
  const fetchFeedbacks = async (showRefreshing = false) => {
    if (!userId || !token) {
      console.error('Missing userId or token');
      return;
    }

    try {
      showRefreshing ? setIsRefreshing(true) : setLoadingFeedbacks(true);
      setFeedbackError(null);

      const API_BASE_URL = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API_BASE_URL}/api/session-feedback/expert/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to load feedbacks');
      }

      const transformedFeedbacks = result.data.map(feedback => ({
        ...feedback,
        rating: Number(feedback.rating),
        created_at: new Date(feedback.created_at).toISOString()
      })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setFeedbacks(transformedFeedbacks);
      
      if (transformedFeedbacks.length > 0) {
        const avgRating = transformedFeedbacks.reduce((sum, curr) => sum + curr.rating, 0) / transformedFeedbacks.length;
      }

    } catch (err) {
      console.error('Error fetching feedbacks:', err);
      setFeedbackError(err instanceof Error ? err.message : 'Failed to load feedbacks');
      toast.error('Failed to load feedbacks');
    } finally {
      setLoadingFeedbacks(false);
      setIsRefreshing(false);
    }
  };

  // Fetch current availability
  const fetchAvailability = async () => {
    try {
        const storedUserData = localStorage.getItem('user');
        if (!storedUserData || !expertId) return;

        const user = JSON.parse(storedUserData);
        const token = user.token || user.accessToken;

        const response = await fetch(`${API_BASE_URL}/api/experts/availability?user_id=${expertId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch availability');
        }

        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
            setAvailability(data.data);
        }
    } catch (error) {
        console.error('Error fetching availability:', error);
    }
  };

  // Fetch upcoming meetings...
  const fetchUpcomingMeetings = async () => {
    try {
      setLoadingMeetings(true);

      const API_BASE_URL = import.meta.env.VITE_API_URL;
      
      const meetingsResponse = await fetch(
        `${API_BASE_URL}/api/bookings/expert/dashboard/${expertId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!meetingsResponse.ok) {
        throw new Error(`Failed to fetch meetings: ${meetingsResponse.status}`);
      }

      const data = await meetingsResponse.json();

      if (data.success) {
        setUpcomingMeetings(data.data.upcomingMeetings);
      } else {
        throw new Error(data.message || 'Failed to load dashboard data');
      }

    } catch (error) {
      console.error('Error fetching upcoming meetings', error);
      toast.error('Failed to load upcoming meetings');
    } finally {
      setLoadingMeetings(false);
    }
  };

  useEffect(() => {
    if (expertId && token) {
      fetchUpcomingMeetings();
    }
  }, [expertId, token]);

  const handlePasswordUpdate = async (oldPassword: string, newPassword: string) => {
    try {
      if (!token) {
        toast.error("Authentication error. Please log in again.");
        return;
      }
      const response = await fetch(`${API_BASE_URL}/api/auth/update-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Password updated successfully!");
      } else {
        throw new Error(data.message || 'Failed to update password.');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Add useEffect for education details
  useEffect(() => {
    const fetchEducationDetails = async () => {
      if (!expertId || !token) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/experts/education-details/${expertId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch education details');
        }

        const result = await response.json();

        if (result.success) {
          setEducationDetails(result.data);
        }
      } catch (error) {
        console.error('Error fetching education:', error);
      }
    };

    fetchEducationDetails();
  }, [expertId, token]);

  // Add useEffect for experience details
  useEffect(() => {
    const fetchExperienceDetails = async () => {
      if (!expertId || !token) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/experts/experience-details/${expertId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch experience details');
        }

        const result = await response.json();

        if (result.success) {
          setExperienceDetails(result.data);
        }
      } catch (error) {
        console.error('Error fetching experience:', error);
      }
    };

    fetchExperienceDetails();
  }, [expertId, token]);

  // Add useEffect for awards details
  useEffect(() => {
    const fetchAwardsDetails = async () => {
      if (!expertId || !token) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/experts/awards-details/${expertId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch awards details');
        }

        const result = await response.json();

        if (result.success) {
          setAwardsDetails(result.data);
        }
      } catch (error) {
        console.error('Error fetching awards:', error);
      }
    };

  fetchAwardsDetails();
}, [expertId, token]);

// Fetch wallet balance
useEffect(() => {
  const fetchWalletBalance = async () => {
    if (!token) return;
    
    try {
      setLoadingWallet(true);
      const response = await fetch(`${API_BASE_URL}/api/wallet/balance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setWalletBalance(data.data.balance);
      }
    } catch (error) {
      console.error("Failed to fetch wallet balance:", error);
    } finally {
      setLoadingWallet(false);
    }
  };
  fetchWalletBalance();
}, [token]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-lg">Loading profile...</div>
        </div>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-500">{error}</div>
        </div>
        <Footer />
      </div>
    );
  }

  // No profile state
  if (!profile || !editedProfile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-lg">Profile not found</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-500 text-white pt-16 pb-8 md:pt-20 md:pb-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl md:text-4xl font-bold mb-2 md:mb-4 text-white">
              Expert Dashboard
            </h1>
            <p className="text-sm md:text-lg opacity-90 text-blue-50">
              Manage your profile, availability, and track your activities
            </p>
          </div>
        </div>
      </div>

      {/* Status Alert - Add this right after the Hero Section closing div and before Stats Cards */}
      {profileStatus && (
        <div className="container mx-auto px-4 -mt-2 mb-8 relative z-10">
          {profileStatus === 'pending' && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md shadow-sm">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Profile Under Review</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>Your profile is under review. We prioritize complete profiles, so updating yours will boost your chances of faster approval!
                       You'll be notified once it's approved and you can start receiving session requests.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {profileStatus === 'rejected' && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md shadow-lg relative z-20">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Profile Rejected</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>
                      Your profile was not approved. We prioritize complete profiles, so updating yours will improve your chances in the next review. Please check your email for the detailed reason of rejection.
                      {/* {rejectionReason ? ` Reason: ${rejectionReason}` : ' Please review and update your profile information, then resubmit for review.'} */}
                    </p>
                  </div>
                  {/* <div className="mt-4">
                    <Button
                      size="sm"
                      className="bg-red-600 text-white hover:bg-red-700"
                      onClick={() => {
                        // Trigger edit mode for personal information
                        handleEdit('personal');
                      }}
                    >
                      Update Profile
                    </Button>
                  </div> */}
                </div>
              </div>
            </div>
          )}

          {profileStatus === 'approved' && !approvedAlertShown && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-md shadow-lg relative z-20">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Profile Approved</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>Congratulations! Your expert profile has been approved. You can now receive session requests and bookings from users.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}


      {/* Stats Cards */}
      <div className="container mx-auto px-4 -mt-6 md:-mt-10 mb-6 md:mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {/* Total Sessions */}
          <div className="bg-white p-4 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 rounded">
                <BookOpen className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-slate-600">Total Sessions</p>
                <p className="text-lg md:text-2xl font-bold text-slate-900">
                  {statsLoading ? "..." : bookingStats.totalSessions}
                </p>
              </div>
            </div>
          </div>

          {/* Pending Bookings */}
          <div className="bg-white p-4 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-50 rounded">
                <TrendingUp className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-slate-600">Pending Bookings</p>
                <p className="text-lg md:text-2xl font-bold text-orange-600">
                  {statsLoading ? "..." : bookingStats.pendingBookings}
                </p>
              </div>
            </div>
            {bookingStats.pendingBookings > 0 && (
              <div className="mt-4 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-emerald-600 border-emerald-200 hover:bg-emerald-500"
                  onClick={() => navigate('/appointment-log')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  View Pending Bookings
                </Button>
              </div>
            )}
          </div>

          {/* Average Rating */}
          <div className="bg-white p-4 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-amber-50 rounded">
                <Star className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-slate-600">Average Rating</p>
                <div className="text-lg md:text-2xl font-bold text-slate-900">
                  {feedbacks.length > 0 ? (
                    <ReactStars
                      count={5}
                      value={feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length}
                      size={24}
                      edit={false}
                      activeColor="#ffd700"
                    />
                  ) : (
                    'No ratings yet'
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Wallet Balance */}
          <div className="bg-white p-4 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-violet-50 rounded">
                <Wallet className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-slate-600">Wallet Balance</p>
                <p className="text-lg md:text-2xl font-bold text-slate-900">
                   {loadingWallet ? '...' : formatCurrency(walletBalance)}
                </p>
              </div>
            </div>
             <a href="/wallet" className="text-xs text-blue-600 hover:underline mt-2 inline-block">View details & withdraw</a>
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <main className="flex-1 container mx-auto px-4 py-4 md:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-4">
            <ProfileHeader
              profile={profile}
              editedProfile={editedProfile}
              isEditing={isEditing}
              handleEdit={handleEdit}
              handleUpdateField={handleUpdateField}
              handleProfileUpdate={handleProfileUpdate}
              handleCancelEdit={handleCancelEdit}
              educationDetails={educationDetails}
              experienceDetails={experienceDetails}
              awardsDetails={awardsDetails}
              setIsEditing={setIsEditing}
              setEducationDetails={setEducationDetails}
              setExperienceDetails={setExperienceDetails}
              setAwardsDetails={setAwardsDetails}
              expertId={expertId}
              token={token}
              onImageUpload={handleImageUpload}
              uploadingImage={uploadingImage}
            />
            
            {/* Contact Information - Enhanced with Edit Button */}
            <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-2 sm:mb-0">Contact Information</h2>
                {!isEditing.contact && (
                  <Button 
                    onClick={() => handleEdit('contact')} 
                    variant="outline" 
                    size="sm" 
                    className="w-full sm:w-auto hover:bg-blue-400 border-blue-300 text-blue-600 hover:border-blue-400"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Contact
                  </Button>
                )}
              </div>

              {isEditing.contact ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Input
                        value={editedProfile.email || ''}
                        placeholder="Email"
                        type="email"
                        disabled
                        className="bg-gray-100 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>
                    <Input
                      value={editedProfile.phone_number || ''}
                      onChange={(e) => handleUpdateField('phone_number', e.target.value)}
                      placeholder="Phone Number"
                    />
                  </div>
                  <Input
                    value={editedProfile.current_organization || ''}
                    onChange={(e) => handleUpdateField('current_organization', e.target.value)}
                    placeholder="Organization"
                  />
                  <Input
                    value={editedProfile.location || ''}
                    onChange={(e) => handleUpdateField('location', e.target.value)}
                    placeholder="Location"
                  />
                  <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    <Button 
                      onClick={() => handleProfileUpdate('contact')} 
                      className="w-full sm:w-auto"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button 
                      onClick={() => handleCancelEdit('contact')} 
                      variant="outline" 
                      className="w-full sm:w-auto"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 rounded-xl border border-blue-200 hover:shadow-md transition-all">
                    <div className="flex items-center mb-2">
                      <div className="p-2 bg-blue-500/10 rounded-lg mr-3">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <p className="text-sm font-medium text-blue-700">Email</p>
                      <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Read-only</span>
                    </div>
                    <p className="font-semibold text-gray-900 ml-11">{profile.email || 'Not provided'}</p>
                  </div>

                  {/* Phone Card */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100/50 p-4 rounded-xl border border-green-200 hover:shadow-md transition-all">
                    <div className="flex items-center mb-2">
                      <div className="p-2 bg-green-500/10 rounded-lg mr-3">
                        <Activity className="h-4 w-4 text-green-600" />
                      </div>
                      <p className="text-sm font-medium text-green-700">Phone</p>
                    </div>
                    <p className="font-semibold text-gray-900 ml-11">{profile.phone_number || 'Not provided'}</p>
                  </div>

                  {/* Organization Card */}
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-4 rounded-xl border border-purple-200 hover:shadow-md transition-all">
                    <div className="flex items-center mb-2">
                      <div className="p-2 bg-purple-500/10 rounded-lg mr-3">
                        <BookOpen className="h-4 w-4 text-purple-600" />
                      </div>
                      <p className="text-sm font-medium text-purple-700">Organization</p>
                    </div>
                    <p className="font-semibold text-gray-900 ml-11">{profile.current_organization || 'Not provided'}</p>
                  </div>

                  {/* Location Card */}
                  <div className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 p-4 rounded-xl border border-cyan-200 hover:shadow-md transition-all">
                    <div className="flex items-center mb-2">
                      <div className="p-2 bg-cyan-500/10 rounded-lg mr-3">
                        <Calendar className="h-4 w-4 text-cyan-600" />
                      </div>
                      <p className="text-sm font-medium text-cyan-700">Location</p>
                    </div>
                    <p className="font-semibold text-gray-900 ml-11">{profile.location || 'Not provided'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Pricing Section */}
            <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-2 sm:mb-0">Pricing</h2>
                {!isEditing.pricing && (
                  <Button 
                    onClick={() => handleEdit('pricing')} 
                    variant="outline" 
                    size="sm" 
                    className="w-full sm:w-auto hover:bg-blue-400 border-blue-300 text-blue-600 hover:border-blue-400"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Pricing
                  </Button>
                )}
              </div>

              {isEditing.pricing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Audio Call Rate (INR/hour)
                    </label>
                    <Input
                      value={editedProfile.audio_pricing?.toString() || ''}
                      onChange={(e) => handleUpdateField('audio_pricing', parseFloat(e.target.value) || 0)}
                      placeholder="Enter rate per hour"
                      type="number"
                      min="0"
                      className="w-full px-4 py-2 text-base"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    <Button 
                      onClick={() => handleProfileUpdate('pricing')} 
                      size="sm" 
                      className="w-full sm:w-auto"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button 
                      onClick={() => handleCancelEdit('pricing')} 
                      variant="outline" 
                      size="sm" 
                      className="w-full sm:w-auto"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-blue-50 via-blue-50/50 to-white rounded-xl border border-blue-100 p-6 transition-all hover:shadow-md">
                  <div className="flex flex-col items-center">
                    <div className="mb-4">
                      <h3 className="text-lg font-medium text-slate-900">Audio Call</h3>
                      <p className="text-sm text-slate-500 mt-1">Voice consultation</p>
                    </div>
                    <div className="flex items-baseline mb-4">
                      <span className="text-4xl font-bold text-blue-600">{formatCurrency(profile.audio_pricing || 0)}</span>
                      <span className="text-slate-600 ml-2">/hour</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Availability Section */}
            <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">Availability</h2>
              </div>
              
              <AvailabilitySection
                selectedDay={selectedDay}
                setSelectedDay={setSelectedDay}
                startTime={startTime}
                endTime={endTime}
                onTimeChange={handleTimeChange}
                onUpdateAvailability={handleUpdateAvailability}
                WEEKDAYS={WEEKDAYS}
                TIME_OPTIONS={TIME_OPTIONS}
              />

              {/* Current Availability Display */}
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-3 text-slate-900">Current Schedule</h3>
                {availability.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availability.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100 hover:shadow-md transition-shadow">
                        <span className="font-medium text-slate-900">{item.day_of_week}</span>
                        <span className="text-blue-700 font-medium">{item.start_time} - {item.end_time}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-200">
                    <Clock className="h-12 w-12 mx-auto mb-2 text-slate-400" />
                    <p className="text-slate-500 italic">No availability set</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Activity & Meetings */}
            <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-emerald-100 rounded-lg mr-3">
                  <Activity className="h-5 w-5 text-emerald-600" />
                </div>
               <h2 className="text-xl font-semibold text-slate-900">Meeting Details</h2>
              </div>

                        {/* Today's Meetings */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-slate-700">Today's Meetings ({todaysMeetings.length})</h3>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      console.log('Manual refresh clicked');
                      if (expertId && token) {
                        fetchBookingStats(expertId);
                      }
                    }}
                    className="text-xs"
                  >
                   
                  </Button>
                </div>
                {statsLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                  </div>
                ) : todaysMeetings.length > 0 ? (
                  <div className="space-y-3">
                    {todaysMeetings.map((meeting) => (
                      <div 
                        key={meeting.id}
                        onClick={() => navigate('/appointment-log?tab=confirmed')}
                        className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200 hover:shadow-lg transition-all cursor-pointer hover:border-blue-300"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            {/* <h4 className="font-medium text-slate-900">{meeting.seeker_name}</h4> */}
                            <p className="text-sm text-slate-600 capitalize">{meeting.session_type} Session</p>
                          </div>
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                            Confirmed
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-2">
                          <div className="flex items-center text-slate-600">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>Today</span>
                          </div>
                          <div className="flex items-center text-slate-600">
                            <Clock className="w-4 h-4 mr-1" />
                            {meeting.start_time} - {meeting.end_time}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-200">
                    <Calendar className="h-12 w-12 mx-auto mb-2 text-slate-400" />
                    <p className="text-slate-500">No meetings scheduled for today</p>
                  </div>
                )}
              </div>      
            </div>

              {/* Statistics - Enhanced */}
             <div className="bg-white rounded-lg shadow-xl p-6 hover:shadow-2xl transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-violet-100 rounded-lg mr-3">
                    <Users className="h-5 w-5 text-violet-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-900">Statistics</h2>
                </div>
                
                <div className="space-y-4">
                  {/* <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <span className="text-blue-800 font-medium">Total Sessions</span>
                    <span className="font-bold text-lg text-slate-900">0</span>
                  </div> */}
                  <div 
                    className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border border-emerald-100 cursor-pointer hover:bg-emerald-100 transition-colors"
                    onClick={() => setIsEarningsModalOpen(true)}
                  >
                    <span className="text-emerald-800 font-medium">Total Earnings</span>
                    <span className="font-bold text-lg text-emerald-600">
                      {loadingEarnings ? '...' : formatCurrency(Number(totalEarnings.toFixed(2)))}
                    </span>
                  </div>
                  {/* <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <span className="text-amber-800 font-medium">Average Rating</span>
                    <span className="font-bold text-lg text-amber-600">-</span>
                  </div> */}
                  <div 
                    className="flex justify-between items-center p-3 bg-violet-50 rounded-lg border border-violet-100 cursor-pointer hover:bg-violet-100 transition-colors"
                    onClick={() => {
                      fetchFeedbacks();
                      setIsFeedbackModalOpen(true);
                    }}
                  >
                    <span className="text-violet-800 font-medium">Session Feedback</span>
                    <span className="font-bold text-lg text-slate-900">
                      {loadingFeedbacks ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-violet-800"></div>
                      ) : (
                        feedbacks.length > 0 ? 
                          (feedbacks.reduce((acc, curr) => acc + (curr.rating || 0), 0) / feedbacks.length).toFixed(1) : 
                          '-'
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions - Enhanced */}
              <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 text-white rounded-lg shadow-xl p-6 hover:shadow-2xl transition-shadow duration-300">
                <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <Button 
                    className="w-full bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 shadow-md hover:shadow-lg transition-all duration-300" 
                    variant="secondary"
                    onClick={() => setIsPasswordModalOpen(true)}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                   Update Password
                  </Button>
                  {/* <Button 
                    className="w-full bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 shadow-md hover:shadow-lg transition-all duration-300" 
                    variant="secondary"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    View Client Requests
                  </Button>
                  <Button 
                    className="w-full bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 shadow-md hover:shadow-lg transition-all duration-300" 
                    variant="secondary"
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button> */}
                   {/* Add the preferences button */}
                  {/* <Button 
                   variant="secondary" 
                   className="w-full h-16 text-lg font-semibold bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 shadow-md hover:shadow-lg transition-all duration-300"
                   onClick={() => setPreferencesModalOpen(true)}
                   >
                   <Settings className="w-5 h-5 mr-2" />
                     Preferences
                  </Button> */}
                </div>
              </div>
          </div>
        </div>
      </main>

      <Footer />

      <EarningsDetailModal 
        isOpen={isEarningsModalOpen}
        onClose={() => setIsEarningsModalOpen(false)}
        history={earningsHistory}
        loading={loadingEarnings}
      />

      <UpdatePasswordModal 
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onConfirm={handlePasswordUpdate}
      />

      {/* Add Feedback Modal */}
      <Dialog open={isFeedbackModalOpen} onOpenChange={setIsFeedbackModalOpen}>
        <DialogContent className="max-w-4xl w-full md:w-[700px] p-0 flex flex-col items-center justify-center">
          <DialogHeader className="w-full px-6 pt-6">
            <div className="flex justify-between items-center w-full">
              <DialogTitle className="text-2xl font-bold text-violet-800">Session Feedback</DialogTitle>
             
            </div>
            <DialogDescription className="text-slate-500 mt-1">All feedback received from your sessions is shown below. </DialogDescription>
          </DialogHeader>

          <div className="w-full px-6 pb-6">
            <div className="mt-4 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-violet-200 scrollbar-track-violet-50">
              {loadingFeedbacks ? (
                <div className="flex justify-center items-center py-16">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-800"></div>
                </div>
              ) : feedbacks.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {feedbacks.map((feedback, idx) => {
                    // Helper to truncate text
                    const truncate = (text, max = 120) => text.length > max ? text.slice(0, max) + '...' : text;
                    // Render review/message with expand/collapse
                    const renderExpandable = (text, key) => (
                      <div className="relative">
                        <p className="text-gray-600 bg-gray-50 p-3 rounded-lg whitespace-pre-line break-words">
                          {expandedFeedbacks[key] || text.length <= 120 ? text : truncate(text)}
                        </p>
                        {text.length > 120 && (
                          <button
                            className="absolute bottom-2 right-3 text-xs text-blue-600 hover:underline bg-white/80 px-1 rounded"
                            onClick={() => setExpandedFeedbacks(prev => ({ ...prev, [key]: !prev[key] }))}
                            type="button"
                          >
                            {expandedFeedbacks[key] ? 'Show less' : 'Show more'}
                          </button>
                        )}
                      </div>
                    );
                    return (
                      <Card key={feedback.booking_id + feedback.created_at} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200">
                        <CardContent className="pt-4 pb-2 px-4 flex flex-col gap-2">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-semibold text-violet-800">Session Feedback</p>
                              <p className="text-xs text-gray-400">{new Date(feedback.created_at).toLocaleDateString()}</p>
                            </div>
                            {feedback.rating && (
                              <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-full">
                                <span className="text-yellow-600 text-lg font-bold mr-1">{feedback.rating}</span>
                                <span className="text-yellow-600">/5</span>
                              </div>
                            )}
                          </div>
                          {feedback.review && (
                            <div className="mt-1">
                              <p className="text-xs font-medium text-gray-700 mb-1">Review</p>
                              {renderExpandable(feedback.review, idx * 2)}
                            </div>
                          )}
                          {feedback.message && (
                            <div className="mt-1">
                              <p className="text-xs font-medium text-gray-700 mb-1">Your Note</p>
                              {renderExpandable(feedback.message, idx * 2 + 1)}
                            </div>
                          )}
                          <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                            <span>Session ID: {feedback.booking_id}</span>
                            <span>{new Date(feedback.created_at).toLocaleTimeString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No feedback received yet</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add the PreferencesModal at the end of the component */}
      <PreferencesModal
        isOpen={preferencesModalOpen}
        onClose={() => setPreferencesModalOpen(false)}
        onSave={handleSavePreferences}
       />
    </div>
  );
};

export default ExpertDashboard;



