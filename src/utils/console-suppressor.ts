// console-suppressor.ts
// Suppress all console output in frontend while keeping statements in code

// Store original console methods
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
  trace: console.trace,
  table: console.table,
  group: console.group,
  groupEnd: console.groupEnd,
  time: console.time,
  timeEnd: console.timeEnd
};

// Suppress all console methods - statements remain in code but produce no output
export const suppressConsole = () => {
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
  console.error = () => {};
  console.debug = () => {};
  console.trace = () => {};
  console.table = () => {};
  console.group = () => {};
  console.groupEnd = () => {};
  console.time = () => {};
  console.timeEnd = () => {};
};

// Restore original console methods (for development/debugging if needed)
export const restoreConsole = () => {
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.debug = originalConsole.debug;
  console.trace = originalConsole.trace;
  console.table = originalConsole.table;
  console.group = originalConsole.group;
  console.groupEnd = originalConsole.groupEnd;
  console.time = originalConsole.time;
  console.timeEnd = originalConsole.timeEnd;
};

// Auto-suppress console on import
suppressConsole();