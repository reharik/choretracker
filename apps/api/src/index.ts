import { Config, config } from "./config";
import { container, initializeContainer } from "./container";
import { initLogger } from "./logger";

const startServer = async () => {
  // Initialize logger first with config log level
  const logger = initLogger(config.logLevel);

  // Log any warnings from config setup, because we can't call logger in config directly
  const configWithWarnings = config as Config & { _warnings?: string[] };
  if (configWithWarnings._warnings) {
    for (const warning of configWithWarnings._warnings) {
      logger.warn(warning);
    }
  }

  // Initialize container with logger and config (loads modules from glob or runtime scan)
  await initializeContainer(logger, config);

  const server = container.resolve("koaServer");

  server.listen(config.serverPort, () => {
    logger.info(`🚀 Server running on http://localhost:${config.serverPort}`, {
      port: config.serverPort,
      nodeEnv: config.nodeEnv,
    });
  });
};

void startServer();
