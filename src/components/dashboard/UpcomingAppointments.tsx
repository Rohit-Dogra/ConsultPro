import React from 'react';

interface UpcomingAppointmentsProps {
  userId?: string | number;
  userType?: string;
}

const UpcomingAppointments: React.FC<UpcomingAppointmentsProps> = ({ userId, userType }) => {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Upcoming Appointments</h2>
      <p>User ID: {userId}</p>
      <p>User Type: {userType}</p>
      <p>This is a placeholder for the UpcomingAppointments component.</p>
    </div>
  );
};

export default UpcomingAppointments;
