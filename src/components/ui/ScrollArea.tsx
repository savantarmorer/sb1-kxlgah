import React from 'react';

interface ScrollAreaProps {
  className?: string;
  children: React.ReactNode;
}

export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className = '', children }, ref) => {
    return (
      <div
        ref={ref}
        className={`relative overflow-auto ${className}`}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(155, 155, 155, 0.5) transparent'
        }}
      >
        {children}
      </div>
    );
  }
);

ScrollArea.displayName = 'ScrollArea'; 