/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import type { Lot } from '../../model/types';
import { useLotItem } from '../../model/hooks/useLotItem';
import { useAuctionViewStore } from '@/features/auction/store/auctionViewStore';
import type { Donation } from '@/shared/types';
import { Check, PlusMinus, Trash } from '@phosphor-icons/react';

// --- 1. Изолированный компонент для ввода математики ---
// Он хранит свое состояние сам, чтобы не ререндерить весь Лот при вводе цифр
interface MathInputProps {
  onConfirm: (value: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

const MathInput = memo(({ onConfirm, isOpen, onClose }: MathInputProps) => {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Фокус и очистка при открытии
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setValue('');
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    } else {
      e.stopPropagation(); // Чтобы не срабатывали хоткеи лота
    }
  };

  const handleSubmit = () => {
    const amount = parseInt(value, 10);
    if (!isNaN(amount) && amount !== 0) {
      onConfirm(amount);
    }
    onClose();
  };

  return (
    <div className={clsx(
         "absolute right-full top-1/2 z-10 flex h-[32px] w-0 -translate-y-1/2 translate-x-[10px] items-center overflow-hidden rounded border border-[#9147ff] bg-[#141416] p-[2px] opacity-0 shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none mr-2",
         isOpen && "!w-[120px] !translate-x-0 !opacity-100 !pointer-events-auto"
     )}>
        <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/[^0-9-]/g, ''))}
            onKeyDown={handleKeyDown}
            placeholder="+/-"
            className={clsx(
                "w-full bg-transparent px-2 font-mono text-xs font-bold outline-none",
                value.startsWith('-') ? "text-[#ef4444]" : "text-[#10b981]"
            )}
        />
        <button 
            onClick={handleSubmit}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-[#9147ff] text-white transition hover:bg-[#7c3aed] text-base"
            aria-label="Подтвердить"
        >
            <Check weight="bold" />
        </button>
     </div>
  );
});

MathInput.displayName = 'MathInput';

// --- 2. Основной компонент ---

interface LotItemProps {
  lot: Lot;
  displayNumber: number;
  onDelete: (id: number) => void;
  onUpdateAmount: (id: number, additionalAmount: number) => void;
  onSetAmount: (id: number, newAmount: number | null) => void;
  onUpdateContent: (id: number, newContent: string) => void;
  onAddLot: () => void;
  showPercentages?: boolean;
  totalAmount?: number;
  isDonationDragging?: boolean;
  onDropOnLot?: (lotId: number, donation: Donation) => void;
  isCompactMode?: boolean; // Добавляем проп
}

