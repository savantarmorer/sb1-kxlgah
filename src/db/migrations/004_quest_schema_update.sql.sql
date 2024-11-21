-- First, create a temporary table to store existing quest data
CREATE TEMP TABLE temp_quests AS SELECT * FROM quests;

-- Drop existing foreign key constraints that reference quests table
ALTER TABLE user_quests DROP CONSTRAINT IF EXISTS user_quests_quest_id_fkey;

-- Drop the existing quests table
DROP TABLE quests;

-- Recreate quests table with UUID
CREATE TABLE quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'available',
    category VARCHAR(50) DEFAULT 'general',
    xp_reward INTEGER NOT NULL DEFAULT 0,
    coin_reward INTEGER NOT NULL DEFAULT 0,
    requirements JSONB DEFAULT '[]'::jsonb,
    order_position INTEGER DEFAULT 0,
    progress INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Migrate existing data with UUID conversion
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
    order_position,
    progress,
    is_active,
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
    requirements,
    order_position,
    progress,
    is_active,
    created_at,
    updated_at
FROM temp_quests;

-- Recreate indexes
CREATE INDEX idx_quests_category ON quests(category);
CREATE INDEX idx_quests_type ON quests(type);
CREATE INDEX idx_quests_status ON quests(status);

-- Drop temporary table
DROP TABLE temp_quests; 