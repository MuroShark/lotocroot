import { cookies } from 'next/headers';
import { DONATIONALERTS_SCOPES } from "@/entities/auth/model/constants";
import type { DonationAlertsTokenData } from '@/shared/types/donationalerts';

const DONATIONALERTS_TOKEN_URL = 'https://www.donationalerts.com/oauth/token';

// Глобальная переменная для хранения текущего промиса обновления.
// Это предотвращает одновременный запуск нескольких обновлений токена.
let refreshPromise: Promise<string> | null = null;

/**
 * Внутренняя логика обновления токена.
 * Выполняет запрос к API и обновляет куки.
 */
async function refreshAccessTokenLogic(): Promise<string> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('da_refresh_token')?.value;
  const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;
  const clientSecret = process.env.DONATION_ALERTS_CLIENT_SECRET;

  if (!refreshToken || !clientId || !clientSecret) {
    throw new Error('Missing refresh token or credentials');
  }

  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refreshToken);
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);
  params.append('scope', DONATIONALERTS_SCOPES);

  const response = await fetch(DONATIONALERTS_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    // Если рефреш не удался (токен протух окончательно или отозван)
    // Очищаем куки
    cookieStore.delete('da_access_token');
    cookieStore.delete('da_refresh_token');
    throw new Error('Failed to refresh token');
  }

  const data: DonationAlertsTokenData = await response.json();

  // Обновляем Access Token
  cookieStore.set('da_access_token', data.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // Рекомендуется lax для OAuth, чтобы куки летали при редиректах
    maxAge: data.expires_in,
    path: '/',
  });

  // Если сервер выдал новый Refresh Token, сохраняем его
  if (data.refresh_token) {
    cookieStore.set('da_refresh_token', data.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 дней
      path: '/',
    });
  }

  return data.access_token;
}

/**
 * Обертка-Singleton для обновления токена.
 * Если обновление уже запущено параллельным запросом, вернет тот же промис.
 */
async function getRefreshedToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessTokenLogic().finally(() => {
      // Очищаем переменную после завершения (успех или ошибка),
      // чтобы следующий запрос 401 мог снова попробовать обновить токен.
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/**
 * Обертка над fetch для запросов к DonationAlerts API.
 * Автоматически добавляет Authorization заголовок.
 * При ошибке 401 пытается обновить токен (с защитой от Race Condition) и повторить запрос.
 */
export async function fetchFromDonationAlerts(url: string, options: RequestInit = {}) {
  const cookieStore = await cookies();
  let accessToken = cookieStore.get('da_access_token')?.value;

  // Внутренняя функция для выполнения запроса
  const makeRequest = async (token: string | undefined) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  };

  // 1. Пробуем выполнить запрос с текущим токеном
  let response = await makeRequest(accessToken);

  // 2. Если получили 401 (Unauthorized), пробуем обновить токен
  if (response.status === 401) {
    console.log('[Server] Token expired, attempting refresh...');
    try {
      // ИСПОЛЬЗУЕМ БЕЗОПАСНУЮ ФУНКЦИЮ ОБНОВЛЕНИЯ
      accessToken = await getRefreshedToken();
      
      // 3. Повторяем запрос с новым токеном
      response = await makeRequest(accessToken);
    } catch (error) {
      console.error('[Server] Token refresh failed:', error);
      // Возвращаем оригинальный ответ 401, чтобы клиент обработал логаут
      return response;
    }
  }

  return response;
}