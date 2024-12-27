import React, { useState, useCallback, useEffect } from 'react';
import { BattleStateEnum } from '../types/battle';
import { BattleService } from '../services/battleService';
import { useGame } from '../contexts/game/gameContext';

const useBattle = () => {
  const { getPhase, setPhase } = BattleService;
  const { state, dispatch } = useGame();
  const [phase, setCurrentPhase] = useState<BattleStateEnum>(BattleStateEnum.IDLE);

  useEffect(() => {
    setPhase(BattleStateEnum.PREPARING);
  }, []);

  const setPhaseWithValidation = useCallback((newPhase: BattleStateEnum) => {
    const isValidTransition = validatePhaseTransition(phase, newPhase);
    if (isValidTransition) {
      setCurrentPhase(newPhase);
    } else {
      console.error(`Invalid phase transition from ${phase} to ${newPhase}`);
    }
  }, [phase]);

  const validatePhaseTransition = (currentPhase: BattleStateEnum, newPhase: BattleStateEnum): boolean => {
    // Define valid phase transitions
    const validTransitions: Record<BattleStateEnum, BattleStateEnum[]> = {
      [BattleStateEnum.IDLE]: [BattleStateEnum.PREPARING, BattleStateEnum.ERROR],
      [BattleStateEnum.PREPARING]: [BattleStateEnum.DEALING, BattleStateEnum.ERROR],
      [BattleStateEnum.DEALING]: [BattleStateEnum.CARD_SELECTION, BattleStateEnum.ERROR],
      [BattleStateEnum.CARD_SELECTION]: [BattleStateEnum.CARD_REVEAL, BattleStateEnum.ERROR],
      [BattleStateEnum.CARD_REVEAL]: [BattleStateEnum.QUESTION, BattleStateEnum.ERROR],
      [BattleStateEnum.QUESTION]: [BattleStateEnum.RESOLUTION, BattleStateEnum.ERROR],
      [BattleStateEnum.RESOLUTION]: [BattleStateEnum.CARD_SELECTION, BattleStateEnum.COMPLETED, BattleStateEnum.ERROR],
      [BattleStateEnum.COMPLETED]: [BattleStateEnum.VICTORY, BattleStateEnum.DEFEAT, BattleStateEnum.DRAW, BattleStateEnum.ERROR],
      [BattleStateEnum.VICTORY]: [BattleStateEnum.IDLE],
      [BattleStateEnum.DEFEAT]: [BattleStateEnum.IDLE],
      [BattleStateEnum.DRAW]: [BattleStateEnum.IDLE],
      [BattleStateEnum.ERROR]: [BattleStateEnum.IDLE],
      [BattleStateEnum.INITIALIZING]: [BattleStateEnum.PREPARING, BattleStateEnum.ERROR]
    };

    return validTransitions[currentPhase]?.includes(newPhase) ?? false;
  };

  const initializeBattle = useCallback(async (options) => {
    setPhaseWithValidation(BattleStateEnum.INITIALIZING);
    try {
      await BattleService.initializeBattle(options);
      setPhaseWithValidation(BattleStateEnum.PREPARING);
    } catch (error) {
      console.error('Battle initialization failed:', error);
      setPhaseWithValidation(BattleStateEnum.ERROR);
    }
  }, [setPhaseWithValidation]);

  return {
    phase,
    setPhase: setPhaseWithValidation,
    initializeBattle,
    // ... rest of the battle state and methods
  };
};

export { useBattle };