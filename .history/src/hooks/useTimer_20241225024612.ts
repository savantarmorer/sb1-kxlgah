import { useState, useEffect, useCallback, useRef } from 'react';

export function useTimer(initialDuration: number, onComplete?: () => void) {
  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();
  const onCompleteRef = useRef(onComplete);
  const lastTickRef = useRef<number>(0);

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
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
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

    // Initial tick
    setTimeLeft((prevTime) => {
      if (prevTime <= 1) {
        onCompleteRef.current?.();
        return 0;
      }
      return prevTime - 1;
    });

    timerRef.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timerRef.current);
          setIsActive(false);
          onCompleteRef.current?.();
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