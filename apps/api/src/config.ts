import dotenv, { config as dotEnvConfig, DotenvConfigOutput } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Only load .env if POSTGRES_HOST is not already set (e.g., by Docker)
if (!process.env.POSTGRES_HOST) {
  dotenv.config({ path: path.resolve(__dirname, "../.env") });
}

const nodeEnvs = ["development", "test", "production", "prod"];
type NodeEnv = (typeof nodeEnvs)[number];

export type Config = {
  nodeEnv: NodeEnv;
  // Database configuration
  postgresHost: string;
  postgresPort: number;
  postgresUser: string;
  postgresPassword: string;
  postgresDatabase: string;
  // JWT configuration
  jwtSecret: string;
  jwtExpiresIn: string;
  // CORS configuration (comma-separated origins in env, stored as array)
  corsOrigins: string[];
  // Server configuration
  serverPort: number;
  // Logging configuration
  logLevel: "error" | "warn" | "info" | "http" | "verbose" | "debug";
};

let config_: Config;
let instantiatedDotEnv: DotenvConfigOutput;

// Utility function to validate values against allowed options
const getValidValue = <T extends string>(
  value: string,
  allowedValues: readonly T[],
): T => {
  if (allowedValues.includes(value as T)) {
    return value as T;
  }
  throw new Error(
    `Invalid value: ${value}. Allowed values: ${allowedValues.join(", ")}`,
  );
};

export const setupConfig = (): Config => {
  if (!instantiatedDotEnv && !process.env.POSTGRES_HOST) {
    // Only load .env if not already configured (e.g., by Docker)
    instantiatedDotEnv = dotEnvConfig();
  }
  const nodeEnv = getValidValue<NodeEnv>(
    process.env.NODE_ENV || "development",
    nodeEnvs,
  );
  const isProduction = nodeEnv === "production" || nodeEnv === "prod";

  // Production safety checks - warnings will be logged after logger is initialized
  // Store warnings to log later
  const warnings: string[] = [];
  if (isProduction) {
    if (process.env.JWT_SECRET === "your-secret-key-here") {
      warnings.push(
        "⚠️  WARNING: Using default JWT secret in production! This is a security risk.",
      );
    }
  }

  // Always recreate config to pick up any env vars that were loaded after module import
  config_ = {
    nodeEnv,
    // Database configuration
    postgresHost: process.env.POSTGRES_HOST || "127.0.0.1",
    postgresPort: Number(process.env.POSTGRES_PORT || 5432),
    postgresUser: process.env.POSTGRES_USER || "postgres",
    postgresPassword: process.env.POSTGRES_PASSWORD || "",
    postgresDatabase: process.env.POSTGRES_DB || "chore_tracker",
    // JWT configuration
    jwtSecret: process.env.JWT_SECRET || "your-secret-key-here",
    jwtExpiresIn: "30d", // 30 days sliding scale
    // CORS configuration (comma-separated: https://chores.backintouch.net,https://backintouch.net)
    corsOrigins: (process.env.CORS_ORIGIN || "http://localhost:5173")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean),
    // Server configuration
    serverPort: Number(process.env.PORT || 3000),
    // Logging configuration
    logLevel:
      (process.env.LOG_LEVEL as
        | "error"
        | "warn"
        | "info"
        | "http"
        | "verbose"
        | "debug") || (isProduction ? "info" : "debug"),
  };

  // Return warnings to be logged after logger initialization
  if (warnings.length > 0) {
    (config_ as Config & { _warnings?: string[] })._warnings = warnings;
  }

  return config_;
};

// Export config - dotenv is already loaded at module import time above
export const config = setupConfig();
