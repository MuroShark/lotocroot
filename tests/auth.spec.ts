import { test, expect } from '@playwright/test';

// Группируем тесты, связанные с аутентификацией
test.describe('Authentication Flow', () => {  

  test('should show login button for unauthorized user', async ({ page }) => {
    await page.goto('/');
    // Ищем на странице кнопку, внутри которой есть текст "Подключить DonationAlerts"
    // `getByRole` - это лучший способ поиска интерактивных элементов.
    const loginButton = page.getByRole('button', { name: /Подключить DonationAlerts/i });

    // Проверяем, что кнопка видима на странице
    await expect(loginButton).toBeVisible();
  });

  test('should redirect to donationalerts on login button click', async ({ page }) => {    
    await page.goto('/');

    const loginButton = page.getByRole('button', { name: /Подключить DonationAlerts/i });

    // Кликаем на кнопку
    await loginButton.click();

    // Playwright автоматически дождется перехода на новую страницу

    // Проверяем, что URL новой страницы - это страница авторизации DonationAlerts
    // `toContain` используется вместо точного совпадения, так как URL может содержать динамические параметры
    // Мы ожидаем, что нас могут сначала перенаправить на страницу логина,
    // которая в свою очередь содержит URL для авторизации в параметре `redirectTo`.
    // Поэтому мы проверяем, что URL начинается с `https://www.donationalerts.com` и где-то в нем есть `/oauth/authorize`.
    await expect(page).toHaveURL(/^https:\/\/www\.donationalerts\.com.*(%2F|\/)oauth(%2F|\/)authorize.*/);
  });

  test('should exchange authorization code for a token and update UI', async ({ page }) => {
    const fakeAccessToken = 'playwright_fake_access_token';

    // 1. Перехватываем запрос на обмен кода. Это ключевая часть.
    await page.route('/api/auth/token', async route => {
      const request = route.request();
      const requestBody = request.postDataJSON();

      // Убедимся, что фронтенд отправил правильные данные
      expect(requestBody.code).toBe('fake_code_from_da');
      expect(requestBody.code_verifier).toBe('mock_code_verifier_for_playwright');

      // Отвечаем поддельным токеном, как будто бэкенд его успешно получил
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ access_token: fakeAccessToken }),
      });
    });

    // 2. Перехватываем запрос на получение данных для сокета.
    await page.route('/api/auth/socket', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 12345,
          endpoint: 'wss://centrifugo.donationalerts.com/connection/websocket',
          token: 'fake_centrifuge_token',
        }),
      });
    });

    // Устанавливаем code_verifier в localStorage для будущих навигаций на том же домене.
    // Этот скрипт выполняется до собственных скриптов страницы, гарантируя, что localStorage установлен.
    await page.addInitScript(() => {
      window.localStorage.setItem('code_verifier', 'mock_code_verifier_for_playwright');
    });

    // 3. Заходим на страницу с параметром `code`, имитируя возврат с DonationAlerts
    // и одновременно ждем, пока приложение сделает оба API-запроса.
    await Promise.all([
      page.waitForRequest('/api/auth/token'),
      page.waitForRequest('/api/auth/socket'),
      page.goto('/?code=fake_code_from_da'),
    ]);

    // 4. Проверяем результат
    // URL должен был очиститься от `code`
    await expect(page).not.toHaveURL(/code=fake_code_from_da/);

    // Сначала дожидаемся, пока кнопка входа исчезнет.
    // Это надежный индикатор того, что React начал процесс перерисовки UI.
    await expect(page.getByRole('button', { name: /Подключить DonationAlerts/i })).not.toBeVisible();

    // Теперь, когда UI обновился, мы можем уверенно проверять наличие новых элементов.
    const integrationsHeader = page.getByRole('heading', { name: 'Интеграции' });
    await expect(integrationsHeader).toBeVisible();

    // Раскрываем секцию с интеграциями, кликнув на заголовок.
    await integrationsHeader.click();

    // Дожидаемся завершения анимации, ожидая видимости контейнера, в котором находится checkbox.
    // В данном случае, это карточка интеграции DonationAlerts.
    await expect(page.getByText('DonationAlerts')).toBeVisible();

    // Сокет-соединение занимает некоторое время. Переключатель будет 'disabled', пока статус 'connecting'.
    // Дожидаемся, пока он станет активным. Это и будет нашей финальной проверкой.
    // Проверяем наличие первого элемента с ролью 'checkbox', который является мастер-переключателем.
    // Компонент Switch из shadcn/ui имеет роль 'checkbox', а не 'switch'.
    await expect(page.getByRole('checkbox').first()).toBeEnabled();
  });
});
