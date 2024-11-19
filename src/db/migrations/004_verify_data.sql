-- Verify achievements
SELECT COUNT(*) as achievement_count FROM public.achievements;

-- Verify quests
SELECT COUNT(*) as quest_count FROM public.quests;

-- Verify items
SELECT COUNT(*) as item_count FROM public.items;

-- Verify daily rewards
SELECT COUNT(*) as daily_reward_count FROM public.daily_rewards;

-- Verify admin user
SELECT 
    name,
    is_super_admin,
    level,
    xp,
    coins
FROM public.profiles 
WHERE name = 'Admin' AND is_super_admin = true;

-- Show all tables and their row counts
SELECT 
    schemaname,
    relname as table_name,
    n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- Show table schemas
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Show existing policies
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
ORDER BY tablename;

-- Show existing triggers
SELECT 
    tgname as trigger_name,
    relname as table_name,
    proname as function_name
FROM pg_trigger 
JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY relname, tgname; 