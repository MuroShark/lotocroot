import { create } from 'zustand';
import { persist, subscribeWithSelector, createJSONStorage } from 'zustand/middleware';
import { createSelector } from 'reselect';
import type { Lot as LotType } from '../types';

export interface LotsState {
  lots: Lot[];
  addLot: (content: string, amount: number | null) => void;
  nextLotId: number;
  deleteLot: (id: number) => void;
  updateLot: (id: number, additionalAmount: number, newContent?: string) => void;
  updateLotAmount: (id: number, additionalAmount: number) => void;
  setLotAmount: (id: number, newAmount: number | null) => void;
  updateLotContent: (id: number, newContent: string) => void;
  setLots: (lots: Lot[]) => void;
  clearLots: () => void;
  undoClearLots: () => void;
  lastClearedLots: Lot[] | null;
  mergeLots: (lotIds: number[]) => void;
}

export type Lot = LotType;

const createLotObject = (id: number, content: string, amount: number | null, isPlaceholder: boolean): Lot => {
  return { id: id, number: id, content, amount, isPlaceholder };
};

const getLotCategory = (lot: Lot) => {
  const amount = lot.amount;
  if (amount !== null && amount > 0) return 0; // 1. Положительные
  if (amount === 0 || amount === null) return 1; // 2. Нулевые и пустые
  return 2; // 3. Отрицательные
};

const sortLots = (lots: Lot[]): Lot[] => {
  return [...lots].sort((a, b) => {
    const categoryDiff = getLotCategory(a) - getLotCategory(b);
    return categoryDiff !== 0 ? categoryDiff : (b.amount ?? 0) - (a.amount ?? 0);
  });
};

