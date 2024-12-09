-- Create enum types for battle status
CREATE TYPE battle_status AS ENUM ('searching', 'ready', 'battle', 'completed');

-- Create user_progress table
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    coins INTEGER NOT NULL DEFAULT 0,
    streak INTEGER NOT NULL DEFAULT 0,
    achievements JSONB DEFAULT '[]'::jsonb,
    inventory JSONB DEFAULT '[]'::jsonb,
    battle_stats JSONB DEFAULT '{
        "totalBattles": 0,
        "wins": 0,
        "losses": 0,
        "win_streak": 0,
        "highestStreak": 0,
        "totalXpEarned": 0,
        "totalCoinsEarned": 0,
        "averageScore": 0
    }'::jsonb,
    reward_multipliers JSONB DEFAULT '{
        "xp": 1,
        "coins": 1
    }'::jsonb,
    streak_multiplier NUMERIC DEFAULT 1,
    recent_xp_gains JSONB DEFAULT '[]'::jsonb,
    last_battle_time TIMESTAMPTZ,
    daily_battles INTEGER DEFAULT 0,
    last_daily_reset TIMESTAMPTZ DEFAULT NOW(),
    battle_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create subject_scores table
CREATE TABLE IF NOT EXISTS subject_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, subject)
);

-- Add RLS policies
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_scores ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own progress"
    ON user_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
    ON user_progress FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
    ON user_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own scores"
    ON subject_scores FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own scores"
    ON subject_scores FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scores"
    ON subject_scores FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create functions to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
CREATE TRIGGER update_user_progress_updated_at
    BEFORE UPDATE ON user_progress
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_subject_scores_updated_at
    BEFORE UPDATE ON subject_scores
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
