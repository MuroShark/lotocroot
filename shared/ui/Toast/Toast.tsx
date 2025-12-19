"use client";
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

// Добавляем key для возможности принудительного ре-рендера и сброса таймера
export interface ToastProps {
  id: string;
  message: string;
  onDismiss: (id: string) => void;
  renderKey?: number; // Новое свойство для принудительного ре-рендера
  duration?: number;
  // Теперь action может быть одним объектом или массивом
  action?: {
    label: string;
    onClick: () => void;
    keepOpen?: boolean; // Новое свойство
  } | Array<{
    label: string;
    onClick: () => void;
    keepOpen?: boolean; // Новое свойство
  }>;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  message,
  onDismiss,
  duration = 5000,
  action,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id);
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [id, duration, onDismiss]);

  const handleActionClick = (onClick: () => void, keepOpen?: boolean) => {
    onClick();
    if (!keepOpen) {
      onDismiss(id);
    }
  };

  // Приводим action к массиву для удобства рендеринга
  const actions = action
    ? Array.isArray(action)
      ? action
      : [action]
    : [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className="relative flex w-auto min-w-[280px] max-w-[380px] flex-col items-center overflow-hidden rounded-lg border border-[var(--border-color)] bg-[var(--bg-element)] text-sm text-[#e2e8f0] shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
    >
      <div className="flex w-full items-center gap-3 p-3 px-4"> {/* Используем gap-3 из старого кода, в HTML gap: 12px */}
        <div className="flex-grow font-medium text-white">{message}</div>
        {actions.map((act, index) => ( // Передаем keepOpen в обработчик
          <button key={index} onClick={() => handleActionClick(act.onClick, act.keepOpen)} className="cursor-pointer rounded border-none bg-transparent p-1 px-2 text-xs font-semibold text-[var(--primary)] transition-colors hover:bg-[var(--primary-dim)]">
            {act.label}
          </button>
        ))}
        <button onClick={() => onDismiss(id)} className="flex cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-1 text-[var(--text-muted)] transition-colors hover:bg-white/10 hover:text-white">
          <X size={18} />
        </button>
      </div>
      <motion.div
        className="absolute bottom-0 left-0 h-[3px] bg-[var(--primary)]"
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
      />
    </motion.div>
  );
};