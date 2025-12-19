/**
 * Типы данных, возвращаемые API DonationAlerts.
 * Основано на предоставленных curl-ответах.
 */

/**
 * Ответ от /api/auth/token, содержащий токен доступа.
 */
export interface DonationAlertsTokenData {
  token_type: string;
  expires_in: number;
  access_token: string;
  refresh_token: string;
}

/**
 * Ответ от /api/auth/socket, содержащий данные для подключения к Centrifugo.
 */
export interface DonationAlertsSocketData {
  id: number;
  endpoint: string;
  token: string;
}

/**
 * Ответ от /api/auth/subscribe, содержащий токены для подписки на каналы.
 */
export interface SubscriptionToken {
  channel: string;
  token: string;
}

export interface DonationAlertsSubscribeData {
  subscription_tokens: SubscriptionToken[];
}

/**
 * Данные о пользователе, возвращаемые /api/v1/user/oauth.
 * Используется на сервере в /api/auth/socket.
 */
export interface DonationAlertsUserData {
  data: {
    id: number;
    code: string;
    name: string;
    avatar: string;
    email: string;
    socket_connection_token: string;
  };
}