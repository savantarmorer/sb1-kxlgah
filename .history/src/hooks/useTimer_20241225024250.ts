import { useState, useEffect, useCallback, useRef } from 'react';

export function useTimer(initialDuration: number, onComplete?: () => void) {
  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setTimeLeft(initialDuration);
  }, [initialDuration]);

  const startTimer = useCallback(() => {
    setIsActive(true);
  }, []);

  const pauseTimer = useCallback(() => {
    setIsActive(false);
  }, []);

  const resetTimer = useCallback(() => {
    setTimeLeft(initialDuration);
    setIsActive(false);
  }, [initialDuration]);

  const getTimeBonus = useCallback(() => {
    return timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    if (!isActive) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timerRef.current);
          setIsActive(false);
          onComplete?.();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, onComplete]);

  return {
    timeLeft,
    isActive,
    startTimer,
    pauseTimer,
    resetTimer,
    getTimeBonus
  };
} 