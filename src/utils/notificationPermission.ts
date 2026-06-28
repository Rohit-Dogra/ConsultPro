// Global notification permission handler
import { requestNotificationPermission } from '../config/firebase';
import clientLogger from './clientLogger';

let permissionRequested = false;
let successMessageShown = false;
let setupCompleted = false;

export const requestNotificationPermissionOnLoad = async () => {
  // Only request once per session
  if (permissionRequested) return;
  
  try {
    // Check if permission is already granted
    if (Notification.permission === 'granted') {
      clientLogger.info('Notification permission already granted');
      return true;
    }
    
    // Check if permission is denied
    if (Notification.permission === 'denied') {
      clientLogger.info('Notification permission denied by user');
      return false;
    }
    
    // Request permission automatically
    clientLogger.info('Requesting notification permission...');
    permissionRequested = true;
    
    const token = await requestNotificationPermission();
    
    if (token) {
      clientLogger.info('Notification permission granted successfully');
      return true;
    } else {
      clientLogger.info('Notification permission denied');
      return false;
    }
  } catch (error) {
    clientLogger.error('Error requesting notification permission:', error);
    return false;
  }
};

// Check if we should request permission
export const shouldRequestPermission = () => {
  // Don't request if already granted or denied
  if (Notification.permission !== 'default') return false;
  
  // Don't request if already requested this session
  if (permissionRequested) return false;
  
  return true;
};

// Check if success message should be shown
export const shouldShowSuccessMessage = () => {
  // Only show if permission is granted and message hasn't been shown
  if (Notification.permission !== 'granted') return false;
  if (successMessageShown) return false;
  
  successMessageShown = true;
  return true;
};

// Check if setup should be run
export const shouldRunSetup = () => {
  // Don't run if already completed
  if (setupCompleted) return false;
  
  // Don't run if permission not granted
  if (Notification.permission !== 'granted') return false;
  
  setupCompleted = true;
  return true;
};

// Reset permission request flag (for testing)
export const resetPermissionRequest = () => {
  permissionRequested = false;
  successMessageShown = false;
  setupCompleted = false;
}; 