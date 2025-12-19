import React, { useState, useRef, useEffect } from 'react';
import { useDonationAlertsAuth } from "@/features/auth/hooks/useDonationAlertsAuth";
import { useDonationAlertsSocket } from '@/features/auction/hooks/useDonationAlertsSocket';
import { useDonatePaySocket } from '@/features/auction/hooks/useDonatePaySocket'; 
import { useAuthStore } from '@/entities/auth/model/store/authStore';
import Image from 'next/image';
import { useAuctionIntegrationsStore } from '@/features/auction/store/auctionIntegrationsStore';
import { useTwitchSocket } from '@/features/auction/hooks/useTwitchSocket';
import { useTwitchAuth } from '@/features/auth/hooks/useTwitchAuth';

// --- Компонент ToggleSwitch ---
const ToggleSwitch = ({ checked, onChange, disabled, isConnecting }: { checked: boolean; onChange: () => void; disabled?: boolean; isConnecting?: boolean }) => {
  return (
    <div 
      onClick={() => !disabled && onChange()}
      className={`
        relative h-6 w-11 cursor-pointer rounded-full transition-colors duration-300 ease-out
        ${checked ? 'bg-[var(--primary)]' : 'bg-[#27272a]'}
        ${disabled || isConnecting ? 'cursor-wait opacity-70' : (!checked && 'group-hover:bg-[#3f3f46]')}
        /* Добавляем пульсацию, если идет соединение или синхронизация токена */
        ${isConnecting ? 'animate-pulse ring-2 ring-[var(--primary)]/50' : ''}
      `}
    >
      <div 
        className={`
          absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow-md transition-transform duration-300 cubic-bezier(0.34, 1.56, 0.64, 1)
          ${checked ? 'translate-x-5' : 'translate-x-0'} 
        `} 
      />
    </div>
  );
};

// --- Интерфейсы и ServiceRow ---
interface ServiceRowProps {
  name: string;
  iconClass?: string;
  iconSrc?: string;
  isAuthorized: boolean;
  isEnabled: boolean;
  isConnecting?: boolean;
  connectingText?: string; // Новый проп для кастомного текста
  isLoggingIn?: boolean;
  isDisabled?: boolean;
  onToggle: () => void;
  onLogin: () => void;
  invertIconOnActive?: boolean;
  brandClasses: {
    bg: string;
    text: string;
    shadow: string;
  }
}

