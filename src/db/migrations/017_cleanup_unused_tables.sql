-- Drop unused tables and their dependencies
DO $$ 
BEGIN
    -- Drop courses table and related objects
    DROP TABLE IF EXISTS courses CASCADE;
    
    -- Drop user_follows table and related objects
    DROP TABLE IF EXISTS user_follows CASCADE;
    
    -- Drop user_progress table and related objects
    DROP TABLE IF EXISTS user_progress CASCADE;
    
    -- Drop users table if it's not the auth.users table
    -- (Only if this is a duplicate and not the main auth table)
    IF EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'users'
        AND EXISTS (
            SELECT FROM pg_tables 
            WHERE schemaname = 'auth' 
            AND tablename = 'users'
        )
    ) THEN
        DROP TABLE IF EXISTS users CASCADE;
    END IF;

    -- Clean up any orphaned policies
    DROP POLICY IF EXISTS "Courses are viewable by everyone" ON courses;
    DROP POLICY IF EXISTS "User follows are viewable by everyone" ON user_follows;
    DROP POLICY IF EXISTS "Users can view own progress" ON user_progress;
    DROP POLICY IF EXISTS "Users can update own progress" ON user_progress;
    DROP POLICY IF EXISTS "Users are viewable by everyone" ON users;
END $$;

-- Verify remaining tables
SELECT 
    tablename,
    obj_description(pgc.oid, 'pg_class') as description,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = pgc.relname) as index_count
FROM pg_tables t
JOIN pg_class pgc ON t.tablename = pgc.relname
WHERE t.schemaname = 'public'
ORDER BY tablename; 