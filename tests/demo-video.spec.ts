import { test, expect } from '@playwright/test';

test.use({
  // Включаем запись видео для этого теста
  video: 'on',
  // Устанавливаем размер окна (HD)
  viewport: { width: 1280, height: 720 },
});

test('record demo video scenario', async ({ page }) => {
  // --- 1. Настройка визуального курсора ---
  // Playwright управляет "виртуальной" мышью, которая не видна на видео.
  // Мы добавляем свой элемент курсора, который будет следовать за координатами мыши.
  await page.addInitScript(() => {
    const installCursor = () => {
      if (document.getElementById('demo-cursor')) return;

      // Скрываем индикатор разработки Next.js (молнию/треугольник)
      const style = document.createElement('style');
      style.textContent = `
        nextjs-portal {
          display: none !important;
        }
      `;
      document.head.appendChild(style);

      const cursor = document.createElement('div');
      cursor.id = 'demo-cursor';
      Object.assign(cursor.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '32px',
        height: '32px',
        zIndex: '2147483647',
        pointerEvents: 'none',
        transition: 'transform 0.1s ease-out',
        backgroundImage: `url('data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="black" stroke="white" stroke-width="1.5"><path d="M5.5 3.21l10.08 20.16 4.25-9.56 9.56-4.25z"/></svg>')}')`,
        backgroundRepeat: 'no-repeat',
      });
      document.body.appendChild(cursor);
      document.addEventListener('mousemove', (e) => {
        cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      });
    };
    if (document.body) installCursor();
    else document.addEventListener('DOMContentLoaded', installCursor);
  });

  // Функция для плавного перемещения мыши к элементу
  async function moveMouseTo(selector: string, steps = 15) {
    const locator = page.locator(selector).first();
    // Ждем, пока элемент станет стабильным и видимым
    await locator.waitFor({ state: 'visible' });
    const box = await locator.boundingBox();
    if (box) {
      // Перемещаем в центр элемента за указанное количество шагов
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps });
    }
  }

  // --- 2. Сценарий ---
  
  // Открываем главную страницу
  await page.goto('/');
  
  // Ставим курсор в центр экрана (начальная точка)
  const viewport = page.viewportSize();
  if (viewport) {
    await page.mouse.move(viewport.width / 2, viewport.height / 2);
  }

  // ПАУЗА 5 СЕКУНД: Чтобы вы успели включить свою запись экрана
  await page.waitForTimeout(5000);
  
  // Ждем полной загрузки
  await page.waitForLoadState('networkidle');

  // 1. Ввод названия лота "Dota 2"
  const contentInput = 'input[placeholder="Название игры или лота..."]';
  await moveMouseTo(contentInput);
  await page.click(contentInput);
  await page.keyboard.type('Dota 2', { delay: 150 }); // Печатаем с задержкой

  // 2. Ввод суммы "500"
  const amountInput = 'input[placeholder="0 ₽"]';
  await moveMouseTo(amountInput);
  await page.click(amountInput);
  await page.keyboard.type('500', { delay: 150 });

  // 3. Нажатие кнопки добавления
  const addButton = 'button:has-text("Добавить")';
  await moveMouseTo(addButton);
  await page.click(addButton);

  // 4. Ожидание появления лота (1 секунда)
  await page.waitForTimeout(1000);
  await expect(page.locator('input[value="Dota 2"]')).toBeVisible();

  // 5. Переход на страницу Рулетки
  const rouletteLink = 'a[href="/roulette"]';
  await moveMouseTo(rouletteLink);
  await page.click(rouletteLink);
  await page.waitForURL('**/roulette');

  // 6. Изменение времени на 3 секунды
  const durationInput = 'input[placeholder="10"]';
  await moveMouseTo(durationInput);
  // Тройной клик выделяет все содержимое инпута
  await page.click(durationInput, { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.keyboard.type('3', { delay: 200 });

  // 7. Нажатие кнопки прокрута
  const spinButton = 'button:has-text("Крутить колесо")';
  await moveMouseTo(spinButton);
  await page.click(spinButton);

  // 8. Ожидание конца анимации и модального окна
  // Ждем кнопку "Принять", которая есть только в модальном окне победителя
  await expect(page.getByRole('button', { name: 'Принять' })).toBeVisible({ timeout: 15000 });

  // Небольшая пауза в конце видео, чтобы зритель успел увидеть результат
  await page.waitForTimeout(5000);
});