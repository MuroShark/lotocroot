"use client";

import { useState, FC, useEffect } from 'react';
import { Check, X, CheckCircle, WarningCircle, ArrowSquareOut, Key, Eye, EyeSlash, LockKey, Spinner } from '@phosphor-icons/react';

// Индикатор шагов
const StepIndicator = ({ num, currentStep }: { num: number, currentStep: number }) => (
  <div className={`
    w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
    ${currentStep > num ? 'bg-[#10b981] text-white' : ''}
    ${currentStep === num ? 'bg-[#9147ff] text-white shadow-[0_0_10px_rgba(145,71,255,0.4)]' : ''}
    ${currentStep < num ? 'bg-[#333] text-[#888]' : ''}
  `}>
    {currentStep > num ? <Check weight="bold" /> : num}
  </div>
);

interface DonatePayWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (apiKey: string, region: Region, userId?: number | string) => void;
}

export type Region = 'ru' | 'eu';

export const DonatePayWizardModal: FC<DonatePayWizardModalProps> = ({ isOpen, onClose, onConnect }) => {
  const [step, setStep] = useState(1);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [isKeyVisible, setIsKeyVisible] = useState(false);

  // Состояния для валидации
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedRegion(null);
      setApiKey('');
      setIsKeyVisible(false);
      setValidationError(null);
      setIsValidating(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRegionSelect = (region: Region) => {
    setSelectedRegion(region);
  };

  const handleNextStep = () => setStep(2);
  
  const handlePrevStep = () => {
    setValidationError(null);
    setStep(1);
  };

  const handleConnect = async () => {
    if (!apiKey || !selectedRegion) return;

    // ПРОВЕРКА ДЛИНЫ НА КЛИЕНТЕ
    // Чтобы мгновенно показать ошибку, не дергая сервер
    if (apiKey.length > 60) {
      setValidationError('Неверный формат токена (слишком длинный)');
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      const response = await fetch('/api/donatepay/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey, region: selectedRegion }),
      });

      const data = await response.json();

      if (data.isValid) {
        onConnect(apiKey, selectedRegion, data.userData?.id);
        onClose();
      } else {
        // Выводим сообщение от сервера (там уже обработан "Неверный токен" и длина)
        setValidationError(data.message || 'Ошибка проверки токена');
      }
    } catch (error) {
      console.error(error);
      setValidationError('Ошибка соединения. Попробуйте позже.');
    } finally {
      setIsValidating(false);
    }
  };

  const isNextDisabled = selectedRegion === null;
  // Блокируем, если слишком короткий или идет загрузка
  const isConnectDisabled = apiKey.trim().length < 5 || isValidating;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-[4px] z-[999] flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="w-[550px] max-w-full bg-[#141416] border border-[#27272a] rounded-xl shadow-2xl flex flex-col animate-fade-slide"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center p-6 pb-2">
          <h3 className="text-[18px] font-bold text-white">Интеграция с DonatePay</h3>
          <button onClick={onClose} className="ml-auto text-[#71717a] hover:text-white transition-colors cursor-pointer">
            <X weight="bold" className="text-xl" />
          </button>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center px-6 py-5">
          <StepIndicator num={1} currentStep={step} />
          <div className="h-0.5 bg-[#333] w-16 mx-2 rounded-full relative overflow-hidden">
            <div 
              className={`absolute top-0 left-0 h-full bg-[#9147ff] transition-all duration-300 ease-out`}
              style={{ width: step === 2 ? '100%' : '0%' }}
            ></div>
          </div>
          <StepIndicator num={2} currentStep={step} />
        </div>

        {/* Body */}
        <div className="px-6 pb-6">
          {/* Step 1: Region */}
          <div className={step === 1 ? 'block' : 'hidden'}>
            <p className="text-[#71717a] text-[13px] mb-4 leading-relaxed">
              Выберите регион в зависимости от домена DonatePay, который вы используете для своего аккаунта.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Region RU */}
              <div 
                onClick={() => handleRegionSelect('ru')}
                className={`
                  relative p-4 rounded-lg border cursor-pointer transition-all duration-200 group
                  ${selectedRegion === 'ru' 
                    ? 'border-[#9147ff] bg-[#9147ff]/5 shadow-[inset_0_0_0_1px_#9147ff]' 
                    : 'border-[#27272a] bg-white/[0.02] hover:bg-white/[0.04] hover:border-[#555]'
                  }
                `}
              >
                <h4 className="font-bold text-white text-[14px] mb-1">Россия (donatepay.ru)</h4>
                <p className="text-[11px] text-[#71717a]">Выберите, если используете donatepay.ru</p>
                <CheckCircle weight="fill" className={`absolute top-3 right-3 text-[#9147ff] text-xl transition-all duration-200 ${selectedRegion === 'ru' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
              </div>

              {/* Region EU */}
              <div 
                onClick={() => handleRegionSelect('eu')}
                className={`
                  relative p-4 rounded-lg border cursor-pointer transition-all duration-200 group
                  ${selectedRegion === 'eu' 
                    ? 'border-[#9147ff] bg-[#9147ff]/5 shadow-[inset_0_0_0_1px_#9147ff]' 
                    : 'border-[#27272a] bg-white/[0.02] hover:bg-white/[0.04] hover:border-[#555]'
                  }
                `}
              >
                <h4 className="font-bold text-white text-[14px] mb-1">Европа (donatepay.eu)</h4>
                <p className="text-[11px] text-[#71717a]">Выберите, если используете donatepay.eu</p>
                <CheckCircle weight="fill" className={`absolute top-3 right-3 text-[#9147ff] text-xl transition-all duration-200 ${selectedRegion === 'eu' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
              </div>
            </div>
          </div>

          {/* Step 2: API Key */}
          <div className={step === 2 ? 'block' : 'hidden'}>
            <div className="flex items-center gap-3 bg-[#ef4444]/15 border border-[#ef4444]/30 text-[#ef4444] p-3 rounded-lg mb-4">
              <WarningCircle weight="fill" className="text-xl flex-shrink-0" />
              <p className="text-[12px] leading-snug">
                <b>Внимание, стример!</b> Скройте экран. API ключ позволяет просматривать историю донатов и управлять уведомлениями. Не показывайте его зрителям!
              </p>
            </div>

            <p className="text-[13px] text-[#71717a] mb-2">1. Получите ваш личный API-ключ на официальном сайте:</p>
            <a 
              href={selectedRegion === 'ru' ? "https://donatepay.ru/page/api" : "https://donatepay.eu/page/api"} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-between bg-[#9147ff]/5 border border-[#9147ff]/20 p-3 rounded-lg mb-4 hover:bg-[#9147ff]/10 hover:border-[#9147ff]/40 transition-all group decoration-0"
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-[#9147ff] text-[13px] flex items-center gap-1.5">
                  Страница API <ArrowSquareOut weight="bold" />
                </span>
                <span className="text-[11px] text-[#71717a] font-mono tracking-wide">
                  {selectedRegion === 'ru' ? 'donatepay.ru/page/api' : 'donatepay.eu/page/api'}
                </span>
              </div>
              <Key weight="duotone" className="text-2xl text-[#9147ff]/70 group-hover:text-[#9147ff] transition-colors" />
            </a>

            <p className="text-[13px] text-[#71717a] mb-2">2. Скопируйте поле <b>&quot;Ваш API ключ&quot;</b> и вставьте его ниже:</p>
            <div className="relative">
              <input 
                type={isKeyVisible ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                className={`
                  w-full bg-[#202024] border text-white px-3 h-10 rounded-md text-[13px] 
                  focus:outline-none font-mono tracking-wider pr-10 transition-colors placeholder:text-[#555]
                  ${validationError 
                    ? 'border-[#ef4444] focus:border-[#ef4444]' 
                    : 'border-[#333] focus:border-[#9147ff]'
                  }
                `}
                placeholder="Вставьте API ключ..."
              />
              <button 
                onClick={() => setIsKeyVisible(!isKeyVisible)}
                className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center text-[#71717a] hover:text-white transition-colors cursor-pointer"
              >
                {isKeyVisible ? <EyeSlash weight="bold" /> : <Eye weight="bold" />}
              </button>
            </div>

            {/* Ошибка валидации */}
            {validationError && (
              <div className="mt-2 flex items-start gap-2 text-[#ef4444] text-[12px] animate-fade-in">
                 <WarningCircle weight="bold" className="mt-[1px]" />
                 <span>{validationError}</span>
              </div>
            )}

            <div className="flex items-start gap-3 bg-[#10b981]/5 border border-[#10b981]/20 p-3 rounded-lg mt-4">
              <LockKey weight="bold" className="text-[#34d399] text-lg mt-0.5" />
              <p className="text-[12px] text-[#d1fae5] leading-snug opacity-80">
                Ключ сохраняется <u>только в браузере</u>. Мы не имеем доступа к вашему аккаунту.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 bg-[#18181b] border-t border-[#27272a] p-4 rounded-b-xl">
          {step === 1 && (
            <>
              <div />
              <button 
                onClick={handleNextStep}
                disabled={isNextDisabled}
                className="px-4 py-2 rounded-md text-[13px] font-semibold bg-[#9147ff] text-white border border-[#9147ff] hover:bg-[#7c3aed] disabled:bg-[#3f3f46] disabled:border-[#3f3f46] disabled:text-[#a1a1aa] disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Далее
              </button>
            </>
          )}
          {step === 2 && (
            <>
              <button 
                onClick={handlePrevStep}
                disabled={isValidating}
                className="px-4 py-2 rounded-md text-[13px] font-semibold bg-transparent text-[#71717a] border border-[#333] hover:bg-white/5 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                Назад
              </button>
              <button 
                onClick={handleConnect}
                disabled={isConnectDisabled}
                className="px-4 py-2 rounded-md text-[13px] font-semibold bg-[#9147ff] text-white border border-[#9147ff] hover:bg-[#7c3aed] disabled:opacity-70 disabled:cursor-not-allowed transition-colors min-w-[110px] flex justify-center items-center gap-2"
              >
                {isValidating ? (
                  <>
                    <Spinner weight="bold" className="animate-spin" />
                    <span>Проверка</span>
                  </>
                ) : (
                  'Подключить'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};