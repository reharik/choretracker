import type { Knex } from "knex";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "./config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Convert null values to undefined in query results while preserving Date objects
const convertNullsToUndefined = (obj: unknown): unknown => {
  if (obj === null) return undefined;
  if (obj instanceof Date) return obj; // Preserve Date objects
  if (Array.isArray(obj)) return obj.map(convertNullsToUndefined);
  if (typeof obj === "object" && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key,
        convertNullsToUndefined(value),
      ]),
    );
  }
  return obj;
};

let __knexConfig: Knex.Config;

export const startUp = () => {
  if (__knexConfig) {
    return __knexConfig;
  }
  try {
    // Detect if we're running from dist/ (compiled) or src/ (development)
    // In dist: __dirname = /path/to/api/dist (compiled)
    // In src: __dirname = /path/to/api/src (development with tsx)
    // Check if the directory name is 'dist' to determine if we're compiled
    const isCompiled = path.basename(__dirname) === "dist";
    const ROOT = isCompiled ? __dirname : path.resolve(__dirname, "..");
    const MIGRATIONS_DIR = path.join(ROOT, "db/migrations");
    const SEEDS_DIR = path.join(ROOT, "db/seeds");

    const connection: Knex.StaticConnectionConfig = {
      host: config.postgresHost,
      port: config.postgresPort,
      user: config.postgresUser,
      password: config.postgresPassword,
      database: config.postgresDatabase,
    };

    __knexConfig = {
      client: "pg",
      connection,
      postProcessResponse: (result: unknown) => convertNullsToUndefined(result),
      migrations: {
        directory: MIGRATIONS_DIR,
        tableName: "knex_migrations",
        extension: isCompiled ? "js" : "ts",
      },
      seeds: {
        directory: SEEDS_DIR,
        extension: isCompiled ? "js" : "ts",
      },
    } satisfies Knex.Config;

    return __knexConfig;
  } catch (error) {
    console.log(`************error************`);
    console.log(error);
    console.log(`********END error************`);

    process.exit(1);
  }
};

export const knexConfig = startUp();

// Default export for Knex CLI
export default knexConfig;