const ServiceRow: React.FC<ServiceRowProps> = ({
  name,
  iconClass,
  iconSrc,
  isAuthorized,
  isEnabled,
  isConnecting,
  connectingText = 'Подключение...', // По умолчанию "Подключение..."
  isLoggingIn,
  isDisabled,
  onToggle,
  onLogin,
  invertIconOnActive = true,
  brandClasses
}) => {
  
  const getStatusText = () => {
    if (isDisabled) return 'В разработке';
    // Используем переданный текст или дефолтный
    if (isConnecting) return connectingText;
    if (!isAuthorized) return 'Требуется вход';
    if (isEnabled) return 'Подключено';
    return 'Отключено';
  };

  const showToggle = isAuthorized || isConnecting;

  return (
    <div className={`
      flex items-center gap-3 py-2.5 select-none group rounded-lg px-3
      transition-colors duration-200 hover:bg-[#1f1f22]
      ${!isAuthorized && !isConnecting ? 'unauthorized' : ''}
      ${isEnabled ? 'active' : ''}
      ${isConnecting ? 'connecting' : ''}
    `}>
      <div 
        className={`
          flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl transition-all duration-300
          text-[#71717a] 
          ${isEnabled ? `${brandClasses.bg} ${brandClasses.shadow}` : 'bg-[#27272a] group-hover:bg-[#333] group-hover:text-white'}
        `}
      >
        {iconSrc ? (
          <Image src={iconSrc} alt={`${name} icon`} width={22} height={22} className={`${isEnabled && invertIconOnActive ? 'brightness-0 invert' : ''} transition-all`}/>
        ) : (
          <i className={iconClass}></i>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-center">
        <span className="text-[13px] font-bold text-[#e4e4e7] leading-tight">{name}</span>
        <span className={`
          text-[11px] font-medium leading-tight mt-0.5 transition-colors duration-200
          ${isConnecting ? 'text-[#f59e0b] animate-pulse' : (isEnabled ? 'text-[#71717a]' : 'text-[#52525b]')}
        `}>
          {getStatusText()}
        </span>
      </div>
      
      {showToggle ? (
        <ToggleSwitch 
          checked={isEnabled} 
          onChange={onToggle} 
          isConnecting={isConnecting}
          disabled={isConnecting || isDisabled}
        />
      ) : (
        <button 
          onClick={onLogin}
          disabled={isLoggingIn || isDisabled}
          className={`
            relative h-7 cursor-pointer rounded border border-[var(--border-color)] bg-transparent px-3 text-[11px] font-bold uppercase tracking-wider text-[var(--primary)] 
            transition-all duration-200 
            hover:border-[var(--primary)] hover:bg-[var(--primary)] hover:text-white hover:shadow-[0_2px_8px_rgba(145,71,255,0.3)]
            ${isDisabled ? 'disabled:cursor-not-allowed disabled:opacity-50' : 'disabled:cursor-wait disabled:opacity-80'}
            ${isLoggingIn ? 'text-transparent' : ''}
          `}
        >
          Войти
          {isLoggingIn && (
             <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
             </span>
          )}
        </button>
      )}
    </div>
  );
};

// --- Основной компонент ---
interface IntegrationsManagerProps {
  onOpenDpWizard: () => void;
  isCompact?: boolean;
}

const IntegrationsManagerComponent: React.FC<IntegrationsManagerProps> = ({ onOpenDpWizard, isCompact = false }) => {
  // DonationAlerts
  const { isAuthenticated, login, isLoggingIn, isTokenExchanging } = useDonationAlertsAuth();
  const { connectionStatus: daStatus, connect: connectDA, disconnect: disconnectDA, isConnecting: isConnectingDA } = useDonationAlertsSocket();

  // DonatePay
  const { isDpAuthenticated } = useAuthStore();
  const { connectionStatus: dpStatus, connect: connectDP, disconnect: disconnectDP, isConnecting: isConnectingDP } = useDonatePaySocket();

  // Twitch
  const { isAuthenticated: isTwitchAuth, login: loginTwitch } = useTwitchAuth();
  const { connect: connectTwitch, disconnect: disconnectTwitch, connectionStatus: twitchStatus } = useTwitchSocket();
  const isEnabledTwitch = useAuctionIntegrationsStore(state => state.services.twitch.isIntegrationEnabled);

  const isEnabledDA = useAuctionIntegrationsStore(state => state.services.donationAlerts.isIntegrationEnabled);
  const isEnabledDP = useAuctionIntegrationsStore(state => state.services.donatePay.isIntegrationEnabled);
  const setIntegrationEnabled = useAuctionIntegrationsStore((state) => state.setIsIntegrationEnabled);

  // --- Эффекты включения ---

  useEffect(() => {
    if (daStatus === 'connected') {
      setIntegrationEnabled('donationAlerts', true);
    } 
  }, [daStatus, setIntegrationEnabled]);

  useEffect(() => {
    if (dpStatus === 'connected') {
      setIntegrationEnabled('donatePay', true);
    }
  }, [dpStatus, setIntegrationEnabled]);

  // --- Handlers ---

  const handleDAToggle = () => {
    if (!isAuthenticated && !isTokenExchanging) return;
    if (isTokenExchanging) return;

    if (isEnabledDA) {
      disconnectDA();
      setIntegrationEnabled('donationAlerts', false);
    } else {
      connectDA();
    }
  };

  const handleDpToggle = () => {
    if (!isDpAuthenticated) return;
    if (isEnabledDP) {
      disconnectDP();
      setIntegrationEnabled('donatePay', false);
    } else {
      connectDP();
    }
  };

  const handleTwitchToggle = () => {
    if (!isTwitchAuth) {
        alert("Сначала войдите в Twitch");
        return;
    }
    if (isEnabledTwitch) {
        disconnectTwitch();
        setIntegrationEnabled('twitch', false);
    } else {
        connectTwitch();
        setIntegrationEnabled('twitch', true);
    }
  };

  // --- UI State ---

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const activeCount = (isEnabledTwitch ? 1 : 0) + (isEnabledDA ? 1 : 0) + (isEnabledDP ? 1 : 0);
  const hasActive = activeCount > 0;

  // DonationAlerts logic
  const isDAVisualConnecting = isConnectingDA || isTokenExchanging;
  const isDAVisualAuthorized = isAuthenticated || isTokenExchanging;
  // Если идет обмен токена - "Синхронизация", если просто подключение сокета - "Подключение"
  const daStatusText = isTokenExchanging ? 'Синхронизация...' : 'Подключение...';

  return (
    <div className="relative z-[100]" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`
          group flex h-10 cursor-pointer items-center gap-2.5 rounded-lg border bg-[#202024] px-3.5 py-2 transition-all duration-200
          ${hasActive 
            ? 'border-[var(--primary)] bg-[rgba(145,71,255,0.08)] text-white' 
            : 'border-[#333] text-[#71717a] hover:border-[#555] hover:text-white'
          }
        `}
      >
        <div className="relative flex items-center justify-center">
          <i className={`ph-fill ph-plugs-connected text-base transition-colors ${hasActive ? 'text-[var(--primary)]' : 'text-inherit'}`}></i>
          <div className={`
             absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[var(--green)] shadow-[0_0_6px_var(--green)] transition-opacity duration-300
             ${hasActive ? 'opacity-100' : 'opacity-0'}
          `} />
        </div>
        
        {!isCompact && <span className="hidden md:inline text-[12px] font-semibold uppercase tracking-wider">Connections</span>}
        
        <span className={`
          flex h-5 min-w-[20px] items-center justify-center rounded px-1.5 font-mono text-[10px] font-bold transition-colors duration-200
          ${hasActive ? 'bg-[var(--primary)] text-white' : 'bg-[#333] text-[#aaa]'}
        `}>
          {activeCount}
        </span>
      </button>

      <div className={`
        absolute right-0 top-[calc(100%+12px)] w-[320px] flex-col rounded-2xl border border-[#27272a] 
        bg-[#121214] shadow-[0_20px_50px_rgba(0,0,0,0.7)] p-2
        transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] origin-top-right
        ${isOpen 
          ? 'visible translate-y-0 opacity-100 scale-100' 
          : 'invisible -translate-y-2 opacity-0 scale-95 pointer-events-none'
        }
      `}>
        <div className="flex flex-col gap-1">
          <ServiceRow 
            name="Twitch"
            iconClass="ph-fill ph-twitch-logo"
            isAuthorized={isTwitchAuth}
            isEnabled={isEnabledTwitch}
            isConnecting={twitchStatus === 'connecting'}
            connectingText="Подключение..."
            onToggle={handleTwitchToggle}
            onLogin={loginTwitch}
            isDisabled={true}
            brandClasses={{
              bg: 'bg-[#a970ff]/15',
              text: 'text-[#a970ff]',
              shadow: 'shadow-[0_0_15px_rgba(169,112,255,0.15)]'
            }}
          />
          <ServiceRow 
            name="DonationAlerts"
            iconSrc="/roulette/donationalerts-icon.svg"
            
            isAuthorized={isDAVisualAuthorized}
            isEnabled={isEnabledDA}
            isConnecting={isDAVisualConnecting}
            connectingText={daStatusText} // Динамический статус
            
            isLoggingIn={isLoggingIn}
            onToggle={handleDAToggle}
            onLogin={login}
            brandClasses={{
              bg: 'bg-[#F57D07]',
              text: 'text-white',
              shadow: 'shadow-[0_0_15px_rgba(245,125,7,0.3)]'
            }}
          />
          <ServiceRow 
            name="DonatePay"
            iconSrc="/roulette/logo-donatepay-mini.svg"
            invertIconOnActive={false}
            isAuthorized={isDpAuthenticated}
            isEnabled={isEnabledDP}
            isConnecting={isConnectingDP}
            connectingText="Подключение..."
            onToggle={handleDpToggle}
            onLogin={() => {
              setIsOpen(false); 
              onOpenDpWizard();
            }}
            brandClasses={{
              bg: 'bg-[#121212]',
              text: 'text-white',
              shadow: 'shadow-none'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export const IntegrationsManager = React.memo(IntegrationsManagerComponent);
IntegrationsManager.displayName = 'IntegrationsManager';