"use client";

interface ResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ResetModal: React.FC<ResetModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-[4px] z-[999] flex items-center justify-center animate-in fade-in duration-200">
      <div className="w-[400px] max-w-[90%] bg-[#141416] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
        <div className="px-6 pt-5 pb-2 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center text-2xl">
            <i className="ph-fill ph-warning"></i>
          </div>
          <div className="text-base font-bold text-white">Сброс данных</div>
        </div>
        <div className="px-6 pb-6">
          <p className="text-[13px] text-[#71717a] leading-relaxed">
            Вы собираетесь удалить все локальные данные сайта, включая шаблоны настроек, авторизации и кеш.
          </p>
          <p className="text-[13px] text-red-500 mt-2">Это действие нельзя отменить.</p>
        </div>
        <div className="px-6 py-4 bg-[#18181b] border-t border-[#27272a] flex justify-end gap-2.5">
          <button onClick={onClose} className="px-4 py-2 rounded-md text-xs font-semibold text-[#71717a] border border-[#333] hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
            Отмена
          </button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-md text-xs font-semibold text-white bg-red-500 border border-red-500 hover:bg-red-600 transition-colors cursor-pointer">
            Да, удалить всё
          </button>
        </div>
      </div>
    </div>
  );
};