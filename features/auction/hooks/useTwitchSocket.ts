'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLotsStore } from '@/entities/lot/model/store/lotsStore';
import { useDonationsStore } from '@/entities/donation/model/store/donationsStore';
import { findBestLotMatch, AUTOMATIC_ASSIGN_THRESHOLD } from '../utils/findBestLotMatch';
import { useAuthStore } from '@/entities/auth/model/store/authStore';

// Прод URL по умолчанию
const PROD_WS_URL = 'wss://eventsub.wss.twitch.tv/ws';

export const useTwitchSocket = () => {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  
  const lots = useLotsStore(state => state.lots);
  const lotsRef = useRef(lots);
  const updateLotAmount = useLotsStore(state => state.updateLotAmount);
  const addDonation = useDonationsStore(state => state.addDonation);
  
  // Достаем Client ID (нужен для запроса) и Токен
  const { twitchAccessToken, twitchUserId } = useAuthStore(); 
  const CLIENT_ID = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;

  useEffect(() => { lotsRef.current = lots; }, [lots]);

  // --- Функция создания подписки ---
  const createSubscription = useCallback(async (sessionId: string) => {
    // Если мы на локалхосте (CLI), подписка не нужна (мы делаем trigger руками)
    // Но если у вас реальный токен, мы пробуем подписаться
    if (!twitchAccessToken || !twitchUserId || !CLIENT_ID) return;

    try {
      console.log('[Twitch] Creating subscription for session:', sessionId);
      
      const response = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${twitchAccessToken}`,
          'Client-Id': CLIENT_ID,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'channel.channel_points_custom_reward_redemption.add',
          version: '1',
          condition: {
            broadcaster_user_id: twitchUserId, // ID пользователя, на которого подписываемся
          },
          transport: {
            method: 'websocket',
            session_id: sessionId, // ID сокета, куда слать данные
          },
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        // 409 Conflict означает, что такая подписка уже есть (это норм)
        if (response.status !== 409) {
             console.error('[Twitch] Sub Error:', err);
        }
      } else {
        console.log('[Twitch] Subscribed successfully! ✅');
      }
    } catch (e) {
      console.error('[Twitch] Subscription fetch failed:', e);
    }
  }, [twitchAccessToken, twitchUserId, CLIENT_ID]);


  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMessage = useCallback((data: any) => {
    const messageType = data.metadata?.message_type;

    // 1. ПРИВЕТСТВИЕ (Тут мы получаем ID и подписываемся)
    if (messageType === 'session_welcome') {
      const sessionId = data.payload.session.id;
      console.log('[Twitch] Session ID:', sessionId);
      
      // Вызываем подписку!
      createSubscription(sessionId);
      
      setStatus('connected');
    }

    // 2. УВЕДОМЛЕНИЕ (Сам донат)
    if (messageType === 'notification') {
      const event = data.payload.event;
      if (data.metadata.subscription_type === 'channel.channel_points_custom_reward_redemption.add') {
          console.log('[Twitch] Reward redeemed:', event);
          
          const rewardTitle = event.reward.title;
          const userInput = event.user_input || '';
          const userName = event.user_name;
          const cost = event.reward.cost; // Сумма в баллах

          const fullMessage = `${rewardTitle} ${userInput}`.trim();

          const { bestMatch, similarity } = findBestLotMatch(fullMessage, lotsRef.current);

          if (bestMatch && similarity >= AUTOMATIC_ASSIGN_THRESHOLD) {
             updateLotAmount(bestMatch.id, cost);
          } else {
             addDonation({
                 id: Date.now() + Math.random(), // Уникальный ID
                 username: userName,
                 message: fullMessage,
                 amount: cost,
                 currency: 'PTS',
                 createdAt: new Date().toISOString(),
                 platform: 'twitch'
             });
          }
      }
    }
  }, [addDonation, updateLotAmount, createSubscription]);

  const connect = useCallback(() => {
    if (wsRef.current) return;
    
    // Определяем URL: Если есть токен -> Прод, иначе -> CLI
    const url = twitchAccessToken ? PROD_WS_URL : (process.env.NEXT_PUBLIC_TWITCH_WS_URL || 'ws://localhost:8080/ws');
    
    setStatus('connecting');

    try {
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('[Twitch] Connected to', url);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            handleMessage(data);
          } catch (e) { console.error(e); }
        };

        ws.onclose = () => {
          console.log('[Twitch] Disconnected');
          setStatus('disconnected');
          wsRef.current = null;
        };
    } catch (e) {
        console.error(e);
        setStatus('disconnected');
    }
  }, [handleMessage, twitchAccessToken]);

  const disconnect = useCallback(() => {
    if (wsRef.current) wsRef.current.close();
  }, []);

  return { connect, disconnect, connectionStatus: status };
};