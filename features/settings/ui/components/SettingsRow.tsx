import React from 'react';

interface SettingsRowProps {
  icon?: React.ReactNode;
  label: string;
  description?: string;
  tooltip?: string;
  children: React.ReactNode;
  className?: string;
}

// Оборачиваем в memo
export const SettingsRow: React.FC<SettingsRowProps> = React.memo(({ 
  icon, label, description, tooltip, children, className 
}) => {
  return (
    <div className={`flex items-center justify-between py-3 border-b border-white/5 gap-5 last:border-0 ${className || ''}`}>
      <div className="flex-1">
        <div className="text-[13px] font-medium text-[#ccc] flex items-center gap-2">
          {icon}
          
          <span className={tooltip ? "border-b border-dashed border-[#71717a] cursor-help hover:text-white hover:border-[#9147ff] transition-colors relative group/tooltip" : ""}>
            {label}
            {tooltip && (
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-[#141416] border border-[#27272a] rounded-md text-[11px] text-[#e4e4e7] text-center font-normal opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 shadow-xl z-50 pointer-events-none">
                {tooltip}
              </span>
            )}
          </span>
        </div>
        {description && <div className="text-[11px] text-[#71717a] mt-1 leading-snug">{description}</div>}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {children}
      </div>
    </div>
  );
});
SettingsRow.displayName = 'SettingsRow';