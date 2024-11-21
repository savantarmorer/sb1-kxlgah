-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create notification_history table
CREATE TABLE IF NOT EXISTS notification_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT false,
    is_dismissed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notification_history_user_id ON notification_history(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_type ON notification_history(type);
CREATE INDEX IF NOT EXISTS idx_notification_history_created_at ON notification_history(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_history_is_read ON notification_history(is_read);

-- Create updated_at trigger
CREATE TRIGGER update_notification_history_updated_at
    BEFORE UPDATE ON notification_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notifications"
    ON notification_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON notification_history FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
    ON notification_history FOR DELETE
    USING (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON TABLE notification_history IS 'Stores user notification history';

-- Now let's verify all required tables exist
DO $$ 
BEGIN
    -- Check all required tables
    ASSERT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles'), 
        'Missing profiles table';
    
    ASSERT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'achievements'), 
        'Missing achievements table';
    
    ASSERT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_achievements'), 
        'Missing user_achievements table';
    
    ASSERT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'quests'), 
        'Missing quests table';
    
    ASSERT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_quests'), 
        'Missing user_quests table';
    
    ASSERT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'quest_requirements'), 
        'Missing quest_requirements table';
    
    ASSERT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'items'), 
        'Missing items table';
    
    ASSERT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_inventory'), 
        'Missing user_inventory table';
    
    ASSERT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'daily_rewards'), 
        'Missing daily_rewards table';
    
    ASSERT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_daily_rewards'), 
        'Missing user_daily_rewards table';
    
    ASSERT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'battle_stats'), 
        'Missing battle_stats table';
    
    ASSERT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notification_history'), 
        'Missing notification_history table';

    -- Verify all tables have RLS enabled
    ASSERT EXISTS (
        SELECT FROM pg_tables t
        JOIN pg_class c ON c.relname = t.tablename
        WHERE t.schemaname = 'public'
        AND c.relrowsecurity = true
    ), 'Some tables are missing RLS';

    -- Verify all tables have updated_at trigger
    ASSERT EXISTS (
        SELECT FROM information_schema.triggers
        WHERE trigger_schema = 'public'
        AND trigger_name LIKE 'update_%_updated_at'
    ), 'Some tables are missing updated_at trigger';

END $$;

-- Show status of all tables
SELECT 
    t.table_name,
    pg_size_pretty(pg_total_relation_size(quote_ident(t.table_name)::text)) as size,
    pg_stat_user_tables.n_live_tup as row_count,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count,
    CASE 
        WHEN c.relrowsecurity THEN 'Enabled'
        ELSE 'Disabled'
    END as rls_status,
    obj_description(quote_ident(t.table_name)::regclass, 'pg_class') as description
FROM information_schema.tables t
JOIN pg_class c ON c.relname = t.table_name
LEFT JOIN pg_stat_user_tables ON pg_stat_user_tables.relname = t.table_name
WHERE t.table_schema = 'public'
AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name; 