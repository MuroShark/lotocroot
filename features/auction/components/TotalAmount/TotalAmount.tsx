import React from 'react';
import { useLotsStore, selectTotalAmount } from '@/entities/lot/model/store/lotsStore';
import { useAuctionViewStore } from '@/features/auction/store/auctionViewStore';
import { EyeIcon } from './icons/EyeIcon'; // <-- Укажите правильный путь
import { EyeOffIcon } from './icons/EyeOffIcon'; // <-- Укажите правильный путь

const TotalAmountComponent: React.FC<{ className?: string; isCompact?: boolean }> = ({ className, isCompact = false }) => {
  const totalAmount = useLotsStore(selectTotalAmount);
  
  const isTotalAmountVisible = useAuctionViewStore((state) => state.isTotalAmountVisible);
  const toggleTotalAmountVisibility = useAuctionViewStore((state) => state.toggleTotalAmountVisibility);

  const formattedAmount = new Intl.NumberFormat('ru-RU', { useGrouping: true }).format(totalAmount).replace(',', ' ');

  return (
    <div className={`flex items-center gap-2 rounded-xl border border-[#27272a] bg-gradient-to-br from-[#18181b] to-[#202024] px-3 py-1.5 shadow-sm transition ${!isCompact ? 'md:gap-3 md:px-4 md:py-2' : ''} ${className}`}>
      {/* Скрываем текст, если включен компактный режим */}
      {!isCompact && <div className="hidden md:block text-[11px] font-bold uppercase tracking-wide text-[#71717a]">Банк:</div>}
      
      {/* Убираем фиксированную ширину в компактном режиме */}
      <div className={`font-mono text-lg font-bold text-white min-w-0 text-right whitespace-nowrap transition-all duration-300 ${!isCompact ? 'md:min-w-[90px]' : ''} ${!isTotalAmountVisible ? 'blur-sm opacity-50 select-none' : ''}`}>
        {formattedAmount} ₽
      </div>
      
      <button 
        className="flex cursor-pointer items-center justify-center text-[#71717a] transition hover:text-[#9147ff]"
        onClick={toggleTotalAmountVisibility}
        aria-label={isTotalAmountVisible ? "Скрыть сумму" : "Показать сумму"}
      >
        {/* Заменяем тег <i> на SVG компоненты */}
        {isTotalAmountVisible ? (
          <EyeIcon className="h-4 w-4" /> 
        ) : (
          <EyeOffIcon className="h-4 w-4" />
        )}
      </button>
    </div>
  );
};

export const TotalAmount = React.memo(TotalAmountComponent);
TotalAmount.displayName = 'TotalAmount';