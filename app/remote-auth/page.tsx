"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

// 1. Вся логика перенесена в отдельный компонент
function AuthContent() {
  const searchParams = useSearchParams();
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const token = searchParams.get('twitch_token');
  const refreshToken = searchParams.get('twitch_refresh_token');
  const userId = searchParams.get('twitch_user_id');

  useEffect(() => {
    if (token && userId) {
      const params = new URLSearchParams();
      params.set('twitch_token', token);
      if (refreshToken) params.set('twitch_refresh_token', refreshToken);
      params.set('twitch_user_id', userId);

      const localLink = `http://localhost:3000/?${params.toString()}`;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGeneratedLink(localLink);
    }
  }, [token, refreshToken, userId]);

  const handleLogin = () => {
    document.cookie = "auth_return_url=/remote-auth; path=/; max-age=300";
    const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_TWITCH_REDIRECT_URI;
    const scope = "channel:read:redemptions channel:manage:redemptions";

    window.location.href = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
};

  const copyToClipboard = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#09090b] p-4 text-[#e4e4e7]">
      <div className="w-full max-w-md rounded-xl border border-[#27272a] bg-[#18181b] p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#9147ff]/20 text-[#9147ff]">
            <i className="ph-fill ph-twitch-logo text-3xl"></i>
          </div>
          <h1 className="text-xl font-bold text-white">Удаленная Авторизация</h1>
          <p className="mt-2 text-sm text-[#71717a]">
            {!generatedLink 
              ? "Войдите через Twitch, чтобы сгенерировать ссылку доступа для разработчика." 
              : "Авторизация успешна! Скопируйте ссылку ниже и отправьте разработчику."}
          </p>
        </div>

        {!generatedLink ? (
          <button
            onClick={handleLogin}
            className="group cursor-pointer flex w-full items-center justify-center gap-2 rounded-lg bg-[#9147ff] py-3 font-semibold text-white transition-all hover:bg-[#7c3aed] hover:shadow-[0_0_20px_rgba(145,71,255,0.4)]"
          >
            <i className="ph-bold ph-sign-in text-lg"></i>
            Войти через Twitch
          </button>
        ) : (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="relative">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#71717a]">
                Ссылка для разработчика
              </label>
              <div className="relative flex items-center rounded-lg border border-[#333] bg-[#09090b] p-3 pr-12 font-mono text-xs text-[#a1a1aa]">
                <span className="truncate">{generatedLink}</span>
              </div>
            </div>

            <button
              onClick={copyToClipboard}
              className={`
                flex w-full items-center justify-center gap-2 rounded-lg py-3 font-semibold transition-all
                ${isCopied 
                  ? "bg-[#10b981] text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]" 
                  : "bg-[#e4e4e7] text-black hover:bg-white cursor-pointer"
                }
              `}
            >
              {isCopied ? (
                <>
                  <i className="ph-bold ph-check text-lg"></i>
                  Скопировано!
                </>
              ) : (
                <>
                  <i className="ph-bold ph-copy text-lg"></i>
                  Копировать ссылку
                </>
              )}
            </button>
            
            <p className="text-center text-[10px] text-[#52525b]">
              Эта ссылка содержит токены доступа. Не передавайте её третьим лицам.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// 2. Экспортируем компонент-обертку с Suspense
export default function RemoteAuthPage() {
  return (
    <Suspense fallback={
      // Простой лоадер в стиле вашего дизайна, пока грузятся параметры
      <div className="flex min-h-screen w-full items-center justify-center bg-[#09090b]">
        <div className="text-[#9147ff]">Загрузка...</div>
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}