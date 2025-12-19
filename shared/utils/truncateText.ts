/**
 * Обрезает текст до указанной длины и добавляет многоточие.
 * @param text - Исходный текст.
 * @param maxLength - Максимальная длина.
 * @returns Обрезанный текст.
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}…`;
};