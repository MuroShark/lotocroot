import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TEN_MINUTES } from '@/features/auction/components/Timer/Timer';
import type { Donation } from '@/shared/types';

export type DonationSortOrder = 'newest' | 'oldest' | 'amountDesc' | 'amountAsc';

// 1. Выносим значения по умолчанию в экспортируемую константу
export const DEFAULT_AUCTION_STATE = {
  isCompactMode: false,
  showPercentages: false,
  isTotalAmountVisible: false,
  showTotalTimer: false,
  isRulesOpen: false, 
  isIncomingOpen: true,
  donationSortOrder: 'oldest' as DonationSortOrder,
  timerInitialTime: TEN_MINUTES,
  addTimeOnNewDonation: false,
  newDonationTimeToAdd: 60,
  preventTimeAddWhenOver: false,
  preventTimeAddThreshold: 2 * 60 * 1000,
  isMinBidEnabled: false,
  minBidAmount: 100,
  addTimeOnLeaderChange: false,
  leaderChangeTimeToAdd: 30,
  addTimeOnNewLot: false,
  newLotTimeToAdd: 60,
  // Drag & drop состояния
  isDonationDragging: false,
  hoveredLotId: null,
  draggedDonation: null,
};

interface AuctionViewState {
  // Настройки отображения
  isCompactMode: boolean;
  toggleCompactMode: () => void;
  
  showPercentages: boolean;
  toggleShowPercentages: () => void;
  
  isTotalAmountVisible: boolean;
  toggleTotalAmountVisibility: () => void;

  showTotalTimer: boolean;
  toggleShowTotalTimer: () => void;

  isRulesOpen: boolean;
  toggleRulesPanel: () => void;
  setRulesOpen: (isOpen: boolean) => void;

  isIncomingOpen: boolean;
  toggleIncomingPanel: () => void;
  setIncomingOpen: (isOpen: boolean) => void;

  donationSortOrder: DonationSortOrder;
  setDonationSortOrder: (order: DonationSortOrder) => void;

  // Drag & Drop
  isDonationDragging: boolean;
  setIsDonationDragging: (isDragging: boolean) => void;
  
  hoveredLotId: number | null;
  setHoveredLotId: (id: number | null) => void;
  
  draggedDonation: Donation | null;
  setDraggedDonation: (donation: Donation | null) => void;
  
  dragOffset: { x: number; y: number };
  setDragOffset: (offset: { x: number; y: number }) => void;
  
  draggedDonationSize: { width: number; height: number };
  setDraggedDonationSize: (size: { width: number; height: number }) => void;

  // Настройки таймера
  timerInitialTime: number;
  setTimerInitialTime: (timeInMs: number) => void;

  addTimeOnNewDonation: boolean;
  toggleAddTimeOnNewDonation: () => void;
  newDonationTimeToAdd: number;
  setNewDonationTimeToAdd: (seconds: number) => void;

  preventTimeAddWhenOver: boolean;
  togglePreventTimeAddWhenOver: () => void;
  preventTimeAddThreshold: number;
  setPreventTimeAddThreshold: (timeInMs: number) => void;

  isMinBidEnabled: boolean;
  toggleIsMinBidEnabled: () => void;
  minBidAmount: number;
  setMinBidAmount: (amount: number) => void;

  addTimeOnLeaderChange: boolean;
  toggleAddTimeOnLeaderChange: () => void;
  leaderChangeTimeToAdd: number;
  setLeaderChangeTimeToAdd: (seconds: number) => void;

  addTimeOnNewLot: boolean;
  toggleAddTimeOnNewLot: () => void;
  newLotTimeToAdd: number;
  setNewLotTimeToAdd: (seconds: number) => void;

  // 🔥 Метод для массового обновления (исправляет баг с шаблонами)
  setBulkSettings: (settings: Partial<AuctionViewState>) => void;

  // 🔥 Метод для сброса настроек
  resetViewSettings: () => void;
}

