DO $$ 
BEGIN
    -- Fix profiles missing SELECT
    CREATE POLICY "Users can view profiles"
        ON profiles FOR SELECT
        USING (true);

    -- Fix quest_requirements missing SELECT
    CREATE POLICY "Users can view quest requirements"
        ON quest_requirements FOR SELECT
        USING (true);

    -- Fix quests missing SELECT
    CREATE POLICY "Users can view quests"
        ON quests FOR SELECT
        USING (true);

    -- Fix achievements missing commands
    DROP POLICY IF EXISTS "Enable read access for all users" ON achievements;
    CREATE POLICY "Users can view achievements"
        ON achievements FOR SELECT
        USING (true);

    -- Fix daily_rewards missing commands
    DROP POLICY IF EXISTS "Enable read access for all users" ON daily_rewards;
    CREATE POLICY "Users can view daily rewards"
        ON daily_rewards FOR SELECT
        USING (true);

    -- Fix items missing commands
    DROP POLICY IF EXISTS "Enable read access for all users" ON items;
    CREATE POLICY "Users can view items"
        ON items FOR SELECT
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