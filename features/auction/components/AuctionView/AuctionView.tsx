"use client";

import { memo, useMemo, useEffect, useState, useRef } from 'react';
import { useAuctionViewStore } from '@/features/auction/store/auctionViewStore';
import { Timer, timerControls } from '../Timer/Timer'; 
import { LotManager } from '../../widgets/LotManager';
import { DonationManager } from '../../widgets/DonationManager/ui/DonationManager';
import { IntegrationsManager } from '../../widgets/DonationManager/ui/IntegrationsManager/IntegrationsManager';
import { RulesPanel } from '../../widgets/RulesPanel/RulesPanel';
import { TotalAmount } from '../TotalAmount/TotalAmount';
import { AuctionHeader } from './AuctionHeader'; 
import { DevDonationController } from '@/features/dev/DevDonationController';
import { DonationSort } from '../../widgets/DonationManager/ui/DonationSort';
import { useDonationsStore } from '@/entities/donation';
import { useLotsStore } from '@/entities/lot';
import { useAuctionIntegrationsStore } from '@/features/auction/store/auctionIntegrationsStore';
import { useAuthStore } from '@/entities/auth/model/store/authStore';
import { DonatePayWizardModal, Region } from '@/features/settings/ui/components/DonatePayWizardModal';
import { useShallow } from 'zustand/react/shallow';
import { usePrevious } from '@/shared/hooks/usePrevious';
import { useDonationAlertsAuth } from '@/features/auth/hooks/useDonationAlertsAuth';

// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-object-type
interface AuctionViewProps {
  // initialIsAuthenticated больше не нужен, хук useDonationAlertsAuth справится сам
}

export const AuctionView = memo(() => {
  useDonationAlertsAuth();

  const {
    isRulesOpen, toggleRulesPanel,
    isIncomingOpen, toggleIncomingPanel, setIncomingOpen,
    addTimeOnNewDonation, newDonationTimeToAdd, addTimeOnNewLot, newLotTimeToAdd,
    preventTimeAddWhenOver, preventTimeAddThreshold, isMinBidEnabled, minBidAmount,
    addTimeOnLeaderChange, leaderChangeTimeToAdd
  } = useAuctionViewStore();
  
  const donations = useDonationsStore(state => state.donations);
  const lots = useLotsStore(state => state.lots);

  const { donationAlerts, twitch, donatePay } = useAuctionIntegrationsStore(useShallow(state => state.services));
  const { setDpAuth } = useAuthStore();
  const [isDpWizardOpen, setIsDpWizardOpen] = useState(false);

  const prevDonations = usePrevious(donations);
  const prevLots = usePrevious(lots);

  // Хранилище порядка лотов (ID в порядке убывания суммы)
  const lastSortedIdsStringRef = useRef<string>("");
  const isFirstRunRef = useRef(true);

  const handleDpConnect = (apiKey: string, region: Region) => {
    setDpAuth(true, apiKey, region);
    setIsDpWizardOpen(false);
  };

  const timerSlot = useMemo(() => <Timer />, []);
  const totalAmountSlot = useMemo(() => <TotalAmount />, []);
  const integrationsSlot = useMemo(() => <IntegrationsManager onOpenDpWizard={() => setIsDpWizardOpen(true)} />, []);

  // Инициализация "отпечатка" списка при загрузке
  useEffect(() => {
    const currentLots = useLotsStore.getState().lots;
    const sortedIds = currentLots
        .filter(l => (l.amount ?? 0) > 0)
        .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))
        .map(l => l.id);

    lastSortedIdsStringRef.current = sortedIds.join(',');
    isFirstRunRef.current = false;
  }, []);

  // Авто-открытие панели входящих
  useEffect(() => {
    const hasActiveIntegrations = donationAlerts.isIntegrationEnabled || twitch.isIntegrationEnabled || donatePay.isIntegrationEnabled;
    const hasDonations = donations.length > 0;

    if (hasDonations || hasActiveIntegrations) {
      setIncomingOpen(true);
    } else if (!hasDonations && !hasActiveIntegrations) {
      setIncomingOpen(false);
    }
  }, [donations.length, donationAlerts.isIntegrationEnabled, twitch.isIntegrationEnabled, donatePay.isIntegrationEnabled, setIncomingOpen]);

  // Эффект: Новый лот
  useEffect(() => {
    if (prevLots && addTimeOnNewLot && newLotTimeToAdd > 0) {
      const newLots = lots.filter(l => !prevLots.some(pl => pl.id === l.id));
      if (newLots.length > 0) {
         if (preventTimeAddWhenOver) {
            const currentTime = timerControls.getTime(); // This now gets time from the global store
            if (currentTime > preventTimeAddThreshold) return;
         }
         timerControls.addTime(newLots.length * newLotTimeToAdd * 1000);
      }
    }
  }, [lots, prevLots, addTimeOnNewLot, newLotTimeToAdd, preventTimeAddWhenOver, preventTimeAddThreshold]);

  // Эффект: Смена лидера
  useEffect(() => {
    // 1. Сортируем положительные лоты
    const positiveLots = lots.filter(l => (l.amount ?? 0) > 0);
    const sortedLots = [...positiveLots].sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));

    // 2. Определяем ID текущего лидера
    const currentLeaderId = sortedLots.length > 0 ? sortedLots[0].id : null;

    // 3. Получаем ID предыдущего лидера из рефа
    const prevSortedIdsString = lastSortedIdsStringRef.current;
    const prevIdsArr = prevSortedIdsString ? prevSortedIdsString.split(',') : [];
    const prevLeaderId = prevIdsArr.length > 0 ? Number(prevIdsArr[0]) : null;

    // 4. Обновляем реф
    const currentSortedIdsString = sortedLots.map(l => l.id).join(',');
    lastSortedIdsStringRef.current = currentSortedIdsString;

    if (isFirstRunRef.current || !addTimeOnLeaderChange) return;

    // 5. Проверка: лидер изменился?
    if (prevLeaderId !== null && currentLeaderId !== null && prevLeaderId !== currentLeaderId) {
         if (leaderChangeTimeToAdd > 0) {
             
             // --- ДОБАВЛЕНА ПРОВЕРКА ОГРАНИЧЕНИЯ ВРЕМЕНИ ---
             if (preventTimeAddWhenOver) {
                const currentTime = timerControls.getTime();
                if (currentTime > preventTimeAddThreshold) return;
             }
             // -----------------------------------------------

             timerControls.addTime(leaderChangeTimeToAdd * 1000);
         }
    }
  }, [
    lots, 
    addTimeOnLeaderChange, 
    leaderChangeTimeToAdd, 
    preventTimeAddWhenOver,     // Не забудьте добавить в зависимости
    preventTimeAddThreshold     // Не забудьте добавить в зависимости
  ]);

  return (
    <div className="flex h-full w-full overflow-hidden">

      {/* --- ЛЕВАЯ ПАНЕЛЬ (RULES) --- */}
      <aside className={`sidebar-panel left ${isRulesOpen ? 'open' : ''}`}>
        <div className="sidebar-inner-fixed w-rules">
          <RulesPanel />
        </div>
      </aside>

      {/* --- ЦЕНТРАЛЬНАЯ ОБЛАСТЬ --- */}
      <div className="relative flex flex-1 flex-col min-w-0 transition-all duration-300">

         <div
          className={`side-trigger left-0 border-l-0 rounded-r-lg z-50 ${isRulesOpen ? 'active' : ''}`}
          onClick={toggleRulesPanel}
         >
          <span>Правила</span>
          <i className={`ph-bold ph-caret-right transition-transform duration-300 ${isRulesOpen ? 'rotate-180' : ''}`}></i>
        </div>

        <div
          className={`side-trigger right-0 border-r-0 rounded-l-lg ${isIncomingOpen ? 'active' : ''}`}
          onClick={toggleIncomingPanel}
        >
          <i className={`ph-bold ph-caret-left transition-transform duration-300 ${isIncomingOpen ? 'rotate-180' : ''}`}></i>
          <span>Входящие</span>
        </div>

        <AuctionHeader
          leftSlot={timerSlot}
          centerSlot={totalAmountSlot}
          rightSlot={integrationsSlot}
        />

        <div className="flex flex-1 flex-col overflow-hidden relative">
          <LotManager />
        </div>

      </div>
      <DonatePayWizardModal
        isOpen={isDpWizardOpen}
        onClose={() => setIsDpWizardOpen(false)}
        onConnect={handleDpConnect}
      />

      {/* --- ПРАВАЯ ПАНЕЛЬ (INCOMING) --- */}
      <aside className={`sidebar-panel right ${isIncomingOpen ? 'open' : ''}`}>
        <div className="sidebar-inner-fixed w-incoming">
          <div className="flex h-[50px] shrink-0 items-center justify-between border-b border-[#27272a] pl-5 pr-2 text-[11px] font-bold uppercase tracking-wider text-[#71717a]">
            <span>Входящие</span>
            <div className="flex items-center">
              <DevDonationController />
              <DonationSort />
            </div>
          </div>
          <div className="flex flex-1 flex-col overflow-y-auto p-4 customScrollbar">
            <DonationManager />
          </div>
        </div>
      </aside>

    </div>
  );
});

AuctionView.displayName = 'AuctionView';