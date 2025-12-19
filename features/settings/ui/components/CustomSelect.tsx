"use client";

import React, { useState, useRef, useEffect } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  className?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (newValue: string) => {
    if (!disabled) {
      onChange(newValue);
      setIsOpen(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          bg-[#202024] border border-[#333] text-white px-3 h-9 rounded-md text-[13px] 
          flex items-center justify-between transition-colors select-none
          ${!disabled ? 'cursor-pointer hover:border-[#3f3f46]' : ''}
          ${isOpen ? 'border-[#9147ff]' : ''}
        `}
      >
        <span className="truncate mr-2">{selectedOption?.label || value}</span>
        <i className={`ph-bold ph-caret-down transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} text-[#71717a]`} />
      </div>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 w-full mt-1 bg-[#18181b] border border-[#333] rounded-md shadow-xl z-50 overflow-hidden animate-fade-slide">
          <div className="max-h-[200px] overflow-y-auto customScrollbar">
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`
                  px-3 py-2 text-[13px] transition-colors cursor-pointer select-none
                  ${option.value === value ? 'bg-[#9147ff]/10 text-[#9147ff]' : 'text-[#e4e4e7] hover:bg-white/5'}
                `}
              >
                {option.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
