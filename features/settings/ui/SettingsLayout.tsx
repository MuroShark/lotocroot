"use client";

import React from 'react';
import { TemplateSelector } from './components/TemplateSelector';
import { useAuctionViewStore } from '@/features/auction/store/auctionViewStore';
import { useCurrencyStore } from '@/features/settings/model/currencyStore';
import { ArrowCounterClockwise, Trash } from '@phosphor-icons/react';

export type SettingsTabId = 'general' | 'integrations' | 'appearance';

interface SettingsLayoutProps {
  activeTab: SettingsTabId;
  onTabChange: (tab: SettingsTabId) => void;
  // onSoftReset больше не нужен, логика будет внутри
  onHardReset: () => void;
  children: React.ReactNode;
}

export const SettingsLayout: React.FC<SettingsLayoutProps> = ({
  activeTab,
  onTabChange,
  onHardReset,
  children
}) => {
  const tabs: { id: SettingsTabId; label: string }[] = [
    { id: 'general', label: 'Основные' },
    { id: 'integrations', label: 'Интеграции' },
    { id: 'appearance', label: 'Оформление' }
  ];

  // Получаем функцию сброса из стора
  const resetViewSettings = useAuctionViewStore((state) => state.resetViewSettings);
  const resetCurrencySettings = useCurrencyStore((state) => state.resetCurrencySettings);

  // Создаем общий обработчик сброса
  const handleResetAll = () => {
    resetViewSettings();
    resetCurrencySettings();
  };
  return (
    <div className="flex flex-col h-full bg-[#09090b] relative">
      
      {/* --- HEADER --- */}
      <header className="h-[70px] px-10 flex items-center justify-between border-b border-[#27272a] bg-[#09090b]/80 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-8">
          <div className="text-xl font-bold text-white tracking-tight">Настройки</div>
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                // Добавлен cursor-pointer
                className={`px-3 py-2 rounded-md text-[13px] font-semibold transition-colors cursor-pointer ${
                  activeTab === tab.id 
                    ? 'text-white bg-[#202024]' 
                    : 'text-[#71717a] hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <TemplateSelector />
      </header>

      {/* --- SCROLLABLE CONTENT --- */}
      <div className="flex-1 overflow-y-auto customScrollbar p-10">
        <div className="max-w-[900px] mx-auto pb-10">
          {children}
        </div>
      </div>

      {/* --- FOOTER --- */}
      <div className="h-[60px] bg-[#09090b]/80 border-t border-[#27272a] flex items-center justify-between px-10 shrink-0 backdrop-blur-md">
        <button 
          className="flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold text-[#71717a] border border-[#333] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          onClick={handleResetAll}
        >
          <ArrowCounterClockwise weight="bold" /> Сбросить настройки
        </button>
        
        <button 
          className="flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold text-[#ef4444] border border-red-500/20 hover:bg-red-500/10 transition-colors cursor-pointer"
          onClick={onHardReset}
        >
          <Trash weight="bold" /> Полный сброс данных
        </button>
      </div>
    </div>
  );
};