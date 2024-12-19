export const breakpoints = {
  // Breakpoint values (in pixels)
  values: {
    xs: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },

  // Media query helpers
  up: (key: keyof typeof breakpoints.values) => 
    `@media (min-width: ${breakpoints.values[key]}px)`,
  
  down: (key: keyof typeof breakpoints.values) => 
    `@media (max-width: ${breakpoints.values[key] - 0.05}px)`,
  
  between: (start: keyof typeof breakpoints.values, end: keyof typeof breakpoints.values) => 
    `@media (min-width: ${breakpoints.values[start]}px) and (max-width: ${breakpoints.values[end] - 0.05}px)`,

  // Commonly used breakpoint combinations
  mobile: '@media (max-width: 639.95px)',
  tablet: '@media (min-width: 640px) and (max-width: 1023.95px)',
  desktop: '@media (min-width: 1024px)',
  
  // Feature-based breakpoints
  touch: '@media (hover: none) and (pointer: coarse)',
  mouse: '@media (hover: hover) and (pointer: fine)',
  dark: '@media (prefers-color-scheme: dark)',
  light: '@media (prefers-color-scheme: light)',
  motion: '@media (prefers-reduced-motion: no-preference)',
  reduced: '@media (prefers-reduced-motion: reduce)',
} as const;

export type BreakpointTokens = typeof breakpoints; 