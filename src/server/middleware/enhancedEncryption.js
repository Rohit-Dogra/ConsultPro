const { decryptToString, encryptString, hasKey } = require('../encryption');
const logger = require('../logger');
// Sensitive endpoints that should always be encrypted in production
const SENSITIVE_ENDPOINTS = [
  '/api/auth',
  '/api/users',
  '/api/profiles',
  '/api/sessions',
  '/api/payments',
  '/api/wallet'
];
// Check if endpoint is sensitive
const isSensitiveEndpoint = (path) => {
  return SENSITIVE_ENDPOINTS.some(endpoint => path.startsWith(endpoint));
};
// Enhanced encryption middleware
const enhancedEncryptionMiddleware = (req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isSensitive = isSensitiveEndpoint(req.path);
  // Check encryption headers
  const wantsDecrypt = (req.get('x-encrypted') || '').toLowerCase() === 'aes';
  const wantsResponseEncrypt = (req.get('x-response-encrypt') || '').toLowerCase() === 'aes' || wantsDecrypt;
  // In production, enforce encryption for sensitive endpoints
  // In development, only encrypt when explicitly requested
  if (isProduction && isSensitive && !wantsResponseEncrypt && hasKey()) {
    logger.warn(`Unencrypted request to sensitive endpoint: ${req.path} from ${req.ip}`);
    return res.status(400).json({
      error: 'Encryption required for this endpoint',
      code: 'ENCRYPTION_REQUIRED'
    });
  }
  // Set flags for handlers
  req._aesEncrypted = wantsDecrypt;
  req._wantResponseEncrypted = wantsResponseEncrypt;
  req._isSensitiveEndpoint = isSensitive;
  // Enhanced response wrapper with automatic encryption for sensitive data
  const originalSend = res.send.bind(res);
  const originalJson = res.json.bind(res);
  // Wrap res.send
  res.send = function (body) {
    try {
      const contentType = res.getHeader('Content-Type') || '';
      const isJsonType = contentType.includes('application/json');
      const isObject = typeof body === 'object' && body !== null;
      // Auto-encrypt sensitive endpoints when encryption is available
      const shouldAutoEncrypt = isSensitive && hasKey() && (isJsonType || isObject);
      if ((req._wantResponseEncrypted || shouldAutoEncrypt) && hasKey() && (isJsonType || isObject)) {
        try {
          const plain = typeof body === 'string' ? body : JSON.stringify(body);
          const enc = encryptString(plain);
          res.set('x-encrypted', 'aes');
          res.set('Content-Type', 'application/json');
          if (process.env.SHOW_ENCRYPTION_LOGS === 'true') {
          }
          return originalSend(JSON.stringify(enc));
        } catch (err) {
          logger.error('Response encryption failed:', err);
          res.status(500);
          return originalSend(JSON.stringify({ error: 'Response encryption failed' }));
        }
      }
    } catch (e) {
      // If header inspection fails, fall back to original send
    }
    return originalSend(body);
  };
  // Wrap res.json for convenience
  res.json = function (obj) {
    res.set('Content-Type', 'application/json');
    return res.send(obj);
  };
  // Add helper method for encrypted responses
  res.encryptAndSend = function (data) {
    if (!hasKey()) {
      return res.status(500).json({ error: 'Encryption not available' });
    }
    try {
      const plain = typeof data === 'string' ? data : JSON.stringify(data);
      const enc = encryptString(plain);
      res.set('x-encrypted', 'aes');
      res.set('Content-Type', 'application/json');
      return originalSend(JSON.stringify(enc));
    } catch (err) {
      logger.error('Manual encryption failed:', err);
      return res.status(500).json({ error: 'Encryption failed' });
    }
  };
  // Handle encrypted request body
  if (wantsDecrypt) {
    if (!hasKey()) {
      return res.status(500).json({ 
        error: 'Server not configured for AES decryption',
        code: 'ENCRYPTION_UNAVAILABLE'
      });
    }
    try {
      const payload = req.body;
      if (payload && payload.iv && payload.tag && payload.data) {
        const decrypted = decryptToString(payload);
        try {
          req.body = JSON.parse(decrypted);
        } catch (e) {
          req.body = decrypted;
        }
        if (process.env.SHOW_ENCRYPTION_LOGS === 'true') {
        }
      }
    } catch (err) {
      logger.error('Failed to decrypt request body:', err);
      return res.status(400).json({ 
        error: 'Invalid encrypted payload',
        code: 'DECRYPTION_FAILED'
      });
    }
  }
  next();
};
module.exports = enhancedEncryptionMiddleware;