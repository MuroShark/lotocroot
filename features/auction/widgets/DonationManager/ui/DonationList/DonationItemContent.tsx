"use client";

import React, { useMemo } from 'react';
import type { Donation, DonationPlatform } from '@/shared/types';
import { useLotsStore } from '@/entities/lot';
import { findBestLotMatch } from '@/features/auction/utils/findBestLotMatch';
import { useCurrencyStore } from '@/features/settings/model/currencyStore';
import { truncateText } from '@/shared/utils/truncateText';
import { useShallow } from 'zustand/react/shallow';
import { X, DotsThreeVertical, Shuffle } from '@phosphor-icons/react';

export type DonationAction =
  | { type: 'DELETE' }
  | { type: 'CREATE_NEW_LOT' }
  | { type: 'ADD_TO_RANDOM_LOT' }
  | { type: 'ADD_TO_BEST_MATCH_LOT' };

interface DonationItemContentProps {
  donation: Donation;
  onAction: (action: DonationAction) => void;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
}

const platformStyles: Record<DonationPlatform, string> = {
  donationalerts: 'border-l-[#f59e0b] hover:border-l-[#f59e0b]',
  twitch: 'border-l-[#a970ff] hover:border-l-[#a970ff]',
  donatepay: 'border-l-[#44AB4F] hover:border-l-[#44AB4F]',
  custom: 'border-l-[#3b82f6] hover:border-l-[#3b82f6]',
};


export const DonationItemContent = React.memo<DonationItemContentProps>(({
  donation,
  onAction,
  isMenuOpen,
  onToggleMenu,
}) => {
  const storeLots = useLotsStore((state) => state.lots);
  const { 
    donationDisplayMode, 
    baseCurrency, 
    rateSource, 
    autoRates, 
    customRates 
  } = useCurrencyStore(useShallow(state => ({
    donationDisplayMode: state.donationDisplayMode,
    baseCurrency: state.baseCurrency,
    rateSource: state.rateSource,
    autoRates: state.autoRates,
    customRates: state.customRates,
  })));

  const { bestMatch: bestMatchLot } = useMemo(() => {
    return findBestLotMatch(donation.message, storeLots);
  }, [donation.message, storeLots]);

  const handleCreateLot = () => onAction({ type: 'CREATE_NEW_LOT' });
  const handleAddToRandomLot = () => onAction({ type: 'ADD_TO_RANDOM_LOT' });
  const handleAddToBestMatchLot = () => onAction({ type: 'ADD_TO_BEST_MATCH_LOT' });
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAction({ type: 'DELETE' });
  };

  const bestMatchButtonText = bestMatchLot ? `К «${truncateText(bestMatchLot.content, 20)}»` : '';

  // Стили для кнопок действий
  const actionBtnClass = "flex h-8 cursor-pointer items-center justify-center rounded-md border border-[#333] bg-[#202024] px-3 text-[11px] font-semibold uppercase tracking-wide text-[#71717a] transition hover:border-[#9147ff] hover:bg-[rgba(145,71,255,0.05)] hover:text-white";
  
  // Определяем стиль карточки в зависимости от платформы
  const cardPlatformClass = platformStyles[donation.platform] || platformStyles.donationalerts;

  // Логика отображения суммы доната
  const displayAmount = useMemo(() => {
    const { amount, currency } = donation;

    if (donationDisplayMode === 'original' || currency === baseCurrency) {
      return {
        value: Math.round(amount),
        currencySymbol: currency, // В будущем можно заменить на символ (₽, $, €)
      };
    }

    // Логика конвертации для отображения
    const rates = rateSource === 'auto' ? autoRates : customRates;
    const rate = rates[currency];

    if (rate) {
      const convertedValue = Math.round(amount * rate);
      return { value: convertedValue, currencySymbol: baseCurrency };
    }

    // Фоллбэк, если курс не найден
    return { value: Math.round(amount), currencySymbol: currency };

  }, [donation, donationDisplayMode, baseCurrency, rateSource, autoRates, customRates]);

  return (
    // Карточка: Темный фон, обводка, цветная полоска слева в зависимости от платформы
    <div className={`group relative flex w-full flex-col gap-3 rounded-lg border border-[#333] border-l-4 bg-[#18181b] p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-[#555] hover:shadow-md ${cardPlatformClass}`}>
      
      {/* Кнопка удаления */}
      <button 
        onClick={handleDelete} 
        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md text-[#71717a] opacity-100 transition hover:bg-[rgba(239,68,68,0.1)] hover:text-[#ef4444]"
        title="Удалить"
      >
        <X weight="bold" />
      </button>

      {/* Заголовок: Ник и Сумма */}
      <div className="flex items-center justify-between pr-6">
        <span className="text-[13px] font-bold text-white">
          {donation.username}
        </span>
        <span className="rounded bg-[rgba(145,71,255,0.15)] px-2 py-0.5 font-mono text-xs font-bold text-[#b08aff]">
          {displayAmount.value} {displayAmount.currencySymbol}
        </span>
      </div>

      {/* Сообщение */}
      <div className="break-words text-xs leading-relaxed text-[#71717a]">
        {donation.message}
      </div>

      {/* Нижняя панель действий */}
      <div className="flex flex-col gap-2 border-t border-[rgba(255,255,255,0.05)] pt-2">
        
        {/* Ряд основных кнопок */}
        <div className="flex gap-2">
          {/* Кнопка "Создать новый" */}
          <button onClick={handleCreateLot} className={`${actionBtnClass} flex-grow`} title="Создать новый лот">
            Создать новый
          </button>
          
          {/* Кнопка Меню (три точки) */}
          <div className="relative">
            <button 
              onClick={(e) => { e.stopPropagation(); onToggleMenu(); }} 
              className={`${actionBtnClass} w-8 px-0 text-lg`}
            >
               <DotsThreeVertical weight="bold" />
            </button>
            
            {/* Выпадающее меню */}
            {isMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 flex min-w-[160px] flex-col gap-1 rounded-md border border-[#333] bg-[#202024] p-1 shadow-xl animate-in fade-in zoom-in-95 duration-100">
                <button 
                  onClick={handleAddToRandomLot} 
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[11px] font-semibold uppercase text-[#71717a] transition hover:bg-[#27272a] hover:text-[#f59e0b]"
                >
                  <Shuffle weight="bold" />
                  В рандом
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Кнопка "Добавить к лучшему совпадению" (если есть) */}
        {bestMatchLot && (
          <button 
            onClick={handleAddToBestMatchLot} 
            className={`${actionBtnClass} w-full !border-blue-500/30 !text-blue-400 hover:!bg-blue-500/10 hover:!text-blue-300`}
            title={`Добавить к лоту: ${bestMatchLot.content}`}
          >
            {bestMatchButtonText}
          </button>
        )}
      </div>
    </div>
  );
});

DonationItemContent.displayName = 'DonationItemContent';