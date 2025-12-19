import React, { useState, useEffect } from 'react';
import { GameMode, EliminationMode } from '../types';

interface RouletteControlsProps {
    mode: GameMode;
    setMode: (m: GameMode) => void;
    subMode: EliminationMode;
    setSubMode: (m: EliminationMode) => void;
    setHideEliminated: (v: boolean) => void;
    duration: number;
    setDuration: (v: number) => void;
    participantsCount: number;
    totalBank: number;
    isSpinning: boolean;
    onSpin: () => void;
    restartGame: () => void; 
    shuffleSegments: () => void; 
    shuffleColors: () => void; 
}

export const RouletteControls: React.FC<RouletteControlsProps> = ({
    mode, setMode, subMode, setSubMode, setHideEliminated,
    duration, setDuration, participantsCount, totalBank,
    isSpinning, onSpin, restartGame, shuffleSegments, shuffleColors
}) => {
    // Храним значение как строку для полного контроля над точками/запятыми
    const [localDuration, setLocalDuration] = useState(duration.toString());

    // Синхронизация при внешних изменениях (например, рестарт игры)
    useEffect(() => {
        // Преобразуем текущее локальное значение в число для сравнения
        const currentLocalNum = parseFloat(localDuration.replace(',', '.'));
        // Если реальное число изменилось и оно не равно тому, что сейчас введено
        if (duration !== currentLocalNum) {
            setLocalDuration(duration.toString());
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [duration]);

    const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;

        // 1. Разрешаем вводить только цифры, одну точку или одну запятую
        // Регулярка: начало строки, цифры, опционально (точка или запятая), цифры, конец строки
        if (!/^\d*[.,]?\d*$/.test(val)) {
            return; // Если ввели букву или второй разделитель - игнорируем
        }

        // 2. Обновляем UI (показываем точку или запятую как есть)
        setLocalDuration(val);

        // 3. Для логики заменяем запятую на точку и парсим
        const normalizedVal = val.replace(',', '.');
        const num = parseFloat(normalizedVal);

        if (!isNaN(num) && isFinite(num)) {
            setDuration(num);
        } else if (val === '') {
            setDuration(0);
        }
    };

    return (
        <aside className="w-[380px] bg-[var(--bg-panel)] backdrop-blur-xl border-l border-[var(--border-color)] flex flex-col z-25 flex-shrink-0">
            {/* Header */}
            <div className="p-5 border-b border-[var(--border-color)]">
                <div className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                    <i className="ph-fill ph-game-controller"></i> Колесо удачи
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                    Участников: {participantsCount} • Банк: <span className="font-mono text-white">{totalBank.toLocaleString()} ₽</span>
                </div>
            </div>

            {/* Mode Selection */}
            <div className="p-4 border-b border-[var(--border-color)] bg-[rgba(255,255,255,0.02)]">
                <div className="flex justify-between items-center mb-2.5">
                    <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wide">Режим игры</span>
                    
                    {mode === 'elimination' && (
                        <div className="info-wrapper">
                            <i className="ph-fill ph-info text-[#555] hover:text-[var(--text-main)] transition-colors text-base"></i>
                            <div className="tooltip">
                                <div className="tooltip-header">Типы выбывания</div>
                                <div className="tooltip-item">
                                    <strong>Рандом:</strong>
                                    В каждом раунде выбывающий определяется случайным образом. Чем больше сумма, тем меньше шанс выбыть.
                                </div>
                                <div className="tooltip-item">
                                    <strong>Визуал:</strong>
                                    Скрытый финал. Сайт заранее выбирает победителя (шанс зависит от суммы). Колесо лишь визуализирует процесс выбывания остальных участников.
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="flex bg-[var(--bg-input)] p-1 rounded-lg border border-[var(--border-color)] relative">
                    <button 
                        disabled={isSpinning}
                        onClick={() => { setMode('classic'); setHideEliminated(false); restartGame(); }} 
                        className={`flex-1 text-xs font-semibold p-1.5 rounded-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${mode === 'classic' ? 'bg-[#27272a] text-white shadow-sm border border-[#333]' : 'text-[var(--text-muted)] hover:text-[#e4e4e7]'}`}
                    >
                        Обычный
                    </button>
                    <button 
                        disabled={isSpinning}
                        onClick={() => { setMode('elimination'); setHideEliminated(true); restartGame(); }} 
                        className={`flex-1 text-xs font-semibold p-1.5 rounded-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${mode === 'elimination' ? 'bg-[#27272a] text-white shadow-sm border border-[#333]' : 'text-[var(--text-muted)] hover:text-[#e4e4e7]'}`}
                    >
                        Выбывание
                    </button>
                </div>

                {mode === 'elimination' && (
                    <div className="mt-3 p-3 bg-[rgba(0,0,0,0.2)] rounded-lg border border-dashed border-[#333] animate-[slideDown_0.3s_cubic-bezier(0.16,1,0.3,1)]">
                        <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">Тип выбывания</div>
                        <div className="flex bg-[var(--bg-input)] p-1 rounded-lg border border-[var(--border-color)] relative">
                            <button 
                                disabled={isSpinning}
                                onClick={() => { 
                                    if (subMode !== 'random') {
                                        setSubMode('random');
                                        shuffleSegments();
                                    }
                                }}
                                className={`flex-1 text-xs font-semibold p-1.5 rounded-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${subMode === 'random' ? 'bg-[#27272a] text-white border border-[#333]' : 'text-[var(--text-muted)] hover:text-[#e4e4e7]'}`}
                            >
                                Рандом
                            </button>
                            <button 
                                disabled={isSpinning}
                                onClick={() => { 
                                    if (subMode !== 'visual') {
                                        setSubMode('visual');
                                        shuffleSegments();
                                    }
                                }}
                                className={`flex-1 text-xs font-semibold p-1.5 rounded-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${subMode === 'visual' ? 'bg-[#27272a] text-white border border-[#333]' : 'text-[var(--text-muted)] hover:text-[#e4e4e7]'}`}
                            >
                                Визуал
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Spin Controls */}
            <div className="p-6 flex flex-col gap-4 border-b border-[var(--border-color)]">
                <button 
                    onClick={onSpin}
                    disabled={isSpinning || participantsCount === 0 || (mode === 'elimination' && participantsCount <= 1)}
                    className="h-[60px] bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white border-none rounded-xl text-base font-bold uppercase tracking-widest cursor-pointer flex items-center justify-center gap-2.5 transition-all shadow-[0_4px_15px_rgba(145,71,255,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(145,71,255,0.5)] active:translate-y-[1px] disabled:bg-[#333] disabled:text-[#777] disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none"
                >
                   <i className={`ph-bold ph-arrows-clockwise ${isSpinning ? 'animate-spin' : ''}`}></i> 
                   {isSpinning ? 'Крутим...' : 'Крутить колесо'}
                </button>
                <div className="flex gap-3">
                     <div className="flex-1 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg px-3 py-1 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase">Время (сек)</span>
                        <input 
                            // ИСПРАВЛЕНИЕ: Меняем type="number" на type="text"
                            type="text"
                            inputMode="decimal" // Чтобы на мобилках открывалась цифровая клавиатура
                            value={localDuration}
                            onChange={handleDurationChange}
                            className="w-[50px] bg-transparent border-none text-white text-right font-mono font-bold text-[13px] focus:outline-none"
                            placeholder="10"
                        />
                     </div>
                </div>
            </div>
        </aside>
    );
};