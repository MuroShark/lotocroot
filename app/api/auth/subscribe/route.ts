import { NextResponse } from 'next/server';
import { fetchFromDonationAlerts } from '@/shared/lib/server/donationAlertsApi'; // Импорт утилиты

export async function POST(request: Request) {
  const { channels, client } = await request.json();
  if (!channels || !client) {
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
  }

  try {
    // Используем нашу обертку.
    const subTokenResponse = await fetchFromDonationAlerts('https://www.donationalerts.com/api/v1/centrifuge/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ channels, client }),
    });

    const subTokenData = await subTokenResponse.json();

    if (!subTokenResponse.ok) {
      return NextResponse.json({ error: 'Failed to subscribe', details: subTokenData }, { status: 400 });
    }

    return NextResponse.json({ subscription_tokens: subTokenData.channels });
  } catch (error) {
    console.error('[API][Subscribe] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}