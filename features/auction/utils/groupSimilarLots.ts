import type { Lot } from '@/entities/lot';
import { findBestLotMatch, SIMILARITY_THRESHOLD } from './findBestLotMatch';

/**
 * Группирует похожие лоты вместе.
 * @param lots - Массив всех лотов.
 * @param similarityThreshold - Порог схожести, выше которого лоты считаются похожими.
 * @returns Объект, где ключ - ID "главного" лота, а значение - массив ID похожих лотов.
 */
export const groupSimilarLots = (
  lots: Lot[],
  similarityThreshold: number = SIMILARITY_THRESHOLD + 0.2 // Делаем порог чуть выше для группировки
): Record<number, number[]> => {
  const filledLots = lots.filter(lot => !lot.isPlaceholder && lot.content.trim().length > 2);
  const groups: Record<number, number[]> = {};
  const processedLotIds = new Set<number>();

  if (filledLots.length < 2) {
    return {};
  }

  for (const currentLot of filledLots) {
    if (processedLotIds.has(currentLot.id)) {
      continue;
    }

    const otherLots = filledLots.filter(l => l.id !== currentLot.id && !processedLotIds.has(l.id));
    const currentGroup = [currentLot.id];

    for (const otherLot of otherLots) {
      const { similarity } = findBestLotMatch(currentLot.content, [otherLot]);
      if (similarity >= similarityThreshold) {
        currentGroup.push(otherLot.id);
      }
    }

    if (currentGroup.length > 1) {
      groups[currentLot.id] = currentGroup;
      currentGroup.forEach(id => processedLotIds.add(id));
    }
  }

  return groups;
};