const { decryptToString, encryptString, hasKey } = require('../encryption');
const logger = require('../logger');

const simpleEncryptionMiddleware = (req, res, next) => {
  const wantsDecrypt = req.get('x-encrypted') === 'aes';
  const wantsResponseEncrypt = req.get('x-response-encrypt') === 'aes';
  
  req._aesEncrypted = wantsDecrypt;
  req._wantResponseEncrypted = wantsResponseEncrypt;
  
  // Add helper method for encrypted responses
  res.encryptAndSend = function(data) {
    if (!hasKey()) {
      return this.status(500).json({ error: 'Encryption not available' });
    }
    
    try {
      const plain = typeof data === 'string' ? data : JSON.stringify(data);
      const enc = encryptString(plain);
      this.set('x-encrypted', 'aes');
      this.set('Content-Type', 'application/json');
      return this.send(JSON.stringify(enc));
    } catch (err) {
      logger.error('Encryption failed:', err);
      return this.status(500).json({ error: 'Encryption failed' });
    }
  };
  
  // Handle encrypted request body
  if (wantsDecrypt && hasKey()) {
    try {
      const payload = req.body;
      if (payload && payload.iv && payload.tag && payload.data) {
        const decrypted = decryptToString(payload);
        req.body = JSON.parse(decrypted);
      }
    } catch (err) {
      logger.error('Decryption failed:', err);
      return res.status(400).json({ error: 'Invalid encrypted payload' });
    }
  }
  
  next();
};

module.exports = simpleEncryptionMiddleware;