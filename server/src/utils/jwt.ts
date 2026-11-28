import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface SessionTokenPayload {
  sub: string;
  email: string;
  isDemo?: boolean;
}

export function signSessionToken(payload: SessionTokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: '7d' });
}

export function verifySessionToken(token: string): SessionTokenPayload {
  const decoded = jwt.verify(token, env.jwtSecret);
  if (typeof decoded === 'string' || !decoded.sub || typeof decoded.email !== 'string') {
    throw new Error('Token de sessão inválido.');
  }
  return {
    sub: decoded.sub,
    email: decoded.email,
    isDemo: Boolean(decoded.isDemo),
  };
}
