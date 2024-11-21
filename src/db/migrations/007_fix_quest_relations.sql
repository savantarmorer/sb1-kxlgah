-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- First, create a temporary table to store quest data
CREATE TEMP TABLE temp_quests AS SELECT * FROM quests;

-- Drop existing foreign key constraints
ALTER TABLE user_quests DROP CONSTRAINT IF EXISTS user_quests_quest_id_fkey;
ALTER TABLE quest_requirements DROP CONSTRAINT IF EXISTS quest_requirements_quest_id_fkey;

-- Drop and recreate quests table with UUID
DROP TABLE quests;
CREATE TABLE quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'available',
    category VARCHAR(50) DEFAULT 'general',
    xp_reward INTEGER NOT NULL DEFAULT 0,
    coin_reward INTEGER NOT NULL DEFAULT 0,
    requirements JSONB DEFAULT '[]'::jsonb,
    progress INTEGER DEFAULT 0,
    order_position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate user_quests table with proper UUID foreign key
DROP TABLE IF EXISTS user_quests;
CREATE TABLE user_quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    quest_id UUID REFERENCES quests(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, quest_id)
);

-- Create indexes
CREATE INDEX idx_quests_user_id ON quests(user_id);
CREATE INDEX idx_quests_type ON quests(type);
CREATE INDEX idx_quests_status ON quests(status);
CREATE INDEX idx_quests_category ON quests(category);
CREATE INDEX idx_user_quests_user_id ON user_quests(user_id);
CREATE INDEX idx_user_quests_quest_id ON user_quests(quest_id);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_quests_updated_at
    BEFORE UPDATE ON quests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_quests_updated_at
    BEFORE UPDATE ON user_quests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Migrate data back
INSERT INTO quests (
    id,
    title,
    description,
    type,
    status,
    category,
    xp_reward,
    coin_reward,
    requirements,
    progress,
    order_position,
    is_active,
    user_id,
    created_at,
    updated_at
)
SELECT 
    COALESCE(uuid_generate_v4(), id::uuid),
    title,
    description,
    type,
    status,
    category,
    xp_reward,
    coin_reward,
    requirements::jsonb,
    progress,
    order_position,
    is_active,
    user_id::uuid,
    created_at,
    updated_at
FROM temp_quests;

-- Drop temporary table
DROP TABLE temp_quests;

-- Add comments
COMMENT ON TABLE quests IS 'Stores quest definitions and metadata';
COMMENT ON TABLE user_quests IS 'Tracks user progress on quests'; 