export const useLotsStore = create<LotsState>()(subscribeWithSelector(persist(
  (set, get) => ({
    lots: [createLotObject(1, '', null, true)],
    nextLotId: 2,
    lastClearedLots: null,
    
    setLots: (newLots) => {
      if (newLots.length === 0) {
        set(state => ({ lots: [createLotObject(state.nextLotId, '', null, true)], nextLotId: state.nextLotId + 1 }));
      } else {
        // Обновляем nextLotId, чтобы новые лоты не конфликтовали с загруженными по ID
        const maxId = newLots.reduce((max, lot) => Math.max(max, lot.id), 0);
        set(state => ({ 
          lots: sortLots(newLots),
          nextLotId: Math.max(state.nextLotId, maxId + 1)
        }));
      }
    },

    addLot: (content, amount) =>
      set(state => {
        const newId = state.nextLotId;
        // Плейсхолдер - это лот, у которого НЕТ ни текста, ни суммы.
        // Если есть хотя бы что-то одно, это уже не плейсхолдер.
        const isPlaceholder = content.trim() === '' && (amount === null || amount === 0);
        const newLot = createLotObject(newId, content, amount, isPlaceholder);

        return { lots: sortLots([...state.lots, newLot]), nextLotId: newId + 1 };
      }),

    deleteLot: (id) => set(state => {
      const newLots = state.lots.filter(lot => lot.id !== id);
      if (newLots.length === 0) {
        const newPlaceholderId = state.nextLotId;
        return { lots: [createLotObject(newPlaceholderId, '', null, true)], nextLotId: newPlaceholderId + 1 };
      }
      return { lots: newLots };
    }),

    updateLot: (id, additionalAmount, newContent) => set((state) => {
      const lots = state.lots.map(lot => {
        if (lot.id !== id) return lot;

        const content = newContent !== undefined ? newContent : lot.content;
        const newAmount = (lot.amount ?? 0) + additionalAmount;
        const newIsPlaceholder = content.trim() === '' && newAmount === 0;

        return { ...lot, amount: newAmount, content, isPlaceholder: newIsPlaceholder };
      });

      return { lots: sortLots(lots) };
    }),

    updateLotAmount: (id, additionalAmount) => set(state => {
      const targetLot = state.lots.find(lot => lot.id === id);
      if (!targetLot) return state;

      const newAmount = ((targetLot.amount ?? 0) + additionalAmount) || null;
      const newIsPlaceholder = targetLot.content.trim() === '' && (newAmount === 0 || newAmount === null);

      const lots = sortLots(state.lots.map(lot => lot.id === id ? { ...lot, amount: newAmount, isPlaceholder: newIsPlaceholder } : lot));

      return { lots };
    }),

    setLotAmount: (id, newAmount) => set((state) => {
      const targetLot = state.lots.find(lot => lot.id === id);
      if (!targetLot) return state;

      const updatedLot = {
        ...targetLot,
        amount: newAmount,
        isPlaceholder: targetLot.content.trim() === '' && (newAmount === 0 || newAmount === null),
      };

      const lots = sortLots(state.lots.map(lot => lot.id === id ? updatedLot : lot));

      return { lots };
    }),

    updateLotContent: (id, newContent) => set(state => {
      const originalLot = state.lots.find(l => l.id === id);
      if (!originalLot) return state;
      const updatedLots = state.lots.map(lot => {
        if (lot.id !== id) return lot;
        
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const isPlaceholderBefore = lot.isPlaceholder;
        const newIsPlaceholder = newContent.trim() === '' && (lot.amount === 0 || lot.amount === null);

        return { ...lot, content: newContent, isPlaceholder: newIsPlaceholder};
      });

      return { lots: updatedLots };
    }),

    clearLots: () => {
      const currentLots = get().lots;
      if (currentLots.length === 1 && currentLots[0].isPlaceholder && currentLots[0].id === 1) {
        return;
      }
      set(() => {
        return {
          lastClearedLots: currentLots,
          lots: [createLotObject(1, '', null, true)], 
          nextLotId: 2, 
        };
      });
    },

    undoClearLots: () => set(state => {
      const restoredLots = state.lastClearedLots;
      if (restoredLots) {
        const maxIdInRestored = restoredLots.length > 0 ? Math.max(...restoredLots.map(l => l.id)) : 0;
        // Восстановленные лоты тоже лучше отсортировать на всякий случай
        return { lots: sortLots(restoredLots), lastClearedLots: null, nextLotId: Math.max(state.nextLotId, maxIdInRestored + 1) };
      } else {
        const newPlaceholderId = state.nextLotId;
        return { lots: [createLotObject(newPlaceholderId, '', null, true)], lastClearedLots: null, nextLotId: newPlaceholderId + 1 };
      }
    }),

    mergeLots: (lotIds) => set(state => {
      if (lotIds.length < 2) {
        return state; 
      }

      const lotsToMerge = state.lots.filter(lot => lotIds.includes(lot.id));
      if (lotsToMerge.length < 2) {
        return state;
      }

      const mainLot = lotsToMerge.reduce((prev, curr) => (prev.id < curr.id ? prev : curr));
      const totalAmount = lotsToMerge.reduce((sum, lot) => sum + (lot.amount ?? 0), 0);

      const updatedMainLot = {
        ...mainLot,
        amount: totalAmount,
        isPlaceholder: mainLot.content.trim() === '' && totalAmount === 0,
      };

      return { lots: sortLots([...state.lots.filter(lot => !lotIds.includes(lot.id)), updatedMainLot]) };
    }),
  }),
  {
    name: 'rouletta-lots-storage',
    // Используем createJSONStorage с проверкой window для корректной работы в SSR (Next.js)
    storage: createJSONStorage(() => {
      if (typeof window !== 'undefined') return localStorage;
      return {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      };
    }),
  }
)));

// --- Селекторы остаются без изменений ---

const selectLots = (state: LotsState) => state.lots;

export const selectFilteredLots = createSelector(
  selectLots,
  (state: LotsState, searchTerm: string) => searchTerm,
  (sortedLots, searchTerm) => {
    if (!searchTerm.trim()) return sortedLots;

    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return sortedLots.filter(lot =>
      lot.content.toLowerCase().includes(lowercasedSearchTerm) ||
      `#${lot.id}`.includes(lowercasedSearchTerm) ||
      `лот ${lot.id}`.includes(lowercasedSearchTerm)
    );
  }
);

export const selectTotalAmount = createSelector(
  (state: LotsState) => state.lots,
  (lots) => lots.reduce((sum, lot) => sum + (lot.amount ?? 0), 0)
);

export const selectPositiveTotalAmount = createSelector(
  (state: LotsState) => state.lots,
  (lots) => lots.reduce((sum, lot) => {
    return (lot.amount ?? 0) > 0 ? sum + lot.amount! : sum;
  }, 0)
);

export const selectLotContentsByIds = (ids: number[]): (state: LotsState) => { id: number; content: string }[] => createSelector(
  (state: LotsState) => state.lots,
  (lots): { id: number; content: string }[] => lots
    .filter(lot => ids.includes(lot.id))
    .map(lot => ({ id: lot.id, content: lot.content }))
);