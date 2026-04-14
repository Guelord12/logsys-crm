import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'light',
      primaryColor: '#4A90E2',
      
      setTheme: (theme) => {
        set({ theme });
        
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        
        localStorage.setItem('theme', theme);
      },
      
      setPrimaryColor: (color) => {
        set({ primaryColor: color });
        document.documentElement.style.setProperty('--logsys-primary', color);
      },
      
      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        get().setTheme(newTheme);
      },
      
      initializeTheme: () => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        get().setTheme(savedTheme);
      }
    }),
    {
      name: 'logsys-theme-storage',
      partialize: (state) => ({
        theme: state.theme,
        primaryColor: state.primaryColor
      })
    }
  )
);