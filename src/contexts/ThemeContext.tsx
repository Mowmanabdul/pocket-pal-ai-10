import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeColor = 'emerald' | 'midnight' | 'ocean' | 'sunset' | 'lavender' | 'rose';

interface ThemeContextType {
  theme: ThemeColor;
  setTheme: (theme: ThemeColor) => void;
}

export const themeConfigs: Record<ThemeColor, { 
  name: string; 
  preview: string[];
  description: string;
}> = {
  emerald: {
    name: 'Emerald',
    preview: ['#22c55e', '#10b981', '#14b8a6'],
    description: 'Fresh & vibrant green'
  },
  midnight: {
    name: 'Midnight',
    preview: ['#1e293b', '#334155', '#475569'],
    description: 'Sleek dark mode'
  },
  ocean: {
    name: 'Ocean',
    preview: ['#0ea5e9', '#06b6d4', '#14b8a6'],
    description: 'Cool blue tones'
  },
  sunset: {
    name: 'Sunset',
    preview: ['#f97316', '#fb923c', '#fbbf24'],
    description: 'Warm orange hues'
  },
  lavender: {
    name: 'Lavender',
    preview: ['#8b5cf6', '#a78bfa', '#c4b5fd'],
    description: 'Soft purple vibes'
  },
  rose: {
    name: 'Rose',
    preview: ['#f43f5e', '#fb7185', '#fda4af'],
    description: 'Elegant pink tones'
  }
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeColor>(() => {
    const saved = localStorage.getItem('spendwise-theme');
    return (saved as ThemeColor) || 'emerald';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('spendwise-theme', theme);
  }, [theme]);

  const setTheme = (newTheme: ThemeColor) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
