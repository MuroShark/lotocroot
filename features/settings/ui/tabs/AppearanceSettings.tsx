import React from 'react';

export const AppearanceSettings = () => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 mt-5">
      <div className="flex flex-col items-center justify-center py-20 border border-dashed border-[#27272a] rounded-xl bg-white/5">
        <div className="bg-[#9147ff]/10 text-[#9147ff] px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-5 border border-[#9147ff]/20">
          Work in Progress
        </div>
        
        <i className="ph-duotone ph-paint-brush-broad text-5xl text-[#9147ff]/80 mb-5 drop-shadow-[0_0_10px_rgba(145,71,255,0.3)]"></i>
        
        <div className="text-lg font-bold text-white mb-2">
          Раздел в разработке
        </div>
        
        <div className="text-[13px] text-[#71717a] max-w-sm text-center leading-relaxed">
          Мы готовим новый мощный редактор тем. Скоро вы сможете настроить каждый пиксель вашего аукциона.
        </div>
      </div>
    </div>
  );
};