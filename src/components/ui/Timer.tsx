import React, { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';

export interface TimerProps {
  duration: number;
  onTick?: () => void;
  onComplete?: () => void;
  className?: string;
}

export function Timer({ duration, onTick, onComplete, className }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete?.();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
          onComplete?.();
        }
        onTick?.();
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, onComplete, onTick]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const color = timeLeft <= 10 ? 'text-red-500' : timeLeft <= 30 ? 'text-yellow-500' : 'text-green-500';

  return (
    <div className={cn('font-mono text-lg font-bold', color, className)}>
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  );
} 