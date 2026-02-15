import { asValue, AwilixContainer, createContainer } from 'awilix';
import type { Knex } from 'knex';
import { registerModulesFromGlob } from './di/loadModules';
import { database } from './knex';
import type { LoggerInterface } from './logger';

// Import types for registered services
import type Router from '@koa/router';
import type { Middleware } from 'koa';
import type { Config } from './config';
import type { AuthController } from './controllers/authController';
import type { ChoreController } from './controllers/choreController';
import type { ChoreRepository } from './repositories/choreRepository';
import type { ChoreRoutes } from './routes/choreRoutes';
import type { Routes } from './routes/createRoutes';
import type { AuthService } from './services/authService';

// Base container for manually registered services
interface BaseContainer {
  connection: Knex;
  logger: LoggerInterface;
  config: Config;
}

// Container with all registered services
export interface Container extends BaseContainer {
  authService: AuthService;
  authController: AuthController;
  authRoutes: Router;
  choreRepository: ChoreRepository;
  choreController: ChoreController;
  choreRoutes: ChoreRoutes;
  routes: Routes;
  optionalAuthMiddleware: Middleware;
  authMiddleware: Middleware;
  errorHandler: Middleware;
  requestLogger: Middleware;
  requireAuth: Middleware;
  optionalAuth: Middleware;
  koaServer: import('koa');
  [key: string]: unknown;
}

// Initialize container asynchronously (needed for dev mode file scanning)
let container: AwilixContainer<Container>;
const initializeContainer = async (
  logger: LoggerInterface,
  config: Config,
): Promise<AwilixContainer<Container>> => {
  if (container) {
    return container;
  }
  // Create the container with type inference
  const _container = createContainer<Container>({
    injectionMode: 'PROXY',
  });

  _container.register({
    // Register the database connection manually
    connection: asValue(database),
    logger: asValue(logger), // Register the logger for DI
    config: asValue(config), // Register the config for DI
  });

  await registerModulesFromGlob(_container, logger);
  container = _container;
  return container;
};

export { container, initializeContainer };
