// API Encryption Configuration
export const ENCRYPTION_CONFIG = {
  // Enable encryption for all requests when key is available
  ENCRYPT_ALL_REQUESTS: true,
  
  // Always encrypt sensitive endpoints
  SENSITIVE_ENDPOINTS: [
    '/api/auth',
    '/api/users',
    '/api/profiles',
    '/api/sessions',
    '/api/payments',
    '/api/wallet'
  ],
  
  // Enable encryption if AES key is available
  ENCRYPTION_ENABLED: Boolean(import.meta.env.VITE_AES_KEY),
  
  // Show encryption status in development
  DEBUG_ENCRYPTION: process.env.NODE_ENV === 'development'
};

export default ENCRYPTION_CONFIG;