-- Add gem_price to shop_items
ALTER TABLE shop_items
ADD COLUMN gem_price INTEGER;

-- Add avatar type to items type enum if not exists
DO $$ BEGIN
    ALTER TYPE item_type ADD VALUE IF NOT EXISTS 'AVATAR';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create user_avatars table
CREATE TABLE IF NOT EXISTS user_avatars (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    avatar_id UUID REFERENCES items(id) ON DELETE CASCADE,
    is_equipped BOOLEAN DEFAULT false,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, avatar_id)
);

-- Add RLS policies for user_avatars
ALTER TABLE user_avatars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own avatars"
    ON user_avatars FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own avatars"
    ON user_avatars FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own avatars"
    ON user_avatars FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Function to ensure only one avatar is equipped at a time
CREATE OR REPLACE FUNCTION ensure_single_equipped_avatar()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_equipped THEN
        UPDATE user_avatars
        SET is_equipped = false
        WHERE user_id = NEW.user_id
        AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to ensure only one avatar is equipped
CREATE TRIGGER ensure_single_equipped_avatar_trigger
    BEFORE INSERT OR UPDATE ON user_avatars
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_equipped_avatar(); 