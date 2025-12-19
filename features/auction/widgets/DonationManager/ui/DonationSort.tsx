"use client";

import { useAuctionViewStore } from '@/features/auction/store/auctionViewStore';
import type { DonationSortOrder } from '@/features/auction/store/auctionViewStore';
import { useShallow } from 'zustand/react/shallow';

const sortOptions: { label: string; value: DonationSortOrder }[] = [
  { label: 'Сначала новые', value: 'newest' }, // Поменял местами, как в HTML коде (обычно новые сверху)
  { label: 'Сначала старые', value: 'oldest' },
  { label: 'Сумма: по убыванию', value: 'amountDesc' },
  { label: 'Сумма: по возрастанию', value: 'amountAsc' },
];

const SortItem = ({
  label,
  value,
  isActive,
  onClick,
}: {
  label: string;
  value: DonationSortOrder;
  isActive: boolean;
  onClick: (value: DonationSortOrder) => void;
}) => (
  <button
    onClick={() => onClick(value)}
    className={`
      flex w-full cursor-pointer items-center justify-between rounded px-3 py-2 text-left text-xs font-medium
      transition-colors duration-200
      ${
        isActive
          // Стиль активного элемента (как в HTML: color: primary, bg: primary-dim/0.08)
          ? 'bg-[rgba(145,71,255,0.08)] text-[#9147ff] font-semibold'
          : 'text-[#71717a] hover:bg-[#27272a] hover:text-white'
      }
    `}
  >
    <span>{label}</span>
    {/* Иконка галочки */}
    <i 
      className={`ph-bold ph-check text-sm transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-0'}`}
    ></i>
  </button>
);

export const DonationSort = () => {
  const { donationSortOrder, setDonationSortOrder } = useAuctionViewStore(
    useShallow((state) => ({
      donationSortOrder: state.donationSortOrder,
      setDonationSortOrder: state.setDonationSortOrder,
    }))
  );

  return (
    <div className="group relative flex h-full items-center">
      {/* Иконка-триггер */}
      <div className="cursor-pointer p-3 text-[#71717a] transition-colors group-hover:text-white">
        <i className="ph-bold ph-arrows-down-up text-base"></i>
      </div>

      {/* "Мостик" (невидимый блок), чтобы меню не закрывалось, когда ведем мышку от иконки к меню */}
      <div className="absolute right-0 top-full h-[10px] w-full"></div>

      {/* Выпадающее меню */}
      <div
        className="
          absolute right-[-10px] top-full z-50 mt-[10px] hidden w-[220px] flex-col gap-1
          rounded-lg border border-[#27272a] bg-[#141416] p-1
          shadow-[0_4px_15px_rgba(0,0,0,0.5)] 
          group-hover:flex
          animate-in fade-in-0 zoom-in-95 duration-200
        "
      >
        {sortOptions.map((option) => (
          <SortItem
            key={option.value}
            label={option.label}
            value={option.value}
            isActive={donationSortOrder === option.value}
            onClick={setDonationSortOrder}
          />
        ))}
      </div>
    </div>
  );
};