import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { refreshToken } = await request.json();
    
    const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;

    if (!refreshToken || !clientId || !clientSecret) {
      return NextResponse.json({ error: 'Missing config' }, { status: 400 });
    }

    // Запрос к Twitch на обновление
    const response = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Возвращаем новые токены клиенту
    return NextResponse.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token, // Twitch часто выдает новый refresh token тоже
    });

  } catch (error) {
    console.error('Refresh error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}