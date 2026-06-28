const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';

// Capture the original console methods at module load time so that
// later reassignments (by console-shim) don't cause recursive loops.
const originalConsole = {
  debug: console.debug.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};

function safeApplyOrig(fn, args) {
  try {
    return fn(...args);
  } catch (e) {
    // If logging fails, fall back to original console.error
    try {
      originalConsole.error('Logger failure:', e);
    } catch (err) {
      // swallow to avoid crashing
    }
  }
}

module.exports = {
  debug: (...args) => { if (!isProd) safeApplyOrig(originalConsole.debug, args); },
  info: (...args) => { if (!isProd) safeApplyOrig(originalConsole.info, args); },
  warn: (...args) => safeApplyOrig(originalConsole.warn, args),
  error: (...args) => safeApplyOrig(originalConsole.error, args),
};
