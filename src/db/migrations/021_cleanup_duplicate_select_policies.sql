DO $$ 
BEGIN
    -- Clean up duplicate SELECT policies for achievements
    DROP POLICY IF EXISTS "Users can view achievements" ON achievements;
    DROP POLICY IF EXISTS "Users can view all achievements" ON achievements;
    CREATE POLICY "Users can view achievements"
        ON achievements FOR SELECT
        USING (true);

    -- Clean up duplicate SELECT policies for daily_rewards
    DROP POLICY IF EXISTS "Users can view daily rewards" ON daily_rewards;
    DROP POLICY IF EXISTS "Users can view all daily rewards" ON daily_rewards;
    CREATE POLICY "Users can view daily rewards"
        ON daily_rewards FOR SELECT
        USING (true);

    -- Clean up duplicate SELECT policies for items
    DROP POLICY IF EXISTS "Users can view items" ON items;
    DROP POLICY IF EXISTS "Users can view all items" ON items;
    CREATE POLICY "Users can view items"
        ON items FOR SELECT
        USING (true);

    -- Clean up duplicate SELECT policies for quest_requirements
    DROP POLICY IF EXISTS "Users can view quest requirements" ON quest_requirements;
    DROP POLICY IF EXISTS "Users can view all quest requirements" ON quest_requirements;
    CREATE POLICY "Users can view quest requirements"
        ON quest_requirements FOR SELECT
        USING (true);

    -- Clean up duplicate SELECT policies for quests
    DROP POLICY IF EXISTS "Users can view quests" ON quests;
    DROP POLICY IF EXISTS "Users can view all quests" ON quests;
    CREATE POLICY "Users can view quests"
        ON quests FOR SELECT
        USING (true);
END $$;

-- Final verification query
SELECT 
    t.tablename,
    COUNT(p.policyname) as policy_count,
    string_agg(DISTINCT p.cmd::text, ', ') as commands_covered,
    bool_or(p.cmd = 'ALL' OR p.qual LIKE '%is_super_admin%') as has_admin_access,
    bool_or(p.cmd = 'SELECT') as has_select,
    bool_or(p.cmd = 'INSERT') as has_insert,
    bool_or(p.cmd = 'UPDATE') as has_update,
    bool_or(p.cmd = 'DELETE') as has_delete,
    string_agg(DISTINCT p.policyname, ', ') as policies
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename
WHERE t.schemaname = 'public'
AND t.tablename NOT IN ('courses', 'user_follows', 'user_progress', 'users')
GROUP BY t.tablename
ORDER BY t.tablename; 