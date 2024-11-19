-- First, drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_achievements_updated_at ON public.achievements;
DROP TRIGGER IF EXISTS update_quests_updated_at ON public.quests;
DROP TRIGGER IF EXISTS update_items_updated_at ON public.items;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create or replace updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create profiles table
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    rarity TEXT NOT NULL,
    unlocked BOOLEAN DEFAULT false,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    prerequisites TEXT[] DEFAULT ARRAY[]::TEXT[],
    dependents TEXT[] DEFAULT ARRAY[]::TEXT[],
    trigger_conditions JSONB DEFAULT '[]'::jsonb,
    order_num INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_achievements junction table
CREATE TABLE IF NOT EXISTS public.user_achievements (
    user_id UUID REFERENCES public.profiles(id),
    achievement_id TEXT REFERENCES public.achievements(id),
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    progress INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, achievement_id)
);

-- Create quests table
CREATE TABLE IF NOT EXISTS public.quests (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'available',
    xp_reward INTEGER NOT NULL DEFAULT 0,
    coin_reward INTEGER NOT NULL DEFAULT 0,
    requirements JSONB DEFAULT '[]'::jsonb,
    category TEXT NOT NULL,
    order_num INTEGER DEFAULT 0,
    progress INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_quests junction table
CREATE TABLE IF NOT EXISTS public.user_quests (
    user_id UUID REFERENCES public.profiles(id),
    quest_id TEXT REFERENCES public.quests(id),
    status TEXT NOT NULL DEFAULT 'available',
    progress INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (user_id, quest_id)
);

-- Create items table
CREATE TABLE IF NOT EXISTS public.items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL,
    rarity TEXT NOT NULL,
    cost INTEGER NOT NULL DEFAULT 0,
    effects JSONB DEFAULT '[]'::jsonb,
    requirements JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_inventory junction table
CREATE TABLE IF NOT EXISTS public.user_inventory (
    user_id UUID REFERENCES public.profiles(id),
    item_id TEXT REFERENCES public.items(id),
    quantity INTEGER DEFAULT 1,
    equipped BOOLEAN DEFAULT false,
    acquired_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, item_id)
);

-- Create daily_rewards table
CREATE TABLE IF NOT EXISTS public.daily_rewards (
    id TEXT PRIMARY KEY,
    day INTEGER NOT NULL,
    reward_type TEXT NOT NULL,
    reward_value INTEGER NOT NULL,
    rarity TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_daily_rewards junction table
CREATE TABLE IF NOT EXISTS public.user_daily_rewards (
    user_id UUID REFERENCES public.profiles(id),
    reward_id TEXT REFERENCES public.daily_rewards(id),
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, reward_id)
);

-- Create battle_stats table
CREATE TABLE IF NOT EXISTS public.battle_stats (
    user_id UUID REFERENCES public.profiles(id) PRIMARY KEY,
    total_battles INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    win_streak INTEGER DEFAULT 0,
    highest_streak INTEGER DEFAULT 0,
    total_xp_earned INTEGER DEFAULT 0,
    total_coins_earned INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_logins table
CREATE TABLE IF NOT EXISTS public.user_logins (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    login_date DATE NOT NULL,
    streak_maintained BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quests_user_id ON public.user_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_user_id ON public.user_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_daily_rewards_user_id ON public.user_daily_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_logins_user_id ON public.user_logins(user_id);

-- Create triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_achievements_updated_at
    BEFORE UPDATE ON public.achievements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quests_updated_at
    BEFORE UPDATE ON public.quests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at
    BEFORE UPDATE ON public.items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_logins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
    -- Drop profiles policies
    DROP POLICY IF EXISTS enable_read_access_for_all_users ON public.profiles;
    DROP POLICY IF EXISTS enable_write_access_for_own_profile ON public.profiles;
    
    -- Drop achievements policies
    DROP POLICY IF EXISTS enable_read_access_for_all_users ON public.achievements;
    DROP POLICY IF EXISTS enable_write_access_for_admin_users ON public.achievements;
    
    -- Drop quests policies
    DROP POLICY IF EXISTS enable_read_access_for_all_users ON public.quests;
    DROP POLICY IF EXISTS enable_write_access_for_admin_users ON public.quests;
    
    -- Drop items policies
    DROP POLICY IF EXISTS enable_read_access_for_all_users ON public.items;
    DROP POLICY IF EXISTS enable_write_access_for_admin_users ON public.items;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Enable write access for own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable read access for all users" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Enable write access for admin users" ON public.achievements FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true)
);

CREATE POLICY "Enable read access for all users" ON public.quests FOR SELECT USING (true);
CREATE POLICY "Enable write access for admin users" ON public.quests FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true)
);

CREATE POLICY "Enable read access for all users" ON public.items FOR SELECT USING (true);
CREATE POLICY "Enable write access for admin users" ON public.items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true)
);

-- Add more policies as needed for other tables 