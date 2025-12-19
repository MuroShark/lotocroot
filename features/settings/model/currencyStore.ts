import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safeLocalStorage } from '@/shared/lib/storage';

export type RateSource = 'auto' | 'custom';
export type DonationDisplayMode = 'original' | 'converted';
export type CurrencyCode = 'RUB' | 'USD' | 'EUR' | 'UAH' | 'BYN' | 'KZT' | 'TRY' | 'PLN' | 'BRL';

interface Rates {
  [key: string]: number; // e.g. { 'USD': 92.50, 'EUR': 100.20 }
}

interface CurrencyState {
  baseCurrency: CurrencyCode;
  rateSource: RateSource;
  autoRates: Rates;
  customRates: Rates;
  lastUpdated: number | null;
  donationDisplayMode: DonationDisplayMode;
  setBaseCurrency: (currency: CurrencyCode) => void;
  setRateSource: (source: RateSource) => void;
  setCustomRate: (currency: CurrencyCode, rate: number) => void;
  setDonationDisplayMode: (mode: DonationDisplayMode) => void;
  fetchRates: () => Promise<void>;
}

const CBR_API_URL = 'https://www.cbr-xml-daily.ru/daily_json.js';

export const useCurrencyStore = create<CurrencyState>()(persist(
  (set, get) => ({
    baseCurrency: 'RUB',
    rateSource: 'auto',
    autoRates: {},
    customRates: {},
    lastUpdated: null,
    donationDisplayMode: 'original',

    setBaseCurrency: (currency) => set({ baseCurrency: currency }),
    setRateSource: (source) => set({ rateSource: source }),
    setCustomRate: (currency, rate) => set(state => ({
      customRates: { ...state.customRates, [currency]: rate }
    })),
    setDonationDisplayMode: (mode) => set({ donationDisplayMode: mode }),

    fetchRates: async () => {
      const { lastUpdated } = get();
      const oneDay = 24 * 60 * 60 * 1000;

      // Не обновляем, если данные свежие (меньше 24 часов)
      if (lastUpdated && (Date.now() - lastUpdated < oneDay)) {
        console.log('Currency rates are up to date.');
        return;
      }

      try {
        console.log('Fetching currency rates from CBR...');
        const response = await fetch(CBR_API_URL);
        if (!response.ok) throw new Error('Failed to fetch rates from CBR');
        
        const data = await response.json();
        const valute = data.Valute;

        const newRates: Rates = { RUB: 1 }; // Добавляем рубль как базовую единицу
        for (const key in valute) {
          newRates[key] = valute[key].Value / valute[key].Nominal;
        }

        set({ autoRates: newRates, lastUpdated: Date.now() });
        console.log('Successfully updated currency rates.');

      } catch (error) {
        console.error("Error fetching currency rates:", error);
        // В случае ошибки можно оставить старые курсы, если они есть
      }
    },
  }),
  {
    name: 'rouletta-currency-storage',
    storage: safeLocalStorage,
  }
));