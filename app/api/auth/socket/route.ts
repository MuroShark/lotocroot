import { NextResponse } from 'next/server';
import { fetchFromDonationAlerts } from '@/shared/lib/server/donationAlertsApi'; // Импорт утилиты
import type { DonationAlertsUserData, DonationAlertsSocketData } from '@/shared/types/donationalerts';

export async function POST() {
  try {
    // Используем нашу обертку. Она сама достанет токен и обновит его при необходимости.
    const userResponse = await fetchFromDonationAlerts('https://www.donationalerts.com/api/v1/user/oauth');

    if (!userResponse.ok) {
      const errorBody = await userResponse.text();
      return NextResponse.json({ error: 'Failed to fetch user data', details: errorBody }, { status: userResponse.status });
    }

    const userData: DonationAlertsUserData = await userResponse.json();
    
    const responseData: DonationAlertsSocketData = {
      id: userData.data.id,
      endpoint: 'wss://centrifugo.donationalerts.com/connection/websocket',
      token: userData.data.socket_connection_token,
    };
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error in /api/auth/socket:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}