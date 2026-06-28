import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import ReactStars from 'react-rating-stars-component';

interface Feedback {
  id: string;
  rating: number;
  review: string;
  created_at: string;
  seeker_name: string;
}

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedbacks: Feedback[];
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, feedbacks }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800">Session Feedback</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {feedbacks.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No feedback available yet</p>
          ) : (
            feedbacks.map((feedback) => (
              <Card key={feedback.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {/* <span className="font-medium text-gray-800">{feedback.seeker_name}</span> */}
                      <span className="text-sm text-gray-500">
                        {new Date(feedback.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="mb-2">
                      <ReactStars
                        count={5}
                        value={feedback.rating}
                        size={20}
                        activeColor="#fbbf24"
                        edit={false}
                      />
                    </div>
                    
                    {feedback.review && (
                      <p className="text-gray-600 mt-2">{feedback.review}</p>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackModal; 