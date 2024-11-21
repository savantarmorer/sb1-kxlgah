-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add missing updated_at triggers
DO $$ 
BEGIN
    -- Add updated_at column where missing
    ALTER TABLE battle_stats 
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    
    ALTER TABLE courses 
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    
    ALTER TABLE quests 
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    
    ALTER TABLE user_follows 
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    
    ALTER TABLE user_inventory 
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    
    ALTER TABLE user_logins 
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    
    ALTER TABLE user_progress 
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

    -- Create missing triggers
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_battle_stats_updated_at') THEN
        CREATE TRIGGER update_battle_stats_updated_at
            BEFORE UPDATE ON battle_stats
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_courses_updated_at') THEN
        CREATE TRIGGER update_courses_updated_at
            BEFORE UPDATE ON courses
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_quests_updated_at') THEN
        CREATE TRIGGER update_quests_updated_at
            BEFORE UPDATE ON quests
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_follows_updated_at') THEN
        CREATE TRIGGER update_user_follows_updated_at
            BEFORE UPDATE ON user_follows
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_inventory_updated_at') THEN
        CREATE TRIGGER update_user_inventory_updated_at
            BEFORE UPDATE ON user_inventory
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_logins_updated_at') THEN
        CREATE TRIGGER update_user_logins_updated_at
            BEFORE UPDATE ON user_logins
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_progress_updated_at') THEN
        CREATE TRIGGER update_user_progress_updated_at
            BEFORE UPDATE ON user_progress
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Fix missing or incomplete policies
DO $$ 
BEGIN
    -- Courses
    DROP POLICY IF EXISTS "Enable write access for admin users" ON courses;
    CREATE POLICY "Enable write access for admin users"
        ON courses FOR ALL
        USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true));

    -- User follows
    DROP POLICY IF EXISTS "Users can manage their own follows" ON user_follows;
    CREATE POLICY "Users can manage their own follows"
        ON user_follows FOR ALL
        USING (auth.uid() = follower_id);

    -- User inventory
    DROP POLICY IF EXISTS "Admin full access to inventory" ON user_inventory;
    CREATE POLICY "Admin full access to inventory"
        ON user_inventory FOR ALL
        USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true));

    -- User logins
    DROP POLICY IF EXISTS "Admin full access to logins" ON user_logins;
    CREATE POLICY "Admin full access to logins"
        ON user_logins FOR ALL
        USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true));

    -- Notification history
    DROP POLICY IF EXISTS "Users can insert their own notifications" ON notification_history;
    CREATE POLICY "Users can insert their own notifications"
        ON notification_history FOR INSERT
        WITH CHECK (auth.uid() = user_id);
END $$;

-- Add missing indexes for performance
DO $$ 
BEGIN
    -- Add indexes for timestamp columns
    CREATE INDEX IF NOT EXISTS idx_battle_stats_updated_at ON battle_stats(updated_at);
    CREATE INDEX IF NOT EXISTS idx_courses_updated_at ON courses(updated_at);
    CREATE INDEX IF NOT EXISTS idx_quests_updated_at ON quests(updated_at);
    CREATE INDEX IF NOT EXISTS idx_user_follows_updated_at ON user_follows(updated_at);
    CREATE INDEX IF NOT EXISTS idx_user_inventory_updated_at ON user_inventory(updated_at);
    CREATE INDEX IF NOT EXISTS idx_user_logins_updated_at ON user_logins(updated_at);
    CREATE INDEX IF NOT EXISTS idx_user_progress_updated_at ON user_progress(updated_at);
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