import { useEffect, useCallback, useState, useRef } from "react";
import { useToasterStore } from "@/shared/ui/Toast/Toaster";
import { useAuthStore } from "@/entities/auth/model/store/authStore";
import { generateCodeVerifier, generateCodeChallenge } from "@/shared/lib/auth";
import { DONATIONALERTS_SCOPES } from "@/entities/auth/model/constants";

export const useDonationAlertsAuth = (initialIsAuthenticated?: boolean) => {
  const { addToast } = useToasterStore();
  const { isAuthenticated, setIsAuthenticated } = useAuthStore();
  
  // Состояние для спиннера на кнопке перед редиректом
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // НОВОЕ: Состояние для процесса обмена кода на токен (после возврата)
  const [isTokenExchanging, setIsTokenExchanging] = useState(false);
  
  const isHydrated = useRef(false);
  
  const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID;
  const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI;

  useEffect(() => {
    if (initialIsAuthenticated !== undefined && !isHydrated.current) {
      setIsAuthenticated(initialIsAuthenticated);
      isHydrated.current = true;
    }
  }, [initialIsAuthenticated, setIsAuthenticated]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const codeVerifier = localStorage.getItem("code_verifier");

    if (code && codeVerifier) {
      // Сразу включаем режим "Синхронизация"
      setIsTokenExchanging(true);
      
      window.history.replaceState(null, "", window.location.pathname);

      const exchangeToken = async () => {
        if (!REDIRECT_URI) return false;
        try {
          const response = await fetch('/api/auth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, code_verifier: codeVerifier, redirect_uri: REDIRECT_URI }),
          });
          
          if (!response.ok) throw new Error('Token exchange failed');
          return true;
        } catch (error) {
          console.error('Auth error:', error);
          return false;
        }
      };

      (async () => {
        const success = await exchangeToken();
        localStorage.removeItem("code_verifier");
        
        if (success) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
        // Выключаем режим синхронизации, результат получен
        setIsTokenExchanging(false);
      })();
    }
  }, [REDIRECT_URI, setIsAuthenticated]);

  const login = useCallback(async () => {
    if (!(CLIENT_ID && REDIRECT_URI)) return;
    setIsLoggingIn(true);

    try {
      const healthCheckResponse = await fetch('/api/health/donationalerts');
      if (!healthCheckResponse.ok) {
        throw new Error('Сервис DonationAlerts временно недоступен.');
      }

      const codeVerifier = generateCodeVerifier(128);
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      
      localStorage.setItem("code_verifier", codeVerifier);
      const authUrl = `https://www.donationalerts.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI!}&response_type=code&scope=${DONATIONALERTS_SCOPES}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
      
      setTimeout(() => {
        window.location.href = authUrl;
      }, 300);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Произошла неизвестная ошибка';
      console.error('Auth error:', errorMessage);
      addToast({
        message: errorMessage,
      });
      setIsLoggingIn(false);
    }

  }, [CLIENT_ID, REDIRECT_URI, addToast]);
  
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsAuthenticated(false);
    } catch (e) {
      console.error(e);
    }
  }, [setIsAuthenticated]);

  // Возвращаем новое состояние isTokenExchanging
  return { isAuthenticated, login, logout, isLoggingIn, isTokenExchanging };
};