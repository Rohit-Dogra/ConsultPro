// Suppress all console output while keeping statements in code
import './utils/console-suppressor';
import './utils/clientLogger';
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Register Firebase Messaging service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/firebase-messaging-sw.js')
    .then((registration) => {
      // Service worker registered successfully
    })
    .catch((error) => {
      // Service worker registration failed
    });
}

createRoot(document.getElementById("root")!).render(<App />);
