-- Drop duplicate policies
DO $$ 
BEGIN
    -- Drop duplicate daily_rewards policies
    DROP POLICY IF EXISTS "enable_read_access_for_all_users" ON daily_rewards;
    DROP POLICY IF EXISTS "enable_write_access_for_admin_users" ON daily_rewards;

    -- Drop duplicate profiles policies that do the same thing
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
END $$;

-- Add missing policies for junction tables
DO $$ 
BEGIN
    -- user_achievements policies
    DROP POLICY IF EXISTS "Users can view their own achievements" ON user_achievements;
    DROP POLICY IF EXISTS "Users can update their own achievements" ON user_achievements;
    
    CREATE POLICY "Users can view their own achievements"
        ON user_achievements FOR SELECT
        USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their own achievements"
        ON user_achievements FOR UPDATE
        USING (auth.uid() = user_id);

    -- user_quests policies
    DROP POLICY IF EXISTS "Users can view their own quests" ON user_quests;
    DROP POLICY IF EXISTS "Users can update their own quests" ON user_quests;
    
    CREATE POLICY "Users can view their own quests"
        ON user_quests FOR SELECT
        USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their own quests"
        ON user_quests FOR UPDATE
        USING (auth.uid() = user_id);

    -- user_inventory policies
    DROP POLICY IF EXISTS "Users can view their own inventory" ON user_inventory;
    DROP POLICY IF EXISTS "Users can update their own inventory" ON user_inventory;
    
    CREATE POLICY "Users can view their own inventory"
        ON user_inventory FOR SELECT
        USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their own inventory"
        ON user_inventory FOR UPDATE
        USING (auth.uid() = user_id);

    -- battle_stats policies
    DROP POLICY IF EXISTS "Users can view their own battle stats" ON battle_stats;
    DROP POLICY IF EXISTS "Users can update their own battle stats" ON battle_stats;
    
    CREATE POLICY "Users can view their own battle stats"
        ON battle_stats FOR SELECT
        USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their own battle stats"
        ON battle_stats FOR UPDATE
        USING (auth.uid() = user_id);

    -- user_logins policies
    DROP POLICY IF EXISTS "Users can view their own login history" ON user_logins;
    
    CREATE POLICY "Users can view their own login history"
        ON user_logins FOR SELECT
        USING (auth.uid() = user_id);

    -- Fix user_daily_rewards INSERT policy
    DROP POLICY IF EXISTS "Users can claim their own daily rewards" ON user_daily_rewards;
    
    CREATE POLICY "Users can claim their own daily rewards"
        ON user_daily_rewards FOR INSERT
        WITH CHECK (auth.uid() = user_id);
END $$;

-- Verify policies after changes
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

-- Show tables missing policies
SELECT DISTINCT t.tablename
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename
WHERE t.schemaname = 'public'
AND p.policyname IS NULL
ORDER BY t.tablename; 