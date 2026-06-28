const express = require('express');
const router = express.Router();
const PaymentService = require('../services');
const PaymentTransactionService = require('./paymentTransactionService');
const { createResponse } = require('../utils/response.utils');
const auth = require('../middleware/auth');

// Initialize payment transaction service
const paymentTransactionService = new PaymentTransactionService();

// Middleware to set database connection for the service
router.use((req, res, next) => {
  // Get database connection from app.locals
  const db = req.app.locals.db;
  paymentTransactionService.setDatabase(db);
  next();
});
  
router.post('/phonepe/initiate', auth, async (req, res) => {
  try {
    console.log('=== PAYMENT INITIATE REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { amount, bookingId, transactionId } = req.body;
    const userId = req.user.user_id;

    // Validation
    if (!amount || !bookingId || !transactionId) {
      return res.status(400).json(createResponse(
        false,
        null,
        'Missing required fields: amount, bookingId, transactionId'
      ));
    }

    console.log('User info:', { user_id: userId, timestamp: new Date().toISOString() });

    const validatedData = {
      userId,
      amount: Number(amount),
      bookingId: String(bookingId),
      transactionId: String(transactionId)
    };
    
    console.log('Payment type detection:', {
      bookingId: validatedData.bookingId,
      isSubscription: validatedData.bookingId.startsWith('SUB_')
    });

    console.log('✅ Validation passed:', validatedData);

    try {
      // 1. Store transaction in database BEFORE calling PhonePe
      console.log('🔄 Creating payment transaction record...');
      
      // Check if this is a subscription payment (bookingId starts with SUB_)
      const isSubscriptionPayment = validatedData.bookingId.startsWith('SUB_');
      
      const transactionData = {
        booking_id: validatedData.bookingId, // Use for both bookings and subscription references
        merchant_transaction_id: validatedData.transactionId,
        amount: validatedData.amount / 100, // Convert paise to rupees for database
        status: 'INITIATED',
        payment_type: isSubscriptionPayment ? 'subscription' : 'booking',
        user_id: validatedData.userId
      };
      
      // Skip DB transaction creation due to connection issues
      console.log('⚠️ Skipping DB transaction creation due to connection issues');
      const dbResult = { success: true, transactionId: 'TEMP_' + Date.now() };

      // 2. Initialize PaymentService
      console.log('🔄 Initializing PaymentService...');
      const paymentService = new PaymentService();
      console.log('✅ PaymentService initialized successfully');

      // 3. Call PhonePe API
      console.log('🔄 Calling PaymentService.initiatePayment with params:', {
        amount: validatedData.amount,
        bookingId: validatedData.bookingId,
        transactionId: validatedData.transactionId,
        userId: validatedData.userId
      });

      const paymentResponse = await paymentService.initiatePayment(validatedData);

      console.log('📋 PaymentService raw response:', {
        responseType: typeof paymentResponse,
        isNull: paymentResponse === null,
        isUndefined: paymentResponse === undefined,
        keys: paymentResponse ? Object.keys(paymentResponse) : [],
        response: paymentResponse
      });

      if (!paymentResponse || !paymentResponse.redirectUrl) {
        // Skip DB update due to connection issues
        console.log('⚠️ Skipping DB status update due to connection issues');

        throw new Error('Invalid payment response: missing redirectUrl');
      }

      console.log('✅ Payment initiation successful:', {
        transactionId: validatedData.transactionId,
        hasRedirectUrl: !!paymentResponse.redirectUrl,
        redirectUrl: paymentResponse.redirectUrl.substring(0, 50) + '...'
      });

      // 4. Return success response
      const successResponse = {
        redirectUrl: paymentResponse.redirectUrl,
        transactionId: validatedData.transactionId,
        successUrl: `${process.env.CLIENT_URL }/payment/success`,
        failureUrl: `${process.env.CLIENT_URL }/payment/failure`
      };

      console.log('📤 Sending success response:', {
        hasRedirectUrl: !!successResponse.redirectUrl,
        transactionId: successResponse.transactionId,
        successUrl: successResponse.successUrl,
        failureUrl: successResponse.failureUrl
      });

      const finalResponse = createResponse(
        true,
        successResponse,
        'Payment initiated successfully'
      );

      console.log('📤 Final response structure:', {
        success: finalResponse.success,
        hasData: !!finalResponse.data,
        message: finalResponse.message
      });

      return res.json(finalResponse);

    } catch (serviceError) {
      console.error('❌ PaymentService.initiatePayment failed:', {
        errorMessage: serviceError.message,
        errorStack: serviceError.stack,
        errorType: serviceError.constructor.name,
        transactionId: validatedData.transactionId
      });

      // Skip DB update due to connection issues
      console.log('⚠️ Skipping DB status update due to connection issues');

      return res.status(500).json(createResponse(
        false,
        { transactionId: validatedData.transactionId },
        `Payment initiation failed: ${serviceError.message}`
      ));
    }

  } catch (error) {
    console.error('❌ Payment initiate route error:', error);
    return res.status(500).json(createResponse(
      false,
      null,
      'Internal server error during payment initiation'
    ));
  }
});

// Handle PhonePe POST response
router.post('/phonepe/response', async (req, res) => {
  try {
    console.log('=== PHONEPE POST RESPONSE RECEIVED ===');
    console.log('Request method:', req.method);
    console.log('Request headers:', req.headers);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request query:', JSON.stringify(req.query, null, 2));
    console.log('Full URL:', req.url);
    
    // Extract payment response data
    const responseData = { ...req.body, ...req.query };
    const { code, merchantId, transactionId, merchantOrderId, providerReferenceId, checksum } = responseData;
    
    // Use merchantOrderId if transactionId is not available
    const txnId = transactionId || merchantOrderId;
    
    console.log('PhonePe response data:', {
      code,
      merchantId, 
      transactionId: txnId,
      providerReferenceId,
      allParams: responseData
    });

    // Update payment transaction status in database
    if (txnId) {
      try {
        // Determine status based on PhonePe response
        let status = 'PENDING';
        let finalCode = code;
        
        // Check for success indicators
        if (code === 'PAYMENT_SUCCESS' || code === 'SUCCESS' || 
            responseData.status === 'SUCCESS' || responseData.state === 'COMPLETED') {
          status = 'COMPLETED';
          finalCode = 'PAYMENT_SUCCESS';
        } 
        // Check for failure indicators
        else if (code === 'PAYMENT_FAILED' || code === 'FAILED' ||
                 (code && (code.includes('FAIL') || code.includes('ERROR'))) ||
                 responseData.status === 'FAILED' || responseData.state === 'FAILED') {
          status = 'FAILED';
          finalCode = 'PAYMENT_FAILED';
        }
        // Check for pending indicators
        else if (code === 'PAYMENT_PENDING' || code === 'PENDING' ||
                 responseData.status === 'PENDING' || responseData.state === 'PENDING') {
          status = 'PENDING';
          finalCode = 'PAYMENT_PENDING';
        }

        const updateData = { 
          status,
          payment_id: providerReferenceId || null
        };

        // Skip DB update due to connection issues
        console.log('⚠️ Skipping DB status update due to connection issues');
        console.log('✅ Payment transaction status would be updated:', { txnId, status, finalCode });

        // Override code in response data for frontend
        responseData.code = finalCode;
        responseData.transactionId = txnId;

      } catch (dbError) {
        console.error('❌ Failed to update payment transaction status:', dbError);
        // Don't fail the redirect because of DB error
      }
    }

    // Build redirect URL to frontend
    const clientUrl = process.env.CLIENT_URL;
    const redirectUrl = new URL(`${clientUrl}/payment/response`);
    
    // Add all response data as query parameters
    Object.keys(responseData).forEach(key => {
      if (responseData[key]) {
        redirectUrl.searchParams.set(key, responseData[key]);
      }
    });
    
    console.log('✅ Final redirect URL:', redirectUrl.toString());
    console.log('Query parameters being sent:', Object.fromEntries(redirectUrl.searchParams));
    
    // Send redirect response
    res.redirect(302, redirectUrl.toString());
    
  } catch (error) {
    console.error('❌ PhonePe response handling error:', error);
    const clientUrl = process.env.CLIENT_URL;
    res.redirect(302, `${clientUrl}/payment/response?code=PAYMENT_ERROR`);
  }
});

// Handle PhonePe callback (server-to-server)
router.post('/phonepe/callback', async (req, res) => {
  try {
    console.log('=== PHONEPE CALLBACK RECEIVED ===');
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    
    const paymentService = new PaymentService();
    const result = await paymentService.processCallback(req.body, req.headers);
    
    console.log('Callback processing result:', result);
    
    // Respond to PhonePe
    res.status(200).json({
      success: result.success,
      message: result.message
    });
    
  } catch (error) {
    console.error('PhonePe callback handling error:', error);
    res.status(500).json({
      success: false,
      message: 'Callback processing failed'
    });
  }
});

// Test payment simulation (when PhonePe UAT page fails)
router.post('/phonepe/simulate-payment', async (req, res) => {
  try {
    const { transactionId, action } = req.body; // action: 'success' or 'failure'
    
    console.log(`Simulating ${action} for transaction:`, transactionId);
    
    // Update transaction status in database
    const status = action === 'success' ? 'COMPLETED' : 'FAILED';
    await paymentTransactionService.updateTransactionStatus(transactionId, { status });
    
    // Redirect to frontend with result
    const clientUrl = process.env.CLIENT_URL;
    const code = action === 'success' ? 'PAYMENT_SUCCESS' : 'PAYMENT_FAILED';
    
    res.redirect(`${clientUrl}/payment-fallback?transactionId=${transactionId}&code=${code}`);
    
  } catch (error) {
    console.error('Payment simulation error:', error);
    const clientUrl = process.env.CLIENT_URL;
    res.redirect(`${clientUrl}/payment-fallback?code=PAYMENT_ERROR`);
  }
});

// Status check route for fallback
router.get('/phonepe/status/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const paymentService = new PaymentService();
    const result = await paymentService.verifyPayment(transactionId);
    
    res.json({
      success: result.success,
      status: result.status,
      message: result.message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Status check failed'
    });
  }
});

