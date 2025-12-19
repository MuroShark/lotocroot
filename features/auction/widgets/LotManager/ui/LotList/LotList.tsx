"use client";

import React, { memo } from 'react';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { LotItem } from '@/entities/lot';
import type { Lot } from '@/entities/lot';
import type { Donation } from '@/shared/types';

interface LotListProps {
  lots: Lot[];
  isCompactMode: boolean;
  isHydrated: boolean;
  showPercentages: boolean;
  totalAmount: number;
  isDonationDragging: boolean;
  onDelete: (id: number) => void;
  onUpdateAmount: (id: number, amount: number) => void;
  onSetAmount: (id: number, amount: number | null) => void;
  onUpdateContent: (id: number, content: string) => void;
  hasActiveSearch: boolean;
  onAddLot: () => void;
  onDropOnLot?: (lotId: number, donation: Donation) => void; // Сделаем необязательным, т.к. он приходит из LotItem
}

export const LotList = memo<LotListProps>(({
  lots,
  isHydrated,
  hasActiveSearch,
  ...props
}) => {
  return (
    <div className={clsx(
      "flex-1 overflow-y-auto customScrollbar",
      props.isCompactMode ? 'py-0' : 'px-6 py-4'
    )}>
      {isHydrated && (
        <motion.div layoutScroll className="flex flex-col">
          <AnimatePresence initial={false}>
              {lots.length > 0 ? (
                lots.map((lot, index) => (
                  <LotItem
                    key={lot.id}
                    displayNumber={index + 1}
                    lot={lot}
                    {...props}
                  />
                ))
              ) : (
                !hasActiveSearch && (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center pt-20 text-[#333]">
                      <i className="ph ph-ghost text-4xl mb-2"></i>
                      <p className="text-sm">Список пуст</p>
                   </motion.div>
                )
              )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
});
LotList.displayName = 'LotList';