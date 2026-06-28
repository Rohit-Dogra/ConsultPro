const { decryptToString, encryptString, hasKey } = require('../encryption');

module.exports = (req, res, next) => {
  // If the incoming request signals AES encryption via header, decrypt it.
  const wantsDecrypt = (req.get('x-encrypted') || '').toLowerCase() === 'aes';
  const wantsResponseEncrypt = (req.get('x-response-encrypt') || '').toLowerCase() === 'aes' || wantsDecrypt;

  // expose flags so handlers can check
  req._aesEncrypted = wantsDecrypt;
  req._wantResponseEncrypted = wantsResponseEncrypt;

  // Wrap res.send to support JSON-only encryption for responses when requested.
  const originalSend = res.send.bind(res);
  res.send = function (body) {
    try {
      const contentType = (res.getHeader && (res.getHeader('Content-Type') || res.get('Content-Type'))) || res.get && res.get('Content-Type') || '';
      const isJsonType = typeof contentType === 'string' && contentType.includes('application/json');
      const isObject = typeof body === 'object' && body !== null;

      if (req._wantResponseEncrypted && hasKey() && (isJsonType || isObject)) {
          try {
            const plain = typeof body === 'string' ? body : JSON.stringify(body);
            const enc = encryptString(plain);
            res.set('x-encrypted', 'aes');
            res.set('Content-Type', 'application/json');
            // Send a string to avoid express converting objects to JSON via res.json
            return originalSend(JSON.stringify(enc));
          } catch (err) {
            res.status(500);
            return originalSend(JSON.stringify({ error: 'Response encryption failed' }));
          }
      }
    } catch (e) {
      // If header inspection fails, fall back to original send
    }
    return originalSend(body);
  };

  if (wantsDecrypt) {
    if (!hasKey()) {
      return res.status(500).json({ error: 'Server not configured for AES decryption' });
    }
    try {
      // Expecting body to be JSON object: { iv, tag, data }
      const payload = req.body;
      if (payload && payload.iv && payload.tag && payload.data) {
        const decrypted = decryptToString(payload);
        try {
          req.body = JSON.parse(decrypted);
        } catch (e) {
          // Not JSON, keep as raw string
          req.body = decrypted;
        }
      }
    } catch (err) {
      return res.status(400).json({ error: 'Invalid encrypted payload' });
    }
  }

  next();
};
