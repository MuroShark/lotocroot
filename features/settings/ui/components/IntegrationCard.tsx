import React from 'react';
import Image from 'next/image';

export type IntegrationType = 'twitch' | 'da' | 'dp';

interface IntegrationCardProps {
  name: string;
  status: string;
  type: IntegrationType;
  iconSrc?: string;
  connected?: boolean;
  isLoggingIn?: boolean;
  hasError?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

const THEMES: Record<IntegrationType, { icon: string; color: string; bg: string }> = {
  twitch: { 
    icon: 'ph-twitch-logo', 
    color: 'text-[#a970ff]', 
    bg: 'bg-[#a970ff]/10' 
  },
  da: { 
    icon: 'ph-currency-dollar', 
    color: 'text-[#F57D07]', 
    bg: 'bg-[#F57D07]/10' 
  },
  dp: { 
    icon: 'ph-wallet', 
    color: 'text-[#44AB4F]', 
    bg: 'bg-[#44AB4F]/10' 
  }
};

export const IntegrationCard: React.FC<IntegrationCardProps> = ({ 
  name, 
  status, 
  type, 
  iconSrc,
  connected,
  hasError,
  isLoggingIn,
  onConnect,
  onDisconnect
}) => {
  const theme = THEMES[type];

  return (
    <div className={`
      h-[70px] border rounded-lg p-3 flex items-center gap-3 transition-colors group/card
      ${
        hasError ? 'border-red-500/40 bg-red-500/5' :
        connected 
        ? 'border-[#9147ff]/30 bg-[#9147ff]/5'
        : 'border-[#27272a] bg-white/5 hover:bg-white/10 hover:border-[#444]'
      }
    `}>
      {/* Иконка */}
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 transition-colors ${theme.color} ${
        connected && type === 'dp' 
          ? 'bg-[#121212]' 
          : `${theme.bg}`
      }`}>
        {iconSrc ? (
          <Image src={iconSrc} alt={`${name} icon`} width={24} height={24} />
        ) : (
          <i className={`ph-fill ${theme.icon}`}></i>
        )}
      </div>

      {/* Инфо */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <span className="font-bold text-[13px] text-white truncate">{name}</span>
        <div className={`flex items-center gap-1 text-[10px] ${
          hasError ? 'text-red-400' : 'text-[#71717a]'
        }`}>
          {hasError && <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" />}
          {connected && <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] shadow-[0_0_6px_#10b981]" />}
          <span className="truncate">{status}</span>
        </div>
      </div>

      {/* Кнопка действия */}
      <button 
        onClick={connected ? onDisconnect : onConnect} 
        disabled={isLoggingIn}
        // Добавлен cursor-pointer
        className={`
          relative px-2 py-1 rounded border text-[10px] font-semibold transition-colors cursor-pointer group
          ${hasError
            ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' :
            connected 
            ? 'border-[#27272a] text-[#71717a] hover:text-[#ef4444] hover:border-[#ef4444]/50'
            : `border-[#333] text-[#e4e4e7] hover:bg-[#333] ${!isLoggingIn && 'hover:text-white'}`
          }
          disabled:cursor-wait disabled:opacity-70
          ${isLoggingIn ? 'text-transparent' : ''}
        `}
      >
        {connected ? 'Отключить' : 'Подключить'}
        {isLoggingIn && !hasError && (
           <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <span className="block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
           </span>
        )}
      </button>
    </div>
  );
};