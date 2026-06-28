const { StandardCheckoutClient, Env, StandardCheckoutPayRequest } = require('pg-sdk-node');
const { createResponse } = require('./utils/response.utils');

class PaymentService {
  constructor() {
    this.clientId = process.env.PHONEPE_CLIENT_ID;
    this.clientSecret = process.env.PHONEPE_CLIENT_SECRET;
    this.clientVersion = parseInt(process.env.PHONEPE_CLIENT_VERSION || '1');
    this.env = process.env.PHONEPE_ENV === 'PRODUCTION' ? Env.PRODUCTION : Env.UAT;
    this.successUrl = '/appointment-log';
    this.failureUrl = '/payments';
 
    // Validate required configuration
    if (!this.clientId || !this.clientSecret) {
      throw new Error('Missing PhonePe configuration');
    }

    console.log('PhonePe SDK initialized with test credentials');

    try {
      // Initialize PhonePe SDK according to documentation
      this.client = StandardCheckoutClient.getInstance(
        this.clientId,
        this.clientSecret,
        this.clientVersion,
        this.env
      );
      
      console.log('PhonePe SDK initialized successfully');
    } catch (error) {
      console.error('PhonePe SDK initialization failed:', error);
      throw error;
    }
  }

  async initiatePayment(paymentData) {
    try {
        console.log('🔄 Calling PaymentService.initiatePayment with params:', {
            amount: paymentData.amount,
            bookingId: paymentData.bookingId,
            transactionId: paymentData.transactionId,
            userId: paymentData.userId
        });

        // Get environment variables - use local server for testing
        const baseUrl = process.env.BASE_URL;

        // Create payment request using PhonePe SDK - Standard Checkout
        const request = StandardCheckoutPayRequest.builder()
            .merchantOrderId(paymentData.transactionId)
            .amount(paymentData.amount)
            .redirectUrl(`${baseUrl}/api/payments/phonepe/response?merchantOrderId=${paymentData.transactionId}`)
            .build();
            


        // Initiate payment using PhonePe SDK
        const response = await this.client.pay(request);

        // Extract redirect URL from response
        const redirectUrl = response.redirectUrl;
        if (!redirectUrl) {
            throw new Error('No redirect URL in PhonePe response');
        }

        console.log('✅ PhonePe payment initiation successful:', {
            transactionId: paymentData.transactionId,
            redirectUrlLength: redirectUrl.length
        });

        return {
            redirectUrl: redirectUrl,
            transactionId: paymentData.transactionId
        };

    } catch (error) {
        console.error('Payment initiation failed:', error.message);
        
        throw new Error(`Payment initiation failed: ${error.message}`);
    }
}

  async checkStatus(merchantOrderId) {
    try {
        console.log('Checking order status for:', merchantOrderId);
        
        // Get order status using PhonePe SDK
        const response = await this.client.getOrderStatus(merchantOrderId);

        console.log('Order status response:', {
            merchantOrderId,
            state: response.state,
            code: response.code
        });

        return {
            success: response.state === 'COMPLETED',
            code: response.state === 'COMPLETED' ? 'PAYMENT_SUCCESS' : response.code,
            state: response.state,
            data: response
        };
    } catch (error) {
        console.error('Order status check failed:', {
            merchantOrderId,
            error: error.message
        });
        throw error;
    }
}

  async processCallback(payload, headers) {
    try {
      console.log('Processing callback with payload:', {
        payload,
        headers: {
          'content-type': headers['content-type'],
          'authorization': headers['authorization']
        }
      });

      // Handle form-urlencoded data
      let parsedPayload = payload;
      if (headers['content-type']?.includes('application/x-www-form-urlencoded')) {
        try {
          parsedPayload = JSON.parse(payload);
        } catch (e) {
          const urlParams = new URLSearchParams(payload);
          parsedPayload = Object.fromEntries(urlParams);
        }
      }

      // Verify callback using PhonePe SDK (if credentials are available)
      const username = process.env.PHONEPE_CALLBACK_USERNAME;
      const password = process.env.PHONEPE_CALLBACK_PASSWORD;
      
      if (username && password && headers['authorization']) {
        try {
          const callbackResponse = this.client.validateCallback(
            username,
            password,
            headers['authorization'],
            JSON.stringify(parsedPayload)
          );
          console.log('Callback validation successful');
        } catch (error) {
          console.error('Invalid callback signature:', error);
          return {
            success: false,
            code: 'INVALID_SIGNATURE',
            redirectPath: this.failureUrl,
            message: 'Invalid callback signature'
          };
        }
      }

      // Verify transaction status from PhonePe using SDK
      const transactionId = parsedPayload.transactionId || parsedPayload.merchantOrderId;
      const transactionStatus = await this.checkStatus(transactionId);
      console.log('Transaction status from PhonePe:', transactionStatus);

      if (transactionStatus.success && transactionStatus.code === 'PAYMENT_SUCCESS') {
        await this.updateTransactionStatus(
          transactionId,
          'success',
          transactionStatus.data?.providerReferenceId
        );

        return {
          success: true,
          code: 'PAYMENT_SUCCESS',
          redirectPath: this.successUrl,
          message: 'Payment successful'
        };
      } else {
        await this.updateTransactionStatus(
          transactionId,
          'failed',
          transactionStatus.data?.providerReferenceId
        );

        return {
          success: false,
          code: transactionStatus.code || 'PAYMENT_FAILED',
          redirectPath: this.failureUrl,
          message: transactionStatus.message || 'Payment failed'
        };
      }

    } catch (error) {
      console.error('Payment confirmation error:', error);
      return {
        success: false,
        code: 'PAYMENT_ERROR',
        redirectPath: this.failureUrl,
        message: 'Payment confirmation failed'
      };
    }
  }

  async updateTransactionStatus(transactionId, status, providerReferenceId = null) {
    if (!this.db) {
      console.warn('No database connection available for transaction update');
      return;
    }

    try {
      const query = `
        UPDATE payment_transactions 
        SET 
          status = ?,
          payment_reference = ?,
          updated_at = CURRENT_TIMESTAMP,
          confirmation_time = CURRENT_TIMESTAMP
        WHERE merchant_transaction_id = ?
      `;

      const [result] = await this.db.query(query, [
        status,
        providerReferenceId,
        transactionId
      ]);

      console.log('Transaction status updated:', {
        transactionId,
        status,
        providerReferenceId,
        rowsAffected: result.affectedRows
      });

      return result;

    } catch (dbError) {
      console.error('Database update failed:', dbError);
      throw dbError;
    }
  }

  async verifyPayment(merchantOrderId) {
    try {
        console.log('🔍 Verifying payment:', merchantOrderId);
        
        if (!merchantOrderId) {
            throw new Error('Merchant Order ID is required');
        }

        // Get order status for verification
        const response = await this.client.getOrderStatus(merchantOrderId);
        console.log('Payment verification response:', response);

        const isCompleted = response.state === 'COMPLETED';

        console.log('✅ Payment verification result:', {
            merchantOrderId,
            state: response.state,
            isCompleted
        });

        return {
            success: isCompleted,
            status: response.state,
            code: isCompleted ? 'PAYMENT_SUCCESS' : response.code,
            message: isCompleted ? 'Payment completed' : 'Payment not completed',
            transactionId: merchantOrderId,
            data: response
        };

    } catch (error) {
        console.error('❌ Payment verification error:', {
            message: error.message,
            merchantOrderId
        });
        
        return {
            success: false,
            message: `Payment verification failed: ${error.message}`,
            transactionId: merchantOrderId
        };
    }
}
}

module.exports = PaymentService;