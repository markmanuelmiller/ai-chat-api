import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { setupRoutes } from '@/api/routes';
import { errorHandler, notFoundHandler } from '@/api/middleware/errorMiddleware';
import { logger } from '@/utils/logger';

export const createApp = ({
  authController,
  chatController,
  healthController,
  authService,
}: {
  authController: any;
  chatController: any;
  healthController: any;
  authService: any;
}) => {
  const app = express();

  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
  });

  // Routes
  app.use('/api', setupRoutes(authController, chatController, healthController, authService));

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
