import { createLogger, format, transports, type Logger } from "winston";

type Level = "error" | "warn" | "info" | "http" | "verbose" | "debug";

interface ErrorWithResponse extends Error {
  response: {
    data?: unknown;
    status?: number;
    headers?: unknown;
  };
}

interface ErrorWithResponsePayload {
  data?: unknown;
  status?: number;
  headers?: unknown;
}

interface ErrorPayload {
  error?: Error;
  errorResponse?: ErrorWithResponsePayload;
}

// Type definition for error function overloads
type ErrorLogger = {
  (message: string): void;
  (message: string, err: Error): void;
  (message: string, errorMessage: string): void;
  (message: string, data: Record<string, unknown>): void;
  (message: string, err: Error, data: Record<string, unknown>): void;
  (message: string, errorMessage: string, data: Record<string, unknown>): void;
};

export type LoggerInterface = {
  error: ErrorLogger;
  warn: (val: string, data?: unknown) => void;
  info: (val: string, data?: unknown) => void;
  http: (val: string, data?: unknown) => void;
  verbose: (val: string, data?: unknown) => void;
  debug: (val: string, data?: unknown) => void;
};

const isErrorWithResponse = (err: unknown): err is ErrorWithResponse => {
  return (
    err != null &&
    typeof err === "object" &&
    "response" in err &&
    typeof (err as ErrorWithResponse).response === "object"
  );
};

const getErrorWithResponse = (err: unknown): ErrorWithResponsePayload => {
  if (isErrorWithResponse(err)) {
    return {
      data: err.response.data,
      status: err.response.status,
      headers: err.response.headers,
    };
  }
  return {};
};

const loggingFormat = format.combine(
  format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss.SSSS ZZ",
  }),
  format.errors({ stack: true }),
  format.splat(),
  format.json(),
);

const buildErrorLogPayload = (
  message: string,
  errorOrData?: Error | string | Record<string, unknown>,
  data?: Record<string, unknown>,
): { val: string; data?: unknown; err?: ErrorPayload } => {
  let err: Error | undefined;
  let meta: Record<string, unknown> | undefined;

  if (errorOrData === undefined) {
    // Case 1: Just message - create Error from message
    err = new Error(message);
  } else if (errorOrData instanceof Error) {
    // Case 2 or 5: Error object provided
    err = errorOrData;
    if (data !== undefined) {
      // Case 5: Error + additional data
      meta = data;
    }
  } else if (typeof errorOrData === "string") {
    // Case 3 or 6: String provided - create Error from string
    err = new Error(errorOrData);
    if (data !== undefined) {
      // Case 6: Error string + additional data
      meta = data;
    }
  } else {
    // Case 4: Object provided (not Error) - treat as metadata, create Error from message
    err = new Error(message);
    meta = errorOrData;
  }
  let errorData;
  if (err) {
    const error = err instanceof Error ? { error: err } : undefined;
    const errorResponse = getErrorWithResponse(err);
    errorData = {
      ...error,
      ...errorResponse,
    };
  }
  return { val: message, data: meta, err: errorData };
};

let choreTrackerLogger: Logger;
export const initLogger = (loggingLevel: Level = "info"): LoggerInterface => {
  choreTrackerLogger = createLogger({
    level: loggingLevel,
    format: loggingFormat,
    transports: [
      new transports.Console({
        format: loggingFormat,
        handleExceptions: true,
      }),
    ],
    levels: {
      error: 0,
      warn: 1,
      info: 2,
      http: 3,
      verbose: 4,
      debug: 5,
    },
  });
  const logMessage = (
    level: Level,
    val: string,
    data?: unknown,
    err?: ErrorPayload,
  ) => {
    choreTrackerLogger.log(level, val, {
      ...(data && typeof data === "object" && !Array.isArray(data)
        ? data
        : { data }),
      ...err,
    });
  };

  const error: ErrorLogger = (
    message: string,
    errorOrData?: Error | string | Record<string, unknown>,
    data?: Record<string, unknown>,
  ): void => {
    const payload = buildErrorLogPayload(message, errorOrData, data);
    logMessage("error", payload.val, payload.data, payload.err);
  };
  const warn = (val: string, data?: unknown) => {
    logMessage("warn", val, data);
  };
  const info = (val: string, data?: unknown) => {
    logMessage("info", val, data);
  };
  const http = (val: string, data?: unknown) => {
    logMessage("http", val, data);
  };
  const verbose = (val: string, data?: unknown) => {
    logMessage("verbose", val, data);
  };
  const debug = (val: string, data?: unknown) => {
    logMessage("debug", val, data);
  };
  return { error, warn, info, http, verbose, debug };
};

export const logger: LoggerInterface = initLogger();
