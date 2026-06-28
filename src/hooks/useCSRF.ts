import { useState, useEffect } from 'react';

export const useCSRF = () => {
  const [csrfToken, setCSRFToken] = useState<string | null>(null);

  const fetchCSRFToken = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return null;

      const user = JSON.parse(userData);
      const API_URL = import.meta.env.VITE_API_URL;
      
      const response = await fetch(`${API_URL}/api/subscriptions/csrf-token`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setCSRFToken(data.csrfToken);
        return data.csrfToken;
      }
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
    }
    return null;
  };

  useEffect(() => {
    fetchCSRFToken();
  }, []);

  return { csrfToken, fetchCSRFToken };
};