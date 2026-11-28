import { STORAGE_KEYS, readText, removeItem, writeText } from './storage';

const rawBaseUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
export const API_BASE_URL = rawBaseUrl ? rawBaseUrl.replace(/\/+$/, '') : '/api';

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export class ApiUnavailableError extends Error {
  constructor(message = 'Servidor indisponível no momento.') {
    super(message);
    this.name = 'ApiUnavailableError';
  }
}

export const readAuthToken = (): string | null => readText(STORAGE_KEYS.authToken);

export function writeAuthToken(token: string | null): void {
  if (token) writeText(STORAGE_KEYS.authToken, token);
  else removeItem(STORAGE_KEYS.authToken);
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {},
): Promise<T> {
  const { skipAuth, headers, ...rest } = options;
  const token = skipAuth ? null : readAuthToken();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch {
    throw new ApiUnavailableError();
  }

  // Proxy Vite retorna 502/503/504 quando o backend Node.js não está rodando localmente
  if (response.status >= 502 && response.status <= 504) {
    throw new ApiUnavailableError();
  }

  const contentType = response.headers.get('content-type') ?? '';
  const data = contentType.includes('application/json') ? ((await response.json()) as Record<string, unknown>) : null;

  if (!response.ok) {
    const message =
      (data && typeof data.error === 'string' && data.error) ||
      `Erro na requisição (${response.status}).`;
    throw new ApiError(response.status, message);
  }

  return data as T;
}
