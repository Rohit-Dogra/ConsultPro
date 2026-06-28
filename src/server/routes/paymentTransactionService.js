let db;

class PaymentTransactionService {
  
  constructor(database = null) {
    this.db = database;
  }

  // Set database connection (to be called from routes)
  setDatabase(database) {
    this.db = database;
  }
  
  // Create a new payment transaction record
  async createTransaction(transactionData) {
    try {
      if (!this.db) {
        throw new Error('Database connection not initialized');
      }

      let { 
        booking_id, 
        merchant_transaction_id, 
        amount, 
        status = 'INITIATED',
        payment_type = 'booking', // Add default value
        metadata = null,          // Add optional metadata
        user_id = null           // Add user_id for subscription payments
      } = transactionData;

      if (!merchant_transaction_id || amount === undefined) {
        throw new Error('Missing required parameters: merchant_transaction_id and amount');
      }

      // For booking payments, booking_id is required and must exist in bookings table
      if (payment_type === 'booking' && !booking_id) {
        throw new Error('booking_id is required for booking payments');
      }
      
      // For subscription payments, set booking_id to NULL and store reference in metadata
      let finalBookingId = booking_id;
      let finalMetadata = metadata;
      
      if (payment_type === 'subscription') {
        if (!booking_id) {
          throw new Error('Subscription reference (bookingId) is required for subscription payments');
        }
        // Set booking_id to NULL for subscriptions, store reference in metadata
        finalBookingId = null;
        finalMetadata = {
          ...metadata,
          subscription_reference: booking_id,
          is_subscription_payment: true
        };
      }

      if (isNaN(Number(amount)) || Number(amount) <= 0) {
        throw new Error('Invalid amount');
      }

      // First, ensure the payment_transactions table has the right structure
      await this.ensureTableStructure();
      
      console.log('Table structure ensured, proceeding with transaction creation...');

      const query = `
        INSERT INTO payment_transactions 
        (booking_id, merchant_transaction_id, amount, status, payment_type, metadata, user_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      console.log('Creating payment transaction:', {
        booking_id: finalBookingId,
        merchant_transaction_id,
        amount,
        status,
        payment_type,
        user_id,
        metadata: finalMetadata
      });

      const [result] = await this.db.execute(query, [
        finalBookingId, // NULL for subscriptions, actual booking_id for bookings
        merchant_transaction_id,
        amount,
        status,
        payment_type,
        finalMetadata ? JSON.stringify(finalMetadata) : null,
        user_id
      ]);

      console.log('✅ Payment transaction created with ID:', result.insertId);
      return {
        success: true,
        transactionId: result.insertId,
        merchantTransactionId: merchant_transaction_id
      };

    } catch (error) {
      console.error('❌ Error creating payment transaction:', error);
      throw new Error(`Failed to create payment transaction: ${error.message}`);
    }
  }

  // Ensure payment_transactions table has the right structure
  async ensureTableStructure() {
    try {
      console.log('🔧 Updating payment_transactions table structure...');
      
      // First, drop the foreign key constraint if it exists
      try {
        await this.db.execute(`
          ALTER TABLE payment_transactions 
          DROP FOREIGN KEY payment_transactions_ibfk_1
        `);
        console.log('✅ Dropped foreign key constraint payment_transactions_ibfk_1');
      } catch (error) {
        console.log('ℹ️ Foreign key constraint payment_transactions_ibfk_1 not found or already dropped');
      }
      
      // Then make booking_id nullable
      try {
        await this.db.execute(`
          ALTER TABLE payment_transactions 
          MODIFY COLUMN booking_id VARCHAR(255) NULL
        `);
        console.log('✅ Made booking_id nullable');
      } catch (error) {
        console.log('⚠️ booking_id column update:', error.message);
      }
      
      // Check and add columns one by one (MySQL compatible)
      const columns = [
        { name: 'user_id', definition: 'INT NULL' },
        { name: 'payment_type', definition: "VARCHAR(50) DEFAULT 'booking'" },
        { name: 'metadata', definition: 'TEXT NULL' }
      ];
      
      for (const column of columns) {
        try {
          await this.db.execute(`
            ALTER TABLE payment_transactions 
            ADD COLUMN ${column.name} ${column.definition}
          `);
          console.log(`✅ Added column ${column.name}`);
        } catch (error) {
          // Column likely already exists
          if (error.message.includes('Duplicate column name')) {
            console.log(`ℹ️ Column ${column.name} already exists`);
          } else {
            console.log(`⚠️ Column ${column.name} update:`, error.message);
          }
        }
      }
      
      // Re-add foreign key constraint but allow NULL values
      try {
        await this.db.execute(`
          ALTER TABLE payment_transactions 
          ADD CONSTRAINT payment_transactions_ibfk_1 
          FOREIGN KEY (booking_id) REFERENCES bookings(id) 
          ON DELETE SET NULL
        `);
        console.log('✅ Re-added foreign key constraint with NULL support');
      } catch (error) {
        console.log('ℹ️ Foreign key constraint already exists or not needed:', error.message);
      }
      
      console.log('✅ Table structure update completed');
      
    } catch (error) {
      console.error('❌ Table structure update error:', error.message);
    }
  }

  // Update payment transaction status
  async updateTransactionStatus(merchantTransactionId, updates) {
    try {
      if (!this.db) {
        throw new Error('Database connection not initialized');
      }

      const { status, payment_id } = updates;
      
      let query = `
        UPDATE payment_transactions 
        SET status = ?, updated_at = NOW()
      `;
      let params = [status];

      if (payment_id) {
        query += `, payment_id = ?`;
        params.push(payment_id);
      }

      query += ` WHERE merchant_transaction_id = ?`;
      params.push(merchantTransactionId);

      console.log('Updating payment transaction:', {
        merchantTransactionId,
        status,
        payment_id
      });

      const [result] = await this.db.execute(query, params);

      if (result.affectedRows === 0) {
        throw new Error('Payment transaction not found');
      }

      console.log('✅ Payment transaction updated successfully');
      return {
        success: true,
        affectedRows: result.affectedRows
      };

    } catch (error) {
      console.error('❌ Error updating payment transaction:', error);
      throw new Error(`Failed to update payment transaction: ${error.message}`);
    }
  }

  // Get payment transaction by merchant transaction ID
  async getTransactionByMerchantId(merchantTransactionId) {
    try {
      if (!this.db) {
        throw new Error('Database connection not initialized');
      }

      const query = `
        SELECT pt.*, 
               COALESCE(b.seeker_id, pt.user_id) as user_id, 
               b.expert_id 
        FROM payment_transactions pt
        LEFT JOIN bookings b ON pt.booking_id = b.id
        WHERE pt.merchant_transaction_id = ?
      `;

      const [rows] = await this.db.execute(query, [merchantTransactionId]);

      if (rows.length === 0) {
        return null;
      }

      return rows[0];

    } catch (error) {
      console.error('❌ Error fetching payment transaction:', error);
      throw new Error(`Failed to fetch payment transaction: ${error.message}`);
    }
  }

  // Get payment transactions by booking ID
  async getTransactionsByBookingId(bookingId) {
    try {
      if (!this.db) {
        throw new Error('Database connection not initialized');
      }

      const query = `
        SELECT * FROM payment_transactions 
        WHERE booking_id = ? 
        ORDER BY created_at DESC
      `;

      const [rows] = await this.db.execute(query, [bookingId]);
      return rows;

    } catch (error) {
      console.error('❌ Error fetching payment transactions by booking ID:', error);
      throw new Error(`Failed to fetch payment transactions: ${error.message}`);
    }
  }

  // Get payment transaction with booking details
  async getTransactionWithBookingDetails(merchantTransactionId) {
    try {
      if (!this.db) {
        throw new Error('Database connection not initialized');
      }

      const query = `
        SELECT 
          pt.*,
          b.user_id,
          b.expert_id,
          b.session_date,
          b.session_time,
          b.session_type,
          b.status as booking_status,
          u.name as user_name,
          u.email as user_email,
          e.name as expert_name
        FROM payment_transactions pt
        LEFT JOIN bookings b ON pt.booking_id = b.id
        LEFT JOIN users u ON b.user_id = u.id
        LEFT JOIN experts e ON b.expert_id = e.id
        WHERE pt.merchant_transaction_id = ?
      `;

      const [rows] = await this.db.execute(query, [merchantTransactionId]);

      if (rows.length === 0) {
        return null;
      }

      return rows[0];

    } catch (error) {
      console.error('❌ Error fetching transaction with booking details:', error);
      throw new Error(`Failed to fetch transaction details: ${error.message}`);
    }
  }

  // Example of a method that performs some operations needing a transaction
  async someOperationNeedingTransaction(data) {
    const connection = await this.db.getConnection();
    try {
      await connection.beginTransaction();
      // Perform multiple operations...
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = PaymentTransactionService;