import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Donation } from '@/shared/types';

interface DonationsState {
  donations: Donation[];
  addDonation: (donation: Donation) => void;
  deleteDonation: (donationId: number) => void;
  setDonations: (donations: Donation[]) => void;
}

export const useDonationsStore = create<DonationsState>()(
  persist(
    (set) => ({
      donations: [],
      addDonation: (donation) =>
        set((state) => {
          // Предотвращаем добавление дубликатов по ID
          if (state.donations.some((d) => d.id === donation.id)) return state;
          return { donations: [donation, ...state.donations] };
        }),
      deleteDonation: (donationId) => set((state) => ({ donations: state.donations.filter((d) => d.id !== donationId) })),
      setDonations: (donations) => set({ donations }),
    }),
    { name: 'rouletta-donations-storage' } // Уникальный ключ для localStorage
  )
);