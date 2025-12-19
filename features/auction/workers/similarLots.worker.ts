/// <reference lib="webworker" />

// Важно, чтобы импортируемые функции не зависели от API браузера (window, document)
// или специфичного для React кода. Наша функция `groupSimilarLots` подходит.
import { groupSimilarLots } from '../utils/groupSimilarLots';
import type { Lot } from '@/entities/lot';

// Этот обработчик будет запускаться, когда основной поток отправляет сообщение воркеру.
self.onmessage = (event: MessageEvent<{ lots: Lot[] }>) => {
  const { lots } = event.data;

  if (!lots) {
    return;
  }

  // 2. Выполняем тяжелую вычислительную задачу в фоновом потоке.
  const similarGroups = groupSimilarLots(lots);

  // 3. Отправляем результат обратно в основной поток.
  self.postMessage(similarGroups);
};