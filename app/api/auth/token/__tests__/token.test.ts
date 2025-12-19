import { POST } from '../route';

// Мокаем глобальную функцию fetch перед всеми тестами
global.fetch = jest.fn();

// Мокаем модуль 'next/server'
jest.mock('next/server', () => ({
  // Сохраняем оригинальные экспорты (если они нужны)
  ...jest.requireActual('next/server'),
  // Переопределяем NextResponse
  NextResponse: {
    json: jest.fn((body, init) => new Response(JSON.stringify(body), init)),
  },
}));

describe('API Route: /api/auth/token', () => {
  // Сохраняем оригинальные переменные окружения
  const originalEnv = process.env;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Сбрасываем моки и переменные окружения перед каждым тестом
    jest.resetModules();
    process.env = { ...originalEnv };
    (fetch as jest.Mock).mockClear();
    // "Шпионим" за console.error и заглушаем его вывод
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    // Восстанавливаем оригинальные переменные окружения после всех тестов
    process.env = originalEnv;
  });

  afterEach(() => {
    // Восстанавливаем оригинальную реализацию console.error после каждого теста
    consoleErrorSpy.mockRestore();
  });

  it('should successfully exchange an authorization code for an access token', async () => {
    // 1. Настраиваем переменные окружения для теста
    process.env.NEXT_PUBLIC_CLIENT_ID = 'test-client-id';
    process.env.DONATION_ALERTS_CLIENT_SECRET = 'test-client-secret';

    // 2. Мокаем успешный ответ от API DonationAlerts
    const mockTokenData = {
      token_type: 'Bearer',
      expires_in: 864000,
      access_token: 'mock_access_token',
      refresh_token: 'mock_refresh_token',
    };
    // Создаем простой мок, который имитирует успешный ответ fetch
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockTokenData),
    });

    // 3. Создаем мок-объект запроса (Request)
    const requestBody = {
      code: 'test_code',
      code_verifier: 'test_verifier',
      redirect_uri: 'http://localhost:3000',
    };
    const request = new Request('http://localhost/api/auth/token', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    // 4. Вызываем обработчик эндпоинта
    const response = await POST(request);
    const body = await response.json();

    // 5. Проверяем результат
    expect(response.status).toBe(200);
    expect(body).toEqual(mockTokenData);

    // 6. Проверяем, что fetch был вызван с правильными параметрами
    const expectedParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: 'test-client-id',
      client_secret: 'test-client-secret',
      code: 'test_code',
      redirect_uri: 'http://localhost:3000',
      code_verifier: 'test_verifier',
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://www.donationalerts.com/oauth/token',
      expect.objectContaining({
        method: 'POST',
        body: expectedParams.toString(),
      })
    );
  });

  it('should return an error if DonationAlerts API fails', async () => {
    process.env.NEXT_PUBLIC_CLIENT_ID = 'test-client-id';
    process.env.DONATION_ALERTS_CLIENT_SECRET = 'test-client-secret';

    const errorResponse = { error: 'invalid_grant', error_description: 'The provided authorization grant is invalid' };
    // Создаем мок, который имитирует ответ fetch с ошибкой
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValue(errorResponse),
    });
    const request = new Request('http://localhost/api/auth/token', {
      method: 'POST',
      body: JSON.stringify({ code: 'bad_code', code_verifier: 'bad_verifier', redirect_uri: 'http://localhost:3000' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'Failed to exchange token', details: errorResponse });
  });

  it('should return a 500 error if server configuration is missing', async () => {
    // Не устанавливаем DONATION_ALERTS_CLIENT_SECRET
    process.env.NEXT_PUBLIC_CLIENT_ID = 'test-client-id';
    process.env.DONATION_ALERTS_CLIENT_SECRET = '';

    const request = new Request('http://localhost/api/auth/token', {
      method: 'POST',
      body: JSON.stringify({ code: 'any_code', code_verifier: 'any_verifier', redirect_uri: 'http://localhost:3000' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Server configuration error' });
  });
});