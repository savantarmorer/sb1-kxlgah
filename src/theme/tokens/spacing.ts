export const spacing = {
  unit: 0.25, // 4px base unit
  layout: {
    page: 6, // 24px
    element: 4, // 16px
    section: 8, // 32px
  },
  component: {
    sm: 2, // 8px
    md: 3, // 12px
    lg: 4, // 16px
  }
} as const;

export type SpacingTokens = typeof spacing; 