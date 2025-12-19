'use client';

/**
 * Генерирует случайную криптографически стойкую строку (code verifier) для использования в PKCE.
 * @param length - Длина генерируемой строки.
 * @returns Случайная строка.
 */
export const generateCodeVerifier = (length: number): string => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

/**
 * Создает `code_challenge` из `code_verifier` с использованием SHA-256.
 * @param codeVerifier - Строка, сгенерированная `generateCodeVerifier`.
 * @returns `code_challenge` в формате base64url.
 */
export const generateCodeChallenge = async (codeVerifier: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const buffer = new Uint8Array(digest);
  const codeChallenge = btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return codeChallenge;
};

/**
 * Обменивает авторизационный код на токен доступа.
 * Отправляет запрос на внутренний API-эндпоинт (`/api/auth/token`), который, в свою очередь,
 * безопасно выполняет запрос к DonationAlerts с использованием `client_secret`.
 * @param code - Авторизационный код, полученный от DonationAlerts.
 * @param codeVerifier - `code_verifier`, который был использован для генерации `code_challenge`.
 * @param redirectUri - URI для перенаправления, который использовался при запросе кода.
 * @returns `access_token` в случае успеха, иначе `null`.
 */
export const exchangeCodeForToken = async (
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<string | null> => {
  try {
    const response = await fetch('/api/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        code_verifier: codeVerifier,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to exchange code for token:', errorData);
      return null;
    }

    const data = await response.json();
    return data.access_token || null;
  } catch (error) {
    console.error('Error during token exchange:', error);
    return null;
  }
};