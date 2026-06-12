import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const applyTheme = (theme) =>
  document.documentElement.classList.toggle('dark', theme === 'dark');

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'light',
      toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light';
        set({ theme: next });
        applyTheme(next);
      },
      initTheme: () => applyTheme(get().theme),
    }),
    {
      name: 'libas-theme',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
      },
    }
  )
);
