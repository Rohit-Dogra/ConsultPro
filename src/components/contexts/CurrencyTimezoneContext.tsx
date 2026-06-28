// import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
// import { API_BASE_URL } from '@/config/api';

// interface CurrencyInfo {
//   code: string;
//   symbol: string;
//   name?: string;
// }

// interface ConversionRate {
//   from_currency: string;
//   to_currency: string;
//   rate: number;
// }

// interface CurrencyTimezoneContextType {
//   currency: CurrencyInfo;
//   timezone: string;
//   availableCurrencies: CurrencyInfo[];
//   conversionRates: ConversionRate[];
//   setCurrencyAndTimezone: (currencyCode: string, timezone: string) => Promise<void>;
//   formatCurrency: (amount: number | string, sourceCurrency?: string) => string;
//   convertCurrency: (amount: number, fromCurrency: string, toCurrency: string) => number;
//   formatDateTime: (dateTime: string | Date) => string;
//   refreshPreferences: () => void;
//   preferencesLoaded: boolean;
// }

// const currencyMap: Record<string, string> = {
//   USD: '$',
//   INR: '₹',
// };

// const currencyNames: Record<string, string> = {
//   USD: 'US Dollar',
//   INR: 'Indian Rupee',
// };

// const CurrencyTimezoneContext = createContext<CurrencyTimezoneContextType | null>(null);

// export const useCurrencyTimezone = () => {
//   const context = useContext(CurrencyTimezoneContext);
//   if (!context) {
//     throw new Error('useCurrencyTimezone must be used within a CurrencyTimezoneProvider');
//   }
//   return context;
// };

// interface CurrencyTimezoneProviderProps {
//   children: ReactNode;
// }

// export const CurrencyTimezoneProvider: React.FC<CurrencyTimezoneProviderProps> = ({ children }) => {
//   const [currency, setCurrency] = useState<CurrencyInfo>({ code: '', symbol: '' });
//   const [timezone, setTimezone] = useState<string>('');
//   const [availableCurrencies, setAvailableCurrencies] = useState<CurrencyInfo[]>([
//     { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
//     { code: 'USD', symbol: '$', name: 'US Dollar' }
//   ]);
//   const [conversionRates, setConversionRates] = useState<ConversionRate[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [refreshCounter, setRefreshCounter] = useState(0);
//   const [preferencesLoaded, setPreferencesLoaded] = useState(false);
//   const [isApiCallInProgress, setIsApiCallInProgress] = useState(false);

//   const fetchUserPreferences = useCallback(async () => {
//     // Prevent multiple simultaneous API calls
//     if (isApiCallInProgress) {
//       //       return;
//     }
    
//     try {
//       setIsApiCallInProgress(true);
//       //       const userData = localStorage.getItem('user');
//       if (!userData) {
//         //         setIsLoading(false);
//         setPreferencesLoaded(true);
//         return;
//       }

//       const parsedData = JSON.parse(userData);
//       const token = parsedData.token || parsedData.accessToken;
      
//       if (!token) {
//         //         setIsLoading(false);
//         setPreferencesLoaded(true);
//         return;
//       }
  
//       const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
//       //       // Fetch user preferences
//       const response = await fetch(`${API_BASE_URL}/api/user/preferences`, {
//         headers: {
//           'Authorization': authToken,
//           'Content-Type': 'application/json'
//         }
//       });

//       //       if (response.ok) {
//         const data = await response.json();
//         //         if (data.success && data.data) {
//           const { currency: currencyCode, timezone: userTimezone } = data.data;
          
//           if (currencyCode) {
//             //             setCurrency({ 
//               code: currencyCode, 
//               symbol: currencyMap[currencyCode] || currencyCode,
//               name: currencyNames[currencyCode] || currencyCode
//             });
//           }
          
//           if (userTimezone) {
//             //             setTimezone(userTimezone);
//           }
//         }
//       }

//       // Fetch available currencies and conversion rates
//       try {
//         const currenciesResponse = await fetch(`${API_BASE_URL}/api/currencies`, {
//           headers: {
//             'Authorization': authToken,
//             'Content-Type': 'application/json'
//           }
//         });
        
