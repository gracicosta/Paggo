import { PrismaClient } from '@prisma/client';
import { env } from './config/env.js';
import { createApp } from './app.js';
import { PrismaUserStore } from './repositories/userRepository.js';
import { PrismaTransactionStore } from './repositories/transactionRepository.js';

const prisma = new PrismaClient();
const store = new PrismaUserStore(prisma);
const transactions = new PrismaTransactionStore(prisma);
const app = createApp(store, transactions);

const server = app.listen(env.port, () => {
  console.log(`Paggo API rodando em http://localhost:${env.port}/api`);
});

process.on('SIGINT', async () => {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
});
