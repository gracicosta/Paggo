import { Router } from 'express';
import type { UserStore } from '../repositories/userRepository.js';

export function createHealthRouter(store: UserStore): Router {
  const router = Router();

  router.get('/health', async (_req, res) => {
    const database = await store.checkHealth();
    res.status(200).json({
      status: 'ok',
      service: 'paggo-backend',
      database,
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
