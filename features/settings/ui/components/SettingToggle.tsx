import React from 'react';

interface SettingToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

// Оборачиваем в memo
export const SettingToggle: React.FC<SettingToggleProps> = React.memo(({ checked, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.checked);
    e.target.blur();
  };

  return (
    <label className="relative inline-flex items-center cursor-pointer group isolate">
      <input 
        type="checkbox" 
        className="sr-only peer" 
        checked={checked}
        onChange={handleChange} 
      />
      <div className="w-11 h-6 bg-[#27272a] group-hover:bg-[#333] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#9147ff]/20 rounded-full peer peer-checked:bg-[#9147ff] transition-colors duration-300 ease-spring"></div>
      <div className="absolute top-[2px] left-[2px] bg-[#71717a] border border-gray-300 rounded-full h-5 w-5 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] 
        peer-checked:translate-x-5 peer-checked:bg-white peer-checked:border-white">
      </div>
    </label>
  );
});
SettingToggle.displayName = 'SettingToggle';