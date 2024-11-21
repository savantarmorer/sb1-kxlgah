DO $$ 
BEGIN
    -- Fix achievements policies
    DROP POLICY IF EXISTS "Users can insert achievements" ON achievements;
    CREATE POLICY "Users can insert achievements"
        ON achievements FOR INSERT
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND is_super_admin = true
            )
        );

    -- Fix quest_requirements policies
    DROP POLICY IF EXISTS "Users can modify quest requirements" ON quest_requirements;
    CREATE POLICY "Users can modify quest requirements"
        ON quest_requirements FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND is_super_admin = true
            )
        );

    -- Fix quests policies
    DROP POLICY IF EXISTS "Users can modify quests" ON quests;
    CREATE POLICY "Users can modify quests"
        ON quests FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND is_super_admin = true
            )
        );

    -- Fix user_quests policies
    DROP POLICY IF EXISTS "Users can insert their own quests" ON user_quests;
    CREATE POLICY "Users can insert their own quests"
        ON user_quests FOR INSERT
        WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can delete their own quests" ON user_quests;
    CREATE POLICY "Users can delete their own quests"
        ON user_quests FOR DELETE
        USING (auth.uid() = user_id);

    -- Fix user_daily_rewards policies
    DROP POLICY IF EXISTS "Users can update their daily rewards" ON user_daily_rewards;
    CREATE POLICY "Users can update their daily rewards"
        ON user_daily_rewards FOR UPDATE
        USING (auth.uid() = user_id);

    -- Remove policies for tables that should be dropped
    DROP POLICY IF EXISTS "Users can view follows" ON user_follows;
    DROP POLICY IF EXISTS "Users can manage their own follows" ON user_follows;
    DROP POLICY IF EXISTS "Users can insert their own progress" ON user_progress;
    DROP POLICY IF EXISTS "Users can update own progress" ON user_progress;
    DROP POLICY IF EXISTS "Users can view own progress" ON user_progress;
END $$;

-- Verify final policy coverage
SELECT 
    t.tablename,
    COUNT(p.policyname) as policy_count,
    string_agg(DISTINCT p.cmd::text, ', ') as commands_covered,
    bool_or(p.cmd = 'ALL' OR p.qual LIKE '%is_super_admin%') as has_admin_access,
    bool_or(p.cmd = 'SELECT') as has_select,
    bool_or(p.cmd = 'INSERT') as has_insert,
    bool_or(p.cmd = 'UPDATE') as has_update,
    bool_or(p.cmd = 'DELETE') as has_delete
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename
WHERE t.schemaname = 'public'
AND t.tablename NOT IN ('courses', 'user_follows', 'user_progress', 'users')
GROUP BY t.tablename
ORDER BY t.tablename; 