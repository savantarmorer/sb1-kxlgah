import { useCallback, useEffect, useRef } from 'react';

interface SoundOptions {
  volume?: number;
  loop?: boolean;
}

export function useSound(url: string, options: SoundOptions = {}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(url);
    audioRef.current.volume = options.volume ?? 1;
    audioRef.current.loop = options.loop ?? false;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [url, options.volume, options.loop]);

  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  return { play, stop };
} 