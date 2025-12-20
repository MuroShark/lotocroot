import React, { memo } from 'react';
import { Plus, MagnifyingGlass } from '@phosphor-icons/react';

interface LotControlsProps {
  newLotContent: string;
  setNewLotContent: (value: string) => void;
  newLotAmount: string;
  setNewLotAmount: (value: string) => void;
  onAddLot: () => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  showPercentages?: boolean;
  totalAmount?: number;
}

const LotControlsComponent: React.FC<LotControlsProps> = ({
  newLotContent,
  setNewLotContent,
  newLotAmount,
  setNewLotAmount,
  onAddLot,
  searchTerm,
  setSearchTerm,
  showPercentages,
  totalAmount = 0,
}) => {
  const currentAmount = newLotAmount.trim() !== '' ? parseInt(newLotAmount, 10) : 0;
  const newTotalAmount = totalAmount + currentAmount;
  const percentage = newTotalAmount > 0 && currentAmount > 0 ? (currentAmount / newTotalAmount) * 100 : 0;

  return (
    <div className="flex shrink-0 items-center gap-5 border-b border-[#27272a] bg-[rgba(9,9,11,0.5)] px-6 py-4 backdrop-blur-md">
      {/* Форма добавления */}
      <form 
        className="flex flex-1 items-center gap-3"
        onSubmit={(e) => { e.preventDefault(); onAddLot(); }}
      >
        <input
          type="text"
          value={newLotContent}
          onChange={(e) => setNewLotContent(e.target.value)}
          placeholder="Название игры или лота..."
          className="flex-1 rounded-lg border border-[#333] bg-[#202024] px-3.5 py-0 text-[13px] text-white placeholder-[#71717a] transition focus:border-[#9147ff] focus:shadow-[0_0_0_2px_rgba(145,71,255,0.15)] focus:outline-none h-[42px]"
        />

        {showPercentages && (
          <span
            className={`flex items-center w-12 justify-center font-mono text-xs text-[#71717a] transition-opacity duration-200 ${
              percentage > 0 ? 'opacity-100' : 'opacity-50'
            }`}
          >
            {`${percentage.toFixed(1)}%`}
          </span>
        )}
        
        <input
          type="text"
          value={newLotAmount}
          onChange={(e) => {
             const val = e.target.value.replace(/[^0-9]/g, '');
             setNewLotAmount(val);
          }}
          placeholder="0 ₽"
          className="w-[110px] shrink-0 rounded-lg border border-[#333] bg-[#202024] px-3.5 py-0 text-right font-mono text-[13px] font-bold text-white placeholder-[#71717a] transition focus:border-[#9147ff] focus:outline-none h-[42px]"
        />

        <button 
          type="submit" 
          className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-[#9147ff] px-5 py-0 text-[13px] font-semibold text-white transition hover:bg-[#7c3aed] hover:shadow-[0_4px_12px_rgba(145,71,255,0.25)] active:translate-y-0 h-[42px]"
        >
          <Plus weight="bold" />
          Добавить
        </button>
      </form>

      {/* Поиск */}
      <div className="flex h-[42px] w-[260px] shrink-0 items-center rounded-lg border border-[#333] bg-[#202024] px-3 transition focus-within:border-[#555]">
        <MagnifyingGlass className="mr-2.5 text-lg text-[#71717a]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Поиск лота..."
          className="h-full w-full bg-transparent text-[13px] text-white placeholder-[#71717a] focus:outline-none"
        />
      </div>
    </div>
  );
};

export const LotControls = memo(LotControlsComponent);
LotControls.displayName = 'LotControls';