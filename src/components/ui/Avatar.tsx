import React from 'react';
import { cn } from '@/lib/utils';

export interface AvatarProps {
  src?: string;
  alt: string;
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  text,
  size = 'md',
  className
}) => {
  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden bg-gray-200',
        {
          'w-8 h-8': size === 'sm',
          'w-12 h-12': size === 'md',
          'w-16 h-16': size === 'lg'
        },
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt={alt || 'Avatar'}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-primary text-white">
          {text ? text.charAt(0).toUpperCase() : 'U'}
        </div>
      )}
    </div>
  );
}; 