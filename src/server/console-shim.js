// console-shim.js

const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  // Only disable logs in production
  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};
  console.warn = () => {};
  console.error = () => {};
} else {}