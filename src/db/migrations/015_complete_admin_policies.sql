DO $$ 
BEGIN
    -- Fix achievements policies (missing UPDATE/DELETE)
    DROP POLICY IF EXISTS "Enable write access for admin users" ON achievements;
    DROP POLICY IF EXISTS "Admin full access to achievements" ON achievements;
    CREATE POLICY "Admin full access to achievements"
        ON achievements FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND is_super_admin = true
            )
        );

    -- Fix daily_rewards policies (missing INSERT/UPDATE/DELETE)
    DROP POLICY IF EXISTS "Enable write access for admin users" ON daily_rewards;
    DROP POLICY IF EXISTS "Admin full access to daily rewards" ON daily_rewards;
    CREATE POLICY "Admin full access to daily rewards"
        ON daily_rewards FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND is_super_admin = true
            )
        );

    -- Fix items policies (missing INSERT/UPDATE/DELETE)
    DROP POLICY IF EXISTS "Enable write access for admin users" ON items;
    DROP POLICY IF EXISTS "Admin full access to items" ON items;
    CREATE POLICY "Admin full access to items"
        ON items FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND is_super_admin = true
            )
        );

    -- Fix quest_requirements policies (missing INSERT/UPDATE/DELETE)
    DROP POLICY IF EXISTS "Enable write access for admin users" ON quest_requirements;
    DROP POLICY IF EXISTS "Admin full access to quest requirements" ON quest_requirements;
    CREATE POLICY "Admin full access to quest requirements"
        ON quest_requirements FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND is_super_admin = true
            )
        );

    -- Fix quests policies (missing INSERT/UPDATE/DELETE)
    DROP POLICY IF EXISTS "Enable write access for admin users" ON quests;
    DROP POLICY IF EXISTS "Admin full access to quests" ON quests;
    CREATE POLICY "Admin full access to quests"
        ON quests FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND is_super_admin = true
            )
        );
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
    bool_or(p.cmd = 'DELETE') as has_delete
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename
WHERE t.schemaname = 'public'
AND t.tablename NOT IN ('courses', 'user_follows', 'user_progress', 'users')
GROUP BY t.tablename
ORDER BY t.tablename; 