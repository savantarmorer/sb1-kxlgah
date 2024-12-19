import React, { createContext, useContext, useState, useEffect } from 'react';
import { PaletteMode } from '@mui/material';

type ColorMode = PaletteMode;

interface ColorModeContextType {
  mode: ColorMode;
  toggleColorMode: () => void;
}

const ColorModeContext = createContext<ColorModeContextType | undefined>(undefined);

export const useColorMode = () => {
  const context = useContext(ColorModeContext);
  if (context === undefined) {
    throw new Error('useColorMode must be used within a ColorModeProvider');
  }
  return context;
};

interface ColorModeProviderProps {
  children: React.ReactNode;
}

export function ColorModeProvider({ children }: ColorModeProviderProps) {
  const [mode, setMode] = useState<ColorMode>(() => {
    // Try to get the saved theme from localStorage
    const savedMode = localStorage.getItem('theme') as ColorMode;
    // Check if the user prefers dark mode
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return savedMode || (prefersDark ? 'dark' : 'light');
  });

  useEffect(() => {
    // Save theme preference to localStorage
    localStorage.setItem('theme', mode);
    // Update the document's color scheme
    document.documentElement.setAttribute('data-theme', mode);
    // Update the color-scheme meta tag
    document.documentElement.style.colorScheme = mode;
  }, [mode]);

  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const value = React.useMemo(
    () => ({
      mode,
      toggleColorMode,
    }),
    [mode]
  );

  return (
    <ColorModeContext.Provider value={value}>
      {children}
    </ColorModeContext.Provider>
  );
} 