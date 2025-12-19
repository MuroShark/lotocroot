import React from 'react';
import { useLotsStore, selectTotalAmount } from '@/entities/lot/model/store/lotsStore';
import { useAuctionViewStore } from '@/features/auction/store/auctionViewStore';
import { EyeIcon } from './icons/EyeIcon'; // <-- Укажите правильный путь
import { EyeOffIcon } from './icons/EyeOffIcon'; // <-- Укажите правильный путь

const TotalAmountComponent: React.FC<{ className?: string }> = ({ className }) => {
  const totalAmount = useLotsStore(selectTotalAmount);
  
  const isTotalAmountVisible = useAuctionViewStore((state) => state.isTotalAmountVisible);
  const toggleTotalAmountVisibility = useAuctionViewStore((state) => state.toggleTotalAmountVisibility);

  const formattedAmount = new Intl.NumberFormat('ru-RU', { useGrouping: true }).format(totalAmount).replace(',', ' ');

  return (
    <div className={`flex items-center gap-3 rounded-xl border border-[#27272a] bg-gradient-to-br from-[#18181b] to-[#202024] px-4 py-2 shadow-sm transition ${className}`}>
      <div className="text-[11px] font-bold uppercase tracking-wide text-[#71717a]">Банк:</div>
      
      <div className={`font-mono text-lg font-bold text-white min-w-[90px] text-right transition-all duration-300 ${!isTotalAmountVisible ? 'blur-sm opacity-50 select-none' : ''}`}>
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