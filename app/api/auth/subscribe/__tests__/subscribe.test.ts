import { POST } from '../route';
import { NextResponse } from 'next/server';

// Мокаем глобальную функцию fetch перед всеми тестами
global.fetch = jest.fn();

// Мокаем модуль 'next/server', чтобы контролировать NextResponse.json
jest.mock('next/server', () => ({
  ...jest.requireActual('next/server'),
  NextResponse: {
    json: jest.fn((body, init) => new Response(JSON.stringify(body), init)),
  },
}));

describe('API Route: /api/auth/subscribe', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Сбрасываем моки перед каждым тестом
    (fetch as jest.Mock).mockClear();
    (NextResponse.json as jest.Mock).mockClear();
    // Заглушаем console.error для чистоты вывода тестов
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Восстанавливаем console.error после каждого теста
    consoleErrorSpy.mockRestore();
  });

  it('should return subscription tokens on a successful request', async () => {
    // 1. Мокаем успешный ответ от API DonationAlerts
    const mockSubscriptionData = {
      channels: [
        { channel: '$alerts:donation_123', token: 'sub_token_1' },
        { channel: '$alerts:donation_456', token: 'sub_token_2' },
      ],
    };
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(mockSubscriptionData),
    });

    // 2. Создаем мок запроса
    const requestBody = {
      channels: ['$alerts:donation_123', '$alerts:donation_456'],
      client: 'test-client-id',
    };
    const request = new Request('http://localhost/api/auth/subscribe', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-user-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    // 3. Вызываем обработчик
    const response = await POST(request);
    const body = await response.json();

    // 4. Проверяем результат
    expect(response.status).toBe(200);
    expect(body).toEqual({ subscription_tokens: mockSubscriptionData.channels });

    // 5. Проверяем, что fetch был вызван с правильными параметрами
    expect(fetch).toHaveBeenCalledWith(
      'https://www.donationalerts.com/api/v1/centrifuge/subscribe',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer valid-user-token',
        }),
        body: JSON.stringify(requestBody),
      })
    );
  });

  it('should return 401 if Authorization header is missing', async () => {
    const request = new Request('http://localhost/api/auth/subscribe', {
      method: 'POST',
      body: JSON.stringify({ channels: [], client: 'some-client' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized: Missing or invalid token' });
  });

  it('should return 400 if channels or client ID are missing in the body', async () => {
    const request = new Request('http://localhost/api/auth/subscribe', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer valid-user-token' },
      body: JSON.stringify({ channels: [] }), // Отсутствует 'client'
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'Bad Request: Missing channels or client ID' });
  });

  it('should return an error if DonationAlerts API fails', async () => {
    const errorDetails = { success: false, message: 'Invalid client' };
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValue(errorDetails),
    });

    const request = new Request('http://localhost/api/auth/subscribe', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer valid-user-token' },
      body: JSON.stringify({ channels: ['$alerts:donation_123'], client: 'test-client-id' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'Failed to get subscription token', details: errorDetails });
  });
});