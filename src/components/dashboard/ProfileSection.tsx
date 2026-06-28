import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { useNavigate } from 'react-router-dom';

interface ProfileSectionProps {
  user: any;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ user }) => {
  const navigate = useNavigate();

  // Early return with fallback UI if user is null
  if (!user) {
    return (
      <div className="flex flex-col items-center text-center">
        <Avatar className="h-24 w-24 mb-4">
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
        <h2 className="text-xl font-bold mb-1">User Not Found</h2>
        <p className="text-muted-foreground mb-4">Please log in again</p>
        <Button 
          variant="outline" 
          className="w-full mb-2"
          onClick={() => navigate('/login')}
        >
          Go to Login
        </Button>
      </div>
    );
  }

  // Get initials for avatar fallback
  const getInitials = () => {
    const firstName = user?.first_name || '';
    const lastName = user?.last_name || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  };

  return (
    <div className="flex flex-col items-center text-center">
      <Avatar className="h-24 w-24 mb-4">
        <AvatarImage src={user?.profile_image || ''} />
        <AvatarFallback>{getInitials()}</AvatarFallback>
      </Avatar>
      <h2 className="text-xl font-bold mb-1">
        {user?.first_name || 'User'} {user?.last_name || ''}
      </h2>
      <p className="text-muted-foreground mb-4">
        {user?.specialty || user?.designation || 'Expert'}
      </p>
      <Button 
        variant="outline" 
        className="w-full mb-2"
        onClick={() => navigate('/profile')}
      >
        Edit Profile
      </Button>
      <Button 
        variant="outline" 
        className="w-full"
        onClick={() => navigate('/availability')}
      >
        Manage Availability
      </Button>
      
      <div className="w-full mt-6">
        <h3 className="font-medium mb-2">Contact Information</h3>
        <div className="text-sm">
          <p className="mb-1">
            <span className="text-muted-foreground">Email:</span> {user?.email || 'No email available'}
          </p>
          <p className="mb-1">
            <span className="text-muted-foreground">Phone:</span> {user?.phone || 'No phone available'}
          </p>
          <p className="mb-1">
            <span className="text-muted-foreground">Location:</span> {user?.location || 'No location available'}
          </p>
        </div>
      </div>
      
      {user?.bio && (
        <div className="w-full mt-4">
          <h3 className="font-medium mb-2">Bio</h3>
          <p className="text-sm text-muted-foreground">
            {user.bio}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProfileSection;

