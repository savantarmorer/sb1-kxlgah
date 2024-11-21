-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create daily_rewards table if it doesn't exist
CREATE TABLE IF NOT EXISTS daily_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day INTEGER NOT NULL,
    reward_type VARCHAR(50) NOT NULL,
    reward_value INTEGER NOT NULL,
    rarity VARCHAR(50) NOT NULL DEFAULT 'common',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_daily_rewards table
CREATE TABLE IF NOT EXISTS user_daily_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reward_id UUID REFERENCES daily_rewards(id) ON DELETE CASCADE,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add unique constraint using an immutable date truncation
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_daily_rewards_unique_claim') THEN
        CREATE UNIQUE INDEX idx_user_daily_rewards_unique_claim 
        ON user_daily_rewards (
            user_id, 
            reward_id, 
            date_trunc('day', claimed_at AT TIME ZONE 'UTC')
        );
    END IF;
END $$;

-- Create indexes for better performance
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_daily_rewards_day') THEN
        CREATE INDEX idx_daily_rewards_day ON daily_rewards(day);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_daily_rewards_type') THEN
        CREATE INDEX idx_daily_rewards_type ON daily_rewards(reward_type);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_daily_rewards_user_id') THEN
        CREATE INDEX idx_user_daily_rewards_user_id ON user_daily_rewards(user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_daily_rewards_reward_id') THEN
        CREATE INDEX idx_user_daily_rewards_reward_id ON user_daily_rewards(reward_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_daily_rewards_claimed_at') THEN
        CREATE INDEX idx_user_daily_rewards_claimed_at ON user_daily_rewards(claimed_at);
    END IF;
END $$;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_daily_rewards_updated_at ON daily_rewards;
CREATE TRIGGER update_daily_rewards_updated_at
    BEFORE UPDATE ON daily_rewards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_daily_rewards_updated_at ON user_daily_rewards;
CREATE TRIGGER update_user_daily_rewards_updated_at
    BEFORE UPDATE ON user_daily_rewards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE daily_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_rewards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Enable read access for all users" ON daily_rewards;
    DROP POLICY IF EXISTS "Enable write access for admin users" ON daily_rewards;
    DROP POLICY IF EXISTS "Users can view their own daily rewards" ON user_daily_rewards;
    DROP POLICY IF EXISTS "Users can claim their own daily rewards" ON user_daily_rewards;

    -- Create new policies
    CREATE POLICY "Enable read access for all users"
        ON daily_rewards FOR SELECT
        USING (true);

    CREATE POLICY "Enable write access for admin users"
        ON daily_rewards FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND is_super_admin = true
            )
        );

    CREATE POLICY "Users can view their own daily rewards"
        ON user_daily_rewards FOR SELECT
        USING (auth.uid() = user_id);

    CREATE POLICY "Users can claim their own daily rewards"
        ON user_daily_rewards FOR INSERT
        WITH CHECK (auth.uid() = user_id);
END $$;

-- Add comments for documentation
COMMENT ON TABLE daily_rewards IS 'Stores daily reward definitions';
COMMENT ON TABLE user_daily_rewards IS 'Tracks claimed daily rewards per user'; 