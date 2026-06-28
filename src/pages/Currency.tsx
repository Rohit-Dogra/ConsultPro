import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { API_BASE_URL } from '@/config/api';

interface CurrencyInfo {
  code: string;
  symbol: string;
}

interface CurrencyTimezoneContextType {
  currency: CurrencyInfo;
  timezone: string;
  setCurrencyAndTimezone: (currencyCode: string, timezone: string) => Promise<void>;
  formatCurrency: (amount: number | string) => string;
  formatDateTime: (dateTime: string | Date) => string;
}

const currencyMap: Record<string, string> = {
  USD: '$',
  INR: '₹',
};

const CurrencyTimezoneContext = createContext<CurrencyTimezoneContextType | null>(null);

export const useCurrencyTimezone = () => {
  const context = useContext(CurrencyTimezoneContext);
  if (!context) {
    throw new Error('useCurrencyTimezone must be used within a CurrencyTimezoneProvider');
  }
  return context;
};

interface CurrencyTimezoneProviderProps {
  children: ReactNode;
}

export const CurrencyTimezoneProvider: React.FC<CurrencyTimezoneProviderProps> = ({ children }) => {
  const [currency, setCurrency] = useState<CurrencyInfo>({ code: 'USD', symbol: '$' });
  const [timezone, setTimezone] = useState<string>('UTC');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user preferences on initial load
  useEffect(() => {
    const fetchUserPreferences = async () => {
      try {
        const userData = localStorage.getItem('user');
        if (!userData) {
          setIsLoading(false);
          return;
        }

        const parsedData = JSON.parse(userData);
        const token = parsedData.token || parsedData.accessToken;
        
        if (!token) {
          setIsLoading(false);
          return;
        }

        const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

        const response = await fetch(`${API_BASE_URL}/api/user/preferences`, {
          headers: {
            'Authorization': authToken,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const { currency: currencyCode, timezone: userTimezone } = data.data;
            setCurrency({ 
              code: currencyCode, 
              symbol: currencyMap[currencyCode] || currencyCode 
            });
            setTimezone(userTimezone);
          }
        }
      } catch (error) {
        console.error('Error fetching user preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserPreferences();
  }, []);

  const setCurrencyAndTimezone = async (currencyCode: string, newTimezone: string) => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('User data not found');
      }

      const parsedData = JSON.parse(userData);
      const token = parsedData.token || parsedData.accessToken;
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

      const response = await fetch(`${API_BASE_URL}/api/user/preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currency: currencyCode,
          timezone: newTimezone
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      setCurrency({ 
        code: currencyCode, 
        symbol: currencyMap[currencyCode] || currencyCode 
      });
      setTimezone(newTimezone);
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  };

  // Format currency based on user preference
  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(numAmount)) {
      return currency.symbol + '0';
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(numAmount);
  };

  // Format date/time based on user's timezone
  const formatDateTime = (dateTime: string | Date) => {
    const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
    
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: timezone
    }).format(date);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>;
  }

  return (
    <CurrencyTimezoneContext.Provider value={{
      currency,
      timezone,
      setCurrencyAndTimezone,
      formatCurrency,
      formatDateTime
    }}>
      {children}
    </CurrencyTimezoneContext.Provider>
  );
};