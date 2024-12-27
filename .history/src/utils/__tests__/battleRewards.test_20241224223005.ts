import { calculateBattleRewards } from '../battleRewards';

describe('Battle Rewards Calculation', () => {
  it('calculates base rewards for correct answer', () => {
    const rewards = calculateBattleRewards(true, 30, 0, 'medium');
    expect(rewards.total_xp).toBe(225); // Base 150 + 50% time bonus
    expect(rewards.total_coins).toBe(112); // Half of XP rounded down
  });

  it('gives no rewards for wrong answer', () => {
    const rewards = calculateBattleRewards(false, 30, 0, 'medium');
    expect(rewards.total_xp).toBe(0);
    expect(rewards.total_coins).toBe(0);
  });

  it('applies time bonus correctly', () => {
    // High time bonus (30 seconds)
    const highTimeRewards = calculateBattleRewards(true, 30, 0, 'medium');
    expect(highTimeRewards.metadata.time_bonus).toBe(50);

    // Medium time bonus (15 seconds)
    const medTimeRewards = calculateBattleRewards(true, 15, 0, 'medium');
    expect(medTimeRewards.metadata.time_bonus).toBe(25);

    // Low time bonus (5 seconds)
    const lowTimeRewards = calculateBattleRewards(true, 5, 0, 'medium');
    expect(lowTimeRewards.metadata.time_bonus).toBe(16);
  });

  it('applies streak bonus correctly', () => {
    const rewards = calculateBattleRewards(true, 30, 3, 'medium');
    expect(rewards.metadata.streak_bonus).toBe(30);
  });

  it('applies difficulty bonus correctly', () => {
    const easyRewards = calculateBattleRewards(true, 30, 0, 'easy');
    expect(easyRewards.metadata.difficulty_bonus).toBe(0);

    const mediumRewards = calculateBattleRewards(true, 30, 0, 'medium');
    expect(mediumRewards.metadata.difficulty_bonus).toBe(25);

    const hardRewards = calculateBattleRewards(true, 30, 0, 'hard');
    expect(hardRewards.metadata.difficulty_bonus).toBe(50);
  });

  it('combines all bonuses correctly', () => {
    const rewards = calculateBattleRewards(true, 30, 3, 'hard');
    expect(rewards.total_xp).toBe(345); // Base 150 + 50% time + 30% streak + 50% difficulty
    expect(rewards.total_coins).toBe(172);
  });

  it('handles edge cases', () => {
    // Zero time left
    const zeroTimeRewards = calculateBattleRewards(true, 0, 0, 'medium');
    expect(zeroTimeRewards.metadata.time_bonus).toBe(0);

    // Very high streak
    const highStreakRewards = calculateBattleRewards(true, 30, 10, 'medium');
    expect(highStreakRewards.metadata.streak_bonus).toBe(100); // Should cap at 100%

    // Invalid difficulty (defaults to medium)
    const invalidDifficultyRewards = calculateBattleRewards(true, 30, 0, 'invalid' as any);
    expect(invalidDifficultyRewards.metadata.difficulty_bonus).toBe(25);
  });
}); 