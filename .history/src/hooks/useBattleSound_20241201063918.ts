import { useCallback } from 'react';
import { useSoundContext } from '../contexts/SoundContext';

type BattleSoundType = 'battle_start' | 'correct' | 'wrong' | 'victory' | 'defeat';

export function useBattleSound() {
  const { play_sound: playSound } = useSoundContext();
  
  const playCorrectSound = useCallback(() => {
    playSound('correct');
  }, [playSound]);

  const playWrongSound = useCallback(() => {
    playSound('wrong');
  }, [playSound]);

  return {
    play_sound: useCallback((type: BattleSoundType) => {
      playSound(type);
    }, [playSound]),
    playCorrectSound,
    playWrongSound
  };
}
