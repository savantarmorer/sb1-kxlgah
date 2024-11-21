DO $$ 
DECLARE
    user_id_column_name text;
BEGIN
    -- Check which column name exists in user_progress
    SELECT column_name INTO user_id_column_name
    FROM information_schema.columns
    WHERE table_name = 'user_progress'
    AND table_schema = 'public'
    AND column_name IN ('user_id', 'profile_id', 'id')
    LIMIT 1;

    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can insert their own progress" ON user_progress;
    DROP POLICY IF EXISTS "Users can update own progress" ON user_progress;
    DROP POLICY IF EXISTS "Users can view own progress" ON user_progress;
    DROP POLICY IF EXISTS "Admin full access to user progress" ON user_progress;

    -- Create new policies using the correct column name
    IF user_id_column_name IS NOT NULL THEN
        EXECUTE format('
            CREATE POLICY "Users can view own progress"
                ON user_progress FOR SELECT
                USING (auth.uid() = %I);

            CREATE POLICY "Users can update own progress"
                ON user_progress FOR UPDATE
                USING (auth.uid() = %I);

            CREATE POLICY "Users can insert their own progress"
                ON user_progress FOR INSERT
                WITH CHECK (auth.uid() = %I);
        ', user_id_column_name, user_id_column_name, user_id_column_name);

        -- Admin policy doesn't depend on the column name
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

-- Show the table structure and policies for verification
SELECT 
    c.table_name,
    string_agg(c.column_name, ', ') as columns,
    COUNT(p.policyname) as policy_count,
    string_agg(DISTINCT p.cmd::text, ', ') as commands_covered
FROM information_schema.columns c
LEFT JOIN pg_policies p ON c.table_name = p.tablename
WHERE c.table_schema = 'public'
AND c.table_name = 'user_progress'
GROUP BY c.table_name;

-- Show detailed policy information
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'user_progress'
ORDER BY policyname; 