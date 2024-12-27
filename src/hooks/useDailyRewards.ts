import { useGame } from '../contexts/GameContext';

export function useDailyRewards() {
  const { state, dispatch } = useGame();

  const checkDailyReward = () => {
    const lastLogin = new Date(state.user.last_login_date || 0);
    const today = new Date();
    const isNewDay = lastLogin.getDate() !== today.getDate();

    if (isNewDay) {
      return true;
    }
    return false;
  };

  const claimDailyReward = () => {
    if (checkDailyReward()) {
      const streak = state.user.daily_rewards?.streak || 0;
      const newStreak = streak + 1;
      const multiplier = Math.min(2, 1 + (newStreak * 0.1));

      dispatch({
        type: 'UPDATE_DAILY_STREAK',
        payload: {
          streak: newStreak,
          multiplier
        }
      });

      // Calculate reward
      const baseReward = 100;
      dispatch({
        type: 'CLAIM_DAILY_REWARD',
        payload: {
          reward_value: Math.floor(baseReward * multiplier),
          reward_type: 'coins'
        }
      });

      return true;
    }
    return false;
  };

  return {
    dailyRewards: state.user.daily_rewards,
    canClaimDailyReward: checkDailyReward,
    claimDailyReward
  };
} 