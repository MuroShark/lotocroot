import type { PersistStorage, StorageValue } from 'zustand/middleware';

/**
 * "Пустое" хранилище, которое используется на стороне сервера,
 * где localStorage недоступен. Оно ничего не делает.
 */
const dummyStorage: PersistStorage<unknown> = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

/**
 * Безопасное хранилище для Zustand, которое использует localStorage на клиенте
 * и "пустышку" на сервере, чтобы избежать ошибок во время SSR.
 */
export const safeLocalStorage: PersistStorage<unknown> = typeof window !== 'undefined' ? {
  getItem: (name: string): StorageValue<unknown> | null => {
    const str = localStorage.getItem(name);
    if (!str) {
      return null;
    }
    // localStorage хранит строки, поэтому нужно распарсить их обратно в StorageValue
    return JSON.parse(str) as StorageValue<unknown>;
  },
  setItem: (name: string, value: StorageValue<unknown>): void => {
    // localStorage хранит строки, поэтому нужно сериализовать StorageValue
    localStorage.setItem(name, JSON.stringify(value));
  },
  removeItem: (name: string): void => {
    localStorage.removeItem(name);
  },
}
  : dummyStorage;