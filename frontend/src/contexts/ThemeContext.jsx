import React, { createContext, useContext, useEffect } from 'react';
import { useThemeStore } from '@store/theme.store';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const theme = useThemeStore();

  useEffect(() => {
    theme.initializeTheme();
  }, []);

  useEffect(() => {
    if (theme.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    document.documentElement.style.setProperty('--logsys-primary', theme.primaryColor);
  }, [theme.theme, theme.primaryColor]);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};