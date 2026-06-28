const crypto = require('crypto');

const AES_KEY_BASE64 = process.env.AES_KEY_BASE64 || process.env.AES_KEY || null;
let keyBuffer = null;
if (AES_KEY_BASE64) {
  try {
    keyBuffer = Buffer.from(AES_KEY_BASE64, 'base64');
    if (keyBuffer.length !== 32) {
      keyBuffer = null;
    }
  } catch (e) {
    keyBuffer = null;
  }
}

function ensureKey() {
  if (!keyBuffer) {
    throw new Error('AES key not configured (AES_KEY_BASE64)');
  }
}

function encryptString(plaintext) {
  ensureKey();
  const iv = crypto.randomBytes(12); // 96 bits for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
  const encrypted = Buffer.concat([cipher.update(Buffer.from(plaintext, 'utf8')), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: encrypted.toString('base64')
  };
}

function decryptToString(payload) {
  ensureKey();
  if (!payload || !payload.iv || !payload.tag || !payload.data) {
    throw new Error('Invalid encrypted payload format');
  }
  const iv = Buffer.from(payload.iv, 'base64');
  const tag = Buffer.from(payload.tag, 'base64');
  const data = Buffer.from(payload.data, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString('utf8');
}

module.exports = {
  encryptString,
  decryptToString,
  hasKey: () => !!keyBuffer
};
