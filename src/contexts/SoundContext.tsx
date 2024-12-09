import React, { createContext, useContext, useState, useCallback } from 'react';

// Expanded sound types to match all available sounds
export type SoundType = 
  | 'battle_start'
  | 'correct'
  | 'wrong'
  | 'victory'
  | 'defeat'
  | 'complete'
  | 'tick';

interface SoundContextType {
  volume: number;
  isMuted: boolean;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  play_sound: (type: SoundType) => Promise<void>;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

// Cache for loaded sound objects
const loadedSounds = new Map<string, HTMLAudioElement>();

// Map of all available sounds
const SOUND_PATHS: Record<SoundType, string> = {
  battle_start: '/sounds/battle-start.mp3',
  correct: '/sounds/correct.mp3',
  wrong: '/sounds/wrong.mp3',
  victory: '/sounds/victory.mp3',
  defeat: '/sounds/defeat.mp3',
  complete: '/sounds/complete.mp3',
  tick: '/sounds/tick.mp3'
};

// Preload sounds to check for issues
async function preloadSound(type: SoundType): Promise<HTMLAudioElement | null> {
  const soundPath = SOUND_PATHS[type];
  try {
    const audio = new Audio(soundPath);
    await audio.load(); // Force load to check for errors
    return audio;
  } catch (error) {
    console.error(`Failed to preload sound: ${type} at path ${soundPath}`, error);
    return null;
  }
}

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [volume, setVolumeState] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize sounds on mount
  React.useEffect(() => {
    const initSounds = async () => {
      for (const type of Object.keys(SOUND_PATHS) as SoundType[]) {
        const audio = await preloadSound(type);
        if (audio) {
          loadedSounds.set(SOUND_PATHS[type], audio);
        }
      }
      setIsInitialized(true);
    };

    initSounds();
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    
    // Update volume for all cached sounds
    loadedSounds.forEach(sound => {
      sound.volume = clampedVolume;
    });
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev;
      // Update all sounds when mute state changes
      loadedSounds.forEach(sound => {
        sound.volume = newMuted ? 0 : volume;
      });
      return newMuted;
    });
  }, [volume]);

  const play_sound = useCallback(async (type: SoundType): Promise<void> => {
    if (isMuted || !isInitialized) return;
    
    try {
      const soundPath = SOUND_PATHS[type];
      if (!soundPath) {
        console.warn(`No sound path defined for type: ${type}`);
        return;
      }

      // Try to get cached sound
      let sound = loadedSounds.get(soundPath);
      
      if (!sound) {
        // Try to load sound if not cached
        sound = await preloadSound(type);
        if (!sound) {
          console.warn(`Failed to load sound: ${type}`);
          return;
        }
        loadedSounds.set(soundPath, sound);
      }

      sound.volume = volume;
      sound.currentTime = 0;
      
      try {
        await sound.play();
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === 'NotSupportedError' || error.name === 'NotAllowedError') {
            // Sound file missing or wrong format - remove from cache
            loadedSounds.delete(soundPath);
            console.warn(`Failed to play sound: ${type} - Sound file may be missing or in wrong format`);
          } else {
            console.warn(`Failed to play sound: ${type}`, error);
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to initialize sound: ${type}`, error);
    }
  }, [volume, isMuted, isInitialized]);

  const value = {
    volume: isMuted ? 0 : volume,
    isMuted,
    setVolume,
    toggleMute,
    play_sound
  };

  return (
    <SoundContext.Provider value={value}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSoundContext() {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error('useSoundContext must be used within a SoundProvider');
  }
  return context;
}
