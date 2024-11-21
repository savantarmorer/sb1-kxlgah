-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fix user_quests table after quest UUID migration
DO $$ 
BEGIN
    -- Only run if user_quests exists and quest_id is not UUID
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'user_quests' 
        AND column_name = 'quest_id' 
        AND data_type != 'uuid'
    ) THEN
        -- Create temporary table
        CREATE TEMP TABLE temp_user_quests AS SELECT * FROM user_quests;
        
        -- Drop and recreate user_quests with proper UUID
        DROP TABLE user_quests;
        
        CREATE TABLE user_quests (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            quest_id UUID REFERENCES quests(id) ON DELETE CASCADE,
            status VARCHAR(50) NOT NULL DEFAULT 'available',
            progress INTEGER DEFAULT 0,
            started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Migrate data
        INSERT INTO user_quests (
            user_id,
            quest_id,
            status,
            progress,
            started_at,
            completed_at,
            created_at,
            updated_at
        )
        SELECT 
            user_id::uuid,
            quest_id::uuid,
            status,
            progress,
            started_at,
            completed_at,
            created_at,
            updated_at
        FROM temp_user_quests;

        -- Drop temp table
        DROP TABLE temp_user_quests;
    END IF;
END $$;

-- Add missing indexes
DO $$ 
BEGIN
    -- User quests indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_quests_status') THEN
        CREATE INDEX idx_user_quests_status ON user_quests(status);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_quests_completed_at') THEN
        CREATE INDEX idx_user_quests_completed_at ON user_quests(completed_at);
    END IF;

    -- Quest requirements indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_quest_requirements_type') THEN
        CREATE INDEX idx_quest_requirements_type ON quest_requirements(requirement_type);
    END IF;
END $$;

-- Add missing triggers
DO $$ 
BEGIN
    -- Add updated_at trigger to user_quests if missing
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_user_quests_updated_at'
    ) THEN
        CREATE TRIGGER update_user_quests_updated_at
            BEFORE UPDATE ON user_quests
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Add missing RLS policies
DO $$ 
BEGIN
    -- User quests policies
    DROP POLICY IF EXISTS "Users can view their own quest progress" ON user_quests;
    CREATE POLICY "Users can view their own quest progress"
        ON user_quests FOR SELECT
        USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can update their own quest progress" ON user_quests;
    CREATE POLICY "Users can update their own quest progress"
        ON user_quests FOR UPDATE
        USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Admin full access to user quests" ON user_quests;
    CREATE POLICY "Admin full access to user quests"
        ON user_quests FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND is_super_admin = true
            )
        );
END $$;

-- Verify final state
SELECT 
    t.tablename,
    COUNT(p.policyname) as policy_count,
    string_agg(DISTINCT p.cmd::text, ', ') as commands_covered,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = t.tablename) as index_count,
    EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgrelid = t.tablename::regclass 
        AND tgname LIKE 'update_%_updated_at'
    ) as has_updated_at_trigger
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename
WHERE t.schemaname = 'public'
GROUP BY t.tablename
ORDER BY t.tablename; 