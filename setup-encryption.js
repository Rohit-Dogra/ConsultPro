#!/usr/bin/env node
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
// Generate a secure 256-bit (32-byte) AES key
function generateAESKey() {
  return crypto.randomBytes(32).toString('base64');
}
// Update environment files with encryption keys
function updateEnvFiles() {
  const aesKey = generateAESKey();
  :', aesKey);
  // Update frontend .env
  const frontendEnvPath = path.join(__dirname, '.env');
  let frontendEnv = '';
  try {
    frontendEnv = fs.readFileSync(frontendEnvPath, 'utf8');
  } catch (e) {
  }
  // Add or update VITE_AES_KEY
  if (frontendEnv.includes('VITE_AES_KEY=')) {
    frontendEnv = frontendEnv.replace(/VITE_AES_KEY=.*$/m, `VITE_AES_KEY=${aesKey}`);
  } else {
    frontendEnv += `\n# API Encryption\nVITE_AES_KEY=${aesKey}\n`;
  }
  fs.writeFileSync(frontendEnvPath, frontendEnv);
  // Update backend .env
  const backendEnvPath = path.join(__dirname, 'src', 'server', '.env');
  let backendEnv = '';
  try {
    backendEnv = fs.readFileSync(backendEnvPath, 'utf8');
  } catch (e) {
  }
  // Add or update AES_KEY_BASE64
  if (backendEnv.includes('AES_KEY_BASE64=')) {
    backendEnv = backendEnv.replace(/AES_KEY_BASE64=.*$/m, `AES_KEY_BASE64=${aesKey}`);
  } else {
    backendEnv += `\n# API Encryption\nAES_KEY_BASE64=${aesKey}\n`;
  }
  fs.writeFileSync(backendEnvPath, backendEnv);
}
// Create encryption configuration file
function createEncryptionConfig() {
  const configContent = `// API Encryption Configuration
export const ENCRYPTION_CONFIG = {
  // Enable encryption for all API requests in production
  ENCRYPT_ALL_REQUESTS: process.env.NODE_ENV === 'production',
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
export default ENCRYPTION_CONFIG;`;
  const configPath = path.join(__dirname, 'src', 'config', 'encryption.ts');
  fs.writeFileSync(configPath, configContent);
}
// Main execution
if (require.main === module) {
  try {
    updateEnvFiles();
    createEncryptionConfig();
  } catch (error) {
    process.exit(1);
  }
}
module.exports = { generateAESKey, updateEnvFiles, createEncryptionConfig };