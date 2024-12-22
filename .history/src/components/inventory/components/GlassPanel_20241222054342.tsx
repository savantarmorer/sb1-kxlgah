import { memo } from 'react';
import { cardStyles } from '../styles/rarity';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const GlassPanel = memo(({ children, className = "", style }: GlassPanelProps) => (
  <div 
    className={`${cardStyles.glassPanel} ${className}`}
    style={style}
  >
    {children}
  </div>
)); 