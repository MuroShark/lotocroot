import React, { useState, memo } from 'react';
import { useAuctionViewStore } from '@/features/auction/store/auctionViewStore';
import { useProfilesStore } from '@/features/auction/store/profilesStore';
import { ImportExportModal } from '../ImportExportModal/ImportExportModal';
import { Check, FloppyDisk, ArrowsLeftRight, Percent, ArrowsInLineVertical, Trash } from '@phosphor-icons/react';

interface LotToolbarProps {
  onClearLots: () => void;
}

const LotToolbarComponent: React.FC<LotToolbarProps> = ({ onClearLots }) => {
  const { showPercentages, toggleShowPercentages, toggleCompactMode, isCompactMode } = useAuctionViewStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isJustSaved, setIsJustSaved] = useState(false);
  const addProfile = useProfilesStore((state) => state.addProfile);

  const handleSaveClick = () => {
    addProfile(); // Вызываем без аргументов, имя сгенерируется в сторе
    setIsJustSaved(true);
    setTimeout(() => {
      setIsJustSaved(false);
    }, 2000);
  };

  // Класс для умных кнопок с текстом при наведении
  const getBtnSmartClass = (isSpecial = false, specialClass = '') => {
    const base = "group relative flex h-10 w-10 cursor-pointer items-center justify-start overflow-hidden rounded-lg border p-0 transition-all duration-300 ease-spring";
    const normal = "border-[#333] bg-[#202024] text-[#71717a] hover:w-[130px] hover:border-[#555] hover:bg-[#27272a] hover:text-white active:bg-[#18181b]";
    return `${base} ${isSpecial ? specialClass : normal}`;
  }
  const btnIconClass = "z-10 min-w-[40px] flex items-center justify-center text-xl transition duration-200";
  const btnTextClass = "translate-x-[-10px] whitespace-nowrap text-xs font-semibold opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100";

  // Класс для переключателей
  const btnToggleClass = (isActive: boolean) => `flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-transparent text-xl transition duration-200 hover:bg-[#202024] hover:text-white ${isActive ? 'bg-[rgba(145,71,255,0.15)] text-[#9147ff] !border-[#9147ff]' : 'text-[#71717a]'}`;

  return (
    <>
      <footer className="flex h-[64px] shrink-0 items-center justify-between border-t border-[#27272a] bg-[rgba(17,17,19,0.75)] px-6 backdrop-blur-md">
         {/* Левая часть */}
         <div className="flex items-center gap-2.5">

            <button 
              className={getBtnSmartClass(isJustSaved, 'bg-[#202024] border-[var(--green)] text-[var(--green)] hover:w-[130px] active:bg-[#18181b]')} 
              onClick={handleSaveClick} 
              title="Сохранить"
            >
               <div className={btnIconClass}>
                  {isJustSaved ? <Check weight="bold" /> : <FloppyDisk />}
               </div>
               <span className={`${btnTextClass} ${isJustSaved ? '!translate-x-0 !opacity-100' : ''}`}>{isJustSaved ? 'Сохранено' : 'Сохранить'}</span>
            </button>

            <button className={getBtnSmartClass()} onClick={() => setIsModalOpen(true)} title="Сохранения">
               {/* ИЗМЕНЕНИЕ: Иконка стрелок влево-вправо */}
               <div className={btnIconClass}>
                  <ArrowsLeftRight />
               </div>
               <span className={btnTextClass}>Сохранения</span>
            </button>
         </div>
         
         {/* Правая часть */}
         <div className="flex items-center gap-2.5">
            <button 
               className={btnToggleClass(showPercentages)} 
               onClick={toggleShowPercentages} 
               title="Показать %"
            >
               <Percent />
            </button>

            <button 
               className={btnToggleClass(isCompactMode)} 
               onClick={toggleCompactMode} 
               title="Компактный вид"
            >
               <ArrowsInLineVertical />
            </button>

            <div className="mx-2.5 h-7 w-px bg-[#333]"></div>

            <button 
               className={`${getBtnSmartClass()} hover:!w-[135px] hover:!border-[#ef4444] hover:!bg-[rgba(239,68,68,0.1)] hover:!text-[#ef4444]`} 
               onClick={onClearLots}
            >
               <div className={btnIconClass}>
                  <Trash />
               </div>
               <span className={btnTextClass}>Очистить всё</span>
            </button>
         </div>
      </footer>
      <ImportExportModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export const LotToolbar = memo(LotToolbarComponent);
LotToolbar.displayName = 'LotToolbar';