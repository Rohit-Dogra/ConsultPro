import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Update the interface
interface ExperienceFormData {
  title: string;
  employment_type?: string; // Make optional
  company: string;
  location: string;
  start_date: string;
  end_date?: string | null;
  is_current: boolean;
  industry?: string; // Make optional
  description: string;
}

// Update the schema
const experienceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  employment_type: z.string().optional(), // Make optional
  company: z.string().min(1, "Company is required"),
  location: z.string().min(1, "Location is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional(),
  is_current: z.boolean(),
  industry: z.string().optional(), // Make optional
  description: z.string().min(1, "Description is required")
}).refine((data) => {
  if (!data.is_current && data.end_date && data.start_date > data.end_date) {
    return false;
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["end_date"]
});

// Update props interface to use ExperienceFormData type
interface ExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ExperienceFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function ExperienceModal({ isOpen, onClose, onSave }: ExperienceModalProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting }, reset } = useForm<ExperienceFormData>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      title: '',
      employment_type: '',
      company: '',
      location: '',
      start_date: '',
      end_date: null,
      is_current: false,
      industry: '',
      description: ''
    }
  });

  const is_current = watch('is_current');

  // Update the onSubmit function with safe optional chaining
  const onSubmit = async (data: ExperienceFormData) => {
    try {
      // Validate required fields
      if (!data.title?.trim() || !data.company?.trim() || !data.start_date) {
        throw new Error('Please fill in all required fields');
      }

      // Format dates and trim strings with optional chaining
      const formattedData = {
        title: data.title.trim(),
        employment_type: data.employment_type?.trim() || null,
        company: data.company.trim(),
        location: data.location.trim(),
        start_date: new Date(data.start_date).toISOString().split('T')[0],
        end_date: data.is_current ? null : (data.end_date ? new Date(data.end_date).toISOString().split('T')[0] : null),
        is_current: Boolean(data.is_current),
        industry: data.industry?.trim() || null,
        description: data.description.trim()
      };

      console.log('Submitting experience data:', formattedData);
      await onSave(formattedData);
      reset();
      onClose();
    } catch (error) {
      console.error('Failed to save experience:', error);
      throw error;
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={() => {
        reset();
        onClose();
      }}
    >
      <DialogContent 
        className="w-[95%] max-w-[525px] h-auto max-h-[90vh] overflow-y-auto p-4 md:p-6"
        aria-describedby="experience-form-description"
      >
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl md:text-2xl font-semibold">
            Add Experience
          </DialogTitle>
          <div id="experience-form-description" className="text-sm text-muted-foreground">
            Add your work experience details below. Fields marked with * are required.
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          {/* Job Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">Job Title *</Label>
            <Input 
              {...register('title')} 
              id="title" 
              className="w-full h-10"
              placeholder="Ex: Senior Software Engineer" 
            />
            {errors.title && <span className="text-red-500 text-xs md:text-sm">{errors.title.message as string}</span>}
          </div>

          {/* Employment Type and Company - 2 columns on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employment_type" className="text-sm font-medium">Employment Type</Label>
              <Input 
                {...register('employment_type')} 
                id="employment_type" 
                className="w-full h-10"
                placeholder="Ex: Full-time" 
              />
              {errors.employment_type && <span className="text-red-500 text-xs md:text-sm">{errors.employment_type.message as string}</span>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company" className="text-sm font-medium">Company *</Label>
              <Input 
                {...register('company')} 
                id="company" 
                className="w-full h-10"
                placeholder="Ex: Google" 
              />
              {errors.company && <span className="text-red-500 text-xs md:text-sm">{errors.company.message as string}</span>}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-medium">Location *</Label>
            <Input 
              {...register('location')} 
              id="location" 
              className="w-full h-10"
              placeholder="Ex: Bangalore, India" 
            />
            {errors.location && <span className="text-red-500 text-xs md:text-sm">{errors.location.message as string}</span>}
          </div>

          {/* Current Job Checkbox */}
          {/* <div className="flex items-center space-x-2 py-2">
            <Checkbox
              id="is_current"
              checked={is_current}
              onCheckedChange={(checked) => setValue('is_current', Boolean(checked))}
              className="h-4 w-4"
            />
            <Label htmlFor="is_current" className="text-sm font-medium">I currently work here</Label>
          </div> */}

          {/* Dates - 2 columns on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date" className="text-sm font-medium">Start Date *</Label>
              <Input 
                {...register('start_date')} 
                type="date" 
                id="start_date" 
                className="w-full h-10"
              />
              {errors.start_date && <span className="text-red-500 text-xs md:text-sm">{errors.start_date.message as string}</span>}
            </div>
            
            {!is_current && (
              <div className="space-y-2">
                <Label htmlFor="end_date" className="text-sm font-medium">End Date</Label>
                <Input 
                  {...register('end_date')} 
                  type="date" 
                  id="end_date" 
                  className="w-full h-10"
                />
                {errors.end_date && <span className="text-red-500 text-xs md:text-sm">{errors.end_date.message as string}</span>}
              </div>
            )}
          </div>

          {/* Industry */}
          <div className="space-y-2">
            <Label htmlFor="industry" className="text-sm font-medium">Industry</Label>
            <Input 
              {...register('industry')} 
              id="industry" 
              className="w-full h-10"
              placeholder="Ex: Information Technology" 
            />
            {errors.industry && <span className="text-red-500 text-xs md:text-sm">{errors.industry.message as string}</span>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">Description *</Label>
            <Textarea
              {...register('description')}
              id="description"
              className="w-full min-h-[120px] resize-y"
              placeholder="Describe your role and responsibilities..."
            />
            {errors.description && <span className="text-red-500 text-xs md:text-sm">{errors.description.message as string}</span>}
          </div>

          {/* Footer Buttons */}
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-4 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                reset();
                onClose();
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Add error boundaries
const withErrorBoundary = (WrappedComponent: React.ComponentType) => {
  return class extends React.Component {
    state = { hasError: false };
    
    static getDerivedStateFromError() {
      return { hasError: true };
    }

    render() {
      if (this.state.hasError) {
        return <div>Something went wrong.</div>;
      }
      return <WrappedComponent {...this.props} />;
    }
  };
};