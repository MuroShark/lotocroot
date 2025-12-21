import React, { useState, useEffect } from 'react';
import { WinnerModalState } from '../types';
import { Trophy, WarningCircle, CheckSquare, Square } from '@phosphor-icons/react';

interface WinnerModalProps {
    data: WinnerModalState;
    onClose: (accepted: boolean) => void;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({ data, onClose }) => {
    const [showConfirm, setShowConfirm] = useState(false);
    const [rememberChoice, setRememberChoice] = useState(false);

    // Сброс состояния после закрытия модалки (с задержкой для анимации)
    useEffect(() => {
        if (!data.show) {
            const timer = setTimeout(() => {
                setShowConfirm(false);
                setRememberChoice(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [data.show]);

    const handleAccept = () => {
        // Если это финал (выбывание) или уже запомнили выбор - сразу принимаем
        if (data.isFinal) {
            onClose(true);
            return;
        }

        const skipConfirm = localStorage.getItem('roulette-skip-delete-confirm') === 'true';
        if (skipConfirm) {
            onClose(true);
        } else {
            setShowConfirm(true);
        }
    };

    const handleConfirmDelete = () => {
        if (rememberChoice) {
            localStorage.setItem('roulette-skip-delete-confirm', 'true');
        }
        onClose(true);
    };

    return (
        <div 
            className={`fixed inset-0 bg-[rgba(0,0,0,0.8)] backdrop-blur-md z-[100] flex items-center justify-center transition-opacity duration-300 ${data.show ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            onClick={(e) => { 
                if(e.target === e.currentTarget) {
                    if (showConfirm) setShowConfirm(false);
                    else onClose(false);
                } 
            }}
        >
            <div className={`w-[400px] bg-[#18181b] border border-[var(--primary)] rounded-[20px] p-10 text-center shadow-[0_0_100px_rgba(145,71,255,0.4)] relative transition-transform duration-400 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] ${data.show ? 'scale-100' : 'scale-75'}`}>
                
                {!showConfirm ? (
                    <>
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
                            <button onClick={handleAccept} className="px-6 py-2.5 rounded-lg font-semibold bg-white text-black hover:bg-[#eee] transition-colors cursor-pointer">
                                {data.isFinal ? 'Отлично' : 'Принять'}
                            </button>
                            {!data.isFinal && (
                                <button onClick={() => onClose(false)} className="px-6 py-2.5 rounded-lg font-semibold bg-transparent text-[#777] border border-[#333] hover:text-white hover:border-white transition-colors">Отмена</button>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="animate-fade-in">
                        <div className="w-[80px] h-[80px] mx-auto mb-5 bg-[var(--red)]/10 text-[var(--red)] rounded-full flex items-center justify-center text-[40px] border border-[var(--red)]/20">
                            <WarningCircle weight="duotone" />
                        </div>
                        <div className="text-lg font-bold text-white mb-2">
                            Удалить лот?
                        </div>
                        <div className="text-[13px] text-[var(--text-muted)] mb-6 leading-relaxed">
                            Принятие победителя также <b>удалит этот лот</b> из списка аукциона. Это действие нельзя отменить.
                        </div>

                        <div 
                            className="flex items-center justify-center gap-2 mb-6 cursor-pointer group select-none"
                            onClick={() => setRememberChoice(!rememberChoice)}
                        >
                            {rememberChoice ? (
                                <CheckSquare weight="fill" className="text-[var(--primary)] text-xl" />
                            ) : (
                                <Square weight="regular" className="text-[#555] text-xl group-hover:text-[#777] transition-colors" />
                            )}
                            <span className={`text-xs ${rememberChoice ? 'text-white' : 'text-[#777] group-hover:text-[#999]'} transition-colors`}>
                                Запомнить выбор
                            </span>
                        </div>
                        
                        <div className="flex gap-2.5 justify-center">
                            <button 
                                onClick={handleConfirmDelete} 
                                className="px-6 py-2.5 rounded-lg font-semibold bg-[var(--red)] text-white hover:bg-red-600 transition-colors cursor-pointer shadow-[0_4px_15px_rgba(239,68,68,0.3)]"
                            >
                                Удалить
                            </button>
                            <button 
                                onClick={() => setShowConfirm(false)} 
                                className="px-6 py-2.5 rounded-lg font-semibold bg-transparent text-[#777] border border-[#333] hover:text-white hover:border-white transition-colors"
                            >
                                Отмена
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};