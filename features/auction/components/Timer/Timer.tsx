import React, { useCallback, useEffect } from 'react';
import { PlayIcon, PauseIcon, RestartIcon } from './icons/TimerIcons';
import { useAuctionViewStore } from '../../store/auctionViewStore';
import { useTimerStore } from '../../store/timerStore';

export const TEN_MINUTES = 10 * 60 * 1000;
export const TWO_MINUTES = 2 * 60 * 1000;
export const ONE_MINUTE = 60 * 1000;

const MS_IN_SECOND = 1000;
const MS_IN_MINUTE = 60 * MS_IN_SECOND;
const MS_IN_HOUR = 60 * MS_IN_MINUTE;
const MS_IN_DAY = 24 * MS_IN_HOUR;

const formatTime = (time: number) => {
  const pad = (num: number) => String(num).padStart(2, '0');
  const safeTime = Math.max(0, time);

  const days = Math.floor(safeTime / MS_IN_DAY);
  const hours = Math.floor((safeTime % MS_IN_DAY) / MS_IN_HOUR);
  const minutes = Math.floor((safeTime % MS_IN_HOUR) / MS_IN_MINUTE);
  const seconds = Math.floor((safeTime % MS_IN_MINUTE) / MS_IN_SECOND);
  const milliseconds = Math.floor((safeTime % MS_IN_SECOND) / 10); 

  if (days > 0) return `${pad(days)}:${pad(hours)}:${pad(minutes)}`;
  if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}:${pad(milliseconds)}`;
};

// Форматирование общего времени (HH:MM:SS)
const formatTotalTime = (timeInSeconds: number) => new Date(timeInSeconds * 1000).toISOString().substr(11, 8);

// Глобальный объект для управления таймером извне
export const timerControls: { addTime: (ms: number) => void; getTime: () => number; } = {
  addTime: () => {},
  getTime: () => 0,
};

export const TotalTime = React.memo(() => {
  const totalAccumulatedTime = useTimerStore(state => state.totalAccumulatedTime);
  const totalSeconds = Math.floor(totalAccumulatedTime / 1000);

  return (
    <div className="flex flex-col justify-center items-end ml-5 pl-5 border-l border-[#333] h-10" title="Общее время стрима">
      <div className="text-[9px] font-bold text-[var(--text-muted)] tracking-widest uppercase mb-0.5">Общее время</div>
      <div id="total-timer-value" className="font-mono text-base font-semibold text-[var(--primary)] leading-none">
        {formatTotalTime(totalSeconds)}
      </div>
    </div>
  );
});
TotalTime.displayName = 'TotalTime';

const TimerComponent: React.FC = () => {
  const timerInitialTime = useAuctionViewStore(state => state.timerInitialTime);
  const showTotalTimer = useAuctionViewStore(state => state.showTotalTimer);

  const { isRunning, timeLeft, start, pause, addTime, reset, setInitialState } = useTimerStore();

  // Initialize timer with value from settings on mount if not running
  useEffect(() => {
    setInitialState(timerInitialTime || TEN_MINUTES);
  }, [timerInitialTime, setInitialState]);

  // Connect external controls to the store
  useEffect(() => {
    timerControls.addTime = addTime;
    timerControls.getTime = () => useTimerStore.getState().timeLeft;
  }, [addTime]);

  const handleToggle = useCallback(() => {
    if (isRunning) {
      pause();
    } else {
      start(timeLeft > 0 ? timeLeft : timerInitialTime);
    }
  }, [isRunning, pause, start, timeLeft, timerInitialTime]);

  const handleRestart = useCallback(() => {
    reset(timerInitialTime);
  }, [reset, timerInitialTime]);

  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  const buttonClass = "flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[#888] transition-colors hover:bg-[#333] hover:text-white active:translate-y-[1px] cursor-pointer";
  const numTextStyle = "font-bold text-sm tracking-tighter";

  return (
    <div 
      className="flex items-center gap-4" 
      onMouseDown={stopPropagation}
      onClick={stopPropagation}
    >
      <div className="flex flex-col justify-center">
        <span 
          className="font-mono text-4xl font-bold leading-none text-white tracking-widest [text-shadow:0_0_20px_rgba(0,0,0,0.5)] tabular-nums"
        >
          {formatTime(timeLeft)}
        </span>
        <span className="mt-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#71717a]">
          До конца сбора
        </span>
      </div>
      
      <div 
        className="flex gap-1.5 rounded-lg border border-[#333] bg-[#202024] p-1.5 shadow-xl relative z-10"
        style={{ '--icon-size': '20px' } as React.CSSProperties}
      >
        <button 
          onClick={handleToggle} 
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[#333] active:translate-y-[1px] cursor-pointer ${isRunning ? 'text-[#ef4444] hover:bg-red-500/10' : 'text-[#10b981] hover:bg-emerald-500/10'}`}
          title={isRunning ? "Пауза" : "Старт"}
        >
          {isRunning ? <PauseIcon /> : <PlayIcon />}
        </button>

        <button onClick={handleRestart} className={buttonClass} title="Сбросить">
          <RestartIcon />
        </button>
        
        <div className="w-[1px] bg-[#333] mx-0.5 h-6 self-center opacity-50"></div>

        <button className={buttonClass} onClick={() => addTime(-ONE_MINUTE)} title="-1 минута">
           <span className={numTextStyle}>-1</span>
        </button>

        <button className={buttonClass} onClick={() => addTime(ONE_MINUTE)} title="+1 минута">
          <span className={numTextStyle}>+1</span>
        </button>

        <button className={buttonClass} onClick={() => addTime(TWO_MINUTES)} title="+2 минуты">
          <span className={numTextStyle}>+2</span>
        </button>
      </div>
      {showTotalTimer && <TotalTime />}
    </div>
  );
};

export const Timer = React.memo(TimerComponent);
Timer.displayName = 'Timer';