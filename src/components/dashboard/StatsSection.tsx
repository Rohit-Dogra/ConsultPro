import React from 'react';

interface StatsSectionProps {
  userId?: string | number;
}

const StatsSection: React.FC<StatsSectionProps> = ({ userId }) => {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Stats Section</h2>
      <p>User ID: {userId}</p>
      <p>This is a placeholder for the StatsSection component.</p>
    </div>
  );
};

export default StatsSection;
