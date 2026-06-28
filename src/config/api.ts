// Default API URL based on environment
let API_BASE_URL: string;

// For local development
// if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
//   // Use HTTP for local development
//   API_BASE_URL = 'http://localhost:8080';
// } else if (window.location.hostname.includes('192.168.')) {
//   // For local network access - IMPORTANT: Use HTTP, not HTTPS for local network
//   API_BASE_URL = `http://${window.location.hostname}:8081`;
// } else {
//   // For production, use HTTPS
//   API_BASE_URL = 'https://api.expertisestation.com';
// }

// Override with environment variable if available
if (import.meta.env.VITE_API_URL) {
  API_BASE_URL = import.meta.env.VITE_API_URL;
}

// console.log('Using API URL:', API_BASE_URL);

export { API_BASE_URL };
