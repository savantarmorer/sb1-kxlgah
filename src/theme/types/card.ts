import { CardProps } from '@mui/material';

declare module '@mui/material/Card' {
  interface CardPropsVariantOverrides {
    glass: true;
    gradient: true;
  }

  interface CardProps {
    interactive?: boolean;
    hoverable?: boolean;
  }
}

export type ExtendedCardProps = CardProps & {
  interactive?: boolean;
  hoverable?: boolean;
}; 