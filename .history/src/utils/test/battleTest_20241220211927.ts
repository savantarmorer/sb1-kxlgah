import { useBattle } from '../../hooks/useBattle';
import { ItemEffect } from '../../types/items';

export async function testBattle() {
  const {
    initialize_battle,
    handle_item_effect,
    answer_question,
    battle: battle_state,
    get_current_question
  } = useBattle();

  try {
    // 1. Initialize battle
    await initialize_battle({
      category: 'all',
      difficulty: 'medium',
      mode: 'casual',
      is_bot: true
    });

    // 2. Wait for battle to be active
    if (battle_state?.status !== 'active') {
      throw new Error('Battle failed to initialize');
    }

    // 3. Use elimination potion
    const eliminationEffect: ItemEffect = {
      type: 'eliminate_wrong_answer',
      value: 1,
      metadata: {
        battle_only: true
      }
    };

    await handle_item_effect(eliminationEffect);

    // 4. Get current question and verify eliminated options
    const currentQuestion = get_current_question();
    const eliminatedOptions = battle_state?.metadata?.eliminated_options || [];

    console.log('Test Results:', {
      battleStatus: battle_state?.status,
      currentQuestion,
      eliminatedOptions,
      remainingOptions: ['A', 'B', 'C', 'D'].filter(opt => !eliminatedOptions.includes(opt))
    });

    return {
      success: true,
      eliminatedOptions,
      currentQuestion
    };

  } catch (error) {
    console.error('Battle test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 