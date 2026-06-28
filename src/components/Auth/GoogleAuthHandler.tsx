import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/api';
import { saveLastUser } from '@/utils/lastUserStorage';

declare global {
  interface Window {
    google: any;
  }
}

interface GoogleAuthHandlerProps {
  onSuccess?: (userData: any) => void;
  onError?: (error: string) => void;
}

const GoogleAuthHandler: React.FC<GoogleAuthHandlerProps> = ({ onSuccess, onError }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
        });
      }
    };

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handleCredentialResponse = async (response: any) => {
    try {
      const { credential } = response;
      
      // Send credential to backend for verification
      const backendResponse = await fetch(`${API_BASE_URL}/api/google-auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential }),
      });

      const result = await backendResponse.json();

      if (!backendResponse.ok) {
        throw new Error(result.message || 'Google authentication failed');
      }

      // Store user data
      const userData = {
        id: result.data.id,
        name: result.data.name,
        email: result.data.email,
        role: result.data.role,
        token: result.data.token,
        profile_picture: result.data.profile_picture,
        profile_completed: !result.data.isNewUser
      };

      localStorage.setItem('user', JSON.stringify(userData));

      // Save as last user for future logins
      saveLastUser({
        name: result.data.name,
        email: result.data.email,
        picture: result.data.profile_picture
      });

      toast.success(result.data.isNewUser ? 'Account created successfully!' : 'Login successful!');

      if (onSuccess) {
        onSuccess(userData);
      } else {
        // Default navigation logic
        if (result.data.isNewUser) {
          navigate('/auth/SeekerProfileForm', { 
            replace: true,
            state: { 
              isNewUser: true,
              userId: result.data.id 
            }
          });
        } else {
          navigate('/seekerdashboard', { replace: true });
        }
      }

    } catch (error) {
      console.error('Google auth error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Google authentication failed';
      toast.error(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  const triggerGoogleSignIn = () => {
    if (window.google) {
      window.google.accounts.id.prompt();
    }
  };

  return null; // This component doesn't render anything
};

export default GoogleAuthHandler;
export { GoogleAuthHandler };