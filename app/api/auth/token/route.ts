import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { DonationAlertsTokenData } from '@/shared/types/donationalerts';

// Функция паузы для повторных попыток
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  const DONATIONALERTS_TOKEN_URL = 'https://www.donationalerts.com/oauth/token';
  const DONATIONALERTS_CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID;
  const DONATIONALERTS_CLIENT_SECRET = process.env.DONATION_ALERTS_CLIENT_SECRET;

  if (!DONATIONALERTS_CLIENT_ID || !DONATIONALERTS_CLIENT_SECRET) {
    return NextResponse.json({ error: 'Server config error' }, { status: 500 });
  }

  try {
    const { code, code_verifier, redirect_uri } = await request.json();

    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', DONATIONALERTS_CLIENT_ID);
    params.append('client_secret', DONATIONALERTS_CLIENT_SECRET);
    params.append('code', code);
    params.append('redirect_uri', redirect_uri);
    params.append('code_verifier', code_verifier);

    // --- ЛОГИКА ПОВТОРНЫХ ПОПЫТОК (RETRY) ---
    let response: Response | null = null;
    let lastError: any = null;
    const MAX_RETRIES = 3;

    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        response = await fetch(DONATIONALERTS_TOKEN_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/x-www-form-urlencoded',
            // Маскируемся под браузер Chrome
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            // Просим не держать соединение (решает проблему SocketError)
            'Connection': 'close' 
          },
          body: params.toString(),
          // Отключаем кэширование
          cache: 'no-store', 
        });

        // Если ответ получен (даже с ошибкой 400), выходим из цикла
        if (response) break;
      } catch (error: any) {
        console.warn(`Attempt ${i + 1} failed:`, error.message);
        lastError = error;
        
        // Если это последний раз - пробрасываем ошибку дальше
        if (i === MAX_RETRIES - 1) break;
        
        // Ждем перед следующей попыткой (500мс, 1000мс...)
        await delay(500 * (i + 1));
      }
    }

    if (!response) {
      throw lastError || new Error('Failed to connect to DonationAlerts after retries');
    }
    // ----------------------------------------

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DA Error Response:', errorText);
      return NextResponse.json({ error: 'Failed to exchange token', details: errorText }, { status: response.status });
    }

    const tokenData: DonationAlertsTokenData = await response.json();

    const nextResponse = NextResponse.json({ success: true });
    const cookieStore = await cookies();

    cookieStore.set('da_access_token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokenData.expires_in,
      path: '/',
    });

    cookieStore.set('da_refresh_token', tokenData.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    return nextResponse;

  } catch (error: any) {
    console.error('Final server error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      message: error.message 
    }, { status: 500 });
  }
}