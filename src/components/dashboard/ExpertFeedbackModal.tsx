import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

// This modal is shown only when both seeker and expert have joined and the call is ended.
// The parent component controls when it appears based on backend logic.

interface ExpertFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: string) => void;
}

const ExpertFeedbackModal: React.FC<ExpertFeedbackModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    setSubmitting(true);
    await onSubmit(feedback);
    setSubmitting(false);
    setFeedback('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Session Feedback</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder="Write your feedback for the session"
            className="min-h-[100px]"
            maxLength={300}
            required
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting || !feedback.trim()}>{submitting ? 'Submitting...' : 'Submit Feedback'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExpertFeedbackModal; 