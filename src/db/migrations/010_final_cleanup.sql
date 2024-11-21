DO $$ 
BEGIN
    -- Add missing INSERT policies for user-related tables
    
    -- user_achievements
    DROP POLICY IF EXISTS "Users can insert their own achievements" ON user_achievements;
    CREATE POLICY "Users can insert their own achievements"
        ON user_achievements FOR INSERT
        WITH CHECK (auth.uid() = user_id);

    -- user_quests
    DROP POLICY IF EXISTS "Users can insert their own quests" ON user_quests;
    CREATE POLICY "Users can insert their own quests"
        ON user_quests FOR INSERT
        WITH CHECK (auth.uid() = user_id);

    -- user_inventory
    DROP POLICY IF EXISTS "Users can insert into their own inventory" ON user_inventory;
    CREATE POLICY "Users can insert into their own inventory"
        ON user_inventory FOR INSERT
        WITH CHECK (auth.uid() = user_id);

    -- battle_stats
    DROP POLICY IF EXISTS "Users can insert their own battle stats" ON battle_stats;
    CREATE POLICY "Users can insert their own battle stats"
        ON battle_stats FOR INSERT
        WITH CHECK (auth.uid() = user_id);

    -- Fix incomplete user_daily_rewards INSERT policy
    DROP POLICY IF EXISTS "Users can claim their own daily rewards" ON user_daily_rewards;
    CREATE POLICY "Users can claim their own daily rewards"
        ON user_daily_rewards FOR INSERT
        WITH CHECK (auth.uid() = user_id);

    -- Add DELETE policies where needed
    DROP POLICY IF EXISTS "Users can delete their own achievements" ON user_achievements;
    CREATE POLICY "Users can delete their own achievements"
        ON user_achievements FOR DELETE
        USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can delete their own quests" ON user_quests;
    CREATE POLICY "Users can delete their own quests"
        ON user_quests FOR DELETE
        USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can delete from their inventory" ON user_inventory;
    CREATE POLICY "Users can delete from their inventory"
        ON user_inventory FOR DELETE
        USING (auth.uid() = user_id);

    -- Add admin policies for user tables
    DROP POLICY IF EXISTS "Admin full access to user achievements" ON user_achievements;
    CREATE POLICY "Admin full access to user achievements"
        ON user_achievements FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND is_super_admin = true
            )
        );

    DROP POLICY IF EXISTS "Admin full access to user quests" ON user_quests;
    CREATE POLICY "Admin full access to user quests"
        ON user_quests FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND is_super_admin = true
            )
        );

    DROP POLICY IF EXISTS "Admin full access to battle stats" ON battle_stats;
    CREATE POLICY "Admin full access to battle stats"
        ON battle_stats FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND is_super_admin = true
            )
        );

    -- Clean up duplicate profiles policies if any remain
    DROP POLICY IF EXISTS "Enable all access for authenticated users" ON profiles;
    
    -- Add proper admin policy for user_daily_rewards
    DROP POLICY IF EXISTS "Admin full access to user daily rewards" ON user_daily_rewards;
    CREATE POLICY "Admin full access to user daily rewards"
        ON user_daily_rewards FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND is_super_admin = true
            )
        );
END $$;

-- Verify all tables have proper policies
SELECT 
    t.tablename,
    COUNT(p.policyname) as policy_count,
    string_agg(p.cmd::text, ', ') as commands_covered
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename
WHERE t.schemaname = 'public'
GROUP BY t.tablename
ORDER BY t.tablename; 