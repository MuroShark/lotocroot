import { create } from 'zustand';

/**
 * Группы похожих лотов.
 * Ключ - "главный" ID лота в группе.
 * Значение - массив ID всех похожих на него лотов (включая его самого).
 */
export type SimilarLotGroups = Record<number, number[]>;

interface SimilarLotsState {
  similarGroups: SimilarLotGroups;
  setSimilarGroups: (groups: SimilarLotGroups) => void;
  highlightedGroup: number[] | null;
  setHighlightedGroup: (group: number[] | null) => void;
}

export const useSimilarLotsStore = create<SimilarLotsState>((set) => ({
  similarGroups: {},
  setSimilarGroups: (groups) => set({ similarGroups: groups }),
  highlightedGroup: null,
  setHighlightedGroup: (group) => set({ highlightedGroup: group }),
}));