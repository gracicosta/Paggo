import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { toPublicUser, type UserStore } from '../repositories/userRepository.js';
import { sanitizeForAi } from '../utils/lgpd.js';

const fixedBillSchema = z.object({
  id: z.string(),
  title: z.string(),
  value: z.number().nonnegative(),
  dueDay: z.number().int().min(1).max(31),
  category: z.string(),
  status: z.enum(['Pendente', 'Vence hoje', 'Vencido']),
});

const subscriptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().nonnegative(),
  dueDay: z.number().int().min(1).max(31),
  service: z.enum(['netflix', 'spotify', 'amazon', 'other']),
  color: z.string().optional(),
});

const categoryBudgetSchema = z.object({
  id: z.string(),
  name: z.string(),
  limit: z.number().nonnegative(),
  spent: z.number().nonnegative().default(0),
  color: z.string(),
  background: z.string(),
});

const piggyBankSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().default(''),
  savedAmount: z.number().nonnegative(),
  goalAmount: z.number().nonnegative(),
  progress: z.number().min(0).max(100),
  iconType: z.string().optional(),
  progressColor: z.string(),
  deadline: z.string().optional(),
  createdAt: z.string().optional(),
  moves: z
    .array(
      z.object({
        id: z.string(),
        date: z.string(),
        amount: z.number(),
      }),
    )
    .optional(),
  completedAt: z.string().optional(),
});

const onboardingPayloadSchema = z.object({
  salary: z.number().nonnegative(),
  extraIncome: z.number().nonnegative().default(0),
  fixedBills: z.array(fixedBillSchema).default([]),
  subscriptions: z.array(subscriptionSchema).default([]),
  categoryBudgets: z.array(categoryBudgetSchema).default([]),
  piggyBanks: z.array(piggyBankSchema).default([]),
  onboarding: z
    .object({
      incomeSources: z.array(z.string()),
      payday: z.number().nullable(),
      goalMonths: z.number().nullable(),
      skippedSteps: z.array(z.number()),
      plan: z.array(
        z.object({
          text: z.string(),
          detail: z.string(),
          tag: z.enum(['Meta', 'Economia', 'Dica', 'Atenção']),
        }),
      ),
      completedAt: z.string(),
    })
    .optional(),
});

export function createOnboardingRouter(store: UserStore): Router {
  const router = Router();

  router.post('/onboarding', requireAuth, async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.auth?.sub;
      if (!userId) {
        res.status(401).json({ error: 'Sessão inválida.' });
        return;
      }

      const parsed = onboardingPayloadSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Dados de onboarding inválidos.' });
        return;
      }

      const updated = await store.saveOnboardingProfile(userId, parsed.data);
      const aiSafeContext = sanitizeForAi(updated);

      res.status(200).json({
        user: toPublicUser(updated),
        aiContextPreview: aiSafeContext,
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
