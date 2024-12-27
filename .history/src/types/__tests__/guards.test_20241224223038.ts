import { isAchievement, isAchievementReward, isBattleRewards, isXPGain, isActivityEntry, isValidGameStateUpdate } from '../guards';

describe('Type Guards', () => {
  describe('isAchievement', () => {
    it('should validate a valid achievement', () => {
      const validAchievement = {
        id: 'test-id',
        title: 'Test Achievement',
        description: 'Test Description',
        trigger: {
          type: 'battle_wins',
          count: 5
        },
        rewards: [
          { type: 'xp', amount: 100 },
          { type: 'coins', amount: 50 }
        ]
      };

      expect(isAchievement(validAchievement)).toBe(true);
    });

    it('should reject invalid achievements', () => {
      const cases = [
        { id: 123, title: 'Invalid ID Type' },
        { id: 'valid', title: 123 },
        { id: 'valid', title: 'Valid', description: 123 },
        { id: 'valid', title: 'Valid', description: 'Valid', rewards: 'not-array' }
      ];

      cases.forEach(testCase => {
        expect(isAchievement(testCase)).toBe(false);
      });
    });
  });

  describe('isAchievementReward', () => {
    it('should validate valid achievement rewards', () => {
      const validRewards = [
        { type: 'xp', amount: 100 },
        { type: 'coins', amount: 50 },
        { type: 'item', amount: 1 },
        { type: 'title', amount: 1 }
      ];

      validRewards.forEach(reward => {
        expect(isAchievementReward(reward)).toBe(true);
      });
    });

    it('should reject invalid achievement rewards', () => {
      const invalidRewards = [
        { type: 'invalid', amount: 100 },
        { type: 'xp', amount: 'invalid' },
        { type: 123, amount: 100 },
        {}
      ];

      invalidRewards.forEach(reward => {
        expect(isAchievementReward(reward)).toBe(false);
      });
    });
  });

  describe('isBattleRewards', () => {
    it('should validate valid battle rewards', () => {
      const validRewards = {
        xp: 100,
        coins: 50,
        streak_bonus: 10,
        achievements: []
      };

      expect(isBattleRewards(validRewards)).toBe(true);
    });

    it('should reject invalid battle rewards', () => {
      const invalidRewards = [
        { xp: 'invalid', coins: 50 },
        { xp: 100, coins: 'invalid' },
        { xp: 100, coins: 50, streak_bonus: 'invalid' },
        { xp: 100, coins: 50, achievements: 'not-array' }
      ];

      invalidRewards.forEach(rewards => {
        expect(isBattleRewards(rewards)).toBe(false);
      });
    });
  });

  describe('isXPGain', () => {
    it('should validate valid XP gain', () => {
      const validXPGain = {
        amount: 100,
        source: 'battle',
        timestamp: new Date().toISOString(),
        multiplier: 1.5
      };

      expect(isXPGain(validXPGain)).toBe(true);
    });

    it('should reject invalid XP gain', () => {
      const invalidXPGains = [
        { amount: 'invalid', source: 'battle' },
        { amount: 100, source: 123 },
        { amount: 100, source: 'battle', timestamp: 123 },
        { amount: 100, source: 'battle', timestamp: 'valid', multiplier: 'invalid' }
      ];

      invalidXPGains.forEach(xpGain => {
        expect(isXPGain(xpGain)).toBe(false);
      });
    });
  });

  describe('isActivityEntry', () => {
    it('should validate valid activity entries', () => {
      const validEntry = {
        id: 'test-id',
        userId: 'user-id',
        type: 'battle',
        details: { result: 'win' },
        timestamp: new Date().toISOString()
      };

      expect(isActivityEntry(validEntry)).toBe(true);
    });

    it('should reject invalid activity entries', () => {
      const invalidEntries = [
        { id: 123, userId: 'valid' },
        { id: 'valid', userId: 123 },
        { id: 'valid', userId: 'valid', type: 'invalid-type' },
        { id: 'valid', userId: 'valid', type: 'battle', details: 'not-object' }
      ];

      invalidEntries.forEach(entry => {
        expect(isActivityEntry(entry)).toBe(false);
      });
    });
  });

  describe('isValidGameStateUpdate', () => {
    const baseState = {
      health: 100,
      xp: 0,
      level: 1,
      coins: 0,
      inventory: []
    };

    it('should validate valid game state updates', () => {
      const validUpdates = [
        { health: 90 },
        { xp: 100, level: 2 },
        { coins: 50, inventory: ['potion'] }
      ];

      validUpdates.forEach(update => {
        expect(isValidGameStateUpdate(baseState, update)).toBe(true);
      });
    });

    it('should reject invalid game state updates', () => {
      const invalidUpdates = [
        { health: 'invalid' },
        { xp: -100 },
        { level: 0 },
        { coins: -50 },
        { inventory: 'not-array' }
      ];

      invalidUpdates.forEach(update => {
        expect(isValidGameStateUpdate(baseState, update)).toBe(false);
      });
    });
  });
});
