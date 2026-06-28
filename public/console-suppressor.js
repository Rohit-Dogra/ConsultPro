// Global console suppression for browser
// This script suppresses all console output while keeping statements in code
(function() {
  'use strict';
  
  // Suppress all console methods
  if (typeof window !== 'undefined' && window.console) {
    const methods = ['log', 'info', 'warn', 'error', 'debug', 'trace', 'table', 'group', 'groupEnd', 'time', 'timeEnd'];
    methods.forEach(method => {
      if (window.console[method]) {
        window.console[method] = function() {};
      }
    });
  }
})();