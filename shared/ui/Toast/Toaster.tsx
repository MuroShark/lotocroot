"use client";
import React from 'react';
import { create } from 'zustand';
import { AnimatePresence } from 'framer-motion';
import { Toast, ToastProps } from './Toast';

type ToastOptions = Omit<ToastProps, 'id' | 'onDismiss'> & { id?: string };

interface ToasterState {
  toasts: ToastProps[];
  addToast: (options: ToastOptions) => void;
  resetToastTimer: (id: string, newDuration: number) => void;
  dismissToast: (id: string) => void;
}

export const useToasterStore = create<ToasterState>((set) => ({
  toasts: [],
  addToast: (options) => {
    const id = options.id || new Date().toISOString() + Math.random().toString();
    set((state) => ({
      toasts: [...state.toasts, { ...options, id, onDismiss: () => useToasterStore.getState().dismissToast(id) }],
    }));
  },
  resetToastTimer: (id, newDuration) => {
    set(state => ({
      toasts: state.toasts.map(t =>
        t.id === id ? { ...t, duration: newDuration, renderKey: Math.random() } : t // Используем renderKey вместо key
      ),
    }));
  },
  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

export const Toaster: React.FC = () => {
  const { toasts, dismissToast } = useToasterStore();

  return (
    <div className="flex flex-col items-end gap-[10px]">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.renderKey || toast.id} {...toast} onDismiss={dismissToast} />
        ))}
      </AnimatePresence>
    </div>
  );
};