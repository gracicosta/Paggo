import 'dotenv/config';

export interface EnvConfig {
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  lgpdEncryptionKey: string;
  lgpdHashSecret: string;
  googleClientId: string;
  allowGoogleMock: boolean;
  corsOrigin: string;
  geminiApiKey: string;
  geminiModel: string;
}

export const env: EnvConfig = {
  port: Number(process.env.PORT) || 3001,
  databaseUrl:
    process.env.DATABASE_URL?.trim() ||
    'postgresql://paggo:paggo_dev_password@localhost:5432/paggo?schema=public',
  jwtSecret: process.env.JWT_SECRET?.trim() || 'paggo-dev-jwt-secret-change-in-prod',
  lgpdEncryptionKey:
    process.env.LGPD_ENCRYPTION_KEY?.trim() || 'paggo-dev-lgpd-aes256-secret-key-32b',
  lgpdHashSecret: process.env.LGPD_HASH_SECRET?.trim() || 'paggo-dev-lgpd-hmac-secret-key',
  googleClientId: process.env.GOOGLE_CLIENT_ID?.trim() || '',
  allowGoogleMock: process.env.ALLOW_GOOGLE_MOCK !== 'false',
  corsOrigin: process.env.CORS_ORIGIN?.trim() || 'http://localhost:5173',
  geminiApiKey: process.env.GEMINI_API_KEY?.trim() || '',
  geminiModel: process.env.GEMINI_MODEL?.trim() || 'gemini-2.0-flash',
};
