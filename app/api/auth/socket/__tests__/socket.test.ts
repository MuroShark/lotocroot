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

describe('API Route: /api/auth/socket', () => {
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

  it('should return socket connection data on successful authorization', async () => {
    // 1. Мокаем успешный ответ от API DonationAlerts
    const mockUserData = {
      data: {
        id: 12345,
        code: 'user-code',
        name: 'TestUser',
        avatar: 'some-url',
        email: 'test@example.com',
        socket_connection_token: 'mock-socket-token',
      },
    };
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockUserData),
    });

    // 2. Создаем мок запроса с валидным Bearer токеном
    const request = new Request('http://localhost/api/auth/socket', {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-access-token' },
    });

    // 3. Вызываем обработчик
    const response = await POST(request);
    const body = await response.json();

    // 4. Проверяем результат
    expect(response.status).toBe(200);
    expect(body).toEqual({
      id: 12345,
      endpoint: 'wss://centrifugo.donationalerts.com/connection/websocket',
      token: 'mock-socket-token',
    });

    // 5. Проверяем, что fetch был вызван с правильными параметрами
    expect(fetch).toHaveBeenCalledWith(
      'https://www.donationalerts.com/api/v1/user/oauth',
      expect.objectContaining({
        headers: { Authorization: 'Bearer valid-access-token' },
      })
    );
  });

  it('should return 401 if Authorization header is missing', async () => {
    const request = new Request('http://localhost/api/auth/socket', {
      method: 'POST',
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: 'Authorization header is missing or invalid' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should proxy the error if DonationAlerts API fails', async () => {
    // Мокаем ответ с ошибкой от DonationAlerts
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: jest.fn().mockResolvedValue('Unauthorized'), // Используем .text(), как в коде
    });

    const request = new Request('http://localhost/api/auth/socket', {
      method: 'POST',
      headers: { Authorization: 'Bearer expired-access-token' },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: 'Failed to fetch user data', details: 'Unauthorized' });
  });

  it('should return 500 if user data from DonationAlerts is incomplete', async () => {
    // Мокаем ответ с неполными данными (отсутствует socket_connection_token)
    const mockIncompleteUserData = { data: { id: 12345 } };
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockIncompleteUserData),
    });

    const request = new Request('http://localhost/api/auth/socket', {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-access-token' },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Incomplete user data from DonationAlerts' });
  });
});