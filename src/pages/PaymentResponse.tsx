import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const PaymentResponse = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'processing' | 'success' | 'failed' | 'pending'>('processing');
  const [isSubscription, setIsSubscription] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState(null);

  useEffect(() => {
    console.log('=== PAYMENT RESPONSE PAGE LOADED ===');
    console.log('Full URL:', window.location.href);
    console.log('All search params:', Object.fromEntries(searchParams.entries()));
    
    const code = searchParams.get('code');
    const status = searchParams.get('status');
    const state = searchParams.get('state');
    const transactionId = searchParams.get('transactionId') || searchParams.get('merchantTransactionId') || searchParams.get('merchantOrderId');
    
    console.log('Payment response data:', { 
      code, 
      status, 
      state, 
      transactionId,
      allParams: Object.fromEntries(searchParams.entries())
    });

    // Get stored payment data
    const currentPayment = localStorage.getItem('currentPayment');
    let expertId = null;
    let bookingId = null;
    
    if (currentPayment) {
      try {
        const payment = JSON.parse(currentPayment);
        expertId = payment.expertId;
        bookingId = payment.bookingId;
        const isSubscriptionPayment = payment.sessionType === 'Subscription' || (bookingId && bookingId.startsWith('SUB_'));
        const subData = payment.subscriptionData;
        setIsSubscription(isSubscriptionPayment);
        setSubscriptionData(subData);
        console.log('Stored payment data:', { expertId, bookingId, isSubscription: isSubscriptionPayment, subscriptionData: subData });
      } catch (error) {
        console.error('Error parsing payment data:', error);
      }
    }

    // Check for success conditions - PhonePe sends different codes
    const isSuccess = code === 'PAYMENT_SUCCESS' || code === 'SUCCESS' || 
                     status === 'SUCCESS' || state === 'COMPLETED' ||
                     code === 'COMPLETED' || status === 'COMPLETED';
    
    console.log('Success check:', { isSuccess, code, status, state });
    console.log('URL contains success indicators:', window.location.href.toLowerCase().includes('success'));
    
    // Force success only if URL contains success indicators (remove automatic subscription success)
    const forceSuccess = window.location.href.toLowerCase().includes('success') || 
                        window.location.href.toLowerCase().includes('completed');
    
    console.log('Force success check:', { forceSuccess, hasSubBooking: bookingId?.startsWith('SUB_') });
    
    if (isSuccess || forceSuccess) {
      console.log('✅ Payment detected as SUCCESS', { isSuccess, forceSuccess });
      setStatus('success');
      
      // Update booking/subscription status in database ONLY for successful payments
      if (transactionId && (isSuccess || forceSuccess)) {
        // Handle subscription payments - use single API call to avoid locks
        if (subscriptionData) {
          console.log('Processing SUCCESSFUL subscription payment with data:', subscriptionData);
          updateSubscriptionStatusSingle(subscriptionData, transactionId)
            .then(updated => {
              if (updated) {
                console.log('Successfully activated subscription after successful payment');
                toast({
                  title: "Subscription Activated!",
                  description: `Your ${subscriptionData?.planName || 'subscription'} plan is now active!`,
                  variant: "default"
                });
              } else {
                console.error('Failed to activate subscription');
                toast({
                  title: "Subscription Update Failed",
                  description: "Payment successful but subscription activation failed. Contact support.",
                  variant: "destructive"
                });
              }
            })
            .catch(error => {
              console.error('Subscription activation error:', error);
              toast({
                title: "Subscription Error",
                description: "Payment successful but subscription activation failed. Contact support.",
                variant: "destructive"
              });
            });
        } else {
          // Get subscription data from localStorage or use defaults
          console.log('⚠️ No subscriptionData found, checking localStorage for plan details');
          
          let planData = {
            planName: 'Premium Plan',
            planKey: 'premium', 
            planId: 1
          };
          
          // Try to get plan data from currentPayment or user data
          try {
            if (currentPayment) {
              const payment = JSON.parse(currentPayment);
              console.log('Full payment object:', payment);
              
              // Check multiple possible locations for plan data
              const planSource = payment.selectedPlan || payment.subscriptionData || payment.planData || payment.plan;
              
              if (planSource) {
                planData = {
                  planName: planSource.name || planSource.planName || planSource.plan_name || planSource.title,
                  planKey: planSource.key || planSource.planKey || planSource.plan_key || planSource.slug,
                  planId: planSource.id || planSource.planId || planSource.plan_id
                };
                console.log('Extracted plan data from payment:', planData);
              } else {
                console.log('No plan data found in payment object');
              }
            }
          } catch (error) {
            console.error('Error parsing plan data:', error);
          }
          
          console.log('Using plan data:', planData);
          
          updateSubscriptionStatusSingle(planData, transactionId)
            .then(updated => {
              if (updated) {
                console.log('Successfully activated subscription with plan data');
                toast({
                  title: "Subscription Activated!",
                  description: `Your ${planData.planName} is now active!`,
                  variant: "default"
                });
              }
            });
        }
        
        // Handle booking payments - only for successful payments
        if (bookingId && !bookingId.startsWith('SUB_') && (isSuccess || forceSuccess)) {
          updateBookingStatus(bookingId, transactionId)
            .then(updated => {
              if (updated) {
                console.log('Successfully updated booking status from draft to pending after successful payment');
              } else {
                console.error('Failed to update booking status');
              }
            });
        }
        
        // Log if no subscription data found
        if (!subscriptionData) {
          console.log('⚠️ No subscriptionData found for payment');
        }
      }
      
      // Update localStorage for successful payment
      if (currentPayment) {
        try {
          const payment = JSON.parse(currentPayment);
          payment.status = 'completed';
          payment.completedAt = Date.now();
          localStorage.setItem('currentPayment', JSON.stringify(payment));
        } catch (error) {
          console.error('Error updating payment status:', error);
        }
      }

      toast({
        title: "Payment Successful!",
        description: `Transaction completed successfully`,
        variant: "default"
      });

      setTimeout(async () => {
        const currentPayment = localStorage.getItem('currentPayment');
        let isSubPayment = false;
        let subData = null;
        
        if (currentPayment) {
          try {
            const payment = JSON.parse(currentPayment);
            isSubPayment = payment.sessionType === 'Subscription' || (payment.bookingId && payment.bookingId.startsWith('SUB_'));
            subData = payment.subscriptionData;
          } catch (error) {
            console.error('Error parsing payment data:', error);
          }
        }
        
        if (isSubPayment) {
          // Check profile completion for subscription payments
          try {
            const userData = localStorage.getItem('user');
            if (userData) {
              const user = JSON.parse(userData);
              
              // Fetch fresh user data to check profile_completed
              const userId = user.user_id || user.id;
              const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${userId}`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
              });
              
              if (response.ok) {
                const apiResponse = await response.json();
                console.log('Fresh user data response:', apiResponse);
                
                // Handle different API response structures
                const freshUserData = apiResponse.data || apiResponse;
                console.log('Profile completed value:', freshUserData.profile_completed, 'Type:', typeof freshUserData.profile_completed);
                
                // Update localStorage with fresh user data including plan details
                const updatedUser = { ...user, ...freshUserData };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                
                // Check profile_completed column - if undefined, default to completed (true)
                const profileCompletedValue = freshUserData.profile_completed;
                const isProfileCompleted = profileCompletedValue === undefined ? true : Boolean(Number(profileCompletedValue));
                console.log('=== PROFILE COMPLETION CHECK ===');
                console.log('Raw value:', profileCompletedValue);
                console.log('Type:', typeof profileCompletedValue);
                console.log('Is undefined (defaulting to true):', profileCompletedValue === undefined);
                console.log('Final result:', isProfileCompleted);
                console.log('================================');
                
                if (isProfileCompleted) {
                  console.log('Redirecting to dashboard - profile completed');
                  navigate('/seekerdashboard', { 
                    state: { 
                      subscriptionSuccess: true, 
                      transactionId,
                      planName: subData?.planName
                    },
                    replace: true
                  });
                } else {
                  console.log('Redirecting to profile form - profile not completed');
                  navigate('/auth/SeekerProfileForm', { 
                    state: { 
                      fromSubscription: true,
                      subscriptionSuccess: true,
                      transactionId,
                      planName: subData?.planName
                    },
                    replace: true
                  });
                }
              } else {
                navigate('/auth/SeekerProfileForm', { replace: true });
              }
            } else {
              navigate('/auth/SeekerProfileForm', { replace: true });
            }
          } catch (error) {
            console.error('Error checking profile completion:', error);
            navigate('/auth/SeekerProfileForm', { replace: true });
          }
        } else {
          navigate('/appointment-log', { 
            state: { 
              paymentSuccess: true, 
              transactionId
            },
            replace: true
          });
        }
      }, 3000);

    } else if (code === 'PAYMENT_FAILED' || code === 'FAILED' || 
               (code && (code.includes('FAIL') || code.includes('ERROR'))) ||
               status === 'FAILED' || state === 'FAILED') {
      console.log('❌ Payment detected as FAILED');
      setStatus('failed');
      
      // Update booking status to cancelled if payment failed (only for actual bookings, not subscriptions)
      const isActualBooking = bookingId && !bookingId.startsWith('SUB_');
      if (isActualBooking && transactionId) {
        updateBookingStatus(bookingId, transactionId)
          .then(updated => {
            if (updated) {
              console.log('Successfully updated booking status to cancelled');
            } else {
              console.error('Failed to update booking status');
            }
          });
      } else {
        console.log('Subscription payment failed - no booking to cancel');
      }
      
      // Keep failed payment data for retry
      // localStorage.removeItem('currentPayment');
      
      toast({
        title: "Payment Failed",
        description: `Transaction failed. Redirecting to retry payment...`,
        variant: "destructive"
      });
      
      // Stay on payment response page - don't redirect automatically
      // User can choose to retry payment using the "Retry Payment" button
    } else if (code === 'PAYMENT_PENDING' || code === 'PENDING' ||
               (code && code.includes('PENDING')) ||
               status === 'PENDING' || state === 'PENDING') {
      console.log('⏳ Payment detected as PENDING');
      setStatus('pending');
      
      toast({
        title: "Payment Pending",
        description: `Payment is being processed. Please choose your next action.`,
        variant: "default"
      });

      // No automatic redirect - let user decide

    } else {
      // Check if we have any success indicators in URL params
      const allParams = Object.fromEntries(searchParams.entries());
      const hasSuccessIndicator = Object.values(allParams).some(value => 
        value && (value.toString().toUpperCase().includes('SUCCESS') || 
                 value.toString().toUpperCase().includes('COMPLETED'))
      );
      
      console.log('🔍 Checking for success indicators:', { allParams, hasSuccessIndicator });
      
      if (hasSuccessIndicator) {
        console.log('✅ Found success indicator in params');
        setStatus('success');
      } else {
        console.log('❌ No clear status - treating as failed');
        setStatus('failed');
      }
      
      toast({
        title: "Payment Status Unknown",
        description: "Please choose what to do next.",
        variant: "destructive"
      });
      
      // No automatic redirect - let user decide
    }
  }, [searchParams, navigate, toast]);

  const handleGoBackToExpert = () => {
    const currentPayment = localStorage.getItem('currentPayment');
    if (currentPayment) {
      try {
        const payment = JSON.parse(currentPayment);
        if (payment.expertId) {
          navigate(`/expert/${payment.expertId}`, { 
            state: { 
              paymentFailed: status === 'failed',
              paymentPending: status === 'pending',
              transactionId: searchParams.get('transactionId'),
              bookingId: payment.bookingId 
            },
            replace: true 
          });
          return;
        }
      } catch (error) {
        console.error('Error parsing payment data:', error);
      }
    }
    navigate('/seekerdashboard', { replace: true });
  };

  const getRedirectMessage = () => {
    const currentPayment = localStorage.getItem('currentPayment');
    if (currentPayment) {
      try {
        const payment = JSON.parse(currentPayment);
        return payment.expertName || 'expert profile';
      } catch (error) {
        return 'expert profile';
      }
    }
    return 'expert profile';
  };

  // Update booking status after payment
  const updateBookingStatus = async (bookingId: string, transactionId: string) => {
    try {
      // Get authentication token
      const userData = localStorage.getItem('user');
      if (!userData) {
        console.error('No user data found');
        return false;
      }
      
      const parsedData = JSON.parse(userData);
      const token = parsedData.token || parsedData.accessToken;
      
      if (!token) {
        console.error('No authentication token found');
        return false;
      }
      
      const API_BASE_URL = import.meta.env.VITE_API_URL;
      
      // Call API to update booking status from draft to pending
      const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/payment-confirm`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ transactionId })
      });
      
      if (!response.ok) {
        console.error('Failed to update booking status:', await response.text());
        return false;
      }
      
      console.log('Successfully updated booking status from draft to pending');
      return true;
    } catch (error) {
      console.error('Error updating booking status:', error);
      return false;
    }
  };

  // Update subscription status after payment
  const updateSubscriptionStatus = async (subscriptionData: any, transactionId: string) => {
    console.log('🔄 Starting subscription activation with data:', subscriptionData);
    console.log('🔄 Transaction ID:', transactionId);
    
    try {
      // Get authentication token
      const userData = localStorage.getItem('user');
      if (!userData) {
        console.error('❌ No user data found in localStorage');
        return false;
      }
      
      const parsedData = JSON.parse(userData);
      const token = parsedData.token || parsedData.accessToken;
      const userId = parsedData.user_id || parsedData.id;
      
      console.log('👤 User info:', { userId, hasToken: !!token });
      
      if (!token) {
        console.error('❌ No authentication token found');
        return false;
      }
      
      if (!userId) {
        console.error('❌ No user ID found');
        return false;
      }
      
      const API_BASE_URL = import.meta.env.VITE_API_URL;
      console.log('🌐 API Base URL:', API_BASE_URL);
      
      // Prepare subscription payload
      const subscriptionPayload = {
        planId: subscriptionData?.planId || subscriptionData?.id,
        planName: subscriptionData?.planName || subscriptionData?.plan_name,
        planKey: subscriptionData?.planKey || subscriptionData?.plan_key,
        transactionId
      };
      
      console.log('📦 Subscription payload:', subscriptionPayload);
      
      // Call API to activate subscription after payment
      console.log('🚀 Calling subscription activation API...');
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/activate-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscriptionPayload)
      });
      
      console.log('📡 Subscription API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to activate subscription:', errorText);
        return false;
      }
      
      const subscriptionResult = await response.json();
      console.log('✅ Subscription activation result:', subscriptionResult);
      
      // Update users table directly with subscription info
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      
      const userPayload = {
        subscription_status: 'active',
        plan_name: subscriptionPayload.planName,
        plan_key: subscriptionPayload.planKey,
        current_plan_id: subscriptionPayload.planId,
        subscription_start_date: startDate.toISOString().slice(0, 19).replace('T', ' '),
        subscription_end_date: endDate.toISOString().slice(0, 19).replace('T', ' '),
        trial_used: false
      };
      
      console.log('👤 Updating users table with payload:', userPayload);
      
      const userUpdateResponse = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userPayload)
      });
      
      console.log('📡 User update API response status:', userUpdateResponse.status);
      
      if (!userUpdateResponse.ok) {
        const errorText = await userUpdateResponse.text();
        console.error('❌ Failed to update user subscription info:', errorText);
        return false;
      }
      
      const userUpdateResult = await userUpdateResponse.json();
      console.log('✅ User update result:', userUpdateResult);
      
      console.log('🎉 Successfully activated subscription and updated user data');
      return true;
    } catch (error) {
      console.error('💥 Error in subscription activation:', error);
      return false;
    }
  };

  // Single API call to avoid database locks
  const updateSubscriptionStatusSingle = async (subscriptionData: any, transactionId: string) => {
    try {
      console.log('🔍 Input subscription data:', subscriptionData);
      
      const userData = localStorage.getItem('user');
      if (!userData) {
        console.error('❌ No user data found');
        return false;
      }
      
      const parsedData = JSON.parse(userData);
      const token = parsedData.token || parsedData.accessToken;
      const userId = parsedData.user_id || parsedData.id;
      
      if (!token || !userId) {
        console.error('❌ Missing token or user ID');
        return false;
      }
      
      const startDate = new Date();
      
      // Extract plan details with multiple fallbacks
      const planName = subscriptionData?.planName || subscriptionData?.plan_name || 
                      subscriptionData?.name || subscriptionData?.title || 'Premium Plan';
      const planKey = subscriptionData?.planKey || subscriptionData?.plan_key || 
                     subscriptionData?.key || subscriptionData?.slug || 'premium';
      const planId = subscriptionData?.planId || subscriptionData?.plan_id || 
                    subscriptionData?.id || 1;
      // Map plan IDs to durations based on the subscription plans
      const getPlanDuration = (planId, planName, planKey) => {
        // Check by plan ID first
        if (planId === 1 || planKey === 'silver' || planName?.toLowerCase().includes('silver')) {
          return { months: 3, type: 'month' };
        }
        if (planId === 2 || planKey === 'gold' || planName?.toLowerCase().includes('gold')) {
          return { months: 6, type: 'month' };
        }
        if (planId === 3 || planKey === 'platinum' || planName?.toLowerCase().includes('platinum')) {
          return { months: 12, type: 'month' };
        }
        if (planId === 4 || planKey === 'business' || planName?.toLowerCase().includes('business')) {
          return { months: 12, type: 'month' }; // Default to 1 year for business
        }
        // Default fallback
        return { months: 1, type: 'month' };
      };
      
      const planDuration = getPlanDuration(planId, planName, planKey);
      
      // Calculate end date based on plan duration
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + planDuration.months);
      
      console.log('📅 Subscription dates:', { 
        startDate: startDate.toISOString(), 
        endDate: endDate.toISOString(), 
        planDuration: planDuration.months + ' months',
        planId,
        planName,
        planKey
      });
      
      const payload = {
        subscription_status: 'active',
        plan_name: planName,
        plan_key: planKey,
        current_plan_id: planId,
        subscription_start_date: startDate.toISOString().slice(0, 19).replace('T', ' '),
        subscription_end_date: endDate.toISOString().slice(0, 19).replace('T', ' '),
        trial_used: false
      };
      
      console.log('🚀 Single API call with payload:', payload);
      console.log('📊 Plan details extracted:', { planName, planKey, planId, duration: planDuration.months + ' months' });
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      console.log('📡 Single API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Single API failed:', errorText);
        return false;
      }
      
      const result = await response.json();
      console.log('✅ Single API success:', result);
      console.log('✅ Subscription activated with plan:', { planName, planKey, planId });
      return true;
    } catch (error) {
      console.error('💥 Single API error:', error);
      return false;
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div style={{ 
        background: 'white',
        color: '#333',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        maxWidth: '450px',
        width: '100%'
      }}>
        {status === 'processing' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
            <h2>Processing Payment...</h2>
            <p>Please wait while we verify your payment</p>
            <button 
              onClick={() => {
                console.log('Manual success trigger');
                setStatus('success');
                const currentPayment = localStorage.getItem('currentPayment');
                if (currentPayment) {
                  const payment = JSON.parse(currentPayment);
                  const subData = payment.subscriptionData || payment.selectedPlan;
                  if (subData) {
                    updateSubscriptionStatusSingle(subData, 'MANUAL_TEST')
                      .then(updated => {
                        if (updated) {
                          toast({
                            title: "Manual Activation Success!",
                            description: "Subscription activated manually",
                            variant: "default"
                          });
                        }
                      });
                  }
                }
              }}
              style={{
                marginTop: '20px',
                padding: '8px 16px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Force Success (Test)
            </button>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '20px', color: 'green' }}>✅</div>
            <h2>{isSubscription ? 'Subscription Activated!' : 'Payment Successful!'}</h2>
            <p>
              {isSubscription 
                ? `Your ${subscriptionData?.planName || 'subscription'} plan is now active! Redirecting to dashboard...`
                : 'Redirecting to your appointments...'}
            </p>
            <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
              Automatic redirect in 3 seconds...
            </div>
          </>
        )}
        
        {status === 'failed' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '20px', color: 'red' }}>❌</div>
            <h2>Payment Failed</h2>
            <p>Your payment could not be processed.</p>
            <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
              You can try booking again from the {getRedirectMessage()}
            </div>
          </>
        )}

        {status === 'pending' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '20px', color: 'orange' }}>⏳</div>
            <h2>Payment Pending</h2>
            <p>Your payment is being processed by the bank.</p>
            <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
              You will receive an update soon. You can check back with the {getRedirectMessage()} or go to your dashboard.
            </div>
          </>
        )}
        
        {/* Show action buttons for failed/pending states */}
        {(status === 'failed' || status === 'pending') && (
          <div style={{ marginTop: '30px' }}>
            <button 
              onClick={() => {
                if (status === 'failed') {
                  // Reconstruct payment data from localStorage for retry
                  const currentPayment = localStorage.getItem('currentPayment');
                  console.log('🔄 Retry payment - currentPayment:', currentPayment);
                  
                  if (currentPayment) {
                    try {
                      const payment = JSON.parse(currentPayment);
                      console.log('🔄 Parsed payment data:', payment);
                      
                      // Validate required fields
                      if (payment.bookingId && payment.amount) {
                        navigate('/payments', { 
                          state: {
                            bookingId: payment.bookingId,
                            amount: payment.amount,
                            userId: payment.userId || payment.expertId,
                            expertName: payment.expertName || 'Expert',
                            sessionType: payment.sessionType || 'Subscription',
                            sessionDate: payment.sessionDate || 'TBD',
                            sessionTime: payment.sessionTime || 'TBD',
                            paymentDetails: payment.paymentDetails || {
                              description: 'Retry Payment',
                              duration: '1 month',
                              ratePerHour: 0,
                              currency: 'INR'
                            },
                            subscriptionData: payment.subscriptionData
                          },
                          replace: true 
                        });
                        return;
                      }
                    } catch (error) {
                      console.error('Error parsing payment data for retry:', error);
                    }
                  }
                  
                  console.log('❌ No valid payment data found, redirecting to dashboard');
                  navigate('/seekerdashboard', { replace: true });
                } else {
                  handleGoBackToExpert();
                }
              }}
              style={{
                padding: '12px 24px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500',
                marginRight: '15px',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0056b3'}
              onMouseOut={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#007bff'}
            >
              {status === 'failed' ? 'Retry Payment' : 'Back to Expert'}
            </button>
            
            <button 
              onClick={() => navigate('/seekerdashboard', { replace: true })}
              style={{
                padding: '12px 24px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#545b62'}
              onMouseOut={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#6c757d'}
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {/* Show manual redirect option for success case too */}
        {status === 'success' && (
          <div style={{ marginTop: '20px' }}>
            <button 
              onClick={async () => {
                const currentPayment = localStorage.getItem('currentPayment');
                let isSubPayment = false;
                
                if (currentPayment) {
                  try {
                    const payment = JSON.parse(currentPayment);
                    isSubPayment = payment.sessionType === 'Subscription' || (payment.bookingId && payment.bookingId.startsWith('SUB_'));
                  } catch (error) {
                    console.error('Error parsing payment data:', error);
                  }
                }
                
                if (isSubPayment) {
                  // Check profile completion for manual redirect
                  try {
                    const userData = localStorage.getItem('user');
                    if (userData) {
                      const user = JSON.parse(userData);
                      
                      // Fetch fresh user data to check profile_completed
                      const userId = user.user_id || user.id;
                      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${userId}`, {
                        headers: { 'Authorization': `Bearer ${user.token}` }
                      });
                      
                      if (response.ok) {
                        const apiResponse = await response.json();
                        const freshUserData = apiResponse.data || apiResponse;
                        
                        // Update localStorage with fresh user data including plan details
                        const updatedUser = { ...user, ...freshUserData };
                        localStorage.setItem('user', JSON.stringify(updatedUser));
                        
                        // Check profile_completed column - if undefined, default to completed (true)
                        const profileCompletedValue = freshUserData.profile_completed;
                        const isProfileCompleted = profileCompletedValue === undefined ? true : Boolean(Number(profileCompletedValue));
                        console.log('=== MANUAL REDIRECT PROFILE CHECK ===');
                        console.log('Raw value:', profileCompletedValue);
                        console.log('Type:', typeof profileCompletedValue);
                        console.log('Is undefined (defaulting to true):', profileCompletedValue === undefined);
                        console.log('Final result:', isProfileCompleted);
                        console.log('=====================================');
                        
                        if (isProfileCompleted) {
                          navigate('/seekerdashboard', { replace: true });
                        } else {
                          navigate('/auth/SeekerProfileForm', { replace: true });
                        }
                      } else {
                        navigate('/auth/SeekerProfileForm', { replace: true });
                      }
                    } else {
                      navigate('/auth/SeekerProfileForm', { replace: true });
                    }
                  } catch (error) {
                    navigate('/auth/SeekerProfileForm', { replace: true });
                  }
                } else {
                  navigate('/appointment-log', { replace: true });
                }
              }}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                color: '#007bff',
                border: '1px solid #007bff',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Go Now
            </button>
          </div>
        )}
        
        <div style={{ marginTop: '25px', fontSize: '12px', color: '#999', borderTop: '1px solid #eee', paddingTop: '15px' }}>
          <p><strong>Transaction ID:</strong> {searchParams.get('transactionId') || 'N/A'}</p>
          {status === 'pending' && (
            <p style={{ marginTop: '5px', fontSize: '11px' }}>
              You can save this ID to check your payment status later
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentResponse;
