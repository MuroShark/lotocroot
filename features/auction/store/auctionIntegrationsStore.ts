import { create } from 'zustand';
import type { ConnectionStatus } from '@/shared/types';

type ServiceName = 'donationAlerts' | 'twitch' | 'donatePay';

interface ServiceState {
  connectionStatus: ConnectionStatus;
  isIntegrationEnabled: boolean;
}

interface AuctionIntegrationsState {
  services: Record<ServiceName, ServiceState>;
  setConnectionStatus: (service: ServiceName, status: ConnectionStatus) => void;
  setIsIntegrationEnabled: (service: ServiceName, isEnabled: boolean) => void;
}

export const useAuctionIntegrationsStore = create<AuctionIntegrationsState>((set) => ({
  services: {
    donationAlerts: {
      connectionStatus: 'disconnected',
      isIntegrationEnabled: false,
    },
    twitch: {
      connectionStatus: 'disconnected',
      isIntegrationEnabled: false,
    },
    donatePay: {
      connectionStatus: 'disconnected',
      isIntegrationEnabled: false,
    },
  },

  setConnectionStatus: (service, status) => set((state) => ({
    services: {
      ...state.services,
      [service]: { ...state.services[service], connectionStatus: status },
    },
  })),
  setIsIntegrationEnabled: (service, isEnabled) => set((state) => ({
    services: {
      ...state.services,
      [service]: { ...state.services[service], isIntegrationEnabled: isEnabled },
    },
  })),
}));

// Селекторы
export const selectConnectionStatus = (service: ServiceName) => (state: AuctionIntegrationsState) => state.services[service].connectionStatus;
export const selectIsIntegrationEnabled = (service: ServiceName) => (state: AuctionIntegrationsState) => state.services[service].isIntegrationEnabled;