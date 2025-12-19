import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { apiKey, region } = await request.json();

    if (!apiKey || !region) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    // ПРОВЕРКА ДЛИНЫ:
    // DonatePay падает с 500 ошибкой, если токен слишком длинный.
    // Блокируем такие запросы сразу.
    if (apiKey.length > 60) {
      return NextResponse.json(
        { isValid: false, message: 'Неверный формат токена (слишком длинный)' }, 
        { status: 200 }
      );
    }

    const baseUrl = region === 'ru' 
      ? 'https://donatepay.ru' 
      : 'https://donatepay.eu';

    const response = await fetch(`${baseUrl}/api/v1/user?access_token=${apiKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'StreamAuctionApp/1.0', 
      },
    });

    const data = await response.json();

    // Обработка ошибки от DonatePay
    if (data.status === 'error' || !data.data?.id) {
      return NextResponse.json(
        { isValid: false, message: 'Неверный токен' }, 
        { status: 200 }
      );
    }

    return NextResponse.json({ 
      isValid: true, 
      userData: {
        id: data.data.id,
        name: data.data.name,
        avatar: data.data.avatar
      } 
    });

  } catch (error) {
    console.error('DonatePay validation error:', error);
    return NextResponse.json({ isValid: false, message: 'Ошибка сервера' }, { status: 500 });
  }
}