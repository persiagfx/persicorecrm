import * as Sentry from "@sentry/nextjs";

const isDev = process.env.NODE_ENV !== "production";

type LogLevel = "debug" | "info" | "warn" | "error";

function log(level: LogLevel, message: string, ...args: unknown[]) {
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [${level.toUpperCase()}]`;
  if (level === "error") {
    console.error(prefix, message, ...args);
    // Send errors to Sentry in production
    const err = args.find((a) => a instanceof Error) as Error | undefined;
    if (err) {
      Sentry.captureException(err, { extra: { message } });
    } else {
      Sentry.captureMessage(message, "error");
    }
  } else if (level === "warn") {
    console.warn(prefix, message, ...args);
  } else if (isDev) {
    console.log(prefix, message, ...args);
  }
}

export const logger = {
  debug: (msg: string, ...args: unknown[]) => log("debug", msg, ...args),
  info: (msg: string, ...args: unknown[]) => log("info", msg, ...args),
  warn: (msg: string, ...args: unknown[]) => log("warn", msg, ...args),
  error: (msg: string, ...args: unknown[]) => log("error", msg, ...args),
};
