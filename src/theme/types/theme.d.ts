import { Theme as MuiTheme } from '@mui/material/styles';
import { ThemeConfig } from '..';

declare module '@mui/material/styles' {
  interface Theme extends AppTheme {}
  interface ThemeOptions extends Partial<AppTheme> {}
}

export interface AppTheme extends MuiTheme, ThemeConfig {
  spacing: {
    unit: number;
    layout: {
      page: number;
      element: number;
      section: number;
    };
    component: {
      sm: number;
      md: number;
      lg: number;
    };
  };
  colors: {
    brand: {
      primary: Record<number, string>;
      secondary: Record<number, string>;
    };
    dark: {
      background: {
        default: string;
        paper: string;
      };
      text: {
        primary: string;
        secondary: string;
      };
      border: string;
    };
    light: {
      background: {
        default: string;
        paper: string;
      };
      text: {
        primary: string;
        secondary: string;
      };
      border: string;
    };
    neutral: {
      white: string;
      black: string;
      [key: number]: string;
    };
    semantic: {
      error: {
        main: string;
        light: string;
        dark: string;
      };
      warning: {
        main: string;
        light: string;
        dark: string;
      };
      info: {
        main: string;
        light: string;
        dark: string;
      };
      success: {
        main: string;
        light: string;
        dark: string;
      };
    };
  };
  shadow: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    glow: (color: string) => string;
  };
} 