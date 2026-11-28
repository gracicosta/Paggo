import type { NextFunction, Request, Response } from 'express';
import { verifySessionToken, type SessionTokenPayload } from '../utils/jwt.js';

export interface AuthenticatedRequest extends Request {
  auth?: SessionTokenPayload;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Sessão ausente ou expirada. Faça login novamente.' });
    return;
  }

  const token = header.slice('Bearer '.length).trim();
  try {
    req.auth = verifySessionToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}
