"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SideNavProps {
  className?: string;
}

export const SideNav: React.FC<SideNavProps> = ({ className }) => {
  const pathname = usePathname();

  const getNavClass = (path: string) => {
    const base = "relative mb-3 flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg transition-all duration-200";
    const isActive = pathname === path;
    
    if (isActive) {
      return `${base} bg-[rgba(145,71,255,0.15)] text-[#9147ff] before:absolute before:-left-[11px] before:h-5 before:w-[3px] before:rounded-r before:bg-[#9147ff]`;
    }
    return `${base} text-[#71717a] hover:bg-[#27272a] hover:text-white`;
  };

  return (
    <nav className={`flex w-[60px] shrink-0 flex-col items-center border-r border-[#27272a] bg-[rgba(17,17,19,0.75)] pt-5 backdrop-blur-md z-30 ${className || ''}`}>
      {/* Логотип */}
      <Link 
        href="/" 
        className="mb-8 flex h-10 w-10 items-center justify-center text-[26px] text-[#9147ff] transition hover:[text-shadow:0_0_15px_rgba(145,71,255,0.4)]" 
        title="Auction Ultimate"
      >
        <i className="ph-bold ph-gavel"></i>
      </Link>

      {/* Ссылки навигации */}
      <Link href="/" className={getNavClass('/')} title="Аукцион">
        <i className="ph-fill ph-list-dashes text-[22px]"></i>
      </Link>

      <Link href="/roulette" className={getNavClass('/roulette')} title="Рулетка">
        <i className="ph-fill ph-spinner text-[22px]"></i>
      </Link>
      
      {/* Кнопка настроек перемещена сюда */}
      <Link href="/settings" className={getNavClass('/settings')} title="Настройки">
        <i className="ph ph-gear text-[22px]"></i>
      </Link>

      {/* Внешние ссылки */}
      <div className="mt-auto flex flex-col items-center">
        <Link 
          href="https://github.com/MuroShark/lotocroot/issues" 
          target="_blank"
          rel="noopener noreferrer"
          className={getNavClass('bug-report')} 
          title="Сообщить о баге"
        >
          <i className="ph ph-bug text-[22px]"></i>
        </Link>

        <Link 
          href="https://github.com/MuroShark" 
          target="_blank"
          rel="noopener noreferrer"
          className={getNavClass('github')} 
          title="GitHub"
        >
          <i className="ph ph-github-logo text-[22px]"></i>
        </Link>
      </div>
    </nav>
  );
};