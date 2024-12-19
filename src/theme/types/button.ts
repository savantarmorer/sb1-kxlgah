import { ButtonProps } from '@mui/material';

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    gradient: true;
    glass: true;
  }

  interface ButtonPropsColorOverrides {
    white: true;
  }

  interface ButtonPropsSizeOverrides {
    'extra-small': true;
    'extra-large': true;
  }

  interface ButtonProps {
    loading?: boolean;
  }
}

export type ExtendedButtonProps = ButtonProps & {
  loading?: boolean;
}; 