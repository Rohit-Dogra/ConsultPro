const isProd = import.meta.env.MODE === 'production';
// Use VITE_SHOW_CLIENT_LOGS to opt-in to debug/info logging in dev
const showClientLogs = (import.meta.env as any).VITE_SHOW_CLIENT_LOGS === 'true';

// Keys considered sensitive that should be masked when logging
const SENSITIVE_KEYS = ['email', 'token', 'accessToken', 'refreshToken', 'password', 'ssn', 'name'];

function sanitizeValue(key: string, value: any) {
  if (value == null) return value;
  if (typeof value === 'string') {
    if (SENSITIVE_KEYS.includes(key)) {
      // mask emails and long tokens
      if (key === 'email') {
        const parts = value.split('@');
        return parts.length === 2 ? `${parts[0].slice(0, 2)}...@${parts[1]}` : '***';
      }
      return value.length > 8 ? `${value.slice(0, 4)}...${value.slice(-4)}` : '***';
    }
    return value;
  }
  if (typeof value === 'object') return sanitizeObject(value);
  return value;
}

function sanitizeObject(obj: any) {
  if (obj === null) return null;
  if (Array.isArray(obj)) return obj.map((v) => sanitizeObject(v));
  const out: any = {};
  for (const k of Object.keys(obj)) {
    try {
      if (SENSITIVE_KEYS.includes(k)) {
        out[k] = sanitizeValue(k, obj[k]);
      } else if (typeof obj[k] === 'object' && obj[k] !== null) {
        out[k] = sanitizeObject(obj[k]);
      } else {
        out[k] = obj[k];
      }
    } catch (e) {
      out[k] = '<<unserializable>>';
    }
  }
  return out;
}

function sanitizeArg(arg: any) {
  if (arg == null) return arg;
  if (typeof arg === 'object') return sanitizeObject(arg);
  return arg;
}

const originalConsole = { ...window.console };

export function debug(...args: any[]) {
  if (!isProd && showClientLogs) originalConsole.debug(...args.map(sanitizeArg));
}

export function info(...args: any[]) {
  if (!isProd && showClientLogs) originalConsole.info(...args.map(sanitizeArg));
}

export function warn(...args: any[]) {
  originalConsole.warn(...args.map(sanitizeArg));
}

export function error(...args: any[]) {
  originalConsole.error(...args.map(sanitizeArg));
}

// Apply a safe global console wrapper: in production, basic methods are no-ops (except error).
// In non-production, console methods are wrapped to sanitize sensitive fields.
if (isProd) {
  // @ts-ignore
  window.console.log = () => {};
  // @ts-ignore
  window.console.info = () => {};
  // @ts-ignore
  window.console.debug = () => {};
  // keep error
} else {
  // Replace console methods to sanitize arguments
  // Only enable debug/info wrappers when explicitly requested
  // @ts-ignore
  window.console.log = (...args: any[]) => {
    if (showClientLogs) originalConsole.log(...args.map(sanitizeArg));
  };
  // @ts-ignore
  window.console.info = (...args: any[]) => {
    if (showClientLogs) originalConsole.info(...args.map(sanitizeArg));
  };
  // @ts-ignore
  window.console.debug = (...args: any[]) => {
    if (showClientLogs) originalConsole.debug(...args.map(sanitizeArg));
  };
}

export default { debug, info, warn, error };
