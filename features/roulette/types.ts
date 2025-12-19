export interface RouletteSegment {
  id: number;
  name: string;
  amount: number;
  color: string;
  animFactor?: number; // Для анимации исчезновения (1 -> 0)
}

export type GameMode = 'classic' | 'elimination';
export type EliminationMode = 'random' | 'visual';

export interface WinnerModalState {
  show: boolean;
  winner: RouletteSegment | null;
  isFinal: boolean;
}