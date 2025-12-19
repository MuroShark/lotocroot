'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/entities/auth/model/store/authStore';
import { useLotsStore } from '@/entities/lot/model/store/lotsStore';
import { useCentrifugeSocket } from '@/shared/hooks/useCentrifugeSocket';
import { findBestLotMatch, AUTOMATIC_ASSIGN_THRESHOLD } from '../utils/findBestLotMatch';
import { useDonationsStore } from '@/entities/donation/model/store/donationsStore';
import type { Donation } from '@/shared/types';
import type {
  DonationAlertsSocketData,
  DonationAlertsSubscribeData,
  SubscriptionToken,
} from '@/shared/types/donationalerts';

// --- Типы для сообщений от Centrifugo ---

interface CentrifugeAuthResult {
  client: string;
}

interface CentrifugePublicationResult {
  channel: string;
  data: {
    data: Donation;
  };
}

type CentrifugeMessage = {
  id?: number;
  result?: Partial<CentrifugeAuthResult & CentrifugePublicationResult>;
};

function isAuthMessage(msg: unknown): msg is { result: { client: string } } {
  return (msg as { result?: { client?: unknown } })?.result?.client !== undefined;
}

function isPublicationMessage(msg: unknown): msg is { result: { channel: string; data: { data: Donation } } } {
  const donationData = (msg as { result?: { data?: { data?: unknown } } })?.result?.data?.data;

  if (!donationData || typeof donationData !== 'object') {
    return false;
  }

  return (
    'id' in donationData &&
    'username' in donationData &&
    'message' in donationData &&
    'amount' in donationData &&
    'currency' in donationData
  );
}

export const useDonationAlertsSocket = () => {
  // State
  const lots = useLotsStore((state) => state.lots);
  const updateLotAmount = useLotsStore((state) => state.updateLotAmount);
  
  const { isAuthenticated, setIsAuthenticated } = useAuthStore();

  const [isInitializing, setIsInitializing] = useState(false);
  
  const addDonation = useDonationsStore((state) => state.addDonation);

  // Refs
  const lotsRef = useRef(lots);
  const daUserIdRef = useRef<string | null>(null);
  const messageIdRef = useRef(1);
  const sendRef = useRef<((data: unknown) => void) | null>(null);

  useEffect(() => {
    lotsRef.current = lots;
  }, [lots]);

  // --- 1. Функция подписки (Обернута в useCallback) ---
  const subscribeToDonations = useCallback(async (clientId: string, userId: string) => {
    // Проверяем isAuthenticated и наличие sendRef
    if (!isAuthenticated || !sendRef.current) return;

    try {
      console.log('[DA Hook] Запрос токенов для подписки...');
      const channels = [`$alerts:donation_${userId}`];
      
      // Куки отправляются автоматически, Authorization header не нужен
      const subResponse = await fetch('/api/auth/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channels, client: clientId }),
      });

      if (!subResponse.ok) throw new Error('Failed to get subscription tokens');

      const { subscription_tokens }: DonationAlertsSubscribeData = await subResponse.json();
      
      if (Array.isArray(subscription_tokens)) {
        console.log('[DA Hook] Отправка команд подписки...');
        subscription_tokens.forEach((sub: SubscriptionToken) => {
          sendRef.current?.({
            params: { channel: sub.channel, token: sub.token },
            method: 1,
            id: messageIdRef.current++,
          });
        });
      }
    } catch (error) {
      console.error('[DA Hook] Ошибка подписки:', error);
    }
  }, [isAuthenticated]); // Зависимость от статуса авторизации

  // --- 2. Обработчик сообщений ---
  const handleSocketMessage = useCallback((message: unknown) => {
    const msg = message as CentrifugeMessage;

    if (isAuthMessage(msg)) {
      const userId = daUserIdRef.current;
      if (userId) {
        subscribeToDonations(msg.result.client, userId);
      }
    }

    if (isPublicationMessage(msg)) {
      const newDonation: Donation = msg.result.data.data;
      console.log('[DA Hook] Новый донат:', newDonation);

      const { bestMatch, similarity } = findBestLotMatch(newDonation.message, lotsRef.current);

      if (bestMatch && similarity >= AUTOMATIC_ASSIGN_THRESHOLD) {
        updateLotAmount(bestMatch.id, Math.round(newDonation.amount));
      } else {
        addDonation(newDonation);
      }
    }
  }, [addDonation, updateLotAmount, subscribeToDonations]); // Теперь subscribeToDonations в зависимостях

  // --- 3. Инициализация сокета ---
  const {
    status: connectionStatus,
    connect: connectSocket,
    disconnect: disconnectSocket,
    send,
  } = useCentrifugeSocket({
    onMessage: handleSocketMessage,
    onError: () => {
        console.warn('[DA Hook] Socket error occurred');
        setIsInitializing(false);
    },
    onDisconnect: () => {
        console.log('[DA Hook] Socket disconnected');
        setIsInitializing(false);
    },
  });

  // Обновляем ref для send
  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  // --- 4. Публичные методы ---
  const connect = useCallback(async () => {
    if (!isAuthenticated) return;
    if (connectionStatus === 'connected' || connectionStatus === 'connecting' || isInitializing) return;

    try {
      setIsInitializing(true);

      // Куки отправляются автоматически
      const response = await fetch('/api/auth/socket', {
        method: 'POST',
      });

      if (!response.ok) {
        if (response.status === 401) setIsAuthenticated(false);
        throw new Error('Failed to get socket config');
      }

      const socketData: DonationAlertsSocketData = await response.json();
      daUserIdRef.current = String(socketData.id);
      
      connectSocket(socketData.endpoint, socketData.token);
    } catch (error) {
      console.error('[DA Hook] Ошибка подключения:', error);
      setIsInitializing(false);
    }
  }, [isAuthenticated, connectionStatus, isInitializing, connectSocket, setIsAuthenticated]);

  const disconnect = useCallback(() => {
    disconnectSocket();
    setIsInitializing(false);
  }, [disconnectSocket]);

  // Эффект для сброса isInitializing, когда сокет подхватил эстафету
  useEffect(() => {
      if (connectionStatus === 'connecting' || connectionStatus === 'connected') {
          setIsInitializing(false);
      }
  }, [connectionStatus]);

  // --- 5. Возвращаем объединенный статус ---
  // UI будет думать, что мы "подключаемся", если идет запрос к API ИЛИ сокет устанавливает связь
  const isConnecting = isInitializing || connectionStatus === 'connecting';

  return { 
      connectionStatus, 
      isConnecting, // <-- Экспортируем этот новый флаг вместо проверки connectionStatus === 'connecting' снаружи
      connect, 
      disconnect 
  };
};