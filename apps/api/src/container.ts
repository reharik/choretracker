import { asValue, AwilixContainer, createContainer } from "awilix";
import type { Knex } from "knex";
import type { AutoLoadedContainer } from "./di/awilix.autoload";
import { registerModulesFromGlob } from "./di/loadModules";
import { database } from "./knex";
import type { LoggerInterface } from "./logger";
import type { Config } from "./config";

// Base container for manually registered services (not discovered by gen-awilix-container)
interface BaseContainer {
  connection: Knex;
  logger: LoggerInterface;
  config: Config;
}

export type Container = BaseContainer & AutoLoadedContainer;

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
    injectionMode: "PROXY",
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
