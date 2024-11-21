DO $$ 
BEGIN
    -- Only handle existing tables and their policies
    
    -- Fix notification_history policies
    DROP POLICY IF EXISTS "Users can insert their own notifications" ON notification_history;
    CREATE POLICY "Users can insert their own notifications"
        ON notification_history FOR INSERT
        WITH CHECK (auth.uid() = user_id);

    -- Add admin policy for notification_history
    DROP POLICY IF EXISTS "Admin full access to notifications" ON notification_history;
    CREATE POLICY "Admin full access to notifications"
        ON notification_history FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND is_super_admin = true
            )
        );

    -- Fix user_logins policies
    DROP POLICY IF EXISTS "Users can insert their own login records" ON user_logins;
    CREATE POLICY "Users can insert their own login records"
        ON user_logins FOR INSERT
        WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Admin full access to user logins" ON user_logins;
    CREATE POLICY "Admin full access to user logins"
        ON user_logins FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND is_super_admin = true
            )
        );

    -- Clean up any remaining duplicate SELECT policies
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Allow users to read their own profile'
    ) THEN
        DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
    END IF;

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
GROUP BY t.tablename
ORDER BY t.tablename; 