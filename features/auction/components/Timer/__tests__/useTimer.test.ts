import { renderHook, act } from '@testing-library/react';
import { useTimer } from '../Timer';
import { TEN_MINUTES, ONE_MINUTE } from '../Timer';

// Моки для requestAnimationFrame и cancelAnimationFrame
let rAFCallbacks: { [key: number]: ((time: number) => void) | null } = {};
let rAFIdCounter = 0;
const mockRequestAnimationFrame = jest.fn((cb: (time: number) => void) => {
  const id = rAFIdCounter++;
  rAFCallbacks[id] = cb;
  return id;
});
const mockCancelAnimationFrame = jest.fn((id: number) => {
  delete rAFCallbacks[id];
});

// Вспомогательная функция для симуляции одного "тика" requestAnimationFrame
const simulateRAFTick = (currentTime: number) => {
  jest.setSystemTime(currentTime); // Обновляем текущее время для Date.now()
  const currentCallbacks = { ...rAFCallbacks };
  rAFCallbacks = {}; // Очищаем колбэки, т.к. rAF вызывает их один раз
  Object.values(currentCallbacks).forEach(cb => cb && cb(currentTime));
};

describe('useTimer', () => {
  let initialSystemTime = 0;

  beforeAll(() => {
    global.requestAnimationFrame = mockRequestAnimationFrame;
    global.cancelAnimationFrame = mockCancelAnimationFrame;
    jest.useFakeTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.runOnlyPendingTimers();
    rAFCallbacks = {};
    rAFIdCounter = 0;
    initialSystemTime = 1000000;
    jest.setSystemTime(initialSystemTime);
    global.requestAnimationFrame = mockRequestAnimationFrame;
    global.cancelAnimationFrame = mockCancelAnimationFrame;
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('should initialize with the correct initial time and not running', () => {
    const { result } = renderHook(() => useTimer(TEN_MINUTES));
    expect(result.current.time).toBe(TEN_MINUTES);
    expect(result.current.isRunning).toBe(false);
  });

  it('should start and pause the timer correctly', () => {
    const { result } = renderHook(() => useTimer(TEN_MINUTES));

    act(() => {
      result.current.handleToggle();
    });
    expect(result.current.isRunning).toBe(true);
    expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(1);

    act(() => {
      simulateRAFTick(initialSystemTime + 1000);
    });
    expect(result.current.time).toBe(TEN_MINUTES - 1000);
    expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(2);

    act(() => {
      result.current.handleToggle();
    });
    expect(result.current.time).toBe(TEN_MINUTES - 1000);
    expect(result.current.isRunning).toBe(false);
    expect(mockCancelAnimationFrame).toHaveBeenCalled();

    const timeAfterPause = result.current.time;
    act(() => {
      simulateRAFTick(initialSystemTime + 2000);
    });
    expect(result.current.time).toBe(timeAfterPause);
  });

  it('should restart the timer to initial time and stop it', () => {
    const { result } = renderHook(() => useTimer(TEN_MINUTES));

    act(() => {
      result.current.handleToggle();
    });
    act(() => {
      simulateRAFTick(initialSystemTime + 5000);
    });
    expect(result.current.time).toBeCloseTo(TEN_MINUTES - 5000, -2);
    expect(result.current.isRunning).toBe(true);

    act(() => {
      result.current.handleRestart();
    });
    expect(result.current.time).toBe(TEN_MINUTES);
    expect(result.current.isRunning).toBe(false);
    expect(mockCancelAnimationFrame).toHaveBeenCalled();
  });

  it('should add minutes to the timer (paused)', () => {
    const { result } = renderHook(() => useTimer(TEN_MINUTES));

    act(() => {
      result.current.handleAddMinute();
    });
    expect(result.current.time).toBe(TEN_MINUTES + ONE_MINUTE);
  });

  it('should add minutes to the timer (running)', () => {
    const { result } = renderHook(() => useTimer(TEN_MINUTES));

    // 1. Запускаем таймер
    act(() => {
      result.current.handleToggle();
    });
    
    // 2. Симулируем тик в отдельном act, чтобы убедиться, что эффект запуска сработал
    act(() => {
      simulateRAFTick(initialSystemTime + 1000); 
    });

    const timeBeforeAdd = result.current.time; // Теперь это корректно TEN_MINUTES - 1000

    act(() => {
      result.current.handleAddMinute();
    });

    expect(result.current.time).toBe(timeBeforeAdd + ONE_MINUTE);
    expect(result.current.isRunning).toBe(true);

    act(() => {
      simulateRAFTick(initialSystemTime + 2000); // Проходит еще 1 секунда
    });
    
    // Теперь математика сойдется: (Init - 1000) + 60000 - 1000 = Result
    expect(result.current.time).toBeCloseTo(timeBeforeAdd + ONE_MINUTE - 1000, -2);
  });

  it('should subtract minutes from the timer, not going below zero (paused)', () => {
    const { result } = renderHook(() => useTimer(TEN_MINUTES));

    act(() => {
      result.current.handleSubtractMinute();
    });
    expect(result.current.time).toBe(TEN_MINUTES - ONE_MINUTE);

    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current.handleSubtractMinute();
      }
    });
    expect(result.current.time).toBe(0);
  });

  it('should subtract minutes from the timer (running)', () => {
    const { result } = renderHook(() => useTimer(TEN_MINUTES));

    // 1. Запускаем
    act(() => {
      result.current.handleToggle();
    });

    // 2. Тик для обновления времени
    act(() => {
      simulateRAFTick(initialSystemTime + 1000);
    });

    const timeBeforeSubtract = result.current.time; // TEN_MINUTES - 1000

    act(() => {
      result.current.handleSubtractMinute();
    });

    expect(result.current.time).toBe(timeBeforeSubtract - ONE_MINUTE);
    expect(result.current.isRunning).toBe(true);

    act(() => {
      simulateRAFTick(initialSystemTime + 2000); // Проходит еще 1 секунда
    });

    expect(result.current.time).toBeCloseTo(timeBeforeSubtract - ONE_MINUTE - 1000, -2);
  });

  it('should add two minutes to the timer', () => {
    const { result } = renderHook(() => useTimer(TEN_MINUTES));

    act(() => {
      result.current.handleAddTwoMinutes();
    });
    expect(result.current.time).toBe(TEN_MINUTES + 2 * ONE_MINUTE);
  });

  it('should stop the timer when time reaches zero', () => {
    const { result } = renderHook(() => useTimer(1000)); // 1 секунда

    act(() => {
      result.current.handleToggle();
    });

    act(() => {
      simulateRAFTick(initialSystemTime + 1100);
    });

    expect(result.current.time).toBe(0);
    expect(result.current.isRunning).toBe(false);
  });

  it('should clean up animation frame on unmount', () => {
    const { result, unmount } = renderHook(() => useTimer(TEN_MINUTES));

    act(() => {
      result.current.handleToggle();
    });

    act(() => {
      simulateRAFTick(initialSystemTime + 100);
    });
    const activeRAfId = rAFIdCounter - 1;

    unmount();
    expect(mockCancelAnimationFrame).toHaveBeenCalledWith(activeRAfId);
  });

  it('should not request new animation frame if already running and time is adjusted', () => {
    const { result } = renderHook(() => useTimer(TEN_MINUTES));

    act(() => {
      result.current.handleToggle();
    });

    act(() => {
      simulateRAFTick(initialSystemTime + 1000);
    });
    // 1. Initial start, 2. Next tick scheduled
    expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(2);

    act(() => {
      result.current.handleAddMinute();
    });
    // Должен остаться 2, так как новый тик не форсируется через rAF, а ждет естественного цикла
    expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(2);

    act(() => {
      simulateRAFTick(initialSystemTime + 2000);
    });
    expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(3);
  });

  it('should correctly handle multiple rapid adjustments while running', () => {
    const { result } = renderHook(() => useTimer(TEN_MINUTES));

    act(() => {
      result.current.handleToggle();
    });

    act(() => {
      simulateRAFTick(initialSystemTime + 1000);
    });

    expect(result.current.time).toBeCloseTo(TEN_MINUTES - 1000, -2);

    act(() => {
      result.current.handleAddMinute();
      result.current.handleAddTwoMinutes();
    });
    const expectedTimeAfterAdjustments = TEN_MINUTES - 1000 + ONE_MINUTE + 2 * ONE_MINUTE;

    expect(result.current.time).toBe(expectedTimeAfterAdjustments);

    act(() => {
      simulateRAFTick(initialSystemTime + 2000);
    });
    expect(result.current.time).toBeCloseTo(expectedTimeAfterAdjustments - 1000, -2);
  });
});