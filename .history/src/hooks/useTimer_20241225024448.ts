import { useState, useEffect, useCallback, useRef } from 'react';

export function useTimer(initialDuration: number, onComplete?: () => void) {
  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

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
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [initialDuration]);

  const getTimeBonus = useCallback(() => {
    return timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      return;
    }

    const tick = () => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 0) {
          clearInterval(timerRef.current);
          setIsActive(false);
          onCompleteRef.current?.();
          return 0;
        }
        return prevTime - 1;
      });
    };

    // Initial tick to start immediately
    tick();
    timerRef.current = setInterval(tick, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive]);

  return {
    timeLeft,
    isActive,
    startTimer,
    pauseTimer,
    resetTimer,
    getTimeBonus
  };
} 