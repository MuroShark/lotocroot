import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  
  const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  const redirectUri = process.env.NEXT_PUBLIC_TWITCH_REDIRECT_URI;

  if (!code || !clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(new URL('/?error=no_code_or_config', request.url));
  }

  try {
    // 1. Обмен кода на токены
    const tokenRes = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(tokenData.message || 'Failed to get token');
    
    // 2. Получение User ID
    const userRes = await fetch('https://api.twitch.tv/helix/users', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Client-Id': clientId,
      },
    });
    
    const userData = await userRes.json();
    const userId = userData.data?.[0]?.id;

    // --- НОВАЯ ЛОГИКА: Проверяем, куда вернуть пользователя ---
    const cookieStore = await cookies();
    const returnPath = cookieStore.get('auth_return_url')?.value || '/';
    
    // Формируем URL для редиректа
    const targetUrl = new URL(returnPath, request.url);
    
    // Добавляем токены в параметры
    targetUrl.searchParams.set('twitch_token', tokenData.access_token);
    if (tokenData.refresh_token) {
      targetUrl.searchParams.set('twitch_refresh_token', tokenData.refresh_token);
    }
    targetUrl.searchParams.set('twitch_user_id', userId);
    
    // Удаляем куку возврата, чтобы она не мешала в будущем
    const response = NextResponse.redirect(targetUrl);
    response.cookies.delete('auth_return_url');

    return response;

  } catch (error) {
    console.error(error);
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
  }
}