import React from 'react';

interface WheelCanvasProps {
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    wrapperRef: React.RefObject<HTMLDivElement | null>;
    isSpinning: boolean;
    pointerText: string;
    isPointerEliminated: boolean;
    // Новые пропсы для оверлея
    eliminationState: { show: boolean; name: string };
}

const PointerSVG = () => (
    <svg viewBox="0 0 50 60" preserveAspectRatio="none" fill="none" className="w-full h-full drop-shadow-md">
      <defs>
        <linearGradient id="pointerGradient" x1="25" y1="0" x2="25" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#e4e4e7"/>
          <stop offset="100%" stopColor="#a1a1aa"/>
        </linearGradient>
      </defs>
      <path d="M25 60 C 12 40 0 25 0 12 A 25 12 0 0 1 50 12 C 50 25 38 40 25 60 Z" fill="url(#pointerGradient)" stroke="#52525b" strokeWidth="1"/>
      <circle cx="25" cy="16" r="8" fill="#18181b" stroke="#9147ff" strokeWidth="2"/>
    </svg>
);

export const WheelCanvas = ({ 
    canvasRef, 
    wrapperRef, 
    isSpinning, 
    pointerText, 
    isPointerEliminated,
    eliminationState 
}: WheelCanvasProps) => {
    
    const isTooltipVisible = (isSpinning || pointerText !== "Победитель") && pointerText.trim() !== "";

    return (
        <div className="flex-1 relative flex items-center justify-center overflow-hidden min-w-0 pt-[50px]">
            <div 
                ref={wrapperRef} 
                className="relative flex-shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]"
                style={{ 
                    width: 'min(85vh, calc(100vw - 480px))', 
                    height: 'min(85vh, calc(100vw - 480px))',
                    maxWidth: 1200, maxHeight: 1200,
                    minWidth: 300, minHeight: 300,
                    filter: 'drop-shadow(0 0 50px rgba(0,0,0,0.5))',
                    transform: isSpinning ? 'scale(0.98)' : 'scale(1)'
                }}
            >
                {/* Pointer */}
                <div className="absolute -top-[25px] left-1/2 -translate-x-1/2 w-[32px] h-[60px] z-50">
                    <div 
                        className={`absolute bottom-[65px] left-1/2 -translate-x-1/2 whitespace-nowrap bg-[rgba(24,24,27,0.95)] border border-[var(--primary)] px-4 py-2 rounded-lg text-sm font-bold text-white shadow-[0_4px_15px_rgba(0,0,0,0.5),0_0_10px_rgba(145,71,255,0.2)] z-20 pointer-events-none transition-all duration-300 max-w-[300px] overflow-hidden text-ellipsis text-center ${isPointerEliminated ? 'line-through text-[var(--red)] border-[var(--red)]' : ''}`}
                        style={{ opacity: isTooltipVisible ? 1 : 0 }}
                    >
                         {pointerText}
                         <div className={`absolute -bottom-[6px] left-1/2 -translate-x-1/2 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] transition-colors duration-300 ${isPointerEliminated ? 'border-t-[var(--red)]' : 'border-t-[var(--primary)]'}`}></div>
                    </div>
                    <PointerSVG />
                </div>

                <canvas ref={canvasRef} className="w-full h-full block" />
                
                {/* Hub */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80px] h-[80px] bg-[#18181b] border-4 border-[#27272a] rounded-full z-[5] flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                    <i className="ph-fill ph-crown text-[32px] text-[var(--primary)]"></i>
                </div>

                {/* ELIMINATION OVERLAY */}
                {/* Z-index 40: выше Canvas и Hub, но ниже Pointer (z-50) */}
                <div 
                    className={`absolute inset-0 rounded-full flex flex-col items-center justify-center bg-[rgba(9,9,11,0.65)] backdrop-blur-[2px] z-40 transition-opacity duration-300 pointer-events-none ${eliminationState.show ? 'opacity-100' : 'opacity-0'}`}
                >
                    <div 
                        className={`text-[var(--red)] font-extrabold text-2xl uppercase tracking-[3px] mb-4 text-shadow-glow transform transition-transform duration-500 ${eliminationState.show ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
                        style={{ textShadow: '0 0 20px rgba(239, 68, 68, 0.6)' }}
                    >
                        ВЫБЫВАЕТ
                    </div>
                    <div 
                        className={`text-white font-bold text-[32px] text-center px-10 leading-tight transform transition-transform duration-500 delay-100 ${eliminationState.show ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}
                    >
                        {eliminationState.name}
                    </div>
                </div>

            </div>
        </div>
    );
};