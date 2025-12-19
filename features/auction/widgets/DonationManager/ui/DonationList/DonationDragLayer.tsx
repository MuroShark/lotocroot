"use client";

import React, { useEffect, useRef, useMemo } from 'react';
import { useAuctionViewStore } from '@/features/auction/store/auctionViewStore';
import { DonationItemContent } from './DonationItemContent';
import { useShallow } from 'zustand/react/shallow';

export const DonationDragLayer: React.FC = () => {
  // 1. Оптимизация селекторов Zustand (чтобы не рендериться лишний раз при смене других полей)
  const { 
    draggedDonation, 
    isDonationDragging, 
    dragOffset, 
    draggedDonationSize 
  } = useAuctionViewStore(
    useShallow((state) => ({
      draggedDonation: state.draggedDonation,
      isDonationDragging: state.isDonationDragging,
      dragOffset: state.dragOffset,
      draggedDonationSize: state.draggedDonationSize,
    }))
  );

  // 2. Используем ref для прямого доступа к DOM-элементу
  const layerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isDonationDragging || !layerRef.current) {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      return;
    }

    const handleDragOver = (e: DragEvent) => {
      // Предотвращаем дефолтное поведение, чтобы drop вообще был возможен
      e.preventDefault(); 
      e.dataTransfer!.dropEffect = "move";

      // 3. DIRECT DOM MANIPULATION
      // Мы НЕ обновляем стейт React, мы пишем напрямую в стиль элемента.
      // Это работает мгновенно и не вызывает ререндеров React-компонентов.
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      
      requestRef.current = requestAnimationFrame(() => {
        if (layerRef.current) {
          const x = e.clientX - dragOffset.x;
          const y = e.clientY - dragOffset.y;
          // Используем translate3d для включения GPU-ускорения
          layerRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        }
      });
    };

    // Вешаем слушатель на document, так как dragover всплывает
    document.addEventListener('dragover', handleDragOver);

    return () => {
      document.removeEventListener('dragover', handleDragOver);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isDonationDragging, dragOffset]);

  // Стабильные пустые функции, чтобы не ломать React.memo внутри карточки
  const noopAction = useMemo(() => () => {}, []);
  const noopToggle = useMemo(() => () => {}, []);

  if (!isDonationDragging || !draggedDonation) {
    return null;
  }

  return (
    <div 
      ref={layerRef}
      style={{
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: 9999,
        left: 0,
        top: 0,
        width: `${draggedDonationSize.width}px`,
        height: `${draggedDonationSize.height}px`,
        // Начальная позиция может быть за экраном, JS её обновит в первом кадре
        // Но лучше задать initial transform, если есть координаты старта (опционально)
      }}
    >
      <DonationItemContent 
        donation={draggedDonation} 
        onAction={noopAction} 
        isMenuOpen={false} 
        onToggleMenu={noopToggle} 
      />
    </div>
  );
};