DO $$ 
BEGIN
    -- Fix profiles missing UPDATE coverage
    DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;
    
    -- Create separate policies for better clarity
    CREATE POLICY "Users can update their own profile"
        ON profiles FOR UPDATE
        USING (auth.uid() = id);

    -- Ensure all admin-managed tables have proper SELECT policies
    CREATE POLICY "Users can view all achievements"
        ON achievements FOR SELECT
        USING (true);

    CREATE POLICY "Users can view all daily rewards"
        ON daily_rewards FOR SELECT
        USING (true);

    CREATE POLICY "Users can view all items"
        ON items FOR SELECT
        USING (true);

    CREATE POLICY "Users can view all quest requirements"
        ON quest_requirements FOR SELECT
        USING (true);

    CREATE POLICY "Users can view all quests"
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