export const LotItem: React.FC<LotItemProps> = memo(({ 
  lot, 
  displayNumber, 
  onDelete, 
  onUpdateAmount, 
  onSetAmount, 
  onUpdateContent, 
  onAddLot, 
  showPercentages, 
  totalAmount = 0, 
  onDropOnLot, 
  isDonationDragging,
  isCompactMode
}) => {
  // Мы больше не достаем additionalAmount из хука, так как он теперь в MathInput
  const { 
    mainAmountInputRef,
    editedAmount, setEditedAmount, editedContent, 
    handleContentChange, 
    handleContentSave, handleAmountSave,
    handleInputKeyPress, handleContentFocus
  } = useLotItem({ lot, onUpdateAmount, onSetAmount, onUpdateContent, onAddLot });

  const { setDraggedDonation, setIsDonationDragging } = useAuctionViewStore();
  const [isOver, setIsOver] = useState(false);
  
  // Состояние для открытия MathInput
  const [isMathOpen, setIsMathOpen] = useState(false);
  // Реф для контейнера, который объединяет кнопку и попап
  const mathWrapperRef = useRef<HTMLDivElement>(null);

  // --- Логика Drag & Drop ---
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); };
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation(); 
    setIsOver(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsOver(false);
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(false);
    if (e.dataTransfer.types.includes('application/json')) {
      const donationData = e.dataTransfer.getData('application/json');
      try {
        const donation: Donation = JSON.parse(donationData); 
        onDropOnLot?.(lot.id, donation);
        setDraggedDonation(null);
        setIsDonationDragging(false);
      } catch (e) {
        console.error('Ошибка при парсинге JSON:', e)
      }
    }
  };

  // --- Исправленный Click Outside ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Если клик вне нашего wrapper-а (который содержит и кнопку, и инпут), закрываем
      if (isMathOpen && mathWrapperRef.current && !mathWrapperRef.current.contains(event.target as Node)) {
        setIsMathOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMathOpen]);

  // Обработчик подтверждения из MathInput
  const handleMathConfirm = useCallback((amount: number) => {
    onUpdateAmount(lot.id, amount);
    setIsMathOpen(false); // Закрываем после ввода
  }, [lot.id, onUpdateAmount]);

  // Расчет процента
  const percentageValue = totalAmount > 0 && (lot.amount || 0) > 0 
    ? ((lot.amount || 0) / totalAmount) * 100 
    : 0;
  
  const isLeader = false; 

  // console.log(`Render LotItem #${lot.id}`);

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ 
        opacity: 0, 
        height: 0, 
        marginBottom: 0, // Убираем отступ при удалении
        marginTop: 0,    // На всякий случай убираем и верхний отступ
        zIndex: -1,      // Уводим на задний план, чтобы не перекрывал соседей
        overflow: 'hidden' // Обрезаем контент, чтобы текст не висел в воздухе пока блок схлопывается
      }}
      transition={{
        layout: { type: 'spring', stiffness: 400, damping: 40 },
        opacity: { duration: 0.2 },
        // Явно указываем длительность для сворачивания, чтобы оно совпадало с исчезновением
        height: { duration: 0.2 }, 
        marginBottom: { duration: 0.2 }
      }}
      className={clsx(
        'relative flex w-full overflow-visible border', !isCompactMode && 'mb-2 last:mb-0',
        isCompactMode ? {
          'h-[38px] border-b border-b-[#27272a] border-transparent bg-[rgba(255,255,255,0.02)] px-6 even:bg-[rgba(255,255,255,0.04)]': true,
          'shadow-[inset_2px_0_0_var(--primary)]': isLeader,
          '!border-b-[#9147ff] !bg-[rgba(145,71,255,0.1)]': isOver,
        } : {
          'h-[48px] rounded-lg border-transparent bg-[var(--bg-element)] px-4': true,
          '!border-[#9147ff] shadow-[0_0_15px_rgba(145,71,255,0.05)]': isLeader,
          'border-[#333]': isDonationDragging,
          '!border-[#9147ff] !bg-[rgba(145,71,255,0.1)]': isOver,
        }
        // isLeader && (isCompactMode ? 'shadow-[inset_2px_0_0_var(--primary)]' : '!border-[#9147ff] shadow-[0_0_15px_rgba(145,71,255,0.05)]'),
        // isDonationDragging && !isCompactMode && 'border-[#333]', 
        // isOver && '!border-[#9147ff] !bg-[rgba(145,71,255,0.1)]' 
      )}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Прогресс бар (Фон) */}
      <div 
        className={clsx(
          "absolute bottom-0 left-0 top-0 z-0 bg-gradient-to-r from-[rgba(145,71,255,0.2)] to-[rgba(145,71,255,0.05)] transition-[width] duration-500 ease-out pointer-events-none",
          isCompactMode ? 'opacity-15' : 'rounded-l-lg'
        )}
        style={{ width: `${percentageValue}%`}}
      />

      {/* Контент */}
      <div className={clsx("relative z-10 flex h-full w-full items-center justify-between gap-3", isDonationDragging && "pointer-events-none")}>
        
        {/* Левая часть (Номер, ID, Название) */}
        <div className="flex min-w-0 flex-1 items-center gap-3 h-full">
          <span className="flex w-6 shrink-0 items-center justify-center font-mono text-xs text-[#a1a1aa]">
            {displayNumber}.
          </span>
        <div className="flex w-[48px] shrink-0 items-center justify-center">
          <span className="flex min-w-[28px] items-center justify-center rounded bg-[rgba(145,71,255,0.15)] px-1.5 py-0.5 font-mono text-[11px] text-[#c4b5fd]">
            #{lot.id}
          </span>
        </div>
          <input 
            type="text" 
            value={editedContent}
            onChange={handleContentChange}
            onBlur={handleContentSave}
            onFocus={handleContentFocus}
            onKeyDown={handleInputKeyPress}
            placeholder="Пустой лот"
            className="h-full w-full min-w-0 rounded-md bg-transparent px-2 font-sans text-sm font-medium text-[#f4f4f5] placeholder:text-gray-600 hover:bg-white/5 focus:bg-[var(--bg-input)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>

        {/* Правая часть (Проценты, Мат. ввод, Сумма, Удаление) */}
        <div className="flex shrink-0 items-center gap-3 h-full">
          {showPercentages && (
            <span className="flex items-center font-mono text-xs text-[#71717a] transition-opacity">
              {percentageValue.toFixed(1)}%
            </span>
          )}

          {/* --- ОБЕРТКА ДЛЯ МАТЕМАТИКИ С РЕФОМ --- */}
          <div ref={mathWrapperRef} className="relative flex items-center">
             
             {/* 1. Кнопка-триггер (Стили восстановлены!) */}
             <button 
                className={clsx(
                    "relative z-[5] flex h-7 w-7 items-center justify-center rounded border-none bg-transparent text-base text-[#555] transition-all duration-200 hover:bg-[#333] hover:text-white cursor-pointer",
                    isMathOpen && "bg-[rgba(145,71,255,0.15)] !text-[#9147ff]"
                )}
                onClick={() => setIsMathOpen(!isMathOpen)}
                title="Изменить сумму"
                aria-label="Изменить сумму"
             >
                <PlusMinus weight="bold" />
             </button>

             {/* 2. Изолированный компонент ввода */}
             <MathInput 
                isOpen={isMathOpen} 
                onConfirm={handleMathConfirm} 
                onClose={() => setIsMathOpen(false)}
             />
          </div>

          {/* Основная сумма */}
          <input 
            ref={mainAmountInputRef}
            type="text"
            value={editedAmount}
            onChange={(e) => setEditedAmount(e.target.value.replace(/[^0-9-]/g, ''))}
            onBlur={handleAmountSave}
            onKeyDown={handleInputKeyPress}
            placeholder="₽"
            className="h-full w-[90px] rounded-md bg-transparent px-2 text-left font-mono text-sm font-bold text-white hover:bg-white/5 focus:bg-[var(--bg-input)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />

          {/* Кнопка удаления */}
          <button 
            onClick={() => onDelete(lot.id)}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded text-[#444] transition hover:bg-[rgba(239,68,68,0.1)] hover:text-[#ef4444]"
            title="Удалить"
            aria-label="Удалить лот"
          >
            <Trash className="text-base" />
          </button>
        </div>

      </div>
    </motion.div>
  );
});

LotItem.displayName = 'LotItem';