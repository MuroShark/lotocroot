"use client";

import React, { useState, useCallback } from 'react';
import { Button } from '@/shared/ui/Button/Button';
import { DevDonationPanel } from './DevDonationPanel';
import { BugBeetle } from '@phosphor-icons/react';

export const DevDonationController: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = useCallback(() => setIsOpen(true), []);
  const handleClose = useCallback(() => setIsOpen(false), []);

  // В продакшене компонент не рендерится
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      <Button variant="ghost" size="icon" onClick={handleOpen} title="Эмулятор донатов">
        <BugBeetle weight="bold" className="text-lg text-[#ff6b6b] transition-colors hover:text-white" />
      </Button>
      <DevDonationPanel 
        isOpen={isOpen}
        onClose={handleClose}
      />
    </>
  );
};