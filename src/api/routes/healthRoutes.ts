import { Router } from 'express';
import { HealthController } from '@/api/controllers/HealthController';

export const healthRouter = (healthController: HealthController) => {
  const router = Router();

  router.get('/', healthController.checkHealth);

  return router;
};
