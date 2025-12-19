import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { useLotsStore, type Lot } from '@/entities/lot/model/store/lotsStore';

export interface Profile {
  id: string;
  name: string;
  lots: Lot[];
  createdAt: string;
  updatedAt:string;
  isDefault?: boolean;
}

interface ProfilesState {
  profiles: Profile[];
  addProfile: (name?: string, lots?: Lot[]) => void;
  deleteProfile: (id: string) => void;
  updateProfileName: (id: string, name: string) => void;
  saveLotsToProfile: (id: string, lots: Lot[]) => void;
  importProfile: (profileData: Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initializeProfiles: () => void;
}

const createNewProfile = (name: string, lots: Lot[] = []): Profile => {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    name,
    lots,
    createdAt: now,
    updatedAt: now,
  };
};

export const useProfilesStore = create<ProfilesState>()(persist(
  (set, get) => ({
    profiles: [],

    initializeProfiles: () => {
      const { profiles } = get();
      if (profiles.find(p => p.isDefault)) return;

      const now = new Date().toISOString();
      const autosaveProfile: Profile = {
        id: 'autosave',
        name: 'Автосохранение',
        lots: [],
        createdAt: now,
        updatedAt: now,
        isDefault: true,
      };
      set({ profiles: [autosaveProfile, ...profiles] });
    },

    addProfile: (name, lots?) => {
      // Если лоты не переданы явно, берем текущие из useLotsStore
      const lotsToSave = lots ?? useLotsStore.getState().lots;
      // Если имя не передано, генерируем его
      const profileName = name ?? `Новое сохранение ${get().profiles.filter(p => !p.isDefault).length + 1}`;
      const newProfile = createNewProfile(profileName, lotsToSave);
      set(state => ({ profiles: [...state.profiles, newProfile] }));
    },

    deleteProfile: (id) => {
      set(state => ({
        profiles: state.profiles.filter(p => p.id !== id),
      }));
    },

    updateProfileName: (id, name) => {
      set(state => ({
        profiles: state.profiles.map(p =>
          p.id === id ? { ...p, name, updatedAt: new Date().toISOString() } : p
        ),
      }));
    },

    saveLotsToProfile: (id, lots) => {
      // Теперь пустые лоты сохраняются для всех профилей, включая автосохранение,
      // согласно запросу пользователя.
      const lotsToSave = lots;
      set(state => ({
        profiles: state.profiles.map(p =>
          p.id === id ? { ...p, lots: lotsToSave, updatedAt: new Date().toISOString() } : p
        ),
      }));
    },

    importProfile: (profileData) => {
      const newProfile = createNewProfile(profileData.name, profileData.lots);
      set(state => ({
        profiles: [...state.profiles, newProfile],
      }));
    },
  }),
  {
    name: 'rouletta-profiles-storage',
  }
));

// Инициализация профилей при первой загрузке приложения
useProfilesStore.getState().initializeProfiles();

// Подписываемся на изменения в useLotsStore для автосохранения
useLotsStore.subscribe(
  (state) => {
    useProfilesStore.getState().saveLotsToProfile('autosave', state.lots);
  }
);