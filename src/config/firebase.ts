import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCpswzW9x4toTJ-SIxCoUp0F7oWEzor_JY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "webapp-8fc0b.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://webapp-8fc0b-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "webapp-8fc0b",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "webapp-8fc0b.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1055297711001",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1055297711001:web:812094aeeff2f5defbc108",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-K8TQVZ2N56"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging and get a reference to the service
let messaging: any = null;

// Function to initialize messaging
const initializeMessaging = async () => {
  try {
    // Check if messaging is supported
    const isMessagingSupported = await isSupported();
    if (!isMessagingSupported) {
      console.log('Firebase messaging is not supported in this browser');
      return null;
    }

    messaging = getMessaging(app);
    return messaging;
  } catch (error) {
    console.error('Firebase messaging initialization error:', error);
    return null;
  }
};

// Function to request notification permission and get token
const requestNotificationPermission = async () => {
  try {
    // Initialize messaging if not already initialized
    if (!messaging) {
      messaging = await initializeMessaging();
      if (!messaging) return null;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      // Get FCM token
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        console.error('VAPID key is missing');
        return null;
      }

      const currentToken = await getToken(messaging, {
        vapidKey: vapidKey
      });
      
      if (currentToken) {
        // Token obtained successfully (don't log sensitive data)
        return currentToken;
      } else {
        console.log('No registration token available.');
        return null;
      }
    } else {
      console.log('Notification permission denied.');
      return null;
    }
  } catch (err) {
    console.error('An error occurred while retrieving token:', err);
    return null;
  }
};

// Function to handle foreground messages
const setupForegroundMessageHandler = () => {
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    // Message received in foreground
    
    // Show notification using browser's Notification API
    if (Notification.permission === 'granted') {
      const notificationTitle = payload?.notification?.title || 'New Notification';
      const notificationBody = payload?.notification?.body || 'You have a new message';
      const notificationData = payload?.data || {};

      const notificationOptions = {
        body: notificationBody,
        icon: '/logo.png',
        badge: '/badge.png',
        data: notificationData,
        requireInteraction: true,
        actions: [
          { action: 'open', title: 'Open' },
          { action: 'close', title: 'Close' }
        ]
      };

      // Show notification
      const notification = new Notification(notificationTitle, notificationOptions);

      // Handle notification click
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        notification.close();
        
        // Handle click action
        const clickAction = notificationData.click_action || '/';
        window.location.href = clickAction;
      };
    }
  });
};

// Initialize messaging and setup handlers
initializeMessaging().then(() => {
  setupForegroundMessageHandler();
});

export { app, messaging, requestNotificationPermission }; 