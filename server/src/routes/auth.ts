import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { DEMO_ALIAS_EMAIL, DEMO_ALIAS_PASSWORD, DEMO_EMAIL } from '../data/demoSeed.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { toPublicUser, type UserStore } from '../repositories/userRepository.js';
import { signSessionToken } from '../utils/jwt.js';
import { encryptSensitive, hashIdentifier, hashPassword, verifyPassword } from '../utils/lgpd.js';

const registerSchema = z.object({
  name: z.string().trim().min(3, 'Informe seu nome completo.'),
  email: z.string().trim().email('E-mail inválido.').transform((v) => v.toLowerCase()),
  password: z.string().optional().default(''),
  cpf: z.string().transform((v) => v.replace(/\D/g, '')).refine((v) => v.length === 11, 'CPF inválido.'),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento inválida.'),
  termsAcceptedAt: z.string().datetime().optional(),
  provider: z.enum(['email', 'google']).default('email'),
  googleSub: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email('E-mail inválido.').transform((v) => v.toLowerCase()),
  password: z.string().default(''),
});

const googleSchema = z.object({
  accessToken: z.string().min(1).optional(),
  mockProfile: z
    .object({
      name: z.string().trim().min(1),
      email: z.string().trim().email().transform((v) => v.toLowerCase()),
      sub: z.string().optional(),
    })
    .optional(),
});

interface GoogleUserInfo {
  sub?: string;
  name?: string;
  email?: string;
  email_verified?: boolean;
}

async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error('Token do Google inválido ou expirado.');
  }
  return (await response.json()) as GoogleUserInfo;
}

export function createAuthRouter(store: UserStore): Router {
  const router = Router();

  router.get('/check-email', async (req, res, next) => {
    try {
      const email = String(req.query.email ?? '').trim().toLowerCase();
      if (!email) {
        res.status(400).json({ error: 'E-mail é obrigatório.' });
        return;
      }
      if (email === DEMO_EMAIL || email === DEMO_ALIAS_EMAIL) {
        res.json({ registered: true });
        return;
      }
      const existing = await store.findByEmail(email);
      res.json({ registered: Boolean(existing) });
    } catch (err) {
      next(err);
    }
  });

  router.get('/check-cpf', async (req, res, next) => {
    try {
      const digits = String(req.query.cpf ?? '').replace(/\D/g, '');
      if (digits.length !== 11) {
        res.status(400).json({ error: 'CPF deve ter 11 dígitos.' });
        return;
      }
      const existing = await store.findByCpfHash(hashIdentifier(digits));
      res.json({ registered: Boolean(existing) });
    } catch (err) {
      next(err);
    }
  });

  router.post('/register', async (req, res, next) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Dados de cadastro inválidos.' });
        return;
      }

      const data = parsed.data;
      if (data.provider === 'email' && data.password.length < 8) {
        res.status(400).json({ error: 'A senha precisa ter pelo menos 8 caracteres.' });
        return;
      }

      if (data.email === DEMO_EMAIL || data.email === DEMO_ALIAS_EMAIL || (await store.findByEmail(data.email))) {
        res.status(409).json({ error: 'Já existe uma conta com esse e-mail.' });
        return;
      }

      const cpfHash = hashIdentifier(data.cpf);
      if (await store.findByCpfHash(cpfHash)) {
        res.status(409).json({ error: 'Esse CPF já tem uma conta no Paggo.' });
        return;
      }

      const passwordHash = data.provider === 'email' ? await hashPassword(data.password) : null;
      const user = await store.createUser({
        name: data.name,
        email: data.email,
        passwordHash,
        provider: data.provider,
        googleSub: data.googleSub ?? null,
        cpfEncrypted: encryptSensitive(data.cpf),
        cpfHash,
        birthDateEncrypted: encryptSensitive(data.birthDate),
        termsAcceptedAt: data.termsAcceptedAt ? new Date(data.termsAcceptedAt) : new Date(),
      });

      const token = signSessionToken({ sub: user.id, email: user.email });
      res.status(201).json({ token, user: toPublicUser(user) });
    } catch (err) {
      next(err);
    }
  });

  router.post('/login', async (req, res, next) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Informe e-mail e senha.' });
        return;
      }

      const { email, password } = parsed.data;

      if (
        (email === DEMO_ALIAS_EMAIL && password === DEMO_ALIAS_PASSWORD) ||
        email === DEMO_EMAIL
      ) {
        const demo = await store.upsertDemoUser();
        const token = signSessionToken({ sub: demo.id, email: demo.email, isDemo: true });
        res.json({ token, user: toPublicUser(demo) });
        return;
      }

      const found = await store.findByEmail(email);
      if (!found) {
        res.status(401).json({ error: 'E-mail ou senha incorretos.' });
        return;
      }

      if (found.passwordHash) {
        const valid = await verifyPassword(password, found.passwordHash);
        if (!valid) {
          res.status(401).json({ error: 'E-mail ou senha incorretos.' });
          return;
        }
      } else if (found.provider === 'google') {
        res.status(401).json({ error: 'Essa conta usa login com Google. Clique em "Entrar com Google".' });
        return;
      }

      const token = signSessionToken({ sub: found.id, email: found.email });
      res.json({ token, user: toPublicUser(found) });
    } catch (err) {
      next(err);
    }
  });

  router.post('/google', async (req, res, next) => {
    try {
      const parsed = googleSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Envie um accessToken do Google ou um perfil mock habilitado.' });
        return;
      }

      const { accessToken, mockProfile } = parsed.data;
      let profile: { email: string; name: string; sub?: string };

      if (accessToken) {
        const info = await fetchGoogleUserInfo(accessToken);
        if (!info.email) {
          res.status(400).json({ error: 'A conta Google não informou um e-mail.' });
          return;
        }
        profile = {
          email: info.email.toLowerCase(),
          name: info.name || info.email.split('@')[0],
          sub: info.sub,
        };
      } else if (mockProfile && env.allowGoogleMock) {
        profile = {
          email: mockProfile.email,
          name: mockProfile.name,
          sub: mockProfile.sub ?? `mock_google_${mockProfile.email}`,
        };
      } else {
        res.status(400).json({ error: 'Autenticação mock do Google desabilitada neste ambiente.' });
        return;
      }

      const existing = await store.findByEmail(profile.email);
      if (existing) {
        const token = signSessionToken({ sub: existing.id, email: existing.email });
        res.json({
          token,
          user: toPublicUser(existing),
          needsSignup: false,
        });
        return;
      }

      // Conta nova via Google: retorna perfil para completar o passo 2 do cadastro (CPF, nascimento 18+, termos)
      res.json({
        needsSignup: true,
        profile,
      });
    } catch (err) {
      if (err instanceof Error && err.message.includes('Google')) {
        res.status(401).json({ error: err.message });
        return;
      }
      next(err);
    }
  });

  router.post('/demo', async (_req, res, next) => {
    try {
      const demo = await store.upsertDemoUser();
      const token = signSessionToken({ sub: demo.id, email: demo.email, isDemo: true });
      res.json({ token, user: toPublicUser(demo) });
    } catch (err) {
      next(err);
    }
  });

  router.get('/me', requireAuth, async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.auth?.sub;
      if (!userId) {
        res.status(401).json({ error: 'Sessão inválida.' });
        return;
      }
      const user = await store.findById(userId);
      if (!user) {
        res.status(404).json({ error: 'Usuário não encontrado.' });
        return;
      }
      res.json({ user: toPublicUser(user) });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
