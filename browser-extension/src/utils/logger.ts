/**
 * Centralized logging utility for the Keyvault browser extension.
 * 
 * - Disables debug/info logs in production builds
 * - Sanitizes sensitive data in all logs
 * - Preserves warn/error logs in production (sanitized) for troubleshooting
 */

const isProd = import.meta.env.PROD;

/**
 * Recursively sanitizes input to redact sensitive fields.
 * 
 * @param input - The value to sanitize
 * @returns Sanitized value with sensitive fields redacted
 */
function sanitize(input: any): any {
  if (typeof input === "string") {
    return input
      .replace(/"password":".*?"/gi, '"password":"[REDACTED]"')
      .replace(/"username":".*?"/gi, '"username":"[REDACTED]"')
      .replace(/"encrypted":".*?"/gi, '"encrypted":"[REDACTED]"')
      .replace(/"privateKey":".*?"/gi, '"privateKey":"[REDACTED]"')
      .replace(/"passphrase":".*?"/gi, '"passphrase":"[REDACTED]"');
  }
  
  if (typeof input === "object" && input !== null) {
    const clone: any = Array.isArray(input) ? [] : {};
    
    for (const [key, value] of Object.entries(input)) {
      if (/password|username|encrypted|privateKey|passphrase/i.test(key)) {
        clone[key] = "[REDACTED]";
      } else {
        clone[key] = sanitize(value);
      }
    }
    
    return clone;
  }
  
  return input;
}

/**
 * Internal print function that handles sanitization and environment-based logging.
 * 
 * @param level - The log level
 * @param args - Arguments to log
 */
function print(level: "debug" | "info" | "warn" | "error", ...args: any[]): void {
  const safe = args.map(sanitize);
  
  // In development, all logs are enabled
  if (!isProd) {
    console[level](...safe);
    return;
  }
  
  // In production, only warn and error are enabled
  if (["warn", "error"].includes(level)) {
    console[level](...safe);
  }
}

/**
 * Logger utility with methods for different log levels.
 * 
 * - debug/info: Disabled in production
 * - warn/error: Enabled in production (sanitized)
 */
export const logger = {
  debug: (...args: any[]) => print("debug", ...args),
  info: (...args: any[]) => print("info", ...args),
  warn: (...args: any[]) => print("warn", ...args),
  error: (...args: any[]) => print("error", ...args),
  
  /**
   * Performance timing wrapper (auto-disabled in production).
   * 
   * @param label - Label for the timer
   */
  time: (label: string) => {
    if (!isProd) {
      console.time(label);
    }
  },
  
  /**
   * End performance timing (auto-disabled in production).
   * 
   * @param label - Label for the timer
   */
  timeEnd: (label: string) => {
    if (!isProd) {
      console.timeEnd(label);
    }
  },
};

