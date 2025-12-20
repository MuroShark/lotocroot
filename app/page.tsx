"use client";

import dynamic from 'next/dynamic';

// Отключаем SSR для основного компонента, так как он зависит от localStorage (zustand persist)
const AuctionView = dynamic(
  () => import('@/features/auction/components/AuctionView/AuctionView').then((mod) => mod.AuctionView),
  { ssr: false }
);

export default function HomePage() {
  return (
    <AuctionView />
  );
}