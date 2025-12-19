"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/entities/auth/model/store/authStore";

// Scope: чтение наград за баллы канала
const TWITCH_SCOPES = "channel:read:redemptions channel:manage:redemptions"; 

export const useTwitchAuth = () => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { isTwitchAuthenticated, setTwitchAuth } = useAuthStore();
  
  // Переменные окружения
  const CLIENT_ID = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;
  const REDIRECT_URI = process.env.NEXT_PUBLIC_TWITCH_REDIRECT_URI; // http://localhost:3000/api/auth/twitch/callback

  // --- Эффект для перехвата токенов после редиректа ---
  useEffect(() => {
    // Наш route.ts возвращает нас на главную с параметрами: 
    // /?twitch_token=...&twitch_refresh_token=...&twitch_user_id=...
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const token = params.get('twitch_token');
    const refreshToken = params.get('twitch_refresh_token');
    const userId = params.get('twitch_user_id');

    // Если нашли токен и ID пользователя — сохраняем
    if (token && userId) {
      setTwitchAuth(true, token, refreshToken || null, userId);
      
      // Очищаем адресную строку браузера от токенов, чтобы было красиво и безопасно
      const newUrl = window.location.pathname;
      window.history.replaceState(null, '', newUrl);
      
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoggingIn(false);
    }
  }, [setTwitchAuth]);

  // --- Функция Входа ---
  const login = useCallback(() => {
    if (!CLIENT_ID || !REDIRECT_URI) {
        console.error("Twitch Env variables missing (CLIENT_ID or REDIRECT_URI)");
        return;
    }
    setIsLoggingIn(true);
    
    // ВАЖНО: response_type=code означает, что мы просим код авторизации,
    // который наш серверный route.ts обменяет на токены (включая refresh_token).
    const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${TWITCH_SCOPES}`;
    
    window.location.href = authUrl;
  }, [CLIENT_ID, REDIRECT_URI]);

  // --- Функция Выхода ---
  const logout = useCallback(() => {
     // Сбрасываем все поля Twitch в null
     setTwitchAuth(false, null, null, null);
     setIsLoggingIn(false);
  }, [setTwitchAuth]);

  return { isAuthenticated: isTwitchAuthenticated, login, logout, isLoggingIn };
};