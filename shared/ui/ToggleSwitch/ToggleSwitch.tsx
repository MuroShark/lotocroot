import React, { useState, useEffect } from 'react';
import { cva } from 'class-variance-authority';

const toggleSwitchSlider = cva(
  [
    'absolute inset-0 rounded-[24px] transition-all duration-400',
    "before:absolute before:content-[''] before:h-[20px] before:w-[20px] before:left-[2px] before:bottom-[2px] before:rounded-full before:transition-all before:duration-400",
  ],
  {
    variants: {
      checked: {
        true: 'bg-blue-600 before:bg-white before:translate-x-[20px]',
        false: 'bg-[#4d4d4d] before:bg-[#ccc]',
      },
      disabled: {
        true: '', // Дополнительные стили для disabled применяются через compoundVariants
      },
    },
    compoundVariants: [
      {
        checked: true,
        disabled: true,
        className: 'bg-[#1a1a1a]',
      },
    ],
    defaultVariants: {
      checked: false,
    },
  },
);

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  className?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, disabled = false, className = '' }) => {
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Этот эффект отслеживает изменения `disabled` от родителя (например, `isConnecting`).
  // Если родитель переводит переключатель в состояние disabled, мы сбрасываем наше внутреннее состояние `isTransitioning`.
  useEffect(() => {
    if (disabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsTransitioning(false);
    }
  }, [disabled]);

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isTransitioning || disabled) return;

    setIsTransitioning(true);
    onChange(e);

    setTimeout(() => {
      setIsTransitioning(false);
    }, 400); // Задержка соответствует времени анимации в CSS
  };

  // Переключатель находится в состоянии загрузки, если он в процессе внутренней анимации
  // ИЛИ если он заблокирован извне (например, во время подключения).
  const isLoading = isTransitioning || disabled;

  return (
    <label
      className={`relative inline-block h-[24px] w-[44px] ${isLoading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'} ${className}`}
    >
      <input type="checkbox" checked={checked} onChange={handleOnChange} disabled={isLoading} className="h-0 w-0 opacity-0" />
      <span className={toggleSwitchSlider({ checked, disabled })}></span>
    </label>
  );
};