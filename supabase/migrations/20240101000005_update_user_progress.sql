-- Add new columns to user_progress table
ALTER TABLE user_progress
ADD COLUMN IF NOT EXISTS battle_stats JSONB DEFAULT jsonb_build_object(
    'totalBattles', 0,
    'wins', 0,
    'losses', 0,
    'win_streak', 0,
    'highestStreak', 0,
    'totalXpEarned', 0,
    'totalCoinsEarned', 0,
    'averageScore', 0
),
ADD COLUMN IF NOT EXISTS reward_multipliers JSONB DEFAULT jsonb_build_object(
    'xp', 1,
    'coins', 1
),
ADD COLUMN IF NOT EXISTS streak_multiplier NUMERIC DEFAULT 1,
ADD COLUMN IF NOT EXISTS recent_xp_gains JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS last_battle_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS daily_battles INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_daily_reset TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS battle_history JSONB DEFAULT '[]'::jsonb;
