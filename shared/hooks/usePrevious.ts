import { useState, useEffect } from 'react';

/**
 * Хук для получения предыдущего значения переменной (пропса или состояния).
 * @param value Текущее значение.
 * @returns Предыдущее значение.
 */
export function usePrevious<T>(value: T): T | undefined {
  // Состояние для хранения предыдущего значения
  const [previous, setPrevious] = useState<T | undefined>(undefined);

  // Эффект для обновления предыдущего значения ПОСЛЕ того, как текущий рендер завершился.
  // Он сработает, когда `value` изменится.
  useEffect(() => {
    setPrevious(value);
  }, [value]);

  // Возвращаем значение, которое было сохранено в состоянии ДО обновления в useEffect.
  return previous;
}