import React, { memo, ReactNode } from 'react';

interface AuctionHeaderProps {
  leftSlot: ReactNode;
  centerSlot: ReactNode;
  rightSlot: ReactNode;
}

const AuctionHeaderComponent = ({ leftSlot, centerSlot, rightSlot }: AuctionHeaderProps) => {
  return (
    <header className="relative z-50 grid grid-cols-[auto_1fr_auto] gap-4 h-[70px] shrink-0 items-center border-b border-[#27272a] bg-[rgba(17,17,19,0.75)] px-6 backdrop-blur-md">
      {/* LEFT: Timer */}
      <div className="flex items-center justify-start">
        {leftSlot}
      </div>

      {/* CENTER: Bank */}
      <div className="flex items-center justify-center">
         {centerSlot}
      </div>

      {/* RIGHT: Integrations */}
      <div className="flex items-center justify-end">
         {rightSlot}
      </div>
    </header>
  );
};

export const AuctionHeader = memo(AuctionHeaderComponent);
AuctionHeader.displayName = 'AuctionHeader';