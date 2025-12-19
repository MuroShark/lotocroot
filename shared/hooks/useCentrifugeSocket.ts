import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConnectionStatus } from '@/shared/types';

interface UseCentrifugeSocketProps {
  onMessage?: (message: unknown) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: () => void;
}

export const useCentrifugeSocket = ({
  onMessage,
  onConnect,
  onDisconnect,
  onError
}: UseCentrifugeSocketProps = {}) => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messageIdRef = useRef(1);

  const connectionParamsRef = useRef<{ endpoint: string; token: string } | null>(null);
  
  // Храним колбэки в ref, чтобы их изменения не триггерили эффекты
  const callbacksRef = useRef({ onMessage, onConnect, onDisconnect, onError });

  // Ref для функции connect, чтобы мы могли вызывать её внутри самой себя (для реконнекта)
  const connectRef = useRef<(endpoint: string, token: string) => void>(() => {});
  
  useEffect(() => {
    callbacksRef.current = { onMessage, onConnect, onDisconnect, onError };
  }, [onMessage, onConnect, onDisconnect, onError]);

  // === Логика PING (Method: 7) ===
  const startPing = useCallback((ws: WebSocket) => {
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

    pingIntervalRef.current = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        // ИСПРАВЛЕНО: Возвращаем формат, который принимает DonationAlerts
        const pingMessage = {
          id: messageIdRef.current++,
          method: 7, // Специфичный метод пинга для этой версии сервера
          params: {}
        };
        ws.send(JSON.stringify(pingMessage));
      }
    }, 25000);
  }, []);

  const stopPing = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  // === Управление подключением ===
  const connect = useCallback((endpoint: string, token: string) => {
    // Предотвращаем дублирующиеся подключения
    if (status === 'connected' || status === 'connecting') {
        if (socketRef.current?.readyState === WebSocket.OPEN || socketRef.current?.readyState === WebSocket.CONNECTING) {
            return;
        }
    }

    connectionParamsRef.current = { endpoint, token };
    setStatus('connecting');

    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    if (socketRef.current) {
      socketRef.current.close();
    }

    const ws = new WebSocket(endpoint);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('[Centrifuge] Connection opened');
      
      // Отправляем Auth пакет сразу при открытии
      const authMessage = {
        params: { token },
        id: messageIdRef.current++,
      };
      ws.send(JSON.stringify(authMessage));
      
      // Запускаем пинг
      startPing(ws);
    };

    ws.onmessage = (event) => {
      const messages = event.data.split('\n');
      
      for (const rawMessage of messages) {
        if (!rawMessage.trim()) continue;
        
        try {
          const message = JSON.parse(rawMessage);

          // Логика успешного подключения: пришел ответ с client ID
          if (message.result?.client) {
             setStatus('connected');
             callbacksRef.current.onConnect?.();
          }

          callbacksRef.current.onMessage?.(message);
        } catch (e) {
          // Теперь сюда мы будем попадать гораздо реже
          console.error('[Centrifuge] JSON Parse error', e, 'Raw message:', rawMessage);
        }
      }
    };

    ws.onclose = (event) => {
      console.log('[Centrifuge] Closed', event.code, event.reason);
      stopPing();
      socketRef.current = null;

      // Если закрытие произошло не по инициативе пользователя (код 1000)
      if (event.code !== 1000) {
        setStatus('error');
        callbacksRef.current.onError?.();
        
        // Вычисляем задержку с джиттером (случайным разбросом)
        const timeout = Math.min(30000, Math.random() * 5000 + 2000);
        console.log(`[Centrifuge] Reconnecting in ${timeout}ms...`);
        
        reconnectTimerRef.current = setTimeout(() => {
          if (connectionParamsRef.current) {
            // Вызываем connect через Ref, чтобы избежать ошибки "accessed before initialization"
            connectRef.current(connectionParamsRef.current.endpoint, connectionParamsRef.current.token);
          }
        }, timeout);
      } else {
        setStatus('disconnected');
        callbacksRef.current.onDisconnect?.();
      }
    };

    ws.onerror = (error) => {
      console.error('[Centrifuge] WebSocket Error', error);
      // onclose сработает следом, реконнект обрабатываем там
    };
  }, [status, startPing, stopPing]); 

  // Обновляем Ref текущей версией функции connect
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const disconnect = useCallback(() => {
    connectionParamsRef.current = null; // Сбрасываем параметры, чтобы отменить реконнект
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    stopPing();
    
    if (socketRef.current) {
      socketRef.current.close(1000, 'User disconnected');
      socketRef.current = null;
    }
    setStatus('disconnected');
  }, [stopPing]);

  const send = useCallback((data: unknown) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
    } else {
      console.warn('[Centrifuge] Cannot send, socket not open');
    }
  }, []);

  // Очистка при размонтировании компонента
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { status, connect, disconnect, send };
};