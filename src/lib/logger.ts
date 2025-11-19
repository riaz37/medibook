export class Logger {
  constructor(private context: string) {}

  info(message: string, meta?: Record<string, unknown>) {
    console.info(`[${this.context}] ${message}`, meta || {});
  }

  warn(message: string, meta?: Record<string, unknown>) {
    console.warn(`[${this.context}] ${message}`, meta || {});
  }

  error(message: string, meta?: Record<string, unknown>) {
    console.error(`[${this.context}] ${message}`, meta || {});
  }
}

export const createLogger = (context: string) => new Logger(context);

