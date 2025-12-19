import React, { memo, ReactNode } from 'react';

interface AuctionHeaderProps {
  leftSlot: ReactNode;
  centerSlot: ReactNode;
  rightSlot: ReactNode;
}

const AuctionHeaderComponent = ({ leftSlot, centerSlot, rightSlot }: AuctionHeaderProps) => {
  return (
    <header className="relative z-50 flex h-[70px] shrink-0 items-center justify-between border-b border-[#27272a] bg-[rgba(17,17,19,0.75)] px-6 backdrop-blur-md">
      {/* LEFT: Timer */}
      <div className="flex flex-1 items-center justify-start">
        {leftSlot}
      </div>

      {/* CENTER: Bank */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
         {centerSlot}
      </div>

      {/* RIGHT: Integrations */}
      <div className="flex flex-1 items-center justify-end">
         {rightSlot}
      </div>
    </header>
  );
};

export const AuctionHeader = memo(AuctionHeaderComponent);
AuctionHeader.displayName = 'AuctionHeader';