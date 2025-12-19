export interface Lot {
  id: number;
  number: number;
  content: string;
  amount: number | null;
  isPlaceholder?: boolean;
}