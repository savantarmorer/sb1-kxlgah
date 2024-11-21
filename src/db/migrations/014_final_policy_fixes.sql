DO $$ 
BEGIN
    -- Fix daily_rewards policies (missing INSERT/UPDATE/DELETE for admin)
    DROP POLICY IF EXISTS "Enable write access for admin users" ON daily_rewards;
    CREATE POLICY "Admin full access to daily rewards"
        ON daily_rewards FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND is_super_admin = true
            )
        );

    -- Fix items policies (missing INSERT/UPDATE/DELETE for admin)
    DROP POLICY IF EXISTS "Enable write access for admin users" ON items;
    CREATE POLICY "Admin full access to items"
        ON items FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND is_super_admin = true
            )
        );

    -- Fix battle_stats (missing DELETE)
    CREATE POLICY "Users can delete their battle stats"
        ON battle_stats FOR DELETE
        USING (auth.uid() = user_id);

    -- Fix profiles (missing DELETE)
    CREATE POLICY "Users can delete their own profile"
        ON profiles FOR DELETE
        USING (auth.uid() = id);

    -- Fix user_logins (missing UPDATE/DELETE)
    CREATE POLICY "Users can update their login records"
        ON user_logins FOR UPDATE
        USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete their login records"
        ON user_logins FOR DELETE
        USING (auth.uid() = user_id);

    -- Fix user_daily_rewards (missing DELETE)
    CREATE POLICY "Users can delete their daily reward claims"
        ON user_daily_rewards FOR DELETE
        USING (auth.uid() = user_id);
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