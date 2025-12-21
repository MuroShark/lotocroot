"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
// Импортируем иконки как компоненты
import { 
  ListDashes, 
  Spinner, 
  Gear, 
  Bug, 
  GithubLogo
} from '@phosphor-icons/react';

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
        className="mb-8 flex h-10 w-10 items-center justify-center transition hover:drop-shadow-[0_0_10px_rgba(145,71,255,0.5)]" 
        title="Auction Ultimate"
      >
        <Image 
          src="/roulette/LotoCroot_Icon.png" 
          alt="LotoCroot" 
          width={32} 
          height={32} 
          className="object-contain"
          priority
        />
      </Link>

      {/* Ссылки навигации */}
      <Link href="/" className={getNavClass('/')} title="Аукцион">
        {/* Было: <i className="ph-fill ph-list-dashes text-[22px]"></i> */}
        <ListDashes size={22} weight="fill" />
      </Link>

      <Link href="/roulette" className={getNavClass('/roulette')} title="Рулетка">
        {/* Было: <i className="ph-fill ph-spinner text-[22px]"></i> */}
        <Spinner size={22} weight="fill" />
      </Link>
      
      {/* Кнопка настроек */}
      <Link href="/settings" className={getNavClass('/settings')} title="Настройки">
        {/* Было: <i className="ph ph-gear text-[22px]"></i> (обычный вес regular) */}
        <Gear size={22} />
      </Link>

      {/* Внешние ссылки */}
      <div className="mt-auto flex flex-col items-center">
        <Link 
          href="https://boosty.to/muroshark/donate" 
          target="_blank"
          rel="noopener noreferrer"
          className={getNavClass('boosty')} 
          title="Поддержать на Boosty"
        >
          <Image 
            src="/roulette/boosty/Color.svg" 
            alt="Boosty" 
            width={22} 
            height={22}
            className="object-contain"
            priority
            unoptimized
          />
        </Link>

        <Link 
          href="https://github.com/MuroShark/lotocroot/issues" 
          target="_blank"
          rel="noopener noreferrer"
          className={getNavClass('bug-report')} 
          title="Сообщить о баге"
        >
          <Bug size={22} />
        </Link>

        <Link 
          href="https://github.com/MuroShark" 
          target="_blank"
          rel="noopener noreferrer"
          className={getNavClass('github')} 
          title="GitHub"
        >
          <GithubLogo size={22} />
        </Link>
      </div>
    </nav>
  );
};