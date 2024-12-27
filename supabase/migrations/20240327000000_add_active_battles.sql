-- Create active_battles table
CREATE TABLE IF NOT EXISTS active_battles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    opponent_id UUID REFERENCES auth.users(id),
    status TEXT NOT NULL,
    score JSONB NOT NULL DEFAULT '{"player": 0, "opponent": 0}'::jsonb,
    player_role TEXT NOT NULL,
    opponent_role TEXT NOT NULL,
    current_round INTEGER DEFAULT 1,
    total_rounds INTEGER DEFAULT 5,
    last_played_cards JSONB,
    in_progress BOOLEAN DEFAULT true,
    rewards JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_active_battles_user_id ON active_battles(user_id);
CREATE INDEX IF NOT EXISTS idx_active_battles_opponent_id ON active_battles(opponent_id);
CREATE INDEX IF NOT EXISTS idx_active_battles_status ON active_battles(status);

-- Add RLS policies
ALTER TABLE active_battles ENABLE ROW LEVEL SECURITY;

-- Users can view their own battles and battles they're participating in
CREATE POLICY "Users can view their own battles"
    ON active_battles FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = opponent_id);

-- Users can update their own battles
CREATE POLICY "Users can update their own battles"
    ON active_battles FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can insert their own battles
CREATE POLICY "Users can insert their own battles"
    ON active_battles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_active_battles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_active_battles_updated_at
    BEFORE UPDATE ON active_battles
    FOR EACH ROW
    EXECUTE FUNCTION update_active_battles_updated_at(); 