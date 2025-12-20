"use client";

import { AuctionView } from '@/features/auction/components/AuctionView/AuctionView';

export default function HomePage() {
  // Теперь AuctionView сам управляет состоянием аутентификации на клиенте.
  return (
    <AuctionView />
  );
}