import { calculateBattleRewards } from '../battleRewards';

describe('Battle Rewards Calculation', () => {
  it('calculates base rewards for correct answer', () => {
    const rewards = calculateBattleRewards(true, 30, 0, 'medium');
    expect(rewards.total_xp).toBe(263); // Base 175 + 50% time bonus
    expect(rewards.total_coins).toBe(131); // Half of XP rounded down
  });

  it('gives no rewards for wrong answer', () => {
    const rewards = calculateBattleRewards(false, 30, 0, 'medium');
    expect(rewards.total_xp).toBe(0);
    expect(rewards.total_coins).toBe(0);
  });

  it('applies time bonus correctly', () => {
    const rewards = calculateBattleRewards(true, 30, 0, 'medium');
    const rewardsSlowTime = calculateBattleRewards(true, 5, 0, 'medium');
    expect(rewards.total_xp).toBeGreaterThan(rewardsSlowTime.total_xp);
  });

  it('applies streak bonus correctly', () => {
    const rewards = calculateBattleRewards(true, 30, 3, 'medium');
    const rewardsNoStreak = calculateBattleRewards(true, 30, 0, 'medium');
    expect(rewards.total_xp).toBeGreaterThan(rewardsNoStreak.total_xp);
  });

  it('applies difficulty bonus correctly', () => {
    const rewardsHard = calculateBattleRewards(true, 30, 0, 'hard');
    const rewardsMedium = calculateBattleRewards(true, 30, 0, 'medium');
    const rewardsEasy = calculateBattleRewards(true, 30, 0, 'easy');
    
    expect(rewardsHard.total_xp).toBeGreaterThan(rewardsMedium.total_xp);
    expect(rewardsMedium.total_xp).toBeGreaterThan(rewardsEasy.total_xp);
  });

  it('combines all bonuses correctly', () => {
    const rewards = calculateBattleRewards(true, 30, 5, 'hard');
    const baseRewards = calculateBattleRewards(true, 5, 0, 'easy');
    expect(rewards.total_xp).toBeGreaterThan(baseRewards.total_xp * 2);
  });

  it('handles edge cases', () => {
    // Zero time remaining
    const zeroTimeRewards = calculateBattleRewards(true, 0, 0, 'medium');
    expect(zeroTimeRewards.total_xp).toBeGreaterThan(0);

    // Very high streak
    const highStreakRewards = calculateBattleRewards(true, 30, 100, 'medium');
    expect(highStreakRewards.total_xp).toBeGreaterThan(0);

    // Invalid difficulty (defaults to medium)
    const invalidDifficultyRewards = calculateBattleRewards(true, 30, 0, 'invalid' as any);
    expect(invalidDifficultyRewards.total_xp).toBe(rewards.total_xp);
  });
}); 