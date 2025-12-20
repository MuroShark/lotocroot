"use client";

import { useState, useEffect, useRef } from "react";
import { useDonationAlertsAuth } from "@/features/auth/hooks/useDonationAlertsAuth";
import { useTwitchAuth } from "@/features/auth/hooks/useTwitchAuth"; // 1. Импортируем хук
import { useAuthStore } from "@/entities/auth/model/store/authStore";
import { DonatePayWizardModal, Region } from "../components/DonatePayWizardModal";
import { CurrencyGrid } from "../components/CurrencyGrid";
import { CurrencyCode, RateSource, useCurrencyStore, DonationDisplayMode } from "../../model/currencyStore";
import { IntegrationCard } from "../components/IntegrationCard";
import { CustomSelect } from "../components/CustomSelect";
import { CurrencyCircleDollar } from "@phosphor-icons/react";

export const IntegrationsSettings = () => {
  // --- DonationAlerts ---
  const { 
    isAuthenticated: isDaAuthenticated, 
    login: loginDa, 
    logout: logoutDa, 
    isLoggingIn: isDaLoggingIn 
  } = useDonationAlertsAuth();

  // --- Twitch (Добавили логику) ---
  const {
    isAuthenticated: isTwitchAuthenticated,
    login: loginTwitch,
    logout: logoutTwitch,
    isLoggingIn: isTwitchLoggingIn
  } = useTwitchAuth();

  // --- DonatePay ---
  const { 
    isDpAuthenticated, 
    setDpAuth, 
  } = useAuthStore();

  const [daError, setDaError] = useState(false);
  
  const { 
    baseCurrency, setBaseCurrency,
    rateSource, setRateSource,
    fetchRates,
    donationDisplayMode, setDonationDisplayMode
  } = useCurrencyStore();

  const [isDpWizardOpen, setIsDpWizardOpen] = useState(false);
  const prevIsDaLoggingIn = useRef(isDaLoggingIn);

  // Логика обработки ошибок DA
  useEffect(() => {
    if (isDaLoggingIn) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDaError(false);
    }
    if (prevIsDaLoggingIn.current && !isDaLoggingIn && !isDaAuthenticated) {
      setDaError(true);
    }
    prevIsDaLoggingIn.current = isDaLoggingIn;
  }, [isDaLoggingIn, isDaAuthenticated, setDaError]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  // Принудительно устанавливаем RUB, если выбрано что-то другое
  useEffect(() => {
    if (baseCurrency !== 'RUB') {
      setBaseCurrency('RUB');
    }
  }, [baseCurrency, setBaseCurrency]);

  const handleDpConnect = (apiKey: string, region: Region) => {
    setDpAuth(true, apiKey, region);
  };

  const handleDpDisconnect = () => {
    setDpAuth(false, null, null);
  };

  return (
    <>
      <fieldset className="
        border border-[#27272a] rounded-xl p-6 mb-8 
        transition-colors duration-300 
        hover:border-[#3f3f46] 
        focus-within:border-[#9147ff] 
        focus-within:hover:border-[#9147ff]
      ">
        <legend className="px-2 text-[#9147ff] font-bold text-xs uppercase tracking-wider ml-[-10px]">Подключенные сервисы</legend>
        <div className="grid grid-cols-3 gap-3">
          {/* TWITCH CARD (Обновлено) */}
          <IntegrationCard 
            type="twitch" 
            name="Twitch (Скоро)" 
            // Меняем статус и действия на реальные из хука
            status={'В разработке'} 
            connected={isTwitchAuthenticated}
            isLoggingIn={isTwitchLoggingIn}
            onConnect={loginTwitch}
            onDisconnect={logoutTwitch}
            isDisabled={true}
          />

          <IntegrationCard 
            type="da" 
            name="DonationAlerts" 
            iconSrc="/roulette/donationalerts-icon.svg"
            status={daError && !isDaAuthenticated ? 'Ошибка подключения' : isDaAuthenticated ? 'Активно' : 'Не настроено'} 
            connected={isDaAuthenticated}
            hasError={daError && !isDaAuthenticated}
            isLoggingIn={isDaLoggingIn}
            onConnect={loginDa}
            onDisconnect={logoutDa}
          />

          <IntegrationCard 
            type="dp" 
            name="DonatePay" 
            iconSrc="/roulette/logo-donatepay-mini.svg"
            status={isDpAuthenticated ? 'Активно' : 'Не настроено'}
            connected={isDpAuthenticated}
            onConnect={() => setIsDpWizardOpen(true)}
            onDisconnect={handleDpDisconnect}
          />
        </div>
      </fieldset>

      {/* Секция настроек валюты осталась без изменений */}
      <fieldset className="
        border border-[#27272a] rounded-xl p-6 mb-8 
        transition-colors duration-300 
        hover:border-[#3f3f46] 
        focus-within:border-[#9147ff] 
        focus-within:hover:border-[#9147ff]
      ">
        <legend className="px-2 text-[#9147ff] font-bold text-xs uppercase tracking-wider ml-[-10px]">
          <CurrencyCircleDollar weight="bold" className="mr-1 align-middle inline-block" /> Финансы и Валюта
        </legend>
        
        <div className="grid grid-cols-3 gap-5 mb-5">
           <div className="flex flex-col gap-2">
             <span className="relative group/tooltip w-max text-[13px] font-medium text-[#ccc] border-b border-dashed border-[#71717a] cursor-help hover:text-white hover:border-[#9147ff] transition-colors">
                Валюта в списке
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-[#141416] border border-[#27272a] rounded-md text-[11px] text-[#e4e4e7] text-center font-normal opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 shadow-xl z-50 pointer-events-none">
                  В каком виде показывать донаты в ленте событий.
                </span>
             </span>
             
             <CustomSelect 
               value={donationDisplayMode}
               onChange={(val) => setDonationDisplayMode(val as DonationDisplayMode)}
               options={[
                  { value: 'converted', label: 'Конвертировать' },
                  { value: 'original', label: 'Оригинальная' }
               ]}
             />
           </div>
           
           <div className="flex flex-col gap-2">
             <span className="relative group/tooltip w-max text-[13px] font-medium text-[#ccc] border-b border-dashed border-[#71717a] cursor-help hover:text-white hover:border-[#9147ff] transition-colors">
                Базовая валюта
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-[#141416] border border-[#27272a] rounded-md text-[11px] text-[#e4e4e7] text-center font-normal opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 shadow-xl z-50 pointer-events-none">
                  В этой валюте отображаются суммы в списке лотов. При добавлении доната в аукцион, сумма будет автоматически конвертироваться в эту валюту.
                </span>
             </span>

             <CustomSelect 
               value={baseCurrency}
               disabled={true}
               onChange={(val) => setBaseCurrency(val as CurrencyCode)}
               options={[{ value: 'RUB', label: 'Российский рубль (RUB)' }]}
             />
           </div>

           <div className="flex flex-col gap-2">
             <label className="text-[13px] font-medium text-[#ccc]">Курс валют</label>
             <CustomSelect 
               value={rateSource}
               onChange={(val) => setRateSource(val as RateSource)}
               options={[
                  { value: 'auto', label: 'Авто (ЦБ РФ)' },
                  { value: 'custom', label: 'Свой курс' }
               ]}
             />
           </div>
        </div>

        {rateSource === 'custom' && <CurrencyGrid baseCurrency={baseCurrency} />}
      </fieldset>

      <DonatePayWizardModal 
        isOpen={isDpWizardOpen}
        onClose={() => setIsDpWizardOpen(false)}
        onConnect={handleDpConnect}
      />
    </>
  );
};