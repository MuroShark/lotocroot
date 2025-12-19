"use client";

import React, { useState, useEffect, useRef } from 'react';
import type { Donation } from '@/shared/types';
import { useAuctionViewStore } from '@/features/auction/store/auctionViewStore'; // isDonationDragging используется
import { DonationItemContent, type DonationAction } from './DonationItemContent';

interface DonationListProps {
  donations: Donation[];
  onDonationAction: (donation: Donation, action: DonationAction) => void;
}

const DonationItem = React.memo<({
  donation: Donation;
  onAction: (action: DonationAction) => void;
  isMenuOpen: boolean; 
  onToggleMenu: () => void;
})>(({
  donation,
  onAction,
  isMenuOpen,
  onToggleMenu,
}) => {
  const {
    setDraggedDonation,
    setIsDonationDragging,
    setDragOffset,
    setDraggedDonationSize,
  } = useAuctionViewStore();
  const [isBeingDragged, setIsBeingDragged] = useState(false);
  const dragImageRef = useRef<HTMLImageElement | null>(null);

  // Создаем пустой 1x1px прозрачный PNG для скрытия нативного drag image
  useEffect(() => {
    const img = new Image();
    img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    img.onload = () => {
      dragImageRef.current = img;
    };
  }, []);

  const handleDragStart = (e: React.DragEvent<HTMLLIElement>) => {
    e.dataTransfer.setData('application/json', JSON.stringify(donation));
    // Добавляем 'text/plain' для лучшей совместимости с браузерами (особенно Firefox).
    // В качестве значения можно передать что-то осмысленное, например, ID доната.
    e.dataTransfer.setData('text/plain', donation.id.toString());

    e.dataTransfer.effectAllowed = 'move';

    // Скрываем стандартный drag image браузера
    if (dragImageRef.current) {
      e.dataTransfer.setDragImage(dragImageRef.current, 0, 0);
    }

    // Вычисляем и сохраняем смещение курсора и размер элемента
    const rect = e.currentTarget.getBoundingClientRect();
    const offset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    setDragOffset(offset);
    setDraggedDonationSize({ width: rect.width, height: rect.height });

    setDraggedDonation(donation);
    setIsDonationDragging(true);
    setIsBeingDragged(true);
  };

  // Больше не нужен, позиция отслеживается в DragLayer
  // const handleDrag = (e: React.DragEvent<HTMLLIElement>) => {};

  const handleDragEnd = () => {
    setDraggedDonation(null);
    setIsDonationDragging(false);
    setIsBeingDragged(false);
  };

  // Эффект для предотвращения "запретного" курсора во время перетаскивания
  useEffect(() => {
    if (!isBeingDragged) return;

    const preventDefaultDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'move';
      }
    };

    document.addEventListener('dragover', preventDefaultDragOver);
    return () => document.removeEventListener('dragover', preventDefaultDragOver);
  }, [isBeingDragged]);

  return (
    <li className="relative" draggable="true" onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {/* Плейсхолдер, который виден только во время перетаскивания */}
      {isBeingDragged && (
        <div className="absolute inset-0 box-border rounded-xl border-2 border-dashed border-white/50 bg-white/5" />
      )}

      {/* 
        Оригинальный контент. Во время перетаскивания он становится невидимым, но сохраняет свое место в потоке,
        чтобы предотвратить "прыжок" списка. Плейсхолдер отображается над ним.
      */}
      <div className={`${isBeingDragged ? 'opacity-0' : 'opacity-100 transition-opacity duration-200'}`}>
        <div className={`${isBeingDragged ? 'invisible' : ''}`}>
          <DonationItemContent donation={donation} onAction={onAction} isMenuOpen={isMenuOpen} onToggleMenu={onToggleMenu} />
        </div>
      </div>
    </li>
  );
});

DonationItem.displayName = 'DonationItem';

export const DonationList: React.FC<DonationListProps> = (props) => {
  const { donations } = props;
  const listRef = useRef<HTMLUListElement>(null);
  const [openMenuDonationId, setOpenMenuDonationId] = useState<number | string | null>(null);

  const handleToggleMenu = (donationId: number | string) => {
    setOpenMenuDonationId(prevId => (prevId === donationId ? null : donationId));
  };

  // Хук для закрытия меню при клике вне списка
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Если меню закрыто, ничего не делаем
      if (openMenuDonationId === null) return;

      // Если клик был вне элемента списка, закрываем меню
      if (listRef.current && !listRef.current.contains(event.target as Node)) {
        setOpenMenuDonationId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuDonationId]); // Перезапускаем эффект, если openMenuDonationId изменился

  return (
    <ul ref={listRef} className="flex flex-col gap-[10px]">
      {donations.map((donation) => (
        <DonationItem
          key={donation.id}
          donation={donation}
          onAction={(action) => {
            props.onDonationAction(donation, action);
            setOpenMenuDonationId(null); // Закрываем меню после любого действия
          }}
          isMenuOpen={openMenuDonationId === donation.id}
          onToggleMenu={() => handleToggleMenu(donation.id)}
        />
      ))}
    </ul>
  );
};