'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/entities/auth/model/store/authStore';
import { useLotsStore } from '@/entities/lot/model/store/lotsStore';
import { useDonationsStore } from '@/entities/donation/model/store/donationsStore';
import { findBestLotMatch, AUTOMATIC_ASSIGN_THRESHOLD } from '../utils/findBestLotMatch';
import type { ConnectionStatus, Donation } from '@/shared/types';

interface SocketMessage {
  id?: number;
  error?: string | object;
  result?: {
    client?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any;
  };
}

export const useDonatePaySocket = () => {
  // State & Store
  const lots = useLotsStore((state) => state.lots);
  const updateLotAmount = useLotsStore((state) => state.updateLotAmount);
  const addDonation = useDonationsStore((state) => state.addDonation);
  const { dpApiKey, dpRegion } = useAuthStore();

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [isInitializing, setIsInitializing] = useState(false);

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lotsRef = useRef(lots);
  
  // Храним функцию подключения в рефе
  const publicConnectRef = useRef<((forceRefresh?: boolean) => Promise<void>) | null>(null);
  
  const lastConnectAttemptRef = useRef<number>(0);

  const authRef = useRef({ apiKey: dpApiKey, region: dpRegion });

  const sessionRef = useRef({
    channel: '',
    token: '',      
    userId: '',     
    endpoint: '',   
    clientId: '',   
  });

  // Синхронизация Ref
  useEffect(() => {
    lotsRef.current = lots;
  }, [lots]);

  useEffect(() => {
    authRef.current = { apiKey: dpApiKey, region: dpRegion };
  }, [dpApiKey, dpRegion]);

  // Обработка входящего доната (без изменений)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDonation = useCallback((rawResult: any) => {
    try {
      let realData = rawResult.data?.data || rawResult.data || rawResult;

      if (typeof realData === 'string') {
        try { realData = JSON.parse(realData); } catch {}
      }

      const notification = realData?.notification;
      
      if (notification && notification.type === 'donation') {
        const vars = notification.vars || {};
        console.log('[DonatePay] 💰 New donation:', vars);

        const newDonation: Donation = {
          id: Date.now(),
          username: vars.name || 'Аноним',
          message: vars.comment || '',
          amount: Number(vars.sum || 0),
          currency: vars.currency || 'RUB',
          createdAt: new Date().toISOString(),
          platform: 'donatepay',
        };

        const { bestMatch, similarity } = findBestLotMatch(newDonation.message, lotsRef.current);

        if (bestMatch && similarity >= AUTOMATIC_ASSIGN_THRESHOLD) {
          updateLotAmount(bestMatch.id, Math.round(newDonation.amount));
        } else {
          addDonation(newDonation);
        }
      }
    } catch (e) {
      console.error('[DonatePay] Error processing message:', e);
    }
  }, [addDonation, updateLotAmount]);

  // Получение токена канала и отправка подписки (без изменений)
  const subscribeToChannel = useCallback(async (clientId: string) => {
    try {
      const { apiKey, region } = authRef.current;
      if (!apiKey || !region) return;

      const response = await fetch('/api/auth/donatepay/socket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          apiKey, 
          region, 
          type: 'channel_token',
          channel: sessionRef.current.channel,
          client: clientId
        }),
      });

      if (!response.ok) {
        throw new Error(`Channel token fetch failed: ${response.status}`);
      }
      
      const { token: channelToken } = await response.json();

      if (wsRef.current?.readyState === WebSocket.OPEN) {
         const subMsg = {
          method: 1,
          params: { 
            channel: sessionRef.current.channel, 
            token: channelToken 
          },
          id: 2
        };
        wsRef.current.send(JSON.stringify(subMsg));
      }

    } catch (e) {
      console.error('[DonatePay] Subscribe failed:', e);
      if (wsRef.current) wsRef.current.close(); 
    }
  }, []);

  // --- Основная логика подключения к WebSocket ---

  const connectWebSocket = useCallback((endpoint: string, socketToken: string, userId: string) => {
    // Очистка перед новым подключением
    if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
        // Убираем обработчики, чтобы старый сокет не триггерил onclose при закрытии
        wsRef.current.onclose = null; 
        wsRef.current.close();
    }

    console.log(`[DonatePay] Connecting to WS...`);
    
    sessionRef.current.token = socketToken;
    sessionRef.current.endpoint = endpoint;
    sessionRef.current.userId = userId;
    sessionRef.current.channel = `$public:${userId}`;

    const ws = new WebSocket(endpoint);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[DonatePay] Connection opened. Authenticating...');
      const authMsg = {
        params: { token: socketToken },
        id: 1
      };
      ws.send(JSON.stringify(authMsg));
    };

    ws.onmessage = (event) => {
      const raw = event.data.toString();
      if (raw === '{}') return;

      try {
        const msg: SocketMessage = JSON.parse(raw);

        if (msg.id === 1) {
          if (msg.result?.client) {
            const clientId = msg.result.client;
            console.log(`[DonatePay] Authorized. Client ID: ${clientId}`);
            sessionRef.current.clientId = clientId;
            setConnectionStatus('connected');
            setIsInitializing(false);
            subscribeToChannel(clientId);
          } else {
             console.error('[DonatePay] Auth failed (Token invalid):', msg.error);
             sessionRef.current.token = ''; 
             ws.close(4001, 'AuthFailed'); 
          }
        }
        else if (msg.id === 2) {
          if (!msg.error) {
             console.log(`[DonatePay] Subscribed to ${sessionRef.current.channel}`);
          } else {
             console.error('[DonatePay] Sub Error:', msg.error);
          }
        }
        else if (!msg.id && msg.result) {
          handleDonation(msg.result);
        }

      } catch (e) {
        // ignore
      }
    };

    ws.onclose = (e) => {
      console.log(`[DonatePay] Closed: ${e.code} (Reason: ${e.reason})`);
      wsRef.current = null;

      // ЛОГИКА ИСПРАВЛЕНИЯ:
      // Если это нормальное закрытие пользователем (1000) или компонентом -> ставим disconnected
      if (e.code === 1000) {
          setConnectionStatus('disconnected');
          setIsInitializing(false);
          return;
      }

      // Если это ошибка/разрыв -> мы БУДЕМ пытаться переподключиться.
      // Важно оставить статус 'connecting' (или вернуть его), чтобы UI показывал лоадер/пульсацию
      // и не давал пользователю нажать кнопку "Подключить" повторно.
      if (authRef.current.apiKey) {
         setConnectionStatus('connecting'); // <--- ДЕРЖИМ СТАТУС CONNECTING
         setIsInitializing(true); // Показываем, что процесс идет
         
         const isAuthError = e.code === 4001;
         const timeout = Math.random() * 2000 + 3000; // 3-5 сек
         
         console.log(`[DonatePay] Reconnecting in ${Math.round(timeout)}ms... (Force refresh: ${isAuthError})`);
         
         reconnectTimeoutRef.current = setTimeout(() => {
            publicConnectRef.current?.(isAuthError); 
         }, timeout);
      } else {
          // Если нет ключа API, реконнект невозможен
          setConnectionStatus('disconnected');
          setIsInitializing(false);
      }
    };

    ws.onerror = () => {
       // Ошибки сокета обрабатываются в onclose
    };

  }, [handleDonation, subscribeToChannel]);

  // --- Публичные методы ---

  const publicConnect = useCallback(async (forceRefresh = false) => {
    const { apiKey, region } = authRef.current;
    
    // Очистка таймеров
    if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
    }

    // Проверки статуса
    if (connectionStatus === 'connected' && !forceRefresh) return;
    if (isInitializing && !forceRefresh) return;
    if (!apiKey) return;

    // Debounce
    const now = Date.now();
    const timeSinceLastAttempt = now - lastConnectAttemptRef.current;
    const MIN_DELAY = 1000;

    if (timeSinceLastAttempt < MIN_DELAY && !forceRefresh) {
      console.warn(`[DonatePay] Throttled. Wait ${MIN_DELAY - timeSinceLastAttempt}ms`);
      return;
    }
    lastConnectAttemptRef.current = now;

    try {
      setIsInitializing(true);
      setConnectionStatus('connecting');

      // 1. Пытаемся использовать кэш
      if (!forceRefresh && sessionRef.current.token && sessionRef.current.userId) {
        console.log('[DonatePay] Using cached configuration (Skipping API call)');
        connectWebSocket(
          sessionRef.current.endpoint || 'wss://centrifugo.donatepay.ru:443/connection/websocket', 
          sessionRef.current.token, 
          sessionRef.current.userId
        );
        return;
      }

      // 2. Запрос к API
      console.log('[DonatePay] Fetching new configuration...');
      
      // ВАЖНО: Передаем userId из сессии, если он там есть (даже если токен протух)
      const cachedUserId = sessionRef.current.userId;

      const response = await fetch('/api/auth/donatepay/socket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          apiKey, 
          region, 
          type: 'config',
          userId: cachedUserId || undefined // <--- Передаем ID серверу
        }),
      });

      if (!response.ok) {
        let errorMsg = 'Config fetch failed';
        try {
            const errJson = await response.json();
            if (errJson.error) errorMsg = errJson.error;
        } catch {}
        
        throw new Error(`${errorMsg} (Status: ${response.status})`);
      }

      const { endpoint, token, userId } = await response.json();
      
      // Сохраняем полученные данные (особенно ID на случай следующего реконнекта)
      sessionRef.current.userId = userId;
      
      connectWebSocket(endpoint, token, userId);

    } catch (error) {
      console.error('[DonatePay] Init failed:', error);
      
      setConnectionStatus('connecting');
      setIsInitializing(true);
      
      reconnectTimeoutRef.current = setTimeout(() => publicConnect(true), 5000);
    }
  }, [connectionStatus, isInitializing, connectWebSocket]);

  useEffect(() => {
    publicConnectRef.current = publicConnect;
  }, [publicConnect]);

  const disconnect = useCallback(() => {
    // При ручном отключении обязательно чистим таймеры
    if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnect'); 
      wsRef.current = null;
    }
    setConnectionStatus('disconnected');
    setIsInitializing(false);
  }, []);

  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close(1000, 'Component unmount');
    };
  }, []);

  return {
    connect: () => publicConnect(false),
    disconnect,
    connectionStatus,
    isConnecting: isInitializing || connectionStatus === 'connecting'
  };
};