//         if (currenciesResponse.ok) {
//           const currenciesData = await currenciesResponse.json();
//           if (currenciesData.success) {
//             setAvailableCurrencies(currenciesData.data.currencies || availableCurrencies);
//             setConversionRates(currenciesData.data.rates || []);
//           }
//         }
//       } catch (currencyError) {
//         //       }
      
//       setPreferencesLoaded(true);
//     } catch (error) {
//       //       setPreferencesLoaded(true);
//     } finally {
//       setIsLoading(false);
//       setIsApiCallInProgress(false);
//     }
//   }, [availableCurrencies, isApiCallInProgress]);

//   // Use refreshCounter to trigger preference refresh
//   useEffect(() => {
//     // Only fetch if not already loaded or if explicitly refreshing
//     if (!preferencesLoaded || refreshCounter > 0) {
//       fetchUserPreferences();
//     }
//   }, [fetchUserPreferences, refreshCounter, preferencesLoaded]);

//   const refreshPreferences = () => {
//     setRefreshCounter(prev => prev + 1);
//   };

//   const setCurrencyAndTimezone = async (currencyCode: string, newTimezone: string) => {
//     try {
//       //       // Set locally immediately for better UX
//       setCurrency({ 
//         code: currencyCode, 
//         symbol: currencyMap[currencyCode] || currencyCode 
//       });
//       setTimezone(newTimezone);
      
//       const userData = localStorage.getItem('user');
//       if (!userData) {
//         throw new Error('User data not found');
//       }

//       const parsedData = JSON.parse(userData);
//       const token = parsedData.token || parsedData.accessToken;
      
//       if (!token) {
//         throw new Error('Authentication token not found');
//       }

//       const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
//       //       const response = await fetch(`${API_BASE_URL}/api/user/preferences`, {
//         method: 'PUT',
//         headers: {
//           'Authorization': authToken,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           currency: currencyCode,
//           timezone: newTimezone
//         })
//       });

//       //       if (!response.ok) {
//         const errorData = await response.json().catch(() => ({}));
//         //         throw new Error(errorData.message || 'Failed to update preferences');
//       }

//       // Update all currency symbols in database
//       const symbolResponse = await fetch(`${API_BASE_URL}/api/currency-symbols/update-symbols`, {
//         method: 'POST',
//         headers: {
//           'Authorization': authToken,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           currency: currencyCode
//         })
//       });

//       if (!symbolResponse.ok) {
//         //       }

//       //     } catch (error) {
//       //       throw error;
//     }
//   };

//   const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
//     if (fromCurrency === toCurrency) return amount;
    
//     const rate = conversionRates.find(r => 
//       r.from_currency === fromCurrency && r.to_currency === toCurrency
//     );
    
//     if (rate) {
//       return amount * rate.rate;
//     }
    
//     // Try reverse rate
//     const reverseRate = conversionRates.find(r => 
//       r.from_currency === toCurrency && r.to_currency === fromCurrency
//     );
    
//     if (reverseRate) {
//       return amount / reverseRate.rate;
//     }
    
//     // Default conversion rates if not found in database
//     const defaultRates: Record<string, Record<string, number>> = {
//       'INR': { 'USD': 0.012 },
//       'USD': { 'INR': 83.0 }
//     };
    
//     if (defaultRates[fromCurrency] && defaultRates[fromCurrency][toCurrency]) {
//       return amount * defaultRates[fromCurrency][toCurrency];
//     }
    
//     return amount; // No conversion if rate not found
//   };

//   const formatCurrency = (amount: number | string, sourceCurrency?: string) => {
//     const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
//     if (isNaN(numAmount)) {
//       const currencyToUse = currency.code || 'USD';
//       const symbolToUse = currencyMap[currencyToUse] || '$';
//       return `${symbolToUse}0`;
//     }
    
//     // Determine source currency (what's stored in database)
//     // Default to INR if not specified, as most data is stored in INR
//     const fromCurrency = sourceCurrency || 'INR';
//     const toCurrency = currency.code || 'USD';
    
//     let finalAmount = numAmount;
    
//     // Convert currency if user's preference is different from stored currency
//     if (fromCurrency !== toCurrency) {
//       finalAmount = convertCurrency(numAmount, fromCurrency, toCurrency);
//     }
    
