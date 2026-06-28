import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Add to all modal components:
interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  isSubmitting?: boolean;
}

// Update the interface to match backend types
interface EducationFormData {
  school: string;
  degree: string;
  field_of_study: string;  // Changed to match DB column
  start_date: string;      // Changed to match DB column
  end_date?: string | null;
  grade?: string | null;
  activities?: string | null;
  description?: string | null;
}

interface EducationModalProps extends BaseModalProps {
  // isOpen: boolean;
  // onClose: () => void;
  // onSave: (data: EducationFormData) => Promise<void>;
}

// Update the validation schema
const educationSchema = z.object({
  school: z.string().min(1, "School name is required"),
  degree: z.string().min(1, "Degree is required"),
  field_of_study: z.string().min(1, "Field of study is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional(),
  grade: z.string().optional(),
  activities: z.string().optional(),
  description: z.string().optional()
}).refine((data) => {
  if (data.end_date && data.start_date > data.end_date) {
    return false;
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["end_date"]
});

export function EducationModal({ isOpen, onClose, onSave, isSubmitting }: EducationModalProps) {
  const form = useForm<EducationFormData>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      school: '',
      degree: '',
      field_of_study: '',
      start_date: '',
      end_date: null,
      grade: null,
      activities: null,
      description: null
    }
  });

  const { register, handleSubmit, formState: { errors }, reset } = form;

  const onSubmit = async (data: EducationFormData) => {
    try {
      // Validate all required fields
      if (!data.school?.trim() || !data.degree?.trim() || !data.field_of_study?.trim() || !data.start_date) {
        throw new Error('Please fill in all required fields');
      }

      // Format data before submission
      const formattedData = {
        ...data,
        school: data.school.trim(),
        degree: data.degree.trim(),
        field_of_study: data.field_of_study.trim(),
        start_date: new Date(data.start_date).toISOString().split('T')[0],
        end_date: data.end_date ? new Date(data.end_date).toISOString().split('T')[0] : null,
        grade: data.grade?.trim() || null,
        activities: data.activities?.trim() || null,
        description: data.description?.trim() || null
      };

      console.log('Submitting education data:', formattedData);
      
      await onSave(formattedData);
      reset();
      onClose();
    } catch (error) {
      console.error('Failed to save education:', error);
      // Let the parent component handle the error
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
      <DialogContent className="w-[95%] max-w-[525px] h-auto max-h-[90vh] overflow-y-auto p-4 md:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl md:text-2xl font-semibold">
            Add Education
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Add your education details below. Fields marked with * are required.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="grid gap-4">
            {/* School/University Field */}
            <div className="space-y-2">
              <Label htmlFor="school" className="text-sm font-medium">
                School/University *
              </Label>
              <Input 
                {...register('school')} 
                id="school" 
                className="w-full h-10 px-3"
                placeholder="Ex: Stanford University" 
              />
              {errors.school && 
                <span className="text-red-500 text-xs md:text-sm">
                  {errors.school.message as string}
                </span>
              }
            </div>

            {/* Degree and Field of Study */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="degree" className="text-sm font-medium">
                  Degree *
                </Label>
                <Input 
                  {...register('degree')} 
                  id="degree" 
                  className="w-full h-10 px-3"
                  placeholder="Ex: Bachelor's" 
                />
                {errors.degree && 
                  <span className="text-red-500 text-xs md:text-sm">
                    {errors.degree.message as string}
                  </span>
                }
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fieldOfStudy" className="text-sm font-medium">
                  Field of Study *
                </Label>
                <Input 
                  {...register('field_of_study')} 
                  id="fieldOfStudy" 
                  className="w-full h-10 px-3"
                  placeholder="Ex: Computer Science" 
                />
                {errors.field_of_study && 
                  <span className="text-red-500 text-xs md:text-sm">
                    {errors.field_of_study.message as string}
                  </span>
                }
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-sm font-medium">
                  Start Date *
                </Label>
                <Input 
                  {...register('start_date')} 
                  type="date" 
                  id="startDate" 
                  className="w-full h-10 px-3"
                />
                {errors.start_date && 
                  <span className="text-red-500 text-xs md:text-sm">
                    {errors.start_date.message as string}
                  </span>
                }
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-sm font-medium">
                  End Date
                </Label>
                <Input 
                  {...register('end_date')} 
                  type="date" 
                  id="endDate" 
                  className="w-full h-10 px-3"
                />
              </div>
            </div>

            {/* Grade */}
            <div className="space-y-2">
              <Label htmlFor="grade" className="text-sm font-medium">
                Grade
              </Label>
              <Input 
                {...register('grade')} 
                id="grade" 
                className="w-full h-10 px-3"
                placeholder="Ex: 3.8 GPA" 
              />
            </div>

            {/* Activities */}
            <div className="space-y-2">
              <Label htmlFor="activities" className="text-sm font-medium">
                Activities and societies
              </Label>
              <Textarea 
                {...register('activities')} 
                id="activities" 
                className="w-full min-h-[80px] px-3 py-2"
                placeholder="Ex: Student council, Debate club" 
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea 
                {...register('description')} 
                id="description" 
                className="w-full min-h-[100px] px-3 py-2"
                placeholder="Add other details about your education" 
              />
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
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