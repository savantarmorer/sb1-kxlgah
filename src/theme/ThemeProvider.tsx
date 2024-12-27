import React from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { lightTheme, darkTheme } from './mui';
import { ThemeProvider as CustomThemeProvider, useTheme } from '../contexts/ThemeContext';

interface ThemeProviderProps {
  children: React.ReactNode;
}

function ThemedApp({ children }: ThemeProviderProps) {
  const { theme } = useTheme();
  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;

  return (
    <MuiThemeProvider theme={currentTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <CustomThemeProvider>
      <ThemedApp>{children}</ThemedApp>
    </CustomThemeProvider>
  );
} 