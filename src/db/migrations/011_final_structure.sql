-- Drop unused tables
DO $$ 
BEGIN
    -- Drop unused tables and their dependencies
    DROP TABLE IF EXISTS courses CASCADE;
    DROP TABLE IF EXISTS user_follows CASCADE;
    DROP TABLE IF EXISTS user_progress CASCADE;
    DROP TABLE IF EXISTS users CASCADE;

    -- Clean up any orphaned policies
    DROP POLICY IF EXISTS "Courses are viewable by everyone" ON courses;
    DROP POLICY IF EXISTS "User follows are viewable by everyone" ON user_follows;
    DROP POLICY IF EXISTS "Users can view own progress" ON user_progress;
    DROP POLICY IF EXISTS "Users can update own progress" ON user_progress;
    DROP POLICY IF EXISTS "Users are viewable by everyone" ON users;
END $$;

-- Verify and document final structure
COMMENT ON TABLE achievements IS 'Stores achievement definitions and metadata';
COMMENT ON TABLE battle_stats IS 'Tracks user battle statistics';
COMMENT ON TABLE daily_rewards IS 'Defines daily reward system';
COMMENT ON TABLE items IS 'Stores game item definitions';
COMMENT ON TABLE notification_history IS 'User notification tracking';
COMMENT ON TABLE profiles IS 'User profiles and game progress';
COMMENT ON TABLE quest_requirements IS 'Quest completion requirements';
COMMENT ON TABLE quests IS 'Game quest definitions';
COMMENT ON TABLE user_achievements IS 'User achievement progress';
COMMENT ON TABLE user_daily_rewards IS 'User daily reward claims';
COMMENT ON TABLE user_inventory IS 'User item ownership';
COMMENT ON TABLE user_logins IS 'User login history';
COMMENT ON TABLE user_quests IS 'User quest progress';

-- Final verification query
SELECT 
    t.tablename,
    obj_description(pgc.oid, 'pg_class') as description,
    COUNT(p.policyname) as policy_count,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = t.tablename) as index_count,
    EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgrelid = t.tablename::regclass 
        AND tgname LIKE 'update_%_updated_at'
    ) as has_updated_at_trigger
FROM pg_tables t
JOIN pg_class pgc ON t.tablename = pgc.relname
LEFT JOIN pg_policies p ON t.tablename = p.tablename
WHERE t.schemaname = 'public'
GROUP BY t.tablename, pgc.oid
ORDER BY t.tablename; 