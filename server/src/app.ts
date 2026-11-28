import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import type { UserStore } from './repositories/userRepository.js';
import { InMemoryTransactionStore, type TransactionStore } from './repositories/transactionRepository.js';
import { createHealthRouter } from './routes/health.js';
import { createAuthRouter } from './routes/auth.js';
import { createOnboardingRouter } from './routes/onboarding.js';
import { createTransactionsRouter } from './routes/transactions.js';
import { createDashboardRouter } from './routes/dashboard.js';
import { createPiggyBanksRouter } from './routes/piggyBanks.js';
import { createAiRouter } from './routes/ai.js';

export function createApp(store: UserStore, transactions: TransactionStore = new InMemoryTransactionStore()) {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigin.split(',').map((item) => item.trim()),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  app.use('/api', createHealthRouter(store));
  app.use('/api/auth', createAuthRouter(store));
  app.use('/api', createOnboardingRouter(store));
  app.use('/api', createTransactionsRouter(transactions, store));
  app.use('/api', createDashboardRouter(store, transactions));
  app.use('/api', createPiggyBanksRouter(store, transactions));
  app.use('/api', createAiRouter(store, transactions));

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    void _next;
    console.error('[paggo-backend]', err);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  });

  return app;
}
