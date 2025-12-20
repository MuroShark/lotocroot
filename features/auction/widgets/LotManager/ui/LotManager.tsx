"use client";

import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  useLotsStore,
  selectFilteredLots,
  selectPositiveTotalAmount,
} from '@/entities/lot';
import { useAuctionViewStore } from '@/features/auction/store/auctionViewStore';
import { useShallow } from 'zustand/react/shallow';
import { useToasterStore } from '@/shared/ui/Toast/Toaster';
import { LotControls } from './LotControls/LotControls';
import { LotList } from './LotList/LotList';
import { LotToolbar } from './LotToolbar/LotToolbar';
import type { Donation } from '@/shared/types';
import { useDonationsStore } from '@/entities/donation';
import { useCurrencyStore } from '@/features/settings/model/currencyStore';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface LotManagerProps {
}

interface LotManagerViewProps {
  isCompactMode: boolean;
  showPercentages: boolean;
  isDonationDragging: boolean;
  handleDropOnLot: (lotId: number, donation: Donation) => void; // Добавим обработчик сюда
}

const LotManagerViewComponent: React.FC<LotManagerViewProps> = ({ 
  isCompactMode,
  showPercentages,
  isDonationDragging,
  handleDropOnLot
}) => {
  const lots = useLotsStore((state) => state.lots);
  const addLot = useLotsStore((state) => state.addLot);
  const deleteLot = useLotsStore((state) => state.deleteLot);
  const updateLotAmount = useLotsStore((state) => state.updateLotAmount);
  const setLotAmount = useLotsStore((state) => state.setLotAmount);
  const updateLotContent = useLotsStore((state) => state.updateLotContent);
  const clearLotsCallback = useLotsStore((state) => state.clearLots);
  const undoClearLots = useLotsStore((state) => state.undoClearLots);

  const [searchTerm, setSearchTerm] = useState('');
  const filteredLots = useLotsStore(state => selectFilteredLots(state, searchTerm));
  const totalAmountForPercentages = useLotsStore(selectPositiveTotalAmount);
  const [newLotContent, setNewLotContent] = useState('');
  const [newLotAmount, setNewLotAmount] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);

  const { addToast } = useToasterStore();

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleClearLots = useCallback(() => {
    clearLotsCallback();
    addToast({
      message: 'Список лотов очищен.',
      action: {
        label: 'Отменить',
        onClick: () => undoClearLots(),
      },
      duration: 7000,
    });
  }, [clearLotsCallback, addToast, undoClearLots]);

  const handleAddLot = useCallback(() => {
    const content = newLotContent.trim();
    const amount = newLotAmount.trim() === '' ? null : parseInt(newLotAmount, 10);
    addLot(content, amount);
    setNewLotContent('');
    setNewLotAmount('');
  }, [newLotContent, newLotAmount, addLot]);

  const handleAddEmptyLot = useCallback(() => addLot('', null), [addLot]);

  return (
    <div className="flex h-full flex-col relative">
      {/* Верхняя панель ввода */}
      <LotControls
        newLotContent={newLotContent}
        setNewLotContent={setNewLotContent}
        newLotAmount={newLotAmount}
        setNewLotAmount={setNewLotAmount}
        onAddLot={handleAddLot}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        showPercentages={showPercentages}
        totalAmount={totalAmountForPercentages}
      />

      {/* Список лотов */}
      <LotList
        lots={filteredLots}
        isCompactMode={isCompactMode}
        isHydrated={isHydrated}
        showPercentages={showPercentages}
        totalAmount={totalAmountForPercentages}
        isDonationDragging={isDonationDragging}
        onDelete={deleteLot}
        hasActiveSearch={searchTerm.length > 0}
        onUpdateAmount={updateLotAmount}
        onSetAmount={setLotAmount}
        onUpdateContent={updateLotContent}
        onAddLot={handleAddEmptyLot}
        onDropOnLot={handleDropOnLot}
      />

      {/* Футер с кнопками */}
      <LotToolbar onClearLots={handleClearLots} />
    </div>
  );
};

const LotManagerView = memo(LotManagerViewComponent);

const LotManagerComponent: React.FC<LotManagerProps> = () => {
  // Этот компонент-контейнер подписывается на useAuctionViewStore
  const { isCompactMode, showPercentages, isDonationDragging } = useAuctionViewStore();

  const { updateLot, updateLotAmount } = useLotsStore(useShallow(
    (state) => ({ 
      updateLot: state.updateLot, 
      updateLotAmount: state.updateLotAmount 
    }))
  );

  const { deleteDonation } = useDonationsStore(useShallow(
    (state) => ({ deleteDonation: state.deleteDonation }))
  );

  // Получаем данные для конвертации валют
  const { baseCurrency, rateSource, autoRates, customRates } = useCurrencyStore(useShallow(
    (state) => ({
      baseCurrency: state.baseCurrency,
      rateSource: state.rateSource,
      autoRates: state.autoRates,
      customRates: state.customRates,
    })
  ));

  const handleDropOnLot = useCallback((lotId: number, donation: Donation) => {
    const currentLots = useLotsStore.getState().lots;
    
    const targetLot = currentLots.find((l) => l.id === lotId);
    if (!targetLot) return;
    
    // --- ЛОГИКА КОНВЕРТАЦИИ (добавлена из DonationManager) ---
    let convertedAmount = donation.amount;
    const rates = rateSource === 'auto' ? autoRates : customRates;

    if (donation.currency !== baseCurrency && rates[donation.currency]) {
      convertedAmount = donation.amount * rates[donation.currency];
    }
    const finalAmount = Math.round(convertedAmount);
    // --- КОНЕЦ ЛОГИКИ КОНВЕРТАЦИИ ---

    const lotHasText = targetLot.content.trim() !== '';
    
    if (!lotHasText) {
      updateLot(lotId, finalAmount, donation.message);
    } else {
      updateLotAmount(lotId, finalAmount);
    }
    deleteDonation(donation.id as number);
  }, [updateLot, updateLotAmount, deleteDonation, baseCurrency, rateSource, autoRates, customRates]);


  // И передает пропсы в презентационный компонент
  return (
    <LotManagerView
      handleDropOnLot={handleDropOnLot}
      isCompactMode={isCompactMode}
      showPercentages={showPercentages}
      isDonationDragging={isDonationDragging}
    />
  );
};

export const LotManager = memo(LotManagerComponent);
LotManager.displayName = 'LotManager';