import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google"; 
import "./globals.css";
import { SideNav } from "@/widgets/SideNav";
import { Toaster } from "@/shared/ui/Toast/Toaster";
import { DonationDragLayer } from "@/features/auction/widgets/DonationManager/ui/DonationList/DonationDragLayer";
import { GlobalTimerController } from "@/features/auction/components/Timer/GlobalTimerController";
import { Desktop } from "@phosphor-icons/react/dist/ssr";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://lotocroot.ru'),
  title: "LotoCroot",
  description: "Интерактивный аукцион и Колесо Удачи для стримеров с интеграцией DonationAlerts, Twitch и DonatePay. Удобное управление лотами, таймер и автоматическое продление времени.",
  keywords: ["PointAuc", "point auk", "point auc", "ПоинтАук", "поинт аук", "аукцион для стримеров", "рулетка", "колесо удачи", "DonationAlerts", "Twitch", "DonatePay", "интерактив", "сбор средств", "LotoCroot", "альтернатива pointauc"],
  authors: [{ name: "MuroShark" }],
  creator: "MuroShark",
  openGraph: {
    title: "LotoCroot — Аукцион и Колесо Удачи",
    description: "Бесплатный инструмент для стримеров: аукцион, рулетка, интеграции с DonationAlerts, DonatePay и Twitch. Настраиваемый таймер и удобное управление.",
    type: "website",
    locale: "ru_RU",
    siteName: "LotoCroot",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/roulette/LotoCroot_iconFull.png",
    shortcut: "/roulette/LotoCroot_iconFull.png",
    apple: "/roulette/LotoCroot_iconFull.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head />
      <body className="antialiased">
        {/* Заглушка для мобильных устройств (видна только на экранах < md) */}
        <div className="flex h-screen w-full flex-col items-center justify-center bg-[var(--bg-body)] p-6 md:hidden">
          <div className="flex flex-col items-center justify-center py-10 px-6 border border-dashed border-[#27272a] rounded-xl bg-white/5 w-full max-w-sm animate-fade-slide">
            <div className="bg-[#ef4444]/10 text-[#ef4444] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-5 border border-[#ef4444]/20">
              Desktop Only
            </div>
            
            <Desktop size={48} weight="duotone" className="text-[#ef4444]/80 mb-5 drop-shadow-[0_0_10px_rgba(239,68,68,0.3)]" />
            
            <div className="text-lg font-bold text-[var(--text-main)] mb-2 text-center">
              Устройство не поддерживается
            </div>
            
            <div className="text-[13px] text-[var(--text-muted)] text-center leading-relaxed">
              Для работы с аукционом, пожалуйста, перейдите на планшет, ноутбук или ПК.
            </div>
          </div>
        </div>

        {/* Основной контейнер, имитирующий body { display: flex } из CSS */}
        {/* Глобальный контроллер таймера, который не рендерит UI, но управляет логикой */}
        <GlobalTimerController />

        {/* Скрываем основной контент на мобильных (hidden md:flex) */}
        <div className="hidden md:flex h-screen w-full overflow-hidden text-[var(--text-main)]">
          
          {/* Сайдбар слева (фиксированный) */}
          <SideNav />

          {/* Основная контентная область */}
          <main className="flex-1 flex flex-col min-w-0 relative transition-all duration-400 ease-spring">
             {/* Здесь рендерится page.tsx */}
            {children}
            
            <div className="fixed bottom-5 right-5 z-[9999]">
              <Toaster />
            </div>
            <DonationDragLayer />
          </main>

        </div>
      </body>
    </html>
  );
}