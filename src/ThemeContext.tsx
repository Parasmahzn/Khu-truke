import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { storeGet, storeSet } from './storage';
import { COLORS, DARK_COLORS, Colors } from './theme';

type ThemeContextValue = { isDark: boolean; colors: Colors; toggleDark: () => void };

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  colors: COLORS,
  toggleDark: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    storeGet('@pw/darkMode')
      .then((v) => { if (v === '1') setIsDark(true); })
      .catch(() => {});
  }, []);

  const toggleDark = useCallback(() => {
    setIsDark((v) => {
      const next = !v;
      storeSet('@pw/darkMode', next ? '1' : '0').catch(() => {});
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark, colors: isDark ? DARK_COLORS : COLORS, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useColors = (): Colors => useContext(ThemeContext).colors;
export const useTheme = (): ThemeContextValue => useContext(ThemeContext);
