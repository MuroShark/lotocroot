import React from 'react';
import Image from 'next/image';
import { cva } from 'class-variance-authority';
import type { ConnectionStatus } from '@/shared/types';
import { ToggleSwitch } from '@/shared/ui/ToggleSwitch/ToggleSwitch';

const cardCva = cva('flex items-center justify-between rounded-lg');
const contentCva = cva('flex items-center gap-4');
const nameCva = cva('text-base font-medium text-white');

interface IntegrationCardProps {
  iconSrc: string;
  name: string;
  isEnabled: boolean; 
  connectionStatus: ConnectionStatus;
  onToggle: (isEnabled: boolean) => void;
}

export const IntegrationCard: React.FC<IntegrationCardProps> = ({ 
  iconSrc, 
  name, 
  isEnabled, 
  connectionStatus, 
  onToggle 
}) => {
  const isConnecting = connectionStatus === 'connecting';

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    onToggle(e.target.checked);
  };

  return (
    <div className={cardCva()}>
      <div className={contentCva()}>
        <Image 
          src={iconSrc} 
          alt={name} 
          width={28} 
          height={28} 
          className="block h-7 w-7 shrink-0"
        />
        <span className={nameCva()}>{name}</span>
      </div>
      <ToggleSwitch 
        checked={isEnabled} 
        onChange={handleToggle} 
        disabled={isConnecting} 
      />
    </div>
  );
};