//     try {
//       return new Intl.NumberFormat('en-US', {
//         style: 'currency',
//         currency: toCurrency,
//         minimumFractionDigits: 0,
//         maximumFractionDigits: 2
//       }).format(finalAmount);
//     } catch (error) {
//       // Fallback if Intl.NumberFormat fails
//       const symbolToUse = currencyMap[toCurrency] || toCurrency;
//       return `${symbolToUse}${finalAmount.toFixed(2)}`;
//     }
//   };

//   const formatDateTime = (dateTime: string | Date) => {
//     const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
    
//     const options: Intl.DateTimeFormatOptions = {
//       dateStyle: 'medium',
//       timeStyle: 'short',
//     };
    
//     if (timezone) {
//       options.timeZone = timezone;
//     }
    
//     return new Intl.DateTimeFormat('en-US', options).format(date);
//   };

//   const contextValue = {
//     currency,
//     timezone,
//     availableCurrencies,
//     conversionRates,
//     setCurrencyAndTimezone,
//     formatCurrency,
//     convertCurrency,
//     formatDateTime,
//     refreshPreferences,
//     preferencesLoaded
//   };

//   return (
//     <CurrencyTimezoneContext.Provider value={contextValue}>
//       {children}
//     </CurrencyTimezoneContext.Provider>
//   );
// };

import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { API_BASE_URL } from '@/config/api';

interface CurrencyInfo {
  code: string;
  symbol: string;
  name?: string;
}

interface ConversionRate {
  from_currency: string;
  to_currency: string;
  rate: number;
}

interface CurrencyTimezoneContextType {
  currency: CurrencyInfo;
  timezone: string;
  availableCurrencies: CurrencyInfo[];
  conversionRates: ConversionRate[];
  setCurrencyAndTimezone: (currencyCode: string, timezone: string) => Promise<void>;
  formatCurrency: (amount: number | string, sourceCurrency?: string) => string;
  convertCurrency: (amount: number, fromCurrency: string, toCurrency: string) => number;
  formatDateTime: (dateTime: string | Date) => string;
  refreshPreferences: () => void;
  refreshRates: () => Promise<void>;
  preferencesLoaded: boolean;
}

const currencyMap: Record<string, string> = {
  USD: '$',
  INR: '₹',
};

const currencyNames: Record<string, string> = {
  USD: 'US Dollar',
  INR: 'Indian Rupee',
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
  const [currency, setCurrency] = useState<CurrencyInfo>({ code: '', symbol: '' });
  const [timezone, setTimezone] = useState<string>('');
  const [availableCurrencies, setAvailableCurrencies] = useState<CurrencyInfo[]>([
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' }
  ]);
  const [conversionRates, setConversionRates] = useState<ConversionRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [isApiCallInProgress, setIsApiCallInProgress] = useState(false);

  const fetchUserPreferences = useCallback(async () => {
    // Prevent multiple simultaneous API calls
    if (isApiCallInProgress) {
      return;
    }
    
    try {
      setIsApiCallInProgress(true);
      const userData = localStorage.getItem('user');
      if (!userData) {
        setIsLoading(false);
        setPreferencesLoaded(true);
        return;
      }

      const parsedData = JSON.parse(userData);
      const token = parsedData.token || parsedData.accessToken;
      
      if (!token) {
        setIsLoading(false);
        setPreferencesLoaded(true);
        return;
      }
  
      const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

      // Fetch user preferences
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
          
          if (currencyCode) {
            setCurrency({ 
              code: currencyCode, 
              symbol: currencyMap[currencyCode] || currencyCode,
              name: currencyNames[currencyCode] || currencyCode
            });
          }
          
          if (userTimezone) {
            setTimezone(userTimezone);
          }
        }
      }

      // Fetch available currencies and conversion rates
      try {
        const currenciesResponse = await fetch(`${API_BASE_URL}/api/currencies`, {
          headers: {
            'Authorization': authToken,
            'Content-Type': 'application/json'
          }
        });
        
        if (currenciesResponse.ok) {
          const currenciesData = await currenciesResponse.json();
          if (currenciesData.success) {
            setAvailableCurrencies(currenciesData.data.currencies || availableCurrencies);
            setConversionRates(currenciesData.data.rates || []);
          }
        }
      } catch (currencyError) {
        // Silent error handling
      }
      
      setPreferencesLoaded(true);
    } catch (error) {
      setPreferencesLoaded(true);
    } finally {
      setIsLoading(false);
      setIsApiCallInProgress(false);
    }
  }, [availableCurrencies, isApiCallInProgress]);

  // Use refreshCounter to trigger preference refresh
  useEffect(() => {
    // Only fetch if not already loaded or if explicitly refreshing
    if (!preferencesLoaded || refreshCounter > 0) {
      fetchUserPreferences();
    }
  }, [fetchUserPreferences, refreshCounter, preferencesLoaded]);

  const refreshPreferences = () => {
    setRefreshCounter(prev => prev + 1);
  };

  // Function to refresh conversion rates from global currency API
  const refreshConversionRates = useCallback(async () => {
    // Disabled to prevent CORS errors and infinite loops
    // The endpoint /api/global-currency/rates may not exist
    return;
  }, []);

  // Only refresh rates on manual request, not automatically
  // useEffect(() => {
  //   const interval = setInterval(refreshConversionRates, 5 * 60 * 1000); // 5 minutes
  //   return () => clearInterval(interval);
  // }, [refreshConversionRates]);

  const setCurrencyAndTimezone = async (currencyCode: string, newTimezone: string) => {
    try {
      // Set locally immediately for better UX
      setCurrency({ 
        code: currencyCode, 
        symbol: currencyMap[currencyCode] || currencyCode 
      });
      setTimezone(newTimezone);
      
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update preferences');
      }

      // Update all currency symbols in database
      const symbolResponse = await fetch(`${API_BASE_URL}/api/currency-symbols/update-symbols`, {
        method: 'POST',
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currency: currencyCode
        })
      });

      if (!symbolResponse.ok) {
        // Silent error handling
      }
    } catch (error) {
      throw error;
    }
  };

  const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency) return amount;
    
    // First try to find exact rate
    const rate = conversionRates.find(r => 
      r.from_currency === fromCurrency && r.to_currency === toCurrency
    );
    
    if (rate) {
      return amount * rate.rate;
    }
    
    // Try reverse rate
    const reverseRate = conversionRates.find(r => 
      r.from_currency === toCurrency && r.to_currency === fromCurrency
    );
    
    if (reverseRate) {
      return amount / reverseRate.rate;
    }
    
    // Default conversion rates if not found in database (updated values)
    const defaultRates: Record<string, Record<string, number>> = {
      'INR': { 'USD': 0.012 },
      'USD': { 'INR': 83.5 }
    };
    
    if (defaultRates[fromCurrency] && defaultRates[fromCurrency][toCurrency]) {
      return amount * defaultRates[fromCurrency][toCurrency];
    }
    
    return amount; // No conversion if rate not found
  };

  const formatCurrency = (amount: number | string, sourceCurrency?: string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(numAmount)) {
      const currencyToUse = currency.code || 'USD';
      const symbolToUse = currencyMap[currencyToUse] || '$';
      return `${symbolToUse}0`;
    }
    
    // Determine source currency (what's stored in database)
    // Default to INR if not specified, as most data is stored in INR
    const fromCurrency = sourceCurrency || 'INR';
    const toCurrency = currency.code || 'USD';
    
    let finalAmount = numAmount;
    
    // Convert currency if user's preference is different from stored currency
    if (fromCurrency !== toCurrency) {
      finalAmount = convertCurrency(numAmount, fromCurrency, toCurrency);
    }
    
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: toCurrency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(finalAmount);
    } catch (error) {
      // Fallback if Intl.NumberFormat fails
      const symbolToUse = currencyMap[toCurrency] || toCurrency;
      return `${symbolToUse}${finalAmount.toFixed(2)}`;
    }
  };

  const formatDateTime = (dateTime: string | Date) => {
    const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
    
    const options: Intl.DateTimeFormatOptions = {
      dateStyle: 'medium',
      timeStyle: 'short',
    };
    
    if (timezone) {
      options.timeZone = timezone;
    }
    
    return new Intl.DateTimeFormat('en-US', options).format(date);
  };

  const contextValue = {
    currency,
    timezone,
    availableCurrencies,
    conversionRates,
    setCurrencyAndTimezone,
    formatCurrency,
    convertCurrency,
    formatDateTime,
    refreshPreferences,
    refreshRates: refreshConversionRates,
    preferencesLoaded
  };

  return (
    <CurrencyTimezoneContext.Provider value={contextValue}>
      {children}
    </CurrencyTimezoneContext.Provider>
  );
};