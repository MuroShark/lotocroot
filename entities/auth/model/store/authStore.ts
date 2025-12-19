import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Region } from '@/features/settings/ui/components/DonatePayWizardModal';

interface AuthState {
  // --- DonationAlerts ---
  isAuthenticated: boolean;
  setIsAuthenticated: (status: boolean) => void;

  // --- DonatePay ---
  isDpAuthenticated: boolean;
  dpApiKey: string | null;
  dpRegion: Region | null;
  setDpAuth: (status: boolean, apiKey: string | null, region: Region | null) => void;

  // --- Twitch ---
  isTwitchAuthenticated: boolean;
  twitchAccessToken: string | null;
  twitchRefreshToken: string | null; // Токен для обновления сессии
  twitchUserId: string | null;
  
  /**
   * Устанавливает данные авторизации Twitch.
   * При выходе (logout) передавайте (false, null, null, null).
   */
  setTwitchAuth: (
    status: boolean, 
    token: string | null, 
    refreshToken: string | null, 
    userId: string | null
  ) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // --- DonationAlerts ---
      isAuthenticated: false,
      setIsAuthenticated: (status) => set({ isAuthenticated: status }),

      // --- DonatePay ---
      isDpAuthenticated: false,
      dpApiKey: null,
      dpRegion: null,
      setDpAuth: (status, apiKey, region) => set({ 
        isDpAuthenticated: status, dpApiKey: apiKey, dpRegion: region 
      }),

      // --- Twitch ---
      isTwitchAuthenticated: false,
      twitchAccessToken: null,
      twitchRefreshToken: null,
      twitchUserId: null,
      
      setTwitchAuth: (status, token, refreshToken, userId) => set({ 
        isTwitchAuthenticated: status, 
        twitchAccessToken: token, 
        twitchRefreshToken: refreshToken,
        twitchUserId: userId 
      }),
    }),
    {
      name: 'rouletta-auth-state', // Ключ в localStorage
    }
  )
);