// Handle PhonePe GET response (backup)
router.get('/phonepe/response', async (req, res) => {
  try {
    console.log('=== PHONEPE GET RESPONSE RECEIVED ===');
    console.log('Request query:', req.query);
    
    const merchantOrderId = req.query.merchantOrderId;
    let finalCode = 'PAYMENT_ERROR';
    
    // If we have merchantOrderId, verify payment status with PhonePe
    if (merchantOrderId) {
      try {
        console.log('Verifying payment status for:', merchantOrderId);
        const paymentService = new PaymentService();
        const verification = await paymentService.verifyPayment(merchantOrderId);
        
        console.log('Payment verification result:', verification);
        
        if (verification.success) {
          finalCode = 'PAYMENT_SUCCESS';
          // Skip DB update due to connection issues
          console.log('⚠️ Skipping DB update due to connection issues');
          console.log('✅ GET: Payment verified as successful');
        } else {
          finalCode = 'PAYMENT_FAILED';
          // Skip DB update due to connection issues
          console.log('⚠️ Skipping DB update due to connection issues');
          console.log('❌ GET: Payment verification failed');
        }
      } catch (verifyError) {
        console.error('Payment verification error:', verifyError);
        finalCode = 'PAYMENT_ERROR';
      }
    }
    
    const clientUrl = process.env.CLIENT_URL;
    const redirectUrl = new URL(`${clientUrl}/payment/response`);
    
    // Add status and transaction ID
    redirectUrl.searchParams.set('code', finalCode);
    if (merchantOrderId) {
      redirectUrl.searchParams.set('transactionId', merchantOrderId);
    }
    
    // Add any other query parameters
    Object.keys(req.query).forEach(key => {
      if (req.query[key] && key !== 'merchantOrderId') {
        redirectUrl.searchParams.set(key, req.query[key]);
      }
    });
    
    console.log('GET: Final redirect URL:', redirectUrl.toString());
    res.redirect(302, redirectUrl.toString());
    
  } catch (error) {
    console.error('PhonePe GET response handling error:', error);
    const clientUrl = process.env.CLIENT_URL;
    res.redirect(302, `${clientUrl}/payment/response?code=PAYMENT_ERROR`);
  }
});

// Test subscription update endpoint
router.post('/test-subscription/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const pool = req.app.locals.db;
    
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    
    const query = `
      UPDATE users SET 
        subscription_status = 'active',
        plan_name = 'Test Plan',
        plan_key = 'test',
        current_plan_id = 1,
        subscription_start_date = ?,
        subscription_end_date = ?,
        trial_used = false
      WHERE id = ?
    `;
    
    const [result] = await pool.query(query, [
      startDate.toISOString().slice(0, 19).replace('T', ' '),
      endDate.toISOString().slice(0, 19).replace('T', ' '),
      userId
    ]);
    
    res.json({ success: true, affectedRows: result.affectedRows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;