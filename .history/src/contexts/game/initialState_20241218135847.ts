import type { GameState } from '../../types/game';
import type { BattleState } from '../../types/battle';

const initialBattleState: BattleState = {
  status: 'idle',
  questions: [],
  current_question: 0,
  total_questions: 0,
  opponent: null,
  score: { player: 0, opponent: 0 },
  player_answers: [],
  time_left: 0,
  time_per_question: 30,
  in_progress: false,
  error: null,
  rewards: {
    xp_earned: 0,
    coins_earned: 0,
    streak_bonus: 0,
    time_bonus: 0
  },
  metadata: {
    is_bot: true,
    difficulty: 1
  }
};

export const initialGameState: GameState = {
  user: null,
  battle: initialBattleState,
  recentXPGains: [],
  battle_stats: {
    total_battles: 0,
    wins: 0,
    losses: 0,
    win_streak: 0,
    highest_streak: 0,
    total_xp_earned: 0,
    total_coins_earned: 0
  },
  achievements: [],
  quests: {
    active: [],
    completed: []
  },
  inventory: {
    items: [],
    equipped: []
  },
  statistics: {
    total_xp: 0,
    total_coins: 0,
    battles_won: 0,
    battles_lost: 0,
    current_streak: 0,
    highest_streak: 0,
    quests_completed: 0,
    achievements_unlocked: 0
  },
  error: null,
  loading: false,
  showLevelUpReward: false,
  current_levelRewards: [],
  activeEffects: []
}; 