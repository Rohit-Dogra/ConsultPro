import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PaymentForm from '../components/Payments/PaymentForm';
import { toast } from "../components/ui/use-toast";
import { useCurrencyTimezone } from '../components/contexts/CurrencyTimezoneContext';

interface PaymentState {
  bookingId: string;
  amount: string;
  userId: string;
  expertName: string;
  sessionType: string;   
  sessionDate: string;
  sessionTime: string;
  paymentDetails: {
    description: string;
    duration: string;
    ratePerHour: number;
    currency: string;
  };
  subscriptionData?: {
    planId: string;
    planKey: string;
    planName: string;
    validityMonths: number | null;
  };
}

const Payments = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const paymentData = location.state as PaymentState;

  const [isInitiating, setIsInitiating] = useState(false);
  const { currency, timezone, setCurrencyAndTimezone, formatCurrency, formatDateTime } = useCurrencyTimezone();

  // Validate payment data
  if (!paymentData || !paymentData.bookingId || !paymentData.amount) {
    useEffect(() => {
      toast({
        title: "Invalid Payment Data",
        description: "Missing required payment information",
        variant: "destructive"
      });
      navigate('/', { replace: true });
    }, [navigate]);
    return null;
  }

  const getExpertInitials = (name?: string) => {
    if (!name || typeof name !== 'string') {
      return 'EX';
    }
    
    return name
      .trim()
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || 'EX';
  };

  // Simplified payment initiation
  const handlePaymentInitiate = async (paymentAmount: number, txnId: string) => {
    try {
      console.log('Payment initiated from Payments component:', {
        amount: paymentAmount,
        transactionId: txnId,
        bookingId: paymentData.bookingId
      });

      setIsInitiating(true);

      // The PaymentForm will handle the redirect
      // We just need to store some basic info
      console.log('Payment initiation started - user will be redirected to PhonePe');

    } catch (error: any) {
      console.error('Error in handlePaymentInitiate:', error);
      
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initiate payment",
        variant: "destructive"
      });
    } finally {
      setIsInitiating(false);
    }
  };

  const sessionDetails = {
    expertId: paymentData.userId, // For subscriptions, this will be the user's own ID
    expertName: paymentData.subscriptionData ? paymentData.subscriptionData.planName : getExpertInitials(paymentData.expertName),
    sessionType: paymentData.sessionType || 'Consultation',
    sessionDate: paymentData.sessionDate || 'TBD',
    sessionTime: paymentData.sessionTime || 'TBD'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            {paymentData.subscriptionData ? 'Complete Subscription Payment' : 'Complete Your Payment'}
          </h1>
          <p className="text-lg text-gray-600">
            {paymentData.subscriptionData 
              ? `Upgrading to ${paymentData.subscriptionData.planName}` 
              : `Booking session with ${getExpertInitials(paymentData.expertName)}`}
          </p>
        </div>

        <div className="max-w-md mx-auto">
          {/* Only show the payment form - no conditional rendering */}
          <PaymentForm
            initialAmount={Number(paymentData.amount)}
            customerDetails={{
              bookingId: paymentData.bookingId
            }}
            sessionDetails={sessionDetails}
            subscriptionData={paymentData.subscriptionData}
            onPaymentInitiate={handlePaymentInitiate}
            isLoading={isInitiating}
          />
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          {paymentData.subscriptionData ? (
            <>
              <p className="font-medium">Subscription Details</p>
              <p>{paymentData.subscriptionData.planName}</p>
              <p>Validity: {paymentData.paymentDetails.duration}</p>
              <p className="mt-2">Amount: {formatCurrency(paymentData.amount)}</p>
            </>
          ) : (
            <>
              <p className="font-medium">Session Details</p>
              <p>{paymentData.sessionDate || 'Date TBD'} at {paymentData.sessionTime || 'Time TBD'}</p>
              <p>Session with {getExpertInitials(paymentData.expertName)}</p>
              <p className="mt-2">Amount: {formatCurrency(paymentData.amount)}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Payments;
