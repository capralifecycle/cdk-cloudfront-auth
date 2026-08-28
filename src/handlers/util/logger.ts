export const LogLevel = {
  none: 0,
  error: 10,
  warn: 20,
  info: 30,
  debug: 40,
} as const

export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel]

export class Logger {
  private logLevel: LogLevel

  constructor(logLevel: LogLevel) {
    this.logLevel = logLevel
  }

  private jsonify(args: any[]) {
    return args.map((arg: any): any => {
      if (typeof arg === "object") {
        try {
          return JSON.stringify(arg)
        } catch {
          return arg
        }
      }
      return arg
    })
  }
  public info(...args: any): void {
    if (this.logLevel >= LogLevel.info) {
      console.log(...this.jsonify(args))
    }
  }
  public warn(...args: any): void {
    if (this.logLevel >= LogLevel.warn) {
      console.warn(...this.jsonify(args))
    }
  }
  public error(...args: any): void {
    if (this.logLevel >= LogLevel.error) {
      console.error(...this.jsonify(args))
    }
  }
  public debug(...args: any): void {
    if (this.logLevel >= LogLevel.debug) {
      console.trace(...this.jsonify(args))
    }
  }
}
