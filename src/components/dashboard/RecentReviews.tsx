import React from 'react';

interface RecentReviewsProps {
  userId?: string | number;
}

const RecentReviews: React.FC<RecentReviewsProps> = ({ userId }) => {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Recent Reviews</h2>
      <p>User ID: {userId}</p>
      <p>This is a placeholder for the RecentReviews component.</p>
    </div>
  );
};

export default RecentReviews;
