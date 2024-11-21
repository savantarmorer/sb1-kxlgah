-- Fix RLS on quests table
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;

-- Create policies for quests table
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Enable read access for all users" ON quests;
    DROP POLICY IF EXISTS "Enable write access for admin users" ON quests;

    CREATE POLICY "Enable read access for all users"
        ON quests FOR SELECT
        USING (true);

    CREATE POLICY "Enable write access for admin users"
        ON quests FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND is_super_admin = true
            )
        );
END $$;

-- Add missing table comments
COMMENT ON TABLE achievements IS 'Stores achievement definitions and metadata';
COMMENT ON TABLE battle_stats IS 'Tracks user battle statistics and progress';
COMMENT ON TABLE items IS 'Stores item definitions and metadata';
COMMENT ON TABLE profiles IS 'Stores user profiles and game progress';
COMMENT ON TABLE user_achievements IS 'Tracks user achievement progress';
COMMENT ON TABLE user_inventory IS 'Tracks user item ownership and status';
COMMENT ON TABLE user_quests IS 'Tracks user quest progress';
COMMENT ON TABLE user_logins IS 'Tracks user login history';
COMMENT ON TABLE quests IS 'Stores quest definitions and requirements';

-- Verify table structures and add any missing columns
DO $$ 
BEGIN
    -- Check and add missing columns to user_achievements if needed
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'user_achievements' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE user_achievements 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;

    -- Add updated_at trigger to user_achievements if missing
    IF NOT EXISTS (
        SELECT FROM pg_trigger 
        WHERE tgname = 'update_user_achievements_updated_at'
    ) THEN
        CREATE TRIGGER update_user_achievements_updated_at
            BEFORE UPDATE ON user_achievements
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Verify all junction tables have proper timestamps
    ALTER TABLE user_quests 
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

    ALTER TABLE user_inventory 
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

END $$;

-- Show updated table status
SELECT 
    t.table_name,
    pg_size_pretty(pg_total_relation_size(quote_ident(t.table_name)::text)) as size,
    pg_stat_user_tables.n_live_tup as row_count,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count,
    CASE 
        WHEN c.relrowsecurity THEN 'Enabled'
        ELSE 'Disabled'
    END as rls_status,
    obj_description(quote_ident(t.table_name)::regclass, 'pg_class') as description
FROM information_schema.tables t
JOIN pg_class c ON c.relname = t.table_name
LEFT JOIN pg_stat_user_tables ON pg_stat_user_tables.relname = t.table_name
WHERE t.table_schema = 'public'
AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name;

-- Verify RLS policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname; 