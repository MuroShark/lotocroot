import { NextResponse } from 'next/server';

/**
 * @route GET /api/health/donationalerts
 * @description Проверяет доступность сервиса DonationAlerts.
 * Выполняет HEAD-запрос с таймаутом.
 */
export async function GET() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 секунд таймаут

  try {
    const response = await fetch('https://www.donationalerts.com', {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store', // Не кэшируем результат
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return NextResponse.json({ ok: true });
    } else {
      // Сервис ответил, но не со статусом 2xx
      return NextResponse.json({ ok: false, error: `Сервис ответил со статусом: ${response.status}` }, { status: 503 });
    }
  } catch (error) {
    clearTimeout(timeoutId);
    // Ошибка сети или таймаут
    return NextResponse.json({ ok: false, error: 'Сервис недоступен или не отвечает.' }, { status: 503 });
  }
}