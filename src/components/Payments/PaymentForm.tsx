import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Shield, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCurrencyTimezone } from '../contexts/CurrencyTimezoneContext';

interface PaymentFormProps {
  onPaymentInitiate: (amount: number, transactionId: string) => Promise<void>;
  initialAmount: number;
  customerDetails: {
    bookingId: string;
  };
  sessionDetails: {
    expertId: string;
    expertName: string;
    sessionType: string;
    sessionDate: string;
    sessionTime: string;
  };
  subscriptionData?: {
    planId: string;
    planKey: string;
    planName: string;
    validityMonths: number | null;
  };
  isLoading: boolean;
}

interface PaymentResponse {
  success: boolean;
  data: {
    redirectUrl: string;
    transactionId: string;
    successUrl?: string;
    failureUrl?: string;
  };
  message: string;
}

const PaymentForm = ({ 
  onPaymentInitiate, 
  initialAmount,
  customerDetails,
  sessionDetails,
  subscriptionData,
  isLoading: isLoadingProp
}: PaymentFormProps) => {
  const [amount, setAmount] = useState<string>(initialAmount.toString());
  const [bookingId, setBookingId] = useState<string>(customerDetails.bookingId);
  const [isLoading, setIsLoading] = useState(isLoadingProp);
  const { toast } = useToast();
   const { currency, timezone, setCurrencyAndTimezone, formatCurrency, formatDateTime } = useCurrencyTimezone();

  const generateTransactionId = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `TXN${timestamp}${random}`;
  };

  const getUserData = () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        console.log('No user data found in localStorage');
        return null;
      }

      const parsed = JSON.parse(userData);
      console.log('Parsed user data:', { ...parsed, token: parsed.token ? '[PRESENT]' : '[MISSING]' });
      
      // Check for token with fallbacks
      const token = parsed.token || parsed.accessToken;
      const userId = parsed.id || parsed.user_id;
      
      if (!token || !userId) {
        console.log('Missing required auth fields:', { hasToken: !!token, hasUserId: !!userId });
        return null;
      }

      return {
        token,
        user_id: userId,
        name: parsed.name,
        email: parsed.email
      };
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  };

  useEffect(() => {
    const userData = getUserData();
    if (!userData) {
      toast({
        title: "Authentication Required",
        description: "Please login to proceed with payment",
        variant: "destructive"
      });
    }
  }, []);

  const handlePayment = async () => {
    console.log('=== PAYMENT INITIATION STARTED ===');
    
    if (!amount || !bookingId) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Prevent multiple clicks
    if (isLoading) {
      console.log('Payment already in progress, ignoring duplicate request');
      return;
    }

    setIsLoading(true);

    try {
      const userData = getUserData();
      if (!userData?.token || !userData?.user_id) {
        throw new Error('Authentication required. Please login again.');
      }

      const transactionId = generateTransactionId();
      const API_URL = import.meta.env.VITE_API_URL;

      // Store comprehensive payment data for recovery
      const paymentContext = {
        transactionId,
        bookingId: customerDetails.bookingId,
        amount: amount,
        expertId: sessionDetails.expertId, // Make sure to pass this
        expertName: sessionDetails.expertName,
        sessionType: sessionDetails.sessionType,
        sessionDate: sessionDetails.sessionDate,
        sessionTime: sessionDetails.sessionTime,
        initiatedAt: Date.now(),
        status: 'initiated'
      };

      // Add subscription data if available from props
      if (subscriptionData) {
        paymentContext.subscriptionData = subscriptionData;
      }
      
      localStorage.setItem('currentPayment', JSON.stringify(paymentContext));

      console.log(' Sending payment request:', {
        url: `${API_URL}/api/payments/phonepe/initiate`,
        payload: {
          amount: Math.round(parseFloat(amount) * 100),
          bookingId,
          transactionId
        },
        hasAuth: !!userData.token,
        timestamp: new Date().toISOString()
      });

      const response = await fetch(`${API_URL}/api/payments/phonepe/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userData.token}`
        },
        body: JSON.stringify({
          amount: Math.round(parseFloat(amount) * 100),
          bookingId,
          transactionId
        })
      });

      console.log(' Payment response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      // Get response text first for better debugging
      const responseText = await response.text();
      console.log(' Raw response text (first 500 chars):', responseText.substring(0, 500));

      if (!response.ok) {
        console.error(' HTTP Error Response:', {
          status: response.status,
          statusText: response.statusText,
          responseText: responseText.substring(0, 1000)
        });
        
        // Try to parse error response
        let errorMessage = `Payment request failed: ${response.status} ${response.statusText}`;
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
        }
        
        throw new Error(errorMessage);
      }

      // Parse JSON response
      let data;
      try {
        data = JSON.parse(responseText);
        console.log(' Parsed response data:', data);
      } catch (parseError) {
        console.error(' JSON Parse Error:', parseError);
        throw new Error('Invalid JSON response from server');
      }

      // Validate response structure
      if (!data) {
        throw new Error('Empty response from server');
      }

      if (!data.success || !data.data || !data.data.redirectUrl) {
        throw new Error(data.message || 'Invalid payment response');
      }

      // Store payment data for the response page
      const paymentInfo = {
        transactionId,
        amount: parseFloat(amount),
        bookingId,
        timestamp: Date.now(),
        status: 'pending',
        expertName: sessionDetails.expertName,
        sessionType: sessionDetails.sessionType,
        sessionDate: sessionDetails.sessionDate,
        sessionTime: sessionDetails.sessionTime,
        expertId: sessionDetails.expertId
      };

      // Add subscription data if this is a subscription payment
      if (sessionDetails.sessionType === 'Subscription' && paymentContext.subscriptionData) {
        paymentInfo.subscriptionData = paymentContext.subscriptionData;
      }

      localStorage.setItem('currentPayment', JSON.stringify(paymentInfo));
      const paymentDataForStorage = {
        bookingId,
        amount,
        expertName: sessionDetails.expertName,
        sessionType: sessionDetails.sessionType,
        sessionDate: sessionDetails.sessionDate,
        sessionTime: sessionDetails.sessionTime
      };

      // Add subscription data if this is a subscription payment
      if (sessionDetails.sessionType === 'Subscription' && paymentContext.subscriptionData) {
        paymentDataForStorage.subscriptionData = paymentContext.subscriptionData;
      }

      localStorage.setItem('paymentData', JSON.stringify(paymentDataForStorage));

      console.log(' Payment info stored successfully');

      // Call the callback if provided
      if (onPaymentInitiate) {
        try {
          console.log(' Calling onPaymentInitiate callback...');
          await onPaymentInitiate(parseFloat(amount), transactionId);
          console.log(' Callback completed successfully');
        } catch (callbackError) {
          console.error(' Callback error (continuing anyway):', callbackError);
        }
      }

      toast({
        title: "Redirecting to Payment Gateway",
        description: "Please complete your payment on PhonePe...",
        variant: "default"
      });

      // Redirect to PhonePe immediately
      console.log(' Redirecting to payment gateway...');
      window.location.href = data.data.redirectUrl;

      return;
    } catch (error: any) {
      console.error(' PAYMENT INITIATION ERROR:', {
        errorMessage: error.message,
        errorStack: error.stack,
        errorType: error.constructor?.name,
        timestamp: new Date().toISOString()
      });

      let errorMessage = error.message || "Failed to initiate payment";
      
      if (error.message.includes('Authentication')) {
        errorMessage = "Please login again to continue";
        setTimeout(() => {
          window.location.href = '/auth/seeker';
        }, 2000);
      }

      toast({
        title: "Payment Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setIsLoading(false);
      console.log(' Payment initiation process completed');
    }
  };

  useEffect(() => {
    setIsLoading(isLoadingProp);
  }, [isLoadingProp]);

  return (
    <Card className="w-full shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
          <CreditCard className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold text-gray-800">Make Payment</CardTitle>
        <CardDescription className="text-gray-600">
          Pay securely using PhonePe
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Session/Subscription Details */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <h3 className="font-medium text-gray-800">
            {sessionDetails.sessionType === 'Subscription' ? 'Subscription Details' : 'Session Details'}
          </h3>
          <div className="text-sm text-gray-600 space-y-1">
            {sessionDetails.sessionType === 'Subscription' ? (
              <>
                <p><span className="font-medium">Plan:</span> {sessionDetails.expertName}</p>
                <p><span className="font-medium">Type:</span> {sessionDetails.sessionType}</p>
                <p><span className="font-medium">Activation:</span> {sessionDetails.sessionDate}</p>
              </>
            ) : (
              <>
                <p><span className="font-medium">Expert:</span> {sessionDetails.expertName}</p>
                <p><span className="font-medium">Type:</span> {sessionDetails.sessionType}</p>
                <p><span className="font-medium">Date:</span> {sessionDetails.sessionDate}</p>
                <p><span className="font-medium">Time:</span> {sessionDetails.sessionTime}</p>
              </>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount" className="text-sm font-medium text-gray-700">
            Amount (₹)
          </Label>
          <Input
            id="amount"
            type="text"
            value={`₹${parseFloat(amount).toFixed(2)}`}
            className="text-lg font-semibold bg-gray-50"
            readOnly
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bookingId" className="text-sm font-medium text-gray-700">
            Booking ID
          </Label>
          <Input
            id="bookingId"
            type="text"
            value={bookingId}
            className="bg-gray-50"
            readOnly
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Shield className="w-5 h-5 text-blue-500" />
            <div className="text-sm text-blue-700">
              <p className="font-medium">Secure Payment</p>
              <p className="text-blue-600">Your payment is protected by PhonePe's security</p>
            </div>
          </div>
        </div>

        <Button 
          onClick={handlePayment}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-3 text-lg transition-all duration-200 transform hover:scale-105"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Processing...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5" />
              <span>
                {sessionDetails.sessionType === 'Subscription' 
                  ? `Subscribe for ₹${parseFloat(amount).toFixed(2)}` 
                  : `Pay ₹${parseFloat(amount).toFixed(2)} with PhonePe`}
              </span>
            </div>
          )}
        </Button>

        <div className="text-center text-xs text-gray-500">
          By proceeding, you agree to our terms and conditions
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentForm;
