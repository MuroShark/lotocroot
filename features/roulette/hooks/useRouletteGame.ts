import { useState, useMemo, useEffect, useRef } from 'react';
import { GameMode, EliminationMode, RouletteSegment, WinnerModalState } from '../types';
import { useLotsStore, Lot } from '@/entities/lot/'; // Импортируйте путь к вашему стору

const PALETTE = ['#b91c1c', '#c2410c', '#b45309', '#15803d', '#0e7490', '#1d4ed8', '#7e22ce', '#be123c'];

export const useRouletteGame = () => {
  // 1. Получаем лоты из стора
  const lots = useLotsStore((state) => state.lots);
  const restartGame = useLotsStore((state) => state.undoClearLots); // Если нужно восстановить

  // Локальный стейт игры
  const [segments, setSegments] = useState<RouletteSegment[]>([]);
  const [graveyard, setGraveyard] = useState<RouletteSegment[]>([]);
  
  const [mode, setMode] = useState<GameMode>('classic');
  const [subMode, setSubMode] = useState<EliminationMode>('random');
  const [hideEliminated, setHideEliminated] = useState(false);
  const [targetWinnerId, setTargetWinnerId] = useState<number | null>(null);
  const [segmentOrderKey, setSegmentOrderKey] = useState(0); // Ключ для перемешивания

  const [winnerModal, setWinnerModal] = useState<WinnerModalState>({ show: false, winner: null, isFinal: false });

  // Ref для хранения цветов, чтобы они не "мигали" при обновлении стора
  const colorMapRef = useRef<Record<number, string>>({});

  // 2. Синхронизация Lots (Store) -> Segments (Game)
  useEffect(() => {
    // Новая логика определения активных лотов
    let lotsForGame: Lot[];
    const hasLotsWithAmount = lots.some(l => (l.amount ?? 0) > 0);
    
    if (hasLotsWithAmount) {
      // Если есть лоты с суммой, используем только их
      lotsForGame = lots.filter(l => (l.amount ?? 0) > 0);
    } else {
      // Иначе, если лотов с суммой нет, используем ВООБЩЕ ВСЕ лоты,
      // чтобы можно было разыграть несколько пустых лотов. Исключаем только
      // ситуацию, когда в списке один-единственный лот-плейсхолдер.
      lotsForGame = lots.filter(l => !(l.isPlaceholder && lots.length === 1));
    }
    
    // Генерируем сегменты
    const newSegments = lotsForGame.map((lot, index) => {
      // Пытаемся сохранить старый цвет или назначаем новый из палитры
      if (!colorMapRef.current[lot.id]) {
        colorMapRef.current[lot.id] = PALETTE[index % PALETTE.length];
      }

      // Проверяем, не находится ли этот лот уже в кладбище текущей сессии
      const isDead = graveyard.some(g => g.id === lot.id);
      if (isDead) return null;

      return {
        id: lot.id,
        name: lot.content,
        amount: lot.amount || 0,
        color: colorMapRef.current[lot.id],
        animFactor: 1
      };
    }).filter(Boolean) as RouletteSegment[]; // Убираем null (тех, кто в кладбище)

    setSegments(newSegments);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lots, graveyard]); // Обновляемся при изменении лотов или выбывших

  // Логика преселекта победителя для Visual Elimination
  useEffect(() => {
    if (mode === 'elimination' && subMode === 'visual' && segments.length > 0 && !targetWinnerId) {
        const total = segments.reduce((acc, s) => acc + s.amount, 0);
        const rand = Math.random() * total;
        let acc = 0;
        let target = segments[segments.length - 1];
        
        for(const s of segments) {
            acc += s.amount;
            if (rand <= acc) { target = s; break; }
        }
        setTargetWinnerId(target.id);
    } else if (mode === 'classic' || (mode === 'elimination' && subMode === 'random')) {
        if (targetWinnerId !== null) {
            setTargetWinnerId(null);
        }
    }
  }, [mode, subMode, segments, targetWinnerId]);

  const shuffleColors = () => {
    // Очищаем карту цветов и форсируем перерендер через изменение segments
    colorMapRef.current = {};
    setSegments(prev => {
      const newSegs = [...prev];
      const newColors: string[] = [];
      for (let i = 0; i < newSegs.length; i++) {
          const forbidden: string[] = [];
          if (i > 0) forbidden.push(newColors[i - 1]);
          if (i === newSegs.length - 1 && newSegs.length > 1) forbidden.push(newColors[0]);
          if (i > 1) forbidden.push(newColors[i - 2]);

          let available = PALETTE.filter(c => !forbidden.includes(c));
          if (available.length === 0 && i > 0) available = PALETTE.filter(c => c !== newColors[i-1]);
          const color = available[Math.floor(Math.random() * available.length)] || PALETTE[0];
          newColors.push(color);
          
          // Сохраняем в ref
          colorMapRef.current[newSegs[i].id] = color;
      }
      newSegs.forEach((s, i) => s.color = newColors[i]);
      return newSegs;
    });
  };

  // Перемешивание порядка сегментов для колеса
  const shuffleSegments = () => {
    setSegmentOrderKey(k => k + 1);
  };

  // Удаление из ИГРЫ (не из стора)
  const removeSegment = (id: number) => {
    // Защита от удаления последнего элемента
    if (segments.length <= 1) return;

    const segToRemove = segments.find(s => s.id === id);
    if (segToRemove) {
        setSegments(prev => prev.filter(s => s.id !== id));
        setGraveyard(prev => [...prev, segToRemove]);
    }
  };

  // Полный сброс игры (возвращаем всех из кладбища)
  const restartGameSession = () => {
     setGraveyard([]);
     // Триггерим useEffect, зависящий от lots, чтобы заново заполнить segments
     // В данном случае просто очистка graveyard позволит useEffect (который фильтрует по graveyard)
     // вернуть лоты в список при следующем рендере, но так как useEffect зависит от lots,
     // нам нужно вручную восстановить segments из стора прямо сейчас:
     const activeLots = lots.filter(l => !l.isPlaceholder && (l.amount || 0) > 0);
     const restoredSegments = activeLots.map((lot) => ({
        id: lot.id,
        name: lot.content,
        amount: lot.amount || 0,
        color: colorMapRef.current[lot.id] || PALETTE[0],
        animFactor: 1
     }));
     setSegments(restoredSegments);
     setTargetWinnerId(null);
     setWinnerModal({ show: false, winner: null, isFinal: false });
  };

  const eliminateWinner = (winner: RouletteSegment) => {
    setGraveyard(prev => [...prev, winner]);
    const remaining = segments.filter(s => s.id !== winner.id);
    setSegments(remaining);
    
    if (remaining.length === 1) {
        return { isFinal: true, survivor: remaining[0] };
    }
    return { isFinal: false, survivor: null };
  };

  const totalBank = useMemo(() => segments.reduce((acc, s) => acc + s.amount, 0), [segments]);

  return {
    segments, setSegments,
    graveyard, setGraveyard,
    mode, setMode,
    subMode, setSubMode,
    hideEliminated, setHideEliminated,
    targetWinnerId,
    winnerModal, setWinnerModal,
    segmentOrderKey,
    shuffleSegments,
    shuffleColors,
    removeSegment,
    eliminateWinner,
    totalBank,
    restartGame: restartGameSession // Экспортируем функцию рестарта
  };
};