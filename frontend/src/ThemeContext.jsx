import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
  theme: 'neon-quantum',
  setTheme: () => {},
  motionMode: 'full',
  setMotionMode: () => {},
});

/** @returns {{ theme: string, setTheme: (t: string) => void }} */
// eslint-disable-next-line react-refresh/only-export-components -- hook paired with provider in one module
export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('app-theme');
    if (saved === 'deep-space') return 'neon-quantum';
    if (saved === 'corporate-clean') return 'aurora-frost';
    return saved || 'neon-quantum';
  });
  const [motionMode, setMotionMode] = useState(() => {
    const saved = localStorage.getItem('motion-mode');
    return saved === 'reduced' ? 'reduced' : 'full';
  });

  useEffect(() => {
    localStorage.setItem('app-theme', theme);
    localStorage.setItem('motion-mode', motionMode);
    const root = window.document.documentElement;
    root.classList.remove(
      'deep-space',
      'corporate-clean',
      'neon-quantum',
      'aurora-frost',
      'dark',
      'light',
      'reduced-motion'
    );
    root.classList.add(theme);
    if (motionMode === 'reduced') {
      root.classList.add('reduced-motion');
    }
    // Since some Tailwind utilities like standard `dark:` rely on the "dark" class:
    if (theme === 'neon-quantum') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else if (theme === 'aurora-frost') {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [theme, motionMode]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, motionMode, setMotionMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
