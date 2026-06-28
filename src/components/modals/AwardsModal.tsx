import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Update the interface to match database schema
interface AwardFormData {
  title: string;
  issuer: string;
  issue_date: string; // Changed from issueDate to match DB
  description: string;
}

// Update schema validation to match database fields
const awardsSchema = z.object({
  title: z.string().min(1, "Award title is required").trim(),
  issuer: z.string().min(1, "Issuer is required").trim(),
  issue_date: z.string().min(1, "Issue date is required"), // Changed from issueDate
  description: z.string().min(1, "Description is required").trim()
});

// Base modal props interface
interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  isSubmitting?: boolean;
}

// Update props interface to use proper types
interface AwardsModalProps extends BaseModalProps {}

export function AwardsModal({ isOpen, onClose, onSave }: AwardsModalProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<AwardFormData>({
    resolver: zodResolver(awardsSchema)
  });

  const onSubmit = async (data: AwardFormData) => {
    try {
      // Format and validate data before submission
      const formattedData = {
        title: data.title.trim(),
        issuer: data.issuer.trim(),
        issue_date: new Date(data.issue_date).toISOString().split('T')[0],
        description: data.description.trim()
      };

      console.log('Submitting award data:', formattedData);
      await onSave(formattedData);
      reset();
      onClose();
    } catch (error) {
      console.error('Failed to save award:', error);
      throw error; // Let parent component handle the error
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {
      reset();
      onClose();
    }}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Add Award or Achievement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Award Title *</Label>
              <Input {...register('title')} id="title" placeholder="Ex: Employee of the Year" />
              {errors.title && <span className="text-red-500 text-sm">{errors.title.message}</span>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="issuer">Issuer *</Label>
              <Input {...register('issuer')} id="issuer" placeholder="Ex: Company Name or Institution" />
              {errors.issuer && <span className="text-red-500 text-sm">{errors.issuer.message}</span>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="issue_date">Issue Date *</Label>
              <Input {...register('issue_date')} type="date" id="issue_date" />
              {errors.issue_date && <span className="text-red-500 text-sm">{errors.issue_date.message}</span>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                {...register('description')}
                id="description"
                placeholder="Describe your achievement and its significance..."
                className="min-h-[100px]"
              />
              {errors.description && <span className="text-red-500 text-sm">{errors.description.message}</span>}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                reset();
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
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