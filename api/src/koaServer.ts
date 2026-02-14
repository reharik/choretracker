import cors from '@koa/cors';
import Router from '@koa/router';
import { RESOLVER } from 'awilix';
import dotenv from 'dotenv';
import http from 'http';
import Koa, { Context } from 'koa';
import { koaBody } from 'koa-body';
import { config } from './config';
import type { Container } from './container';
import { database } from './knex';
import { createErrorHandler } from './middleware/errorHandler';
import { createRequestLogger } from './middleware/requestLogger';

dotenv.config();

export type KoaServer = http.Server;

export const createKoaServer = ({ routes, optionalAuthMiddleware, logger }: Container) => {
  const app = new Koa();
  app.context.db = database;
  // 1. Error handling (should be first)
  app.use(createErrorHandler(logger));

  // 2. Request logging (early in pipeline)
  app.use(createRequestLogger(logger));

  // 3. CORS (before body parsing)
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }),
  );

  // 4. Body parsing (must be before request processing)
  app.use(koaBody());

  // 5. Auth middleware (before routes)
  app.use(optionalAuthMiddleware);

  // 6. Routes (the actual request handling)
  const router = new Router({ prefix: '/api' });
  routes.mountRoutes(router);
  app.use(router.routes()).use(router.allowedMethods());

  // Health check endpoint (no /api prefix, no auth required)
  app.use(async (ctx, next) => {
    if (ctx.path === '/health') {
      ctx.status = 200;
      ctx.body = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'chore-tracker-api',
      };
      return;
    }
    await next();
  });

  app.on('error', (err: Error, ctx: Context) => {
    logger.error(`Unhandled error on ${ctx.method} ${ctx.path}`, err, {
      status: ctx.status,
      requestId: ctx.get('x-request-id') || undefined,
      method: ctx.method,
      path: ctx.path,
    });
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', {
      reason,
    });
  });

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', err, {
      name: err.name,
    });
  });

  return http.createServer(app.callback());
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
(createKoaServer as any)[RESOLVER] = {};
