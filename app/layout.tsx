import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google"; // Добавляем JetBrains Mono
import Script from "next/script";
import "./globals.scss";
import { SideNav } from "@/widgets/SideNav";
import { Toaster } from "@/shared/ui/Toast/Toaster";
import { DonationDragLayer } from "@/features/auction/widgets/DonationManager/ui/DonationList/DonationDragLayer";
import { GlobalTimerController } from "@/features/auction/components/Timer/GlobalTimerController";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "LotoCroot",
  description: "DonationAlerts Rouletta",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        {/* Подключаем Phosphor Icons как в примере HTML */}
        <Script 
          src="https://unpkg.com/@phosphor-icons/web" 
          strategy="lazyOnload" 
        />
      </head>
      <body className="antialiased">
        {/* Основной контейнер, имитирующий body { display: flex } из CSS */}
        {/* Глобальный контроллер таймера, который не рендерит UI, но управляет логикой */}
        <GlobalTimerController />

        <div className="flex h-screen w-full overflow-hidden text-[var(--text-main)]">
          
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