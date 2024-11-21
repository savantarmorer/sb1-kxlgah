import React, { createContext, useContext, useState } from 'react';

interface SoundContextType {
  volume: number;
  isMuted: boolean;
  playSound: (type: 'correct' | 'wrong' | 'victory' | 'defeat' | 'tick' | 'start') => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = () => setIsMuted(!isMuted);

  const playSound = (type: 'correct' | 'wrong' | 'victory' | 'defeat' | 'tick' | 'start') => {
    if (isMuted) return;
    // Sound playing logic here
    const audio = new Audio(`/sounds/${type}.mp3`);
    audio.volume = volume;
    audio.play().catch(console.error);
  };

  return (
    <SoundContext.Provider value={{
      volume: isMuted ? 0 : volume,
      isMuted,
      setVolume,
      toggleMute,
      playSound
    }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
} 

