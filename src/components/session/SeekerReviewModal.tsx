import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ReactStars from 'react-rating-stars-component';

interface SeekerReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, review: string) => void;
}

const SeekerReviewModal: React.FC<SeekerReviewModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    setSubmitting(true);
    await onSubmit(rating, review);
    setSubmitting(false);
    setRating(0);
    setReview('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rate Your Session</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center">
            <ReactStars
              count={5}
              value={rating}
              onChange={setRating}
              size={32}
              activeColor="#fbbf24"
            />
            <span className="text-sm text-gray-500 mt-2">How was your experience?</span>
          </div>
          <Textarea
            value={review}
            onChange={e => setReview(e.target.value)}
            placeholder="Write your review (optional)"
            className="min-h-[80px]"
            maxLength={300}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting || rating === 0}>{submitting ? 'Submitting...' : 'Submit Review'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SeekerReviewModal; 