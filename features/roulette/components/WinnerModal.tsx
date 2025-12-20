import React from 'react';
import { RouletteSegment, WinnerModalState } from '../types';
import { Trophy } from '@phosphor-icons/react';

interface WinnerModalProps {
    data: WinnerModalState;
    onClose: (accepted: boolean) => void;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({ data, onClose }) => {
    return (
        <div 
            className={`fixed inset-0 bg-[rgba(0,0,0,0.8)] backdrop-blur-md z-[100] flex items-center justify-center transition-opacity duration-300 ${data.show ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            onClick={(e) => { if(e.target === e.currentTarget) onClose(false); }}
        >
            <div className={`w-[400px] bg-[#18181b] border border-[var(--primary)] rounded-[20px] p-10 text-center shadow-[0_0_100px_rgba(145,71,255,0.4)] relative transition-transform duration-400 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] ${data.show ? 'scale-100' : 'scale-75'}`}>
                <div className="w-[80px] h-[80px] mx-auto mb-5 bg-[var(--primary)] text-white rounded-full flex items-center justify-center text-[40px] animate-shadow-pulse">
                    <Trophy weight="fill" />
                </div>
                <div className="text-sm uppercase tracking-[2px] text-[var(--text-muted)] mb-2">
                    {data.isFinal ? "🏆 АБСОЛЮТНЫЙ ПОБЕДИТЕЛЬ 🏆" : "Победитель"}
                </div>
                <div className="text-[28px] font-extrabold text-white mb-8 leading-[1.2]">
                    {data.winner?.name}
                </div>
                
                <div className="flex gap-2.5 justify-center">
                    <button onClick={() => onClose(true)} className="px-6 py-2.5 rounded-lg font-semibold bg-white text-black hover:bg-[#eee] transition-colors cursor-pointer">
                        {data.isFinal ? 'Отлично' : 'Принять'}
                    </button>
                    {!data.isFinal && (
                        <button onClick={() => onClose(false)} className="px-6 py-2.5 rounded-lg font-semibold bg-transparent text-[#777] border border-[#333] hover:text-white hover:border-white transition-colors">Отмена</button>
                    )}
                </div>
            </div>
        </div>
    );
};