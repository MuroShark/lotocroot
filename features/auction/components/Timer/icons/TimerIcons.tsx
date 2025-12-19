import React from 'react';

export type TimerIconProps = { className?: string; };

export const PlayIcon = React.memo(({ className }: TimerIconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 'var(--icon-size)', height: 'var(--icon-size)' }}>
    <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
  </svg>
));
PlayIcon.displayName = 'PlayIcon';

export const PauseIcon = React.memo(({ className }: TimerIconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 'var(--icon-size)', height: 'var(--icon-size)' }}>
    <path d="M6 19H10V5H6V19ZM14 5V19H18V5H14Z" fill="currentColor"/>
  </svg>
));
PauseIcon.displayName = 'PauseIcon';

export const RestartIcon = React.memo(({ className }: TimerIconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ width: 'var(--icon-size)', height: 'var(--icon-size)' }}>
    <path d="M12 5V1L7 6L12 11V7C15.31 7 18 9.69 18 13C18 16.31 15.31 19 12 19C8.69 19 6 16.31 6 13H4C4 17.42 7.58 21 12 21C16.42 21 20 17.42 20 13C20 8.58 16.42 5 12 5Z"/>
  </svg>
));
RestartIcon.displayName = 'RestartIcon';

export const ArrowUpIcon = React.memo(({ className }: TimerIconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 'var(--icon-size)', height: 'var(--icon-size)' }}>
    <path d="M7.41 15.41L12 10.83L16.59 15.41L18 14L12 8L6 14L7.41 15.41Z" fill="currentColor"/>
  </svg>
));
ArrowUpIcon.displayName = 'ArrowUpIcon';

export const ArrowDownIcon = React.memo(({ className }: TimerIconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 'var(--icon-size)', height: 'var(--icon-size)' }}>
    <path d="M7.41 8.59L12 13.17L16.59 8.59L18 10L12 16L6 10L7.41 8.59Z" fill="currentColor"/>
  </svg>
));
ArrowDownIcon.displayName = 'ArrowDownIcon';

export const PlusTwoIcon = React.memo(({ className }: TimerIconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ width: 'var(--icon-size)', height: 'var(--icon-size)' }} preserveAspectRatio="xMidYMid meet">
        <text 
            x="50%" 
            y="50%" 
            dominantBaseline="middle" 
            textAnchor="middle"
            fontWeight="bold"
            fontSize="18"
        >
            +2
        </text>
    </svg>
));
PlusTwoIcon.displayName = 'PlusTwoIcon';
