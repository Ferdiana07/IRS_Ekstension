// ============================================================
// Utils: Logger
// NEVER log credentials, passwords, tokens, or cookies.
// ============================================================

export type LogLevel = 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'DEBUG';

export interface LogEntry {
  level: LogLevel;
  text: string;
  timestamp: number;
}

type LogCallback = (entry: LogEntry) => void;

class Logger {
  private static _debugMode = false;
  private static _callbacks: LogCallback[] = [];

  static setDebugMode(enabled: boolean): void {
    Logger._debugMode = enabled;
  }

  static onLog(cb: LogCallback): () => void {
    Logger._callbacks.push(cb);
    return () => {
      Logger._callbacks = Logger._callbacks.filter((c) => c !== cb);
    };
  }

  private static emit(level: LogLevel, text: string): void {
    const entry: LogEntry = { level, text, timestamp: Date.now() };

    // Console output
    const prefix = '[IRS-WAR]';
    switch (level) {
      case 'INFO':    console.log(`${prefix} ℹ ${text}`); break;
      case 'SUCCESS': console.log(`%c${prefix} ✓ ${text}`, 'color: #22c55e'); break;
      case 'WARN':    console.warn(`${prefix} ⚠ ${text}`); break;
      case 'ERROR':   console.error(`${prefix} ✗ ${text}`); break;
      case 'DEBUG':
        if (Logger._debugMode) console.debug(`${prefix} 🔍 ${text}`);
        break;
    }

    if (level === 'DEBUG' && !Logger._debugMode) return;

    // Notify subscribers (popup, background)
    Logger._callbacks.forEach((cb) => cb(entry));
  }

  static info(text: string): void    { Logger.emit('INFO', text); }
  static success(text: string): void { Logger.emit('SUCCESS', text); }
  static warn(text: string): void    { Logger.emit('WARN', text); }
  static error(text: string): void   { Logger.emit('ERROR', text); }
  static debug(text: string): void   { Logger.emit('DEBUG', text); }
}

export default Logger;
