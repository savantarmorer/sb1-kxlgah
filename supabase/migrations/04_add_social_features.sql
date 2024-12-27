-- Create user_follows table for social features
CREATE TABLE IF NOT EXISTS user_follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_follow UNIQUE (follower_id, following_id),
    CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Create indexes for better query performance
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_follows_follower') THEN
        CREATE INDEX idx_user_follows_follower ON user_follows(follower_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_follows_following') THEN
        CREATE INDEX idx_user_follows_following ON user_follows(following_id);
    END IF;
END $$;

-- Add trigger for updated_at
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_follows_updated_at') THEN
        CREATE TRIGGER update_user_follows_updated_at
            BEFORE UPDATE ON user_follows
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Enable RLS
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_follows' AND policyname = 'Users can view follows') THEN
        CREATE POLICY "Users can view follows" ON user_follows
            FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_follows' AND policyname = 'Users can manage their own follows') THEN
        CREATE POLICY "Users can manage their own follows" ON user_follows
            FOR ALL USING (auth.uid() = follower_id);
    END IF;
END $$;

-- Add comments
COMMENT ON TABLE user_follows IS 'Tracks user follow relationships';
COMMENT ON COLUMN user_follows.follower_id IS 'The user who is following';
COMMENT ON COLUMN user_follows.following_id IS 'The user being followed';
