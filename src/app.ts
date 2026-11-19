// src/app.ts
import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { swaggerDocument } from './docs/swagger';
import { errorHandler } from './middlewares/error.middleware';
import { createDeidentifyRouter } from './routes/deidentify.routes';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(express.json({ limit: config.bodyLimit }));

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.use('/', createDeidentifyRouter());

  // Must be registered last
  app.use(errorHandler);

  return app;
}