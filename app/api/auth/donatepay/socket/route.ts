import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { apiKey, region, type, channel, client, userId: providedUserId } = body;

    if (!apiKey || !region) {
      return NextResponse.json({ error: 'API Key and region are required' }, { status: 400 });
    }

    const baseUrl = region === 'ru' ? 'https://donatepay.ru' : 'https://donatepay.eu';

    // === СЦЕНАРИЙ 1: Получение начальной конфигурации ===
    if (type === 'config') {
      let userId = providedUserId;

      // ОПТИМИЗАЦИЯ: Если клиент не прислал ID, запрашиваем его у DonatePay.
      // Если прислал — экономим один запрос и избегаем 429 ошибки.
      if (!userId) {
          const userResponse = await fetch(`${baseUrl}/api/v1/user?access_token=${apiKey}`);
          
          if (!userResponse.ok) {
            // Обработка 429 и других ошибок
            if (userResponse.status === 429) {
                return NextResponse.json(
                    { error: 'Too Many Requests to DonatePay API (User Fetch)' }, 
                    { status: 429 }
                );
            }
            const errorText = await userResponse.text();
            console.error(`[DonatePay API] User fetch failed (${userResponse.status}):`, errorText);
            return NextResponse.json(
                { error: 'Upstream User Error', details: errorText }, 
                { status: userResponse.status }
            );
          }
          
          const userData = await userResponse.json();
          userId = userData?.data?.id;
      }

      // 2. Получаем общий токен сокета
      const tokenResponse = await fetch(`${baseUrl}/api/v2/socket/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: apiKey }),
      });
      
      if (!tokenResponse.ok) {
         if (tokenResponse.status === 429) {
            return NextResponse.json(
                { error: 'Too Many Requests to DonatePay API (Token Fetch)' }, 
                { status: 429 }
            );
        }
        const errorText = await tokenResponse.text();
        console.error(`[DonatePay API] Token fetch failed (${tokenResponse.status}):`, errorText);
        return NextResponse.json(
            { error: 'Upstream Token Error', details: errorText }, 
            { status: tokenResponse.status }
        );
      }

      const { token } = await tokenResponse.json();

      return NextResponse.json({
        endpoint: 'wss://centrifugo.donatepay.ru:443/connection/websocket',
        userId: String(userId),
        token,
      });
    }

    // === СЦЕНАРИЙ 2: Получение токена для канала (Без изменений, но с обработкой ошибок) ===
    if (type === 'channel_token') {
       if (!channel || !client) {
        return NextResponse.json({ error: 'Channel and Client ID required' }, { status: 400 });
      }

      const payload = {
        access_token: apiKey,
        client: client,
        channels: [channel]
      };

      const response = await fetch(`${baseUrl}/api/v2/socket/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
         const errorText = await response.text();
         console.error(`[DonatePay API] Channel token failed (${response.status}):`, errorText);
         return NextResponse.json({ error: errorText }, { status: response.status });
      }
      
      const data = await response.json();
      
      let channelToken = null;
      if (data.channels) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ch = data.channels.find((c: any) => c.channel === channel);
        if (ch) channelToken = ch.token;
      } else if (data.token) {
        channelToken = data.token;
      }

      if (!channelToken) return NextResponse.json({ error: 'Token not found in response' }, { status: 404 });

      return NextResponse.json({ token: channelToken });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

  } catch (error) {
    console.error('Error in /api/auth/donatepay/socket:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}