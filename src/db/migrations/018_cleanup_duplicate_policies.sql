DO $$ 
BEGIN
    -- Clean up duplicate admin policies
    DROP POLICY IF EXISTS "Admin full access to logins" ON user_logins;
    DROP POLICY IF EXISTS "Users can modify quest requirements" ON quest_requirements;
    DROP POLICY IF EXISTS "Users can modify quests" ON quests;

    -- Standardize policy names for admin access
    ALTER POLICY "admin_all" ON profiles RENAME TO "Admin full access to profiles";

    -- Clean up redundant policies
    DROP POLICY IF EXISTS "Enable write access for own profile" ON profiles;
    DROP POLICY IF EXISTS "Allow users to read their own profile" ON profiles;
    CREATE POLICY "Users can manage their own profile"
        ON profiles FOR ALL
        USING (auth.uid() = id);

    -- Fix user_logins duplicate policies
    DROP POLICY IF EXISTS "Admin full access to user logins" ON user_logins;
    DROP POLICY IF EXISTS "Admin full access to logins" ON user_logins;
    CREATE POLICY "Admin full access to user logins"
        ON user_logins FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND is_super_admin = true
            )
        );

    -- Fix quest_requirements redundant policies
    DROP POLICY IF EXISTS "Enable read access for all users" ON quest_requirements;
    DROP POLICY IF EXISTS "Enable write access for admin users" ON quest_requirements;

    -- Fix quests redundant policies
    DROP POLICY IF EXISTS "Enable read access for all users" ON quests;
    DROP POLICY IF EXISTS "Enable write access for admin users" ON quests;
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