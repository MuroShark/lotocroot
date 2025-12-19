import React from 'react';

const CURRENCIES = [
    { code: 'USD', symbol: '$', name: 'Доллар США', defaultRate: 92.50 },
    { code: 'EUR', symbol: '€', name: 'Евро', defaultRate: 100.20 },
    { code: 'RUB', symbol: '₽', name: 'Российский рубль', defaultRate: 1 }, // Добавил RUB в список, чтобы он мог быть отфильтрован, если выбран как базовый
    { code: 'UAH', symbol: '₴', name: 'Украинская гривна', defaultRate: 2.45 },
    { code: 'BYN', symbol: 'Br', name: 'Белорусский рубль', defaultRate: 28.50 },
    { code: 'KZT', symbol: '₸', name: 'Казахстанский тенге', defaultRate: 0.20 },
    { code: 'TRY', symbol: '₺', name: 'Турецкая лира', defaultRate: 2.80 },
    { code: 'PLN', symbol: 'zł', name: 'Польский злотый', defaultRate: 23.40 },
    { code: 'BRL', symbol: 'R$', name: 'Бразильский реал', defaultRate: 18.10 },
];

interface CurrencyGridProps {
  baseCurrency: string;
}

export const CurrencyGrid: React.FC<CurrencyGridProps> = ({ baseCurrency }) => {
    // Фильтруем список: убираем ту валюту, которая сейчас выбрана как базовая
    const displayCurrencies = CURRENCIES.filter(c => c.code !== baseCurrency);

    return (
        <div className="bg-[#18181b] rounded-lg border border-white/5 p-4 mt-4 animate-fade-slide">
            <div className="flex justify-between items-center mb-3 px-2">
                <span className="text-[11px] uppercase text-[#71717a] font-bold">Валюта / Курс к базовой</span>
                <span className="text-[10px] text-[#71717a] opacity-50">(Изменяйте значения вручную)</span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {displayCurrencies.map(curr => (
                    <div key={curr.code} className="flex items-center justify-between p-1.5 rounded-md hover:bg-white/5 hover:border-white/5 border border-transparent transition-colors group">
                        <div className="flex items-center gap-2.5 font-semibold text-[13px] text-white">
                            <span className="font-mono text-[11px] text-[#71717a] font-bold w-8">{curr.code}</span>
                            {curr.name}
                        </div>
                        <div className="flex items-center justify-end gap-1.5">
                            <span className="text-xs text-[#71717a] font-mono">1 {curr.symbol} =</span>
                            <input 
                                type="number" 
                                defaultValue={curr.defaultRate} 
                                className="bg-[#202024] border border-[#333] text-white px-2 h-[30px] rounded text-[13px] w-[90px] focus:border-[#9147ff] focus:outline-none transition-colors text-right"
                            />
                            {/* Отображаем текущую базовую валюту вместо хардкода RUB */}
                            <span className="font-mono text-[10px] text-[#9147ff] bg-[#9147ff]/15 px-1 py-0.5 rounded font-bold">
                                {baseCurrency}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};