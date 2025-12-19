"use client";

import React, { useRef, memo, useCallback, useMemo } from "react";
import { useDonationsStore } from "@/entities/donation";
import { useLotsStore } from "@/entities/lot";
import { useAuthStore } from "@/entities/auth/model/store/authStore";
import { findBestLotMatch } from "@/features/auction/utils/findBestLotMatch";
import type { Donation } from '@/shared/types';
import { DonationList } from './DonationList/DonationList';
import { timerControls } from '@/features/auction/components/Timer/Timer';
import type { DonationAction } from './DonationList/DonationItemContent'; 
import { useAuctionViewStore, type DonationSortOrder } from '@/features/auction/store/auctionViewStore';
import { useCurrencyStore } from '@/features/settings/model/currencyStore';
import { useScrollLock } from '@/shared/hooks/useScrollLock';
import { useShallow } from 'zustand/react/shallow';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface DonationManagerProps {
}

const DonationManagerComponent: React.FC<DonationManagerProps> = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  // 1. ОПТИМИЗАЦИЯ: Подписываемся только на donations, так как они нужны для рендера UI
  const { donations, deleteDonation } = useDonationsStore(
    useShallow((state) => ({
      donations: state.donations,
      deleteDonation: state.deleteDonation,
    }))
  );

  // 2. ОПТИМИЗАЦИЯ: Из useLotsStore берем ТОЛЬКО экшены.
  // Мы НЕ берем 'lots' здесь, чтобы избежать ререндера при каждом изменении списка лотов.
  const { addLot, updateLotAmount } = useLotsStore(
    useShallow((state) => ({
      addLot: state.addLot,
      updateLotAmount: state.updateLotAmount,
    }))
  );

  // 3. ОПТИМИЗАЦИЯ: Подписываемся на нужные данные из стора валют
  const { baseCurrency, rateSource, autoRates, customRates } = useCurrencyStore(
    useShallow((state) => ({
      baseCurrency: state.baseCurrency,
      rateSource: state.rateSource,
      autoRates: state.autoRates,
      customRates: state.customRates,
    }))
  );
  const donationListRef = useRef<HTMLDivElement>(null);
  const { isDonationDragging, donationSortOrder } = useAuctionViewStore(
    useShallow((state) => ({
      isDonationDragging: state.isDonationDragging,
      donationSortOrder: state.donationSortOrder,
    }))
  );

  // 4. ОПТИМИЗАЦИЯ: Подписываемся на настройки таймера, чтобы использовать их в `handleDonationAction`
  const {
    addTimeOnNewDonation,
    newDonationTimeToAdd,
    isMinBidEnabled,
    minBidAmount,
    preventTimeAddWhenOver,
    preventTimeAddThreshold,
  } = useAuctionViewStore(useShallow(state => ({
    addTimeOnNewDonation: state.addTimeOnNewDonation,
    newDonationTimeToAdd: state.newDonationTimeToAdd,
    isMinBidEnabled: state.isMinBidEnabled,
    minBidAmount: state.minBidAmount,
    preventTimeAddWhenOver: state.preventTimeAddWhenOver,
    preventTimeAddThreshold: state.preventTimeAddThreshold,
  })));

  useScrollLock(donationListRef, isDonationDragging);

  const sortedDonations = useMemo(() => {
    const sorted = [...donations]; // Создаем копию, чтобы не мутировать исходный массив
    const sortFunctions: Record<DonationSortOrder, (a: Donation, b: Donation) => number> = {
      // Донаты добавляются в начало, поэтому для "старых" нужно перевернуть массив
      oldest: (a, b) => (b.id as number) - (a.id as number),
      // Для "новых" оставляем как есть
      newest: (a, b) => (a.id as number) - (b.id as number),
      amountDesc: (a, b) => b.amount - a.amount,
      amountAsc: (a, b) => a.amount - b.amount,
    };

    // Так как донаты добавляются в начало, для 'newest' и 'oldest' логика инвертируется
    if (donationSortOrder === 'newest') return sorted;
    if (donationSortOrder === 'oldest') return sorted.reverse();
    return sorted.sort(sortFunctions[donationSortOrder]);
  }, [donations, donationSortOrder]);
  
  const addTimeToTimerForDonation = useCallback((donationAmount: number) => {
    if (!addTimeOnNewDonation || newDonationTimeToAdd <= 0) return;

    // Проверка на минимальную ставку
    if (isMinBidEnabled && donationAmount < minBidAmount) return;

    // Проверка на превышение порога времени
    if (preventTimeAddWhenOver) {
      const currentTime = timerControls.getTime();
      if (currentTime > preventTimeAddThreshold) return;
    }

    timerControls.addTime(newDonationTimeToAdd * 1000);
  }, [addTimeOnNewDonation, newDonationTimeToAdd, isMinBidEnabled, minBidAmount, preventTimeAddWhenOver, preventTimeAddThreshold]);

  const handleDonationAction = useCallback((donation: Donation, action: DonationAction) => {
    // --- ЛОГИКА КОНВЕРТАЦИИ ---
    let convertedAmount = donation.amount;
    const rates = rateSource === 'auto' ? autoRates : customRates;

    // Проверяем, нужно ли конвертировать
    if (donation.currency !== baseCurrency && rates[donation.currency]) {
      const rate = rates[donation.currency];
      convertedAmount = donation.amount * rate;
    } else if (donation.currency !== baseCurrency && baseCurrency === 'RUB') {
      // Фоллбэк: если курсов нет, но базовая валюта - рубли, предполагаем, что курс 1:1 (частый случай для DA)
      // В реальном приложении здесь можно показать ошибку или использовать курс по умолчанию
    }

    const finalAmount = Math.round(convertedAmount);
    // --- КОНЕЦ ЛОГИКИ КОНВЕРТАЦИИ ---
    

    // Получаем актуальные лоты "императивно" только в момент клика.
    // Это предотвращает подписку компонента на изменение массива lots.
    const currentLots = useLotsStore.getState().lots;

    switch (action.type) {
      case 'DELETE':
        break;
      case 'CREATE_NEW_LOT':
        addLot(donation.message, finalAmount);
        addTimeToTimerForDonation(finalAmount);
        break;
      case 'ADD_TO_RANDOM_LOT': {
        // Используем currentLots вместо lots из пропсов/хука
        const filledLots = currentLots.filter(lot => !lot.isPlaceholder && lot.content.trim() !== '');
        if (filledLots.length > 0) {
          const randomLot = filledLots[Math.floor(Math.random() * filledLots.length)];
          updateLotAmount(randomLot.id, finalAmount);
          addTimeToTimerForDonation(finalAmount);
        } else {
          addLot(donation.message, finalAmount);
          addTimeToTimerForDonation(finalAmount);
        }
        break;
      }
      case 'ADD_TO_BEST_MATCH_LOT': {
        // Используем currentLots
        const { bestMatch } = findBestLotMatch(donation.message, currentLots);
        if (bestMatch) {
          updateLotAmount(bestMatch.id, finalAmount);
          addTimeToTimerForDonation(finalAmount);
        }
        break;
      }
    }
    deleteDonation(donation.id as number);
  }, [addLot, updateLotAmount, deleteDonation, baseCurrency, rateSource, autoRates, customRates, addTimeToTimerForDonation]); 

  return (
    <>
      {isAuthenticated && (
        <div className="flex min-h-0 flex-grow flex-col">
          <div
            ref={donationListRef}
            className={`customScrollbar min-h-0 flex-grow overflow-x-hidden pr-2 overflow-y-auto pt-1`}
          >
            <div className="flex flex-col gap-3 pb-4">
              <DonationList
                donations={sortedDonations}
                onDonationAction={handleDonationAction}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// 4. ОПТИМИЗАЦИЯ: Оборачиваем в memo, чтобы ререндер AuctionView не вызывал ререндер DonationManager,
// если пропсы (которых нет) не изменились.
export const DonationManager = memo(DonationManagerComponent);