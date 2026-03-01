// src/di/load-modules.ts
import type { AwilixContainer } from "awilix";
import { asFunction } from "awilix";
import fg from "fast-glob";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { config } from "../config";
import type { LoggerInterface } from "../logger";

// Get current directory using import.meta.url (ESM)
const currentFileUrl = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFileUrl);

/**
 * Convention-over-config registration using import.meta.glob (production bundle) or runtime scanning:
 * - Scans services, repositories, controllers, middleware, routes, koaServer
 * - Uses named exports only (no default exports required)
 * - Registers only functions, via asFunction
 * - Applies your "createX" -> "x" naming rule
 */
export const registerModulesFromGlob = async (
  container: AwilixContainer,
  logger: LoggerInterface,
): Promise<void> => {
  // In production, Vite transforms import.meta.glob into a static object at build time
  // So we can't check if import.meta.glob is a function - it won't exist after bundling
  // Instead, just check if we're in production mode
  const isProduction = config.nodeEnv === "production";

  logger.info("[loadModules] Starting module registration", {
    nodeEnv: config.nodeEnv,
    isProduction,
    currentDir: currentDir,
  });

  if (isProduction) {
    // Production bundle: try Vite's import.meta.glob first (transformed at build time)
    try {
      registerForProduction(container, logger);
      // Verify koaServer was registered by trying to resolve it
      try {
        container.resolve("koaServer");
        logger.info(
          "[loadModules] Production glob registration successful - koaServer found",
        );
      } catch (resolveError) {
        logger.warn(
          "[loadModules] koaServer not found in glob, falling back to runtime scanning",
          {
            error:
              resolveError instanceof Error
                ? resolveError.message
                : String(resolveError),
            allRegistrations: Object.keys(container.registrations),
          },
        );
        await registerForDevelopment(container, logger);
      }
    } catch (error) {
      logger.warn(
        "[loadModules] Production glob failed, falling back to runtime scanning",
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
      );
      await registerForDevelopment(container, logger);
    }
  } else {
    // Dev mode OR running source in prod: use runtime file scanning with fast-glob
    logger.info("[loadModules] Using development/runtime scanning mode");
    await registerForDevelopment(container, logger);
  }
};

/**
 * Register exports from a module
 */
const registerModuleExports = (
  container: AwilixContainer,
  moduleExports: Record<string, unknown>,
  logger: LoggerInterface,
): void => {
  for (const [exportName, value] of Object.entries(moduleExports)) {
    // Ignore non-functions (types, constants, helpers you don't want registered)
    if (typeof value !== "function") continue;

    // Optional: skip "private" exports
    if (exportName.startsWith("_")) continue;

    const registrationName = formatName(exportName);
    logger.debug(
      `[loadModules] Registering: ${exportName} -> ${registrationName}`,
    );

    container.register({
      [registrationName]: asFunction(value as (...args: unknown[]) => unknown),
    });
  }
};

const registerForProduction = (
  container: AwilixContainer,
  logger: LoggerInterface,
): void => {
  // Note: import.meta.glob requires string literals, not variables (Vite build-time requirement)
  const modules = import.meta.glob(
    [
      "../services/**/*.{ts,js}",
      "../repositories/**/*.{ts,js}",
      "../controllers/**/*.{ts,js}",
      "../middleware/**/*.{ts,js}",
      "../routes/**/*.{ts,js}",
      "../koaServer.{ts,js}",
    ],
    {
      eager: true,
    },
  );

  const globPatterns = [
    "../services/**/*.{ts,js}",
    "../repositories/**/*.{ts,js}",
    "../controllers/**/*.{ts,js}",
    "../middleware/**/*.{ts,js}",
    "../routes/**/*.{ts,js}",
    "../koaServer.{ts,js}",
  ];
  logger.info("[loadModules] Production mode: using import.meta.glob", {
    patterns: globPatterns,
  });

  const moduleKeys = Object.keys(modules);
  logger.info("[loadModules] import.meta.glob found modules", {
    count: moduleKeys.length,
    keys: moduleKeys.slice(0, 20), // Log first 20 to avoid spam
    hasKoaServer: moduleKeys.some((key) => key.includes("koaServer")),
  });

  let registeredCount = 0;
  for (const [modulePath, mod] of Object.entries(modules)) {
    const moduleExports = mod as Record<string, unknown>;
    const exportNames = Object.keys(moduleExports).filter(
      (key) => typeof moduleExports[key] === "function",
    );
    logger.debug(`[loadModules] Processing module: ${modulePath}`, {
      exports: exportNames,
    });
    registerModuleExports(container, moduleExports, logger);
    registeredCount++;
  }

  logger.info("[loadModules] Production registration complete", {
    modulesProcessed: registeredCount,
    registeredKeys: Object.keys(container.registrations).slice(0, 20),
    hasKoaServerRegistration: "koaServer" in container.registrations,
  });
};

const registerForDevelopment = async (
  container: AwilixContainer,
  logger: LoggerInterface,
): Promise<void> => {
  // File scanning mode
  const patterns = [
    "services/**/*.{ts,js}",
    "repositories/**/*.{ts,js}",
    "controllers/**/*.{ts,js}",
    "middleware/**/*.{ts,js}",
    "routes/**/*.{ts,js}",
    "koaServer.{ts,js}",
  ];

  const baseDir = path.resolve(currentDir, ".."); // src directory (currentDir is src/di, so .. is src)

  logger.debug(`[loadModules] Scanning for modules in: ${baseDir}`, {
    patterns,
  });

  const files = await fg(patterns, {
    cwd: baseDir,
    absolute: true,
  });

  logger.debug(`[loadModules] Found ${files.length} files`, {
    fileCount: files.length,
    files,
  });

  for (const filePath of files) {
    try {
      // Use file:// URL for ES module imports
      const fileUrl = pathToFileURL(filePath).href;
      logger.debug(`[loadModules] Loading module: ${filePath}`);
      const mod = (await import(fileUrl)) as Record<string, unknown>;
      logger.debug(`[loadModules] Module exports`, {
        filePath,
        exports: Object.keys(mod),
      });
      registerModuleExports(container, mod, logger);
    } catch (error: unknown) {
      logger.warn(`[loadModules] Failed to load module ${filePath}`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }
};

/**
 * Mirrors your loadModules `formatName` behavior:
 * - If name starts with "create", strip it and lowercase the next char:
 *   "createUserService" -> "userService"
 * - Otherwise, leave name as-is (or lowerCamelCase it if you prefer).
 */
const formatName = (name: string): string => {
  if (name.startsWith("create") && name.length > 6) {
    const rest = name.slice(6);
    return rest.charAt(0).toLowerCase() + rest.slice(1);
  }

  // If you want strict parity with Awilix' default, you could just return name.
  // I'm keeping a tiny bit of safety: normalize first char to lower case.
  return name.charAt(0).toLowerCase() + name.slice(1);
};
