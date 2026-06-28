// src/server/firebase-admin-init.js

const admin = require('firebase-admin');

// Temporary Firebase Admin configuration for testing
// You need to replace this with your actual service account JSON
if (!admin.apps.length) {
  try {
    // Try to initialize with service account file first
    const serviceAccount = require('./firebase-service-account.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://webapp-8fc0b-default-rtdb.firebaseio.com"
    });
    console.log('Firebase Admin initialized with service account file');
  } catch (error) {
    console.log('Service account file not found or invalid, using default app');
    // Fallback to default app (for testing only)
    admin.initializeApp({
      databaseURL: "https://webapp-8fc0b-default-rtdb.firebaseio.com"
    });
  }
}

module.exports = admin;
