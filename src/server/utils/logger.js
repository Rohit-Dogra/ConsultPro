const sanitizeLogInput = (input) => {
  if (typeof input !== 'string') {
    return JSON.stringify(input).replace(/[\r\n\t]/g, ' ');
  }
  return input.replace(/[\r\n\t]/g, ' ').substring(0, 1000);
};

const safeLog = {
  info: (message, data = {}) => {
    console.log(`[INFO] ${sanitizeLogInput(message)}`, sanitizeLogInput(data));
  },
  error: (message, error = {}) => {
    console.error(`[ERROR] ${sanitizeLogInput(message)}`, sanitizeLogInput(error.message || error));
  },
  warn: (message, data = {}) => {
    console.warn(`[WARN] ${sanitizeLogInput(message)}`, sanitizeLogInput(data));
  }
};

module.exports = { safeLog };