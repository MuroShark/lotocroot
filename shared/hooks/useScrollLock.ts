import { useEffect, type RefObject } from 'react';

/**
 * Хук для блокировки прокрутки на элементе.
 * @param elementRef - Ref на DOM-элемент, прокрутку которого нужно заблокировать.
 * @param isLocked - Флаг, указывающий, должна ли прокрутка быть заблокирована. 
 */
export const useScrollLock = (elementRef: RefObject<HTMLElement | null>, isLocked: boolean) => {
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const preventScroll = (e: Event) => {
      e.preventDefault();
    };

    if (isLocked) {
      // Блокируем события колеса мыши и тач-события
      element.addEventListener('wheel', preventScroll, { passive: false });
      element.addEventListener('touchmove', preventScroll, { passive: false });
    }

    return () => {
      // Очищаем слушатели при разблокировке или размонтировании компонента
      element.removeEventListener('wheel', preventScroll);
      element.removeEventListener('touchmove', preventScroll);
    };
  }, [isLocked, elementRef]);
};