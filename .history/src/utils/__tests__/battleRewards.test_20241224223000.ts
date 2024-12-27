import { calculateBattleRewards } from '../battleRewards';

describe('Battle Rewards Calculation', () => {
  it('calculates base rewards for correct answer', () => {
    const rewards = calculateBattleRewards(true, 30, 0, 'medium');
    expect(rewards.total_xp).toBe(200); // Base 100 + 100% time bonus
    expect(rewards.total_coins).toBe(100); // Half of XP
  });

  it('gives no rewards for wrong answer', () => {
    const rewards = calculateBattleRewards(false, 30, 0, 'medium');
    expect(rewards.total_xp).toBe(0);
    expect(rewards.total_coins).toBe(0);
  });

  it('applies time bonus correctly', () => {
    // Full time bonus (30 seconds)
    const fullTimeRewards = calculateBattleRewards(true, 30, 0, 'medium');
    expect(fullTimeRewards.metadata.time_bonus).toBe(100);

    // Half time bonus (15 seconds)
    const halfTimeRewards = calculateBattleRewards(true, 15, 0, 'medium');
    expect(halfTimeRewards.metadata.time_bonus).toBe(50);

    // Low time bonus (5 seconds)
    const lowTimeRewards = calculateBattleRewards(true, 5, 0, 'medium');
    expect(lowTimeRewards.metadata.time_bonus).toBe(17);
  });

  it('applies streak bonus correctly', () => {
    // No streak
    const noStreakRewards = calculateBattleRewards(true, 30, 0, 'medium');
    expect(noStreakRewards.metadata.streak_bonus).toBe(0);

    // 3 streak
    const threeStreakRewards = calculateBattleRewards(true, 30, 3, 'medium');
    expect(threeStreakRewards.metadata.streak_bonus).toBe(30);

    // 5 streak
    const fiveStreakRewards = calculateBattleRewards(true, 30, 5, 'medium');
    expect(fiveStreakRewards.metadata.streak_bonus).toBe(50);
  });

  it('applies difficulty bonus correctly', () => {
    // Easy difficulty
    const easyRewards = calculateBattleRewards(true, 30, 0, 'easy');
    expect(easyRewards.metadata.difficulty_bonus).toBe(0);

    // Medium difficulty
    const mediumRewards = calculateBattleRewards(true, 30, 0, 'medium');
    expect(mediumRewards.metadata.difficulty_bonus).toBe(25);

    // Hard difficulty
    const hardRewards = calculateBattleRewards(true, 30, 0, 'hard');
    expect(hardRewards.metadata.difficulty_bonus).toBe(50);
  });

  it('combines all bonuses correctly', () => {
    // Perfect scenario: correct answer, full time, 5 streak, hard difficulty
    const perfectRewards = calculateBattleRewards(true, 30, 5, 'hard');
    
    expect(perfectRewards.metadata).toEqual({
      base_reward: 100,
      time_bonus: 100,
      streak_bonus: 50,
      difficulty_bonus: 50
    });

    // Total XP should include all bonuses
    const expectedXP = 100 * (1 + (100 + 50 + 50) / 100);
    expect(perfectRewards.total_xp).toBe(Math.ceil(expectedXP));
    expect(perfectRewards.total_coins).toBe(Math.ceil(expectedXP / 2));
  });

  it('handles edge cases', () => {
    // Zero time left
    const zeroTimeRewards = calculateBattleRewards(true, 0, 0, 'medium');
    expect(zeroTimeRewards.metadata.time_bonus).toBe(0);

    // Invalid difficulty defaults to medium
    const invalidDifficultyRewards = calculateBattleRewards(true, 30, 0, 'invalid' as any);
    expect(invalidDifficultyRewards.metadata.difficulty_bonus).toBe(0);

    // Negative streak treated as 0
    const negativeStreakRewards = calculateBattleRewards(true, 30, -1, 'medium');
    expect(negativeStreakRewards.metadata.streak_bonus).toBe(0);
  });
}); 