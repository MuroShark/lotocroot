export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Платформа, с которой пришел донат.
 * Используется для стилизации и внутренней логики.
 */
export type DonationPlatform = 'donationalerts' | 'twitch' | 'donatepay' | 'custom';

export interface Donation {
  id: string | number;
  username: string;
  message: string;
  amount: number;
  currency: string;
  platform: DonationPlatform;
  createdAt: string; // ISO 8601 date string
}


/**
 * Определяет доступные "экраны" в приложении.
 */
export type View = 'auction' | 'roulette' | 'settings';

export interface AuthState {
  token: string | null;
}
