/**
 * Login com Google (Google Identity Services - fluxo OAuth 2.0 por token).
 *
 * O Client ID vem da variável de ambiente VITE_GOOGLE_CLIENT_ID (arquivo .env.local).
 * Sem ela, o botão "Entrar com Google" mostra um aviso em vez de abrir o pop-up.
 */

export interface GoogleProfile {
  name: string;
  email: string;
  picture?: string;
}

interface TokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface TokenClient {
  requestAccessToken: (overrides?: { prompt?: string }) => void;
}

interface GoogleOAuth2 {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    callback: (response: TokenResponse) => void;
    error_callback?: (error: { type?: string; message?: string }) => void;
  }) => TokenClient;
}

declare global {
  interface Window {
    google?: { accounts?: { oauth2?: GoogleOAuth2 } };
  }
}

const GSI_SRC = 'https://accounts.google.com/gsi/client';

export const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() || '';

export const isGoogleConfigured = () => GOOGLE_CLIENT_ID.length > 0;

let scriptPromise: Promise<void> | null = null;

function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('Não foi possível carregar o serviço do Google. Verifique sua conexão.'));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/** Abre o pop-up do Google e devolve nome e e-mail da conta escolhida. */
export async function signInWithGoogle(): Promise<GoogleProfile> {
  if (!isGoogleConfigured()) {
    throw new Error('Login com Google ainda não configurado (falta VITE_GOOGLE_CLIENT_ID).');
  }

  await loadGoogleScript();
  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) throw new Error('Serviço do Google indisponível no momento.');

  const accessToken = await new Promise<string>((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'openid email profile',
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error_description || 'O Google não autorizou o acesso.'));
          return;
        }
        resolve(response.access_token);
      },
      error_callback: (error) => {
        reject(
          new Error(
            error.type === 'popup_closed'
              ? 'A janela do Google foi fechada antes de concluir o login.'
              : error.message || 'Não foi possível entrar com o Google.',
          ),
        );
      },
    });
    client.requestAccessToken({ prompt: 'select_account' });
  });

  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Não foi possível ler os dados da sua conta Google.');

  const data = (await res.json()) as { name?: string; email?: string; picture?: string };
  if (!data.email) throw new Error('A conta Google não informou um e-mail.');

  return {
    name: data.name || data.email.split('@')[0],
    email: data.email,
    picture: data.picture,
  };
}
