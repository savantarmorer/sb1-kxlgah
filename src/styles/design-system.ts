export const theme = {
  colors: {
    // Modern, accessible color palette
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
    },
    background: {
      light: '#fafafa',
      dark: '#18181b',
    },
    surface: {
      light: '#ffffff',
      dark: '#27272a',
    },
    accent: {
      success: '#22c55e',
      warning: '#eab308',
      error: '#ef4444',
      info: '#3b82f6',
    }
  },
  animation: {
    spring: {
      type: "spring",
      stiffness: 400,
      damping: 30
    },
    transition: {
      ease: [0.2, 0.0, 0.2, 1],
      duration: 0.6
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  }
}; 