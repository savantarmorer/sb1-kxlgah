-- Comprehensive Database Schema for Gamified Educational Platform
-- Version: 1.0
-- Created: 2024-01-15

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Utility function for automatic updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Profiles Table (Core User Information)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    avatar TEXT,
    title TEXT,
    is_super_admin BOOLEAN DEFAULT false,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    coins INTEGER DEFAULT 100,
    streak INTEGER DEFAULT 0,
    study_time INTEGER DEFAULT 0,
    constitutional_score INTEGER DEFAULT 0,
    civil_score INTEGER DEFAULT 0,
    criminal_score INTEGER DEFAULT 0,
    administrative_score INTEGER DEFAULT 0,
    roles TEXT[] DEFAULT ARRAY['user'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Achievements Table
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    points INTEGER,
    rarity TEXT CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    prerequisites UUID[],
    trigger_conditions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Achievements Tracking
CREATE TABLE IF NOT EXISTS public.user_achievements (
    user_id UUID REFERENCES public.profiles(id),
    achievement_id UUID REFERENCES public.achievements(id),
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    progress JSONB,
    PRIMARY KEY (user_id, achievement_id)
);

-- Quests Table
CREATE TABLE IF NOT EXISTS public.quests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT,
    category TEXT,
    status TEXT DEFAULT 'active',
    xp_reward INTEGER,
    coin_reward INTEGER,
    requirements JSONB,
    display_order INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Quests Progress
CREATE TABLE IF NOT EXISTS public.user_quests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    quest_id UUID REFERENCES public.quests(id),
    status TEXT DEFAULT 'in_progress',
    progress JSONB,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Battle Questions Table
CREATE TABLE IF NOT EXISTS public.battle_questions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    question TEXT NOT NULL,
    alternative_a TEXT,
    alternative_b TEXT,
    alternative_c TEXT,
    alternative_d TEXT,
    correct_answer TEXT,
    category TEXT,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Battle History Table
CREATE TABLE IF NOT EXISTS public.battle_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    opponent_id UUID,
    winner_id UUID,
    score_player INTEGER,
    score_opponent INTEGER,
    xp_earned INTEGER,
    coins_earned INTEGER,
    streak_bonus INTEGER,
    is_bot_opponent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Battle Stats Table
CREATE TABLE IF NOT EXISTS public.battle_stats (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id),
    total_battles INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    win_streak INTEGER DEFAULT 0,
    highest_streak INTEGER DEFAULT 0,
    total_xp_earned INTEGER DEFAULT 0,
    total_coins_earned INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Items Table
CREATE TABLE IF NOT EXISTS public.items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT,
    rarity TEXT CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    cost INTEGER,
    effects JSONB,
    requirements JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Inventory
CREATE TABLE IF NOT EXISTS public.user_inventory (
    user_id UUID REFERENCES public.profiles(id),
    item_id UUID REFERENCES public.items(id),
    quantity INTEGER DEFAULT 1,
    equipped BOOLEAN DEFAULT false,
    acquired_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, item_id)
);

-- Performance Metrics
CREATE TABLE IF NOT EXISTS public.performance_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    context TEXT,
    duration INTERVAL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- System Logs
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    level TEXT CHECK (level IN ('info', 'warning', 'error', 'critical')),
    context TEXT,
    message TEXT,
    metadata JSONB,
    error_stack TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create triggers for automatic updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER UPDATE_ACHIEVEMENTs_updated_at
    BEFORE UPDATE ON public.achievements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER UPDATE_QUESTs_updated_at
    BEFORE UPDATE ON public.quests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER UPDATE_ITEMs_updated_at
    BEFORE UPDATE ON public.items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_achievements ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quests ON public.user_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_battle_history ON public.battle_history(user_id);
CREATE INDEX IF NOT EXISTS idx_battle_stats ON public.battle_stats(user_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_random_battle_questions(text,integer);

-- Create get_random_battle_questions function
CREATE OR REPLACE FUNCTION get_random_battle_questions(
    difficulty_filter text DEFAULT NULL,
    questions_limit integer DEFAULT 10
)
RETURNS SETOF battle_questions AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM battle_questions
    WHERE (difficulty_filter IS NULL OR difficulty = difficulty_filter)
    ORDER BY RANDOM()
    LIMIT questions_limit;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE public.profiles IS 'Stores core user profile information and game progression';
COMMENT ON TABLE public.achievements IS 'Defines possible achievements in the game system';
COMMENT ON TABLE public.user_achievements IS 'Tracks user-specific achievement progress';
COMMENT ON TABLE public.quests IS 'Defines available quests in the game system';
COMMENT ON TABLE public.user_quests IS 'Tracks individual user quest progress';
COMMENT ON TABLE public.battle_questions IS 'Stores questions used in battle mode';
COMMENT ON TABLE public.battle_history IS 'Records historical battle information';
COMMENT ON TABLE public.battle_stats IS 'Aggregates user battle performance metrics';
COMMENT ON TABLE public.items IS 'Defines items available in the game store';
COMMENT ON TABLE public.user_inventory IS 'Tracks items owned by users';
COMMENT ON TABLE public.performance_metrics IS 'Stores system performance tracking data';
COMMENT ON TABLE public.system_logs IS 'Comprehensive system logging for monitoring and debugging';
