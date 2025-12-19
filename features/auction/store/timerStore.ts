import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TimerState {
  isRunning: boolean;
  timeLeft: number; // Time left in ms
  endTime: number; // Timestamp for when the timer should end
  totalAccumulatedTime: number; // Total time run in ms (for total timer)
  lastTickTime: number; // Timestamp of the last tick
  isInitialized: boolean; // Has the timer been initialized with a value?

  // Actions
  start: (startTimeMs: number) => void;
  pause: () => void;
  addTime: (ms: number) => void;
  reset: (initialTimeMs: number) => void;
  tick: () => void;
  setInitialState: (initialTimeMs: number) => void;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      isRunning: false,
      timeLeft: 0,
      endTime: 0,
      totalAccumulatedTime: 0,
      lastTickTime: 0,
      isInitialized: false,

      setInitialState: (initialTimeMs) => {
        // This is called on first load to set the timer without starting it
        const { isInitialized } = get();
        if (!isInitialized) {
          set({ timeLeft: initialTimeMs, isInitialized: true });
        }
      },

      start: (startTimeMs) => {
        const { isRunning } = get();
        if (isRunning) return;

        const now = Date.now();
        set({
          isRunning: true,
          endTime: now + startTimeMs,
          timeLeft: startTimeMs,
          lastTickTime: now,
        });
      },

      pause: () => {
        const { isRunning, endTime } = get();
        if (!isRunning) return;

        const now = Date.now();
        const newTimeLeft = Math.max(0, endTime - now);
        set({
          isRunning: false,
          timeLeft: newTimeLeft,
        });
      },

      addTime: (ms) => {
        set((state) => {
          const newTimeLeft = Math.max(0, state.timeLeft + ms);
          return {
            timeLeft: newTimeLeft,
            endTime: state.isRunning ? state.endTime + ms : state.endTime,
          };
        });
      },

      reset: (initialTimeMs) => {
        set({
          isRunning: false,
          timeLeft: initialTimeMs,
          endTime: 0,
          isInitialized: true, // After reset, it's considered initialized with the new value
          // totalAccumulatedTime: 0, // Do not reset total time on simple reset
        });
      },

      tick: () => {
        const { isRunning, endTime, lastTickTime, totalAccumulatedTime } = get();
        if (!isRunning) return;

        const now = Date.now();
        const newTimeLeft = Math.max(0, endTime - now);
        const delta = now - lastTickTime;

        set({
          timeLeft: newTimeLeft,
          lastTickTime: now,
          totalAccumulatedTime: totalAccumulatedTime + delta,
        });

        if (newTimeLeft === 0) {
          set({ isRunning: false });
        }
      },
    }),
    {
      name: 'lotify-timer-storage',
      // Не сохраняем состояние таймера между перезагрузками.
      // Это гарантирует, что таймер всегда будет инициализироваться стартовым значением из настроек.
      partialize: () => ({}),
    }
  )
);