import React, { useState, useCallback, useEffect } from 'react';
import { BattlePhase, BattleStateEnum } from '../types/battle';
import { BattleService } from '../services/battleService';
import { useGame } from '../contexts/game/gameContext';

const useBattle = () => {
  const { getPhase } = BattleService;
  const { state, dispatch } = useGame();
  const [phase, setPhase] = useState<BattleStateEnum>(BattleStateEnum.INITIALIZING);

  // Validate phase transitions
  const validatePhaseTransition = useCallback((currentPhase: BattleStateEnum, newPhase: BattleStateEnum): boolean => {
    const validTransitions: Record<BattleStateEnum, BattleStateEnum[]> = {
      [BattleStateEnum.IDLE]: [BattleStateEnum.INITIALIZING, BattleStateEnum.ERROR],
      [BattleStateEnum.INITIALIZING]: [BattleStateEnum.PREPARING, BattleStateEnum.ERROR],
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
      [BattleStateEnum.ACTIVE]: [BattleStateEnum.DEALING, BattleStateEnum.COMPLETED, BattleStateEnum.ERROR]
    };

    const isValid = validTransitions[currentPhase]?.includes(newPhase);
    if (!isValid) {
      console.error(`[useBattle] Invalid phase transition from ${currentPhase} to ${newPhase}`);
    }
    return isValid;
  }, []);

  // Set phase with validation
  const setPhaseWithValidation = useCallback(async (newPhase: BattleStateEnum): Promise<boolean> => {
    if (validatePhaseTransition(phase, newPhase)) {
      setPhase(newPhase);
      return true;
    }
    return false;
  }, [phase, validatePhaseTransition]);

  useEffect(() => {
    // Initialize battle phase with validation
    setPhaseWithValidation(BattleStateEnum.PREPARING);
  }, [setPhaseWithValidation]);

  const initializeBattle = useCallback(async (options) => {
    await BattleService.initializeBattle(options);
    // Update state as needed
  }, []);

  const applyItemEffects = useCallback((item: InventoryItem) => {
    if (item.effects.includes('eliminate_wrong_answer')) {
      // Modify current question to remove options
      removeWrongAnswers();
    }
    // Handle other effects
  }, []);

  return { phase, setPhaseWithValidation, getPhase };
};

export default useBattle;