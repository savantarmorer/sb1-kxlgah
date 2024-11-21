DO $$ 
BEGIN
    -- First check if user_follows table exists and get its structure
    IF EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'user_follows'
    ) THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "User follows are viewable by everyone" ON user_follows;
        DROP POLICY IF EXISTS "Users can view follows" ON user_follows;
        DROP POLICY IF EXISTS "Users can manage their own follows" ON user_follows;
        DROP POLICY IF EXISTS "Admin full access to user follows" ON user_follows;

        -- Create new policies based on actual column names
        CREATE POLICY "Users can view follows"
            ON user_follows FOR SELECT
            USING (true);

        -- Assuming the column is follower_id instead of user_id
        CREATE POLICY "Users can manage their own follows"
            ON user_follows FOR ALL
            USING (auth.uid() = follower_id);

        CREATE POLICY "Admin full access to user follows"
            ON user_follows FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE id = auth.uid() AND is_super_admin = true
                )
            );
    END IF;

    -- Fix user_progress policies if the table exists
    IF EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'user_progress'
    ) THEN
        DROP POLICY IF EXISTS "Users can insert their own progress" ON user_progress;
        DROP POLICY IF EXISTS "Users can update own progress" ON user_progress;
        DROP POLICY IF EXISTS "Users can view own progress" ON user_progress;
        DROP POLICY IF EXISTS "Admin full access to user progress" ON user_progress;

        -- Create new policies with correct column names
        CREATE POLICY "Users can view own progress"
            ON user_progress FOR SELECT
            USING (auth.uid() = profile_id);

        CREATE POLICY "Users can update own progress"
            ON user_progress FOR UPDATE
            USING (auth.uid() = profile_id);

        CREATE POLICY "Users can insert their own progress"
            ON user_progress FOR INSERT
            WITH CHECK (auth.uid() = profile_id);

        CREATE POLICY "Admin full access to user progress"
            ON user_progress FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE id = auth.uid() AND is_super_admin = true
                )
            );
    END IF;

END $$;

-- Verify table structures and policies
SELECT 
    t.table_name,
    string_agg(c.column_name, ', ') as columns,
    COUNT(p.policyname) as policy_count,
    string_agg(DISTINCT p.cmd::text, ', ') as commands_covered
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
LEFT JOIN pg_policies p ON t.table_name = p.tablename
WHERE t.table_schema = 'public'
AND t.table_name IN ('user_follows', 'user_progress')
GROUP BY t.table_name; 