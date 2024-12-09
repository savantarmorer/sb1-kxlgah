-- Add unique constraint to user_progress table
ALTER TABLE user_progress
ADD CONSTRAINT unique_user_progress_user_id UNIQUE (user_id);

-- Create trigger to sync battle stats
CREATE OR REPLACE FUNCTION sync_battle_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update battle_stats table when user_progress battle_stats changes
  INSERT INTO battle_stats (
    user_id,
    total_battles,
    wins,
    losses,
    win_streak,
    highest_streak,
    total_xp_earned,
    total_coins_earned,
    updated_at
  )
  VALUES (
    NEW.user_id,
    (NEW.battle_stats->>'totalBattles')::integer,
    (NEW.battle_stats->>'wins')::integer,
    (NEW.battle_stats->>'losses')::integer,
    (NEW.battle_stats->>'win_streak')::integer,
    (NEW.battle_stats->>'highestStreak')::integer,
    (NEW.battle_stats->>'totalXpEarned')::integer,
    (NEW.battle_stats->>'totalCoinsEarned')::integer,
    NOW()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_battles = EXCLUDED.total_battles,
    wins = EXCLUDED.wins,
    losses = EXCLUDED.losses,
    win_streak = EXCLUDED.win_streak,
    highest_streak = EXCLUDED.highest_streak,
    total_xp_earned = EXCLUDED.total_xp_earned,
    total_coins_earned = EXCLUDED.total_coins_earned,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on user_progress table
CREATE TRIGGER sync_battle_stats_trigger
AFTER INSERT OR UPDATE OF battle_stats ON user_progress
FOR EACH ROW
EXECUTE FUNCTION sync_battle_stats();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_battle_history_user_id ON battle_history(user_id);
CREATE INDEX IF NOT EXISTS idx_battle_stats_user_id ON battle_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_battle_ratings_user_id ON battle_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_battle_saves_user_id ON battle_saves(user_id);