export const useAuctionViewStore = create<AuctionViewState>()(
  persist(
    (set) => ({
      // Применяем дефолтные значения
      ...DEFAULT_AUCTION_STATE,
      
      dragOffset: { x: 0, y: 0 },
      draggedDonationSize: { width: 0, height: 0 },

      // Действия
      toggleCompactMode: () => set((state) => ({ isCompactMode: !state.isCompactMode })),
      toggleShowPercentages: () => set((state) => ({ showPercentages: !state.showPercentages })),
      toggleTotalAmountVisibility: () => set((state) => ({ isTotalAmountVisible: !state.isTotalAmountVisible })),
      toggleShowTotalTimer: () => set((state) => ({ showTotalTimer: !state.showTotalTimer })),
      
      toggleRulesPanel: () => set((state) => ({ isRulesOpen: !state.isRulesOpen })),
      setRulesOpen: (isOpen) => set({ isRulesOpen: isOpen }),

      toggleIncomingPanel: () => set((state) => ({ isIncomingOpen: !state.isIncomingOpen })),
      setIncomingOpen: (isOpen) => set({ isIncomingOpen: isOpen }),

      setDonationSortOrder: (order) => set({ donationSortOrder: order }),

      setIsDonationDragging: (isDragging) => set({ isDonationDragging: isDragging }),
      setHoveredLotId: (id) => set({ hoveredLotId: id }),
      setDraggedDonation: (donation) => set({ draggedDonation: donation }),
      setDragOffset: (offset) => set({ dragOffset: offset }),
      setDraggedDonationSize: (size) => set({ draggedDonationSize: size }),

      setTimerInitialTime: (timeInMs) => set({ timerInitialTime: timeInMs }),

      toggleAddTimeOnNewDonation: () => set((state) => ({ addTimeOnNewDonation: !state.addTimeOnNewDonation })),
      setNewDonationTimeToAdd: (seconds) => set({ newDonationTimeToAdd: seconds }),

      togglePreventTimeAddWhenOver: () => set((state) => ({ preventTimeAddWhenOver: !state.preventTimeAddWhenOver })),
      setPreventTimeAddThreshold: (timeInMs) => set({ preventTimeAddThreshold: timeInMs }),

      toggleIsMinBidEnabled: () => set((state) => ({ isMinBidEnabled: !state.isMinBidEnabled })),
      setMinBidAmount: (amount) => set({ minBidAmount: amount }),

      toggleAddTimeOnLeaderChange: () => set((state) => ({ addTimeOnLeaderChange: !state.addTimeOnLeaderChange })),
      setLeaderChangeTimeToAdd: (seconds) => set({ leaderChangeTimeToAdd: seconds }),

      toggleAddTimeOnNewLot: () => set((state) => ({ addTimeOnNewLot: !state.addTimeOnNewLot })),
      setNewLotTimeToAdd: (seconds) => set({ newLotTimeToAdd: seconds }),

      // Реализация setBulkSettings
      setBulkSettings: (settings) => set((state) => ({ ...state, ...settings })),

      // Реализация resetViewSettings
      resetViewSettings: () => set(DEFAULT_AUCTION_STATE),
    }),
    {
      name: 'rouletta-auction-view-storage',
      partialize: (state) => ({
        isCompactMode: state.isCompactMode,
        showPercentages: state.showPercentages,
        isTotalAmountVisible: state.isTotalAmountVisible,
        showTotalTimer: state.showTotalTimer,
        isRulesOpen: state.isRulesOpen,
        isIncomingOpen: state.isIncomingOpen,
        donationSortOrder: state.donationSortOrder,
        timerInitialTime: state.timerInitialTime,
        addTimeOnNewDonation: state.addTimeOnNewDonation,
        newDonationTimeToAdd: state.newDonationTimeToAdd,
        preventTimeAddWhenOver: state.preventTimeAddWhenOver,
        preventTimeAddThreshold: state.preventTimeAddThreshold,
        isMinBidEnabled: state.isMinBidEnabled,
        minBidAmount: state.minBidAmount,
        addTimeOnLeaderChange: state.addTimeOnLeaderChange,
        leaderChangeTimeToAdd: state.leaderChangeTimeToAdd,
        addTimeOnNewLot: state.addTimeOnNewLot,
        newLotTimeToAdd: state.newLotTimeToAdd,
      }),
    }
  )
);