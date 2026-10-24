import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./logging/logger.js";

const app = createApp();
app.listen(env.PORT, () => {
  logger.info("api.started", { port: env.PORT });
});