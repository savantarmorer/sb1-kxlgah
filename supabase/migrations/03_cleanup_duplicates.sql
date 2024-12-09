BEGIN;

-- First, create a temporary table with the latest record for each user
CREATE TEMP TABLE latest_user_progress AS
SELECT DISTINCT ON (user_id) 
    id,
    user_id,
    xp,
    level,
    coins,
    streak,
    achievements,
    inventory,
    created_at,
    updated_at,
    battle_stats,
    reward_multipliers,
    streak_multiplier,
    recent_xp_gains,
    last_battle_time,
    daily_battles,
    last_daily_reset,
    battle_history
FROM user_progress
ORDER BY user_id, updated_at DESC;

-- Delete all records from user_progress
DELETE FROM user_progress;

-- Insert back only the latest records
INSERT INTO user_progress
SELECT * FROM latest_user_progress;

-- Drop temporary table
DROP TABLE latest_user_progress;

-- Drop existing constraint if it exists
ALTER TABLE user_progress
DROP CONSTRAINT IF EXISTS unique_user_progress_user_id;

-- Now add the unique constraint
ALTER TABLE user_progress
ADD CONSTRAINT unique_user_progress_user_id UNIQUE (user_id);

-- Create function to sync battle data across tables
CREATE OR REPLACE FUNCTION sync_battle_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if battle_stats has changed
    IF (TG_OP = 'UPDATE' AND OLD.battle_stats IS NOT DISTINCT FROM NEW.battle_stats) THEN
        RETURN NEW;
    END IF;

    -- Update battle_stats table
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
        COALESCE((NEW.battle_stats->>'totalBattles')::integer, 0),
        COALESCE((NEW.battle_stats->>'wins')::integer, 0),
        COALESCE((NEW.battle_stats->>'losses')::integer, 0),
        COALESCE((NEW.battle_stats->>'win_streak')::integer, 0),
        COALESCE((NEW.battle_stats->>'highestStreak')::integer, 0),
        COALESCE((NEW.battle_stats->>'totalXpEarned')::integer, 0),
        COALESCE((NEW.battle_stats->>'totalCoinsEarned')::integer, 0),
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

    -- Update battle_ratings table
    INSERT INTO battle_ratings (
        user_id,
        wins,
        losses,
        streak,
        highest_streak,
        updated_at
    )
    VALUES (
        NEW.user_id,
        COALESCE((NEW.battle_stats->>'wins')::integer, 0),
        COALESCE((NEW.battle_stats->>'losses')::integer, 0),
        COALESCE((NEW.battle_stats->>'win_streak')::integer, 0),
        COALESCE((NEW.battle_stats->>'highestStreak')::integer, 0),
        NOW()
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
        wins = EXCLUDED.wins,
        losses = EXCLUDED.losses,
        streak = EXCLUDED.streak,
        highest_streak = EXCLUDED.highest_streak,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS sync_battle_data_trigger ON user_progress;

-- Create new trigger for battle data synchronization
CREATE TRIGGER sync_battle_data_trigger
AFTER INSERT OR UPDATE OF battle_stats ON user_progress
FOR EACH ROW
EXECUTE FUNCTION sync_battle_data();

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_battle_history_user_id;
DROP INDEX IF EXISTS idx_battle_stats_user_id;
DROP INDEX IF EXISTS idx_battle_ratings_user_id;
DROP INDEX IF EXISTS idx_battle_saves_user_id;
DROP INDEX IF EXISTS idx_user_progress_updated_at;

-- Add indexes for better performance
CREATE INDEX idx_battle_history_user_id ON battle_history(user_id);
CREATE INDEX idx_battle_stats_user_id ON battle_stats(user_id);
CREATE INDEX idx_battle_ratings_user_id ON battle_ratings(user_id);
CREATE INDEX idx_battle_saves_user_id ON battle_saves(user_id);
CREATE INDEX idx_user_progress_updated_at ON user_progress(updated_at);

COMMIT;

-- Run VACUUM ANALYZE after the transaction
ANALYZE user_progress;
ANALYZE battle_stats;
ANALYZE battle_ratings;
ANALYZE battle_history;
