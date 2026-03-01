import { RESOLVER } from "awilix";
import { Context, Next } from "koa";
import type { LoggerInterface } from "../logger";

export const createRequestLogger =
  (logger: LoggerInterface) => async (ctx: Context, next: Next) => {
    const startTime = Date.now();

    logger.http("Incoming request", {
      method: ctx.method,
      path: ctx.path,
      ip: ctx.ip,
      userAgent: ctx.get("user-agent"),
    });

    await next();

    const duration = Date.now() - startTime;

    logger.http("Request completed", {
      method: ctx.method,
      path: ctx.path,
      status: ctx.status,
      duration: `${duration}ms`,
    });
  };

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
(createRequestLogger as any)[RESOLVER] = {};
