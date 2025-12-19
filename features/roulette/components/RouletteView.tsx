"use client";

import React, { useState } from "react";
import { useRouletteGame } from "../hooks/useRouletteGame";
import { useWheelController } from "../hooks/useWheelController";
import { useParticles } from "../hooks/useParticles";
import { RouletteControls } from "./RouletteControls";
import { RouletteList } from "./RouletteList";
import { WheelCanvas } from "./WheelCanvas";
import { WinnerModal } from "./WinnerModal";

export const RouletteView: React.FC = () => {
  const [duration, setDuration] = useState(10);
  
  const game = useRouletteGame();
  
  const { particleCanvasRef, explode } = useParticles();

  const controller = useWheelController({
    segments: game.segments,
    mode: game.mode,
    subMode: game.subMode,
    duration: duration,
    targetWinnerId: game.targetWinnerId,
    segmentOrderKey: game.segmentOrderKey,
    onSpinFinish: (winner) => {
        if (game.mode === 'classic') {
            explode(); 
            game.setWinnerModal({ show: true, winner, isFinal: false });
        }
    },
    onEliminationAnimationFinish: (winner) => {
        const result = game.eliminateWinner(winner);
        if (result.isFinal && result.survivor) {
             explode(); 
             game.setWinnerModal({ show: true, winner: result.survivor, isFinal: true });
        }
    }
  });

  return (
    <div className="flex w-full h-full text-[var(--text-main)] overflow-hidden font-sans relative roulette-bg">
        {/* Canvas для частиц */}
        <canvas ref={particleCanvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none z-50" />
        
        {/* CENTER: Wheel */}
        <WheelCanvas 
            canvasRef={controller.canvasRef}
            wrapperRef={controller.wrapperRef}
            isSpinning={controller.isSpinning}
            pointerText={controller.pointerText}
            isPointerEliminated={controller.isPointerEliminated}
            // Передаем состояние оверлея
            eliminationState={controller.eliminationState}
        />

        {/* RIGHT: Controls & List */}
        <div className="flex flex-col border-l border-[var(--border-color)] bg-[var(--bg-panel)] backdrop-blur-xl z-25 flex-shrink-0 w-[380px]">
             <RouletteControls 
                mode={game.mode}
                setMode={game.setMode}
                subMode={game.subMode}
                setSubMode={game.setSubMode}
                setHideEliminated={game.setHideEliminated}
                duration={duration}
                setDuration={setDuration}
                participantsCount={game.segments.length}
                totalBank={game.totalBank}
                isSpinning={controller.isSpinning}
                onSpin={controller.spin}
                restartGame={game.restartGame}
                shuffleSegments={game.shuffleSegments}
                shuffleColors={game.shuffleColors}
             />
             
             <div className="flex flex-col flex-1 min-h-0">
                <RouletteList 
                    segments={game.segments}
                    graveyard={game.graveyard}
                    mode={game.mode}
                    hideEliminated={game.hideEliminated}
                    isSpinning={controller.isSpinning}
                    onHover={controller.setHoveredId}
                    onRemove={game.removeSegment}
                    totalWeight={game.totalBank}
                />
             </div>

             {/* Footer */}
             <div className="p-4 border-t border-[var(--border-color)] flex items-center justify-between">
                {game.mode === 'elimination' ? (
                     <label className="flex items-center gap-2 text-xs text-[var(--text-muted)] cursor-pointer select-none">
                        <div 
                            className={`w-4 h-4 border border-[#444] rounded flex items-center justify-center transition-colors ${game.hideEliminated ? 'bg-[var(--primary)] border-[var(--primary)] text-white' : ''}`}
                            onClick={() => game.setHideEliminated(!game.hideEliminated)}
                        >
                            {game.hideEliminated && <i className="ph-bold ph-check text-[10px]"></i>}
                        </div>
                        <span>Скрывать выбывших</span>
                     </label>
                ) : <div></div>}
                
                <button onClick={game.shuffleColors} className="w-8 h-8 flex items-center justify-center rounded bg-transparent text-[#666] hover:text-white hover:bg-[rgba(255,255,255,0.1)] transition-colors" title="Перемешать цвета">
                    <i className="ph-bold ph-palette text-lg"></i>
                </button>
            </div>
        </div>

        {/* MODAL */}
        <WinnerModal 
            data={game.winnerModal} 
            onClose={(accepted) => game.setWinnerModal({ ...game.winnerModal, show: false })}
        />
    </div>
  );
};