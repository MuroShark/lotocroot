import React, { useMemo } from 'react';
import { RouletteSegment, GameMode } from '../types';
import { X } from '@phosphor-icons/react';

interface RouletteListProps {
    segments: RouletteSegment[];
    graveyard: RouletteSegment[];
    mode: GameMode;
    hideEliminated: boolean;
    isSpinning: boolean; // Добавлено для блокировки кнопок
    onHover: (id: number | null) => void;
    onRemove: (id: number) => void;
    totalWeight: number; // Это totalBank, оставим для совместимости, но считать будем сами
}

export const RouletteList: React.FC<RouletteListProps> = ({ 
    segments, graveyard, mode, hideEliminated, isSpinning, onHover, onRemove 
}) => {
    
    // Объединяем списки для отображения
    let displayList = [...segments];
    if (!hideEliminated) {
        displayList = [...displayList, ...graveyard];
    }
    // Сортировка по сумме (от большей к меньшей)
    displayList.sort((a, b) => b.amount - a.amount);

    // 1. Функция расчета веса лота в зависимости от режима
    const getWeight = React.useCallback((seg: RouletteSegment) => {
        if (mode === 'elimination') {
            // В режиме выбывания вес обратно пропорционален сумме
            return 1 / Math.max(seg.amount, 1);
        }
        // В классическом режиме вес равен сумме
        return seg.amount;
    }, [mode]);

    // 2. Считаем общий вес ТОЛЬКО активных сегментов (без выбывших)
    const currentTotalWeight = useMemo(() => {
        return segments.reduce((acc, seg) => acc + getWeight(seg), 0);
    }, [segments, getWeight]);

    return (
        <div className="h-full overflow-y-auto p-4 customScrollbar">
            <div className="flex flex-col gap-2">
                {displayList.map(seg => {
                    const isEliminated = graveyard.some(g => g.id === seg.id);
                    
                    // 3. Расчет шанса
                    let chance: string;
                    if (isEliminated) {
                        chance = 'Выбыл';
                    } else if (mode === 'elimination' && seg.amount === 0) {
                        // В режиме выбывания у нулевых лотов шанс выбыть максимальный, но отображать его как процент некорректно.
                        chance = '0%';
                    } else if (currentTotalWeight > 0) {
                        const weight = getWeight(seg);
                        chance = `${((weight / currentTotalWeight) * 100).toFixed(1)}%`;
                    } else chance = '0%';
                    
                    return (
                        <div 
                            key={seg.id}
                            onMouseEnter={() => onHover(seg.id)}
                            onMouseLeave={() => onHover(null)}
                            className={`flex items-center gap-3 p-2.5 rounded-lg border border-transparent transition-all relative overflow-hidden group shrink-0
                                ${isEliminated ? 'opacity-40 bg-[rgba(0,0,0,0.2)] border-[#27272a]' : 'bg-[var(--bg-element)] hover:bg-[var(--bg-element-hover)] hover:border-[#333]'}
                            `}
                        >
                            <div className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.3)] shrink-0" style={{ background: isEliminated ? '#333' : seg.color }}></div>
                            <div className="flex-1 min-w-0">
                                <div className={`font-semibold text-[13px] text-white whitespace-nowrap overflow-hidden text-ellipsis ${isEliminated ? 'line-through text-[var(--text-muted)]' : ''}`}>
                                    {seg.name}
                                </div>
                                <div className={`font-mono text-[11px] ${isEliminated ? 'text-[#444]' : 'text-[var(--text-muted)]'}`}>
                                    {seg.amount.toLocaleString()} ₽ • {chance}
                                </div>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                <button 
                                    onClick={() => onRemove(seg.id)} 
                                    disabled={isSpinning || segments.length <= 1}
                                    title={segments.length <= 1 ? "Нельзя удалить последнего участника" : "Удалить"}
                                    className="w-6 h-6 flex items-center justify-center rounded bg-transparent hover:bg-[rgba(239,68,68,0.15)] text-[#666] hover:text-[var(--red)] transition-colors disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                                >
                                    <X weight="bold" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};