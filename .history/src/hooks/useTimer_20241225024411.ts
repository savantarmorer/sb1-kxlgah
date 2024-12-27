import { useState, useEffect, useCallback, useRef } from 'react';

export function useTimer(initialDuration: number, onComplete?: () => void) {
  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();
  const onCompleteRef = useRef(onComplete);
  const lastTickRef = useRef<number>(Date.now());

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    setTimeLeft(initialDuration);
  }, [initialDuration]);

  const startTimer = useCallback(() => {
    setIsActive(true);
    lastTickRef.current = Date.now();
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

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const delta = Math.floor((now - lastTickRef.current) / 1000);
      lastTickRef.current = now;

      setTimeLeft((prevTime) => {
        const newTime = Math.max(0, prevTime - delta);
        if (newTime === 0) {
          clearInterval(timerRef.current);
          setIsActive(false);
          onCompleteRef.current?.();
        }
        return newTime;
      });
    }, 100); // Run more frequently for better accuracy

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