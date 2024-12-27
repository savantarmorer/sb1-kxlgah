import React, { useState, useCallback, useEffect } from 'react';
import { BattlePhase } from '../types/battle';
import { BattleService } from '../services/battleService';
import { BattleStateEnum } from '../types/battle';
import { useGame } from '../contexts/game/gameContext';

const useBattle = () => {
  const { getPhase, setPhase } = BattleService;
  const { state, dispatch } = useGame();
  const phase = state.battle.phase;

  useEffect(() => {
    setPhase(BattleStateEnum.PREPARING);
  }, []);

  const isValidTransition = validatePhaseTransition(currentPhase, newPhase);
  if (isValidTransition) {
    setPhase(newPhase);
  } else {
    console.error(`Invalid phase transition from ${currentPhase} to ${newPhase}`);
  }

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

  return { getPhase, setPhase };
};

export default useBattle; 