-- Create battle_saves table for error recovery
CREATE TABLE IF NOT EXISTS battle_saves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    battle_state JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS battle_saves_user_id_idx ON battle_saves(user_id);
CREATE INDEX IF NOT EXISTS battle_saves_created_at_idx ON battle_saves(created_at);

-- Add RLS policies
ALTER TABLE battle_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own battle saves"
    ON battle_saves
    FOR ALL
    USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_battle_saves_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_battle_saves_updated_at
    BEFORE UPDATE ON battle_saves
    FOR EACH ROW
    EXECUTE FUNCTION update_battle_saves_updated_at();
