"use client";
import React, { memo } from "react";
import { useShallow } from 'zustand/react/shallow';
import { SettingsRow } from "../components/SettingsRow";
import { SettingToggle } from "../components/SettingToggle";
import { useAuctionViewStore } from "@/features/auction/store/auctionViewStore";
import { ONE_MINUTE } from "@/features/auction/components/Timer/Timer";
import { Clock, ArrowsDownUp, PlusCircle, Coins, Timer } from "@phosphor-icons/react";

// Оборачиваем в memo, чтобы не рендерился, если пропсы не меняются (хотя тут нет пропсов, но это good practice)
export const GeneralSettings = memo(() => {
  
  // 🔥 useShallow: Компонент рендерится ТОЛЬКО если изменились перечисленные поля.
  // Изменения drag&drop или hoveredLotId теперь не вызовут ререндер этой страницы.
  const { 
    timerInitialTime, 
    setTimerInitialTime,
    addTimeOnNewDonation,
    toggleAddTimeOnNewDonation,
    newDonationTimeToAdd,
    setNewDonationTimeToAdd,
    preventTimeAddWhenOver,
    togglePreventTimeAddWhenOver,
    preventTimeAddThreshold,
    setPreventTimeAddThreshold,
    isMinBidEnabled,
    toggleIsMinBidEnabled,
    minBidAmount,
    setMinBidAmount,
    addTimeOnLeaderChange,
    toggleAddTimeOnLeaderChange,
    leaderChangeTimeToAdd,
    setLeaderChangeTimeToAdd,
    showTotalTimer,
    toggleShowTotalTimer,
    addTimeOnNewLot,
    toggleAddTimeOnNewLot,
    newLotTimeToAdd, setNewLotTimeToAdd,
  } = useAuctionViewStore(useShallow((state) => ({
    timerInitialTime: state.timerInitialTime,
    setTimerInitialTime: state.setTimerInitialTime,
    addTimeOnNewDonation: state.addTimeOnNewDonation,
    toggleAddTimeOnNewDonation: state.toggleAddTimeOnNewDonation,
    newDonationTimeToAdd: state.newDonationTimeToAdd,
    setNewDonationTimeToAdd: state.setNewDonationTimeToAdd,
    preventTimeAddWhenOver: state.preventTimeAddWhenOver,
    togglePreventTimeAddWhenOver: state.togglePreventTimeAddWhenOver,
    preventTimeAddThreshold: state.preventTimeAddThreshold,
    setPreventTimeAddThreshold: state.setPreventTimeAddThreshold,
    isMinBidEnabled: state.isMinBidEnabled,
    toggleIsMinBidEnabled: state.toggleIsMinBidEnabled,
    minBidAmount: state.minBidAmount,
    setMinBidAmount: state.setMinBidAmount,
    addTimeOnLeaderChange: state.addTimeOnLeaderChange,
    toggleAddTimeOnLeaderChange: state.toggleAddTimeOnLeaderChange,
    leaderChangeTimeToAdd: state.leaderChangeTimeToAdd,
    setLeaderChangeTimeToAdd: state.setLeaderChangeTimeToAdd,
    showTotalTimer: state.showTotalTimer,
    toggleShowTotalTimer: state.toggleShowTotalTimer,
    addTimeOnNewLot: state.addTimeOnNewLot,
    toggleAddTimeOnNewLot: state.toggleAddTimeOnNewLot,
    newLotTimeToAdd: state.newLotTimeToAdd,
    setNewLotTimeToAdd: state.setNewLotTimeToAdd,
  })));

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTimerInitialTime(Number(e.target.value) * ONE_MINUTE);
  };

  const handleNewDonationTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewDonationTimeToAdd(Number(e.target.value));
  };

  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPreventTimeAddThreshold(Number(e.target.value) * ONE_MINUTE);
  }

  const handleMinBidAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMinBidAmount(Number(e.target.value));
  }

  const handleLeaderChangeTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLeaderChangeTimeToAdd(Number(e.target.value));
  }

  const handleNewLotTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewLotTimeToAdd(Number(e.target.value));
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <fieldset className="
        border border-[#27272a] rounded-xl p-6 mb-8 
        transition-colors duration-300 group 
        hover:border-[#3f3f46] 
        focus-within:border-[#9147ff] 
        focus-within:hover:border-[#9147ff] 
        focus-within:shadow-[0_0_0_1px_rgba(145,71,255,0.1)]
      ">
        <legend className="px-2 text-[#9147ff] font-bold text-xs uppercase tracking-wider ml-[-10px]">
          <Clock weight="bold" className="mr-1 align-middle inline-block" /> Таймер
        </legend>

        <SettingsRow 
          label="Показывать общее время" 
          description="Отображать таймер общего времени работы аукциона рядом с основным."
          tooltip="Этот таймер считает общее время, пока основной таймер запущен."
        >
          <SettingToggle checked={showTotalTimer} onChange={toggleShowTotalTimer} />
        </SettingsRow>

        {/* Grid Timer Logic */}
        <div className="grid grid-cols-2 gap-10 mt-5">
          {/* Positive Conditions */}
          <div className="flex flex-col gap-1">
            <div className="text-[11px] uppercase text-[#10b981] font-bold mb-3 tracking-wide opacity-80">Добавлять время при условии</div>
            
            <SettingsRow label="Смена лидера" icon={<ArrowsDownUp weight="bold" className="text-lg opacity-80" />}>
               <SettingToggle checked={addTimeOnLeaderChange} onChange={toggleAddTimeOnLeaderChange} />
               <div className="relative flex items-center">
                 <input 
                   type="number" 
                   value={leaderChangeTimeToAdd} 
                   onChange={handleLeaderChangeTimeChange}
                   min="0"
                   className="bg-[#202024] border border-[#333] text-white pl-2 pr-8 h-9 rounded-md text-[13px] w-[70px] focus:border-[#9147ff] focus:outline-none transition-colors" 
                  />
                 <span className="absolute right-3 text-[#71717a] text-[10px] font-bold pointer-events-none">с.</span>
               </div>
            </SettingsRow>

            <SettingsRow label="Новый лот" icon={<PlusCircle weight="bold" className="text-lg opacity-80" />}>
               <SettingToggle checked={addTimeOnNewLot} onChange={toggleAddTimeOnNewLot} />
               <div className="relative flex items-center">
                 <input 
                   type="number" 
                   value={newLotTimeToAdd} 
                   onChange={handleNewLotTimeChange}
                   min="0"
                   className="bg-[#202024] border border-[#333] text-white pl-2 pr-8 h-9 rounded-md text-[13px] w-[70px] focus:border-[#9147ff] focus:outline-none transition-colors" 
                  />
                 <span className="absolute right-3 text-[#71717a] text-[10px] font-bold pointer-events-none">с.</span>
               </div>
            </SettingsRow>

             <SettingsRow label="Новый донат" icon={<Coins weight="bold" className="text-lg opacity-80" />}>
               <SettingToggle checked={addTimeOnNewDonation} onChange={toggleAddTimeOnNewDonation} />
               <div className="relative flex items-center">
                 <input 
                   type="number" 
                   value={newDonationTimeToAdd} 
                   min="0"
                   onChange={handleNewDonationTimeChange}
                   className="bg-[#202024] border border-[#333] text-white pl-2 pr-8 h-9 rounded-md text-[13px] w-[70px] focus:border-[#9147ff] focus:outline-none transition-colors" 
                 />
                 <span className="absolute right-3 text-[#71717a] text-[10px] font-bold pointer-events-none">с.</span>
               </div>
            </SettingsRow>
          </div>

          {/* Negative Conditions */}
          <div className="flex flex-col gap-1">
            <div className="text-[11px] uppercase text-[#f59e0b] font-bold mb-3 tracking-wide opacity-80">НЕ добавлять время при условии</div>
            
            <SettingsRow label="Таймер больше чем" icon={<Timer weight="bold" className="text-lg opacity-80" />}>
               <SettingToggle checked={preventTimeAddWhenOver} onChange={togglePreventTimeAddWhenOver} />
               <div className="relative flex items-center">
                 <input 
                   type="number" 
                   value={preventTimeAddThreshold / ONE_MINUTE}
                   onChange={handleThresholdChange}
                   min="1"
                   className="bg-[#202024] border border-[#333] text-white pl-2 pr-9 h-9 rounded-md text-[13px] w-[70px] focus:border-[#9147ff] focus:outline-none transition-colors" 
                  />
                 <span className="absolute right-3 text-[#71717a] text-[10px] font-bold pointer-events-none">мин.</span>
               </div>
            </SettingsRow>
          </div>
        </div>

        {/* Footer Inputs */}
        <div className="mt-6 pt-5 border-t border-white/5 flex gap-10">
          <div className="flex-1 flex items-center justify-between">
             <span className="relative group/tooltip text-[13px] text-[#ccc] font-medium border-b border-dashed border-[#71717a] cursor-help hover:text-white hover:border-[#9147ff] transition-colors">
               Стартовое время
               <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-[#141416] border border-[#27272a] rounded-md text-[11px] text-[#e4e4e7] text-center font-normal opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 shadow-xl z-50 pointer-events-none">
                 Время таймера при запуске аукциона.
               </span>
             </span>

             <div className="relative flex items-center">
                 <input 
                   type="number" 
                   value={timerInitialTime / ONE_MINUTE}
                   onChange={handleTimeChange}
                   className="bg-[#202024] border border-[#333] text-white pl-2 pr-10 h-9 rounded-md text-[13px] w-[100px] focus:border-[#9147ff] focus:outline-none transition-colors" 
                 />
                 <span className="absolute right-3 text-[#71717a] text-[10px] font-bold pointer-events-none">МИН</span>
             </div>
          </div>
          
          <div className="flex-1 flex items-center justify-between">
             <span className="relative group/tooltip text-[13px] text-[#ccc] font-medium border-b border-dashed border-[#71717a] cursor-help hover:text-white hover:border-[#9147ff] transition-colors">
               Минимальная ставка
               <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-[#141416] border border-[#27272a] rounded-md text-[11px] text-[#e4e4e7] text-center font-normal opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 shadow-xl z-50 pointer-events-none">
                 Донаты меньше этой суммы будут игнорироваться.
               </span>
             </span>

             <div className="flex items-center gap-3">
               <SettingToggle checked={isMinBidEnabled} onChange={toggleIsMinBidEnabled} />
               <div className="relative flex items-center">
                   <input 
                     type="number" 
                     value={minBidAmount}
                     onChange={handleMinBidAmountChange}
                     min="0"
                     className="bg-[#202024] border border-[#333] text-white pl-2 pr-10 h-9 rounded-md text-[13px] w-[100px] focus:border-[#9147ff] focus:outline-none transition-colors" 
                   />
                   <span className="absolute right-3 text-[#71717a] text-[10px] font-bold pointer-events-none">RUB</span>
               </div>
             </div>
          </div>
        </div>

      </fieldset>
    </div>
  );
});

GeneralSettings.displayName = 'GeneralSettings';