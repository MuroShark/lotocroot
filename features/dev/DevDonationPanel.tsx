"use client";

import React, { useCallback } from 'react';
import { useDonationsStore } from '@/entities/donation';
import { useLotsStore } from '@/entities/lot';
import type { Lot } from '@/entities/lot';
import type { Donation, DonationPlatform } from '@/shared/types';
import { v4 as uuidv4 } from 'uuid';
import { useAuctionViewStore } from '../auction/store/auctionViewStore';
import { timerControls } from '../auction/components/Timer/Timer';


// Компонент будет рендериться только в dev-режиме, поэтому хуки можно использовать без опасений

const platformStyles: Record<DonationPlatform, string> = {
  donationalerts: 'border-l-[#f59e0b]',
  twitch: 'border-l-[#a970ff]',
  donatepay: 'border-l-[#10b981]',
  custom: 'border-l-[#3b82f6]',
};

const platformNames: Record<DonationPlatform, string> = {
  donationalerts: 'DonationAlerts',
  twitch: 'Twitch',
  donatepay: 'DonatePay',
  custom: 'Кастомный',
};

interface DevDonationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DevDonationPanel: React.FC<DevDonationPanelProps> = ({ isOpen, onClose }) => {
  const { addDonation, deleteDonation } = useDonationsStore();
  const { lots, updateLotAmount } = useLotsStore();

  // Получаем настройки и создаем функцию для добавления времени
  const {
    addTimeOnNewDonation,
    newDonationTimeToAdd,
    isMinBidEnabled,
    minBidAmount,
    preventTimeAddWhenOver,
    preventTimeAddThreshold,
  } = useAuctionViewStore();

  const addTimeToTimerForDonation = useCallback((donationAmount: number) => {
    if (!addTimeOnNewDonation || newDonationTimeToAdd <= 0) return;
    if (isMinBidEnabled && donationAmount < minBidAmount) return;
    if (preventTimeAddWhenOver && timerControls.getTime() > preventTimeAddThreshold) return;
    timerControls.addTime(newDonationTimeToAdd * 1000);
  }, [addTimeOnNewDonation, newDonationTimeToAdd, isMinBidEnabled, minBidAmount, preventTimeAddWhenOver, preventTimeAddThreshold]);

  // Используем React.useState для хранения состояния формы
  const [username, setUsername] = React.useState('DevUser');
  const [message, setMessage] = React.useState('Тестовый донат');
  const [amount, setAmount] = React.useState('100');
  const [count, setCount] = React.useState('1');
  const [platform, setPlatform] = React.useState<DonationPlatform>('donationalerts');
  const [autoAddToLot, setAutoAddToLot] = React.useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount) || 0;
    const numCount = parseInt(count, 10) || 1;

    // Если включена опция авто-добавления и создается только один донат
    if (autoAddToLot && numCount === 1) {
      const trimmedMessage = message.trim();
      const matchingLot = lots.find(
        (lot: Lot) => lot.content.trim().toLowerCase() === trimmedMessage.toLowerCase() && !lot.isPlaceholder
      );

      if (matchingLot) {
        // 1. Обновляем сумму в лоте
        updateLotAmount(matchingLot.id, numAmount);
        // 2. Вызываем функцию добавления времени
        addTimeToTimerForDonation(numAmount);

        onClose(); // Закрываем модалку и выходим
        return;
      }
    }

    // Стандартная логика, если опция выключена, создается несколько донатов,
    // или совпадение не найдено.
    for (let i = 0; i < numCount; i++) {
      const newDonation: Donation = {
        id: uuidv4(),
        amount: numAmount,
        currency: 'RUB',
        message: numCount > 1 ? `${message} #${i + 1}` : message,
        username,
        platform,
        createdAt: new Date().toISOString(),
      };
      addDonation(newDonation);
    }

    onClose(); // Закрываем модалку после добавления
  };

  // Не рендерим ничего в продакшене
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
          <div
            className="relative w-full max-w-md rounded-2xl border border-[#27272a] bg-[#121214] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-white">Эмулятор донатов</h2>
            <p className="mb-4 text-sm text-zinc-400">Создайте тестовый донат для отладки.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Platform */}
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Платформа</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as DonationPlatform)}
                  className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-input)] px-3 py-2 text-sm text-white focus:border-[var(--primary)] focus:outline-none"
                >
                  {Object.keys(platformStyles).map((p) => (
                    <option key={p} value={p}>{platformNames[p as DonationPlatform]}</option>
                  ))}
                </select>
              </div>

              {/* Username */}
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Имя пользователя</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-input)] px-3 py-2 text-sm text-white focus:border-[var(--primary)] focus:outline-none"
                />
              </div>

              {/* Message */}
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Сообщение</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-input)] px-3 py-2 text-sm text-white focus:border-[var(--primary)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Amount */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-400">Сумма</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-input)] px-3 py-2 text-sm text-white focus:border-[var(--primary)] focus:outline-none"
                  />
                </div>

                {/* Count */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-400">Количество</label>
                  <input
                    type="number"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    min="1"
                    className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-input)] px-3 py-2 text-sm text-white focus:border-[var(--primary)] focus:outline-none"
                  />
                </div>
              </div>

              {/* Опция авто-добавления */}
              <div className="mt-1 flex cursor-pointer items-center gap-3 rounded-md p-1 select-none" onClick={() => setAutoAddToLot(!autoAddToLot)}>
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-[var(--border-color)] bg-[var(--bg-input)]">
                  {autoAddToLot && <i className="ph-bold ph-check text-xs text-[var(--primary)]"></i>}
                </div>
                <label 
                  htmlFor="auto-add-to-lot" 
                  className="cursor-pointer text-xs text-zinc-400"
                  onClick={(e) => e.stopPropagation()} // Предотвращаем двойное срабатывание
                >
                  Автоматически добавлять к лоту при полном совпадении
                </label>
              </div>


              <button
                type="submit"
                className="mt-2 flex h-10 w-full items-center justify-center rounded-md bg-[var(--primary)] px-4 text-sm font-bold text-white transition hover:bg-[var(--primary-hover)]"
              >
                Создать донат(ы)
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};