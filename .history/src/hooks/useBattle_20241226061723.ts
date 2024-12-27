import { useCallback, useState, useEffect } from 'react';
import { BattleStateEnum } from '../types/battle';
import { BattleService } from '../services/battleService';
import { BattleRewards } from '../types/battle';

const useBattle = () => {
  const [phase, setPhase] = useState<BattleStateEnum>(BattleStateEnum.IDLE);
  const [rewards, setRewards] = useState<BattleRewards | null>(null);
  
  const setPhaseWithValidation = useCallback((newPhase: BattleStateEnum) => {
    // Add any necessary validation for phase transitions here
    setPhase(newPhase);
  }, []);
  
  // Example usage of BattleService to handle phase transitions
  const initializeBattle = useCallback(async (options) => {
    try {
      setPhaseWithValidation(BattleStateEnum.PREPARING);
      await BattleService.initializeBattle(options);
      setPhaseWithValidation(BattleStateEnum.ACTIVE);
    } catch (error) {
      setPhaseWithValidation(BattleStateEnum.ERROR);
    }
  }, [setPhaseWithValidation]);

  // Additional functions and logic...

  return { 
    phase, 
    setPhase, 
    setPhaseWithValidation, 
    initializeBattle,
    rewards,
    setRewards
    // ...other returned values
  };
};

export default useBattle;