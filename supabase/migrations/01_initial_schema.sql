-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop triggers but keep the function since it's used by other tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_user_progress_updated_at ON user_progress;
DROP TRIGGER IF EXISTS update_store_items_updated_at ON store_items;
DROP TRIGGER IF EXISTS UPDATE_ACHIEVEMENTs_updated_at ON achievements;
DROP TRIGGER IF EXISTS update_user_achievements_updated_at ON user_achievements;
DROP TRIGGER IF EXISTS update_user_statistics_updated_at ON user_statistics;
DROP TRIGGER IF EXISTS update_subject_scores_updated_at ON subject_scores;
DROP TRIGGER IF EXISTS update_user_inventory_updated_at ON user_inventory;

-- Create updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Users Table
-- Core user data including authentication and profile information
-- Referenced by: user_progress, user_inventory, user_achievements, user_statistics
-- Dependencies: None
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    encrypted_password TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    role TEXT NOT NULL DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_username CHECK (username ~* '^[A-Za-z0-9_-]{3,20}$')
);

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- User Progress Table
-- Tracks user's game progress, scores, and stats
-- Referenced by: achievements (for progress checks)
-- Dependencies: users
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    coins INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    achievements JSONB DEFAULT '{}',
    inventory JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT positive_xp CHECK (xp >= 0),
    CONSTRAINT positive_level CHECK (level >= 1),
    CONSTRAINT positive_coins CHECK (coins >= 0),
    CONSTRAINT positive_streak CHECK (streak >= 0)
);

DROP TRIGGER IF EXISTS update_user_progress_updated_at ON user_progress;
CREATE TRIGGER update_user_progress_updated_at
    BEFORE UPDATE ON user_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create separate table for subject scores
CREATE TABLE IF NOT EXISTS subject_scores (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, subject),
    CONSTRAINT positive_score CHECK (score >= 0)
);

DROP TRIGGER IF EXISTS update_subject_scores_updated_at ON subject_scores;
CREATE TRIGGER update_subject_scores_updated_at
    BEFORE UPDATE ON subject_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Store Items Table
-- Defines available items in the store
-- Referenced by: user_inventory, store_purchases
-- Dependencies: None
CREATE TABLE IF NOT EXISTS store_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    type TEXT NOT NULL,
    rarity TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT positive_price CHECK (price >= 0),
    CONSTRAINT valid_type CHECK (type IN ('booster', 'material', 'cosmetic', 'session')),
    CONSTRAINT valid_rarity CHECK (rarity IN ('common', 'rare', 'epic', 'legendary'))
);

DROP TRIGGER IF EXISTS update_store_items_updated_at ON store_items;
CREATE TRIGGER update_store_items_updated_at
    BEFORE UPDATE ON store_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- User Inventory Table
-- Tracks items owned by users
-- Referenced by: none
-- Dependencies: users, store_items
CREATE TABLE IF NOT EXISTS user_inventory (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    equipped BOOLEAN DEFAULT false,
    acquired_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, item_id),
    CONSTRAINT positive_quantity CHECK (quantity > 0)
);

DROP TRIGGER IF EXISTS update_user_inventory_updated_at ON user_inventory;
CREATE TRIGGER update_user_inventory_updated_at
    BEFORE UPDATE ON user_inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- User Quests Table
-- Tracks user progress in quests
-- Referenced by: none
-- Dependencies: users
CREATE TABLE IF NOT EXISTS user_quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    quest_id UUID NOT NULL,
    status TEXT NOT NULL,
    progress INTEGER DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_status CHECK (status IN ('not_started', 'in_progress', 'completed', 'failed')),
    CONSTRAINT valid_progress CHECK (progress BETWEEN 0 AND 100)
);

-- Store Purchases Table
-- Tracks all store transactions
-- Referenced by: achievements (for purchase-based achievements)
-- Dependencies: users, store_items
CREATE TABLE IF NOT EXISTS store_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    item_id UUID REFERENCES store_items(id) ON DELETE CASCADE,
    price_paid INTEGER NOT NULL,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT positive_price_paid CHECK (price_paid >= 0)
);

-- Achievements Table
-- Defines available achievements and their requirements
-- Referenced by: user_achievements
-- Dependencies: none
CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    rarity TEXT NOT NULL,
    unlocked BOOLEAN DEFAULT false,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    prerequisites TEXT[],
    dependents TEXT[],
    trigger_conditions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    order_num INTEGER,
    CONSTRAINT positive_points CHECK (points >= 0),
    CONSTRAINT valid_category CHECK (category IN ('general', 'study', 'social', 'store', 'streak')),
    CONSTRAINT valid_rarity CHECK (rarity IN ('common', 'rare', 'epic', 'legendary'))
);

DROP TRIGGER IF EXISTS UPDATE_ACHIEVEMENTs_updated_at ON achievements;
CREATE TRIGGER UPDATE_ACHIEVEMENTs_updated_at
    BEFORE UPDATE ON achievements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- User Achievements Table
-- Tracks user progress towards achievements
-- Referenced by: None
-- Dependencies: users, achievements
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_id TEXT REFERENCES achievements(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id),
    CONSTRAINT valid_progress CHECK (progress BETWEEN 0 AND 100)
);

DROP TRIGGER IF EXISTS update_user_achievements_updated_at ON user_achievements;
CREATE TRIGGER update_user_achievements_updated_at
    BEFORE UPDATE ON user_achievements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- User Statistics Table
-- Tracks various user statistics for achievements and analytics
-- Referenced by: achievements (for statistic-based achievements)
-- Dependencies: users
CREATE TABLE IF NOT EXISTS user_statistics (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_coins_earned INTEGER DEFAULT 0,
    total_coins_spent INTEGER DEFAULT 0,
    total_xp_earned INTEGER DEFAULT 0,
    total_questions_answered INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    wrong_answers INTEGER DEFAULT 0,
    total_study_sessions INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT positive_statistics CHECK (
        total_coins_earned >= 0 AND
        total_coins_spent >= 0 AND
        total_xp_earned >= 0 AND
        total_questions_answered >= 0 AND
        correct_answers >= 0 AND
        wrong_answers >= 0 AND
        total_study_sessions >= 0 AND
        longest_streak >= 0
    )
);

DROP TRIGGER IF EXISTS update_user_statistics_updated_at ON user_statistics;
CREATE TRIGGER update_user_statistics_updated_at
    BEFORE UPDATE ON user_statistics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_progress_scores 
ON user_progress(xp, level, coins, streak);

CREATE INDEX IF NOT EXISTS idx_user_inventory_equipped 
ON user_inventory(user_id) WHERE equipped = true;

CREATE INDEX IF NOT EXISTS idx_user_quests_status 
ON user_quests(user_id, status);

CREATE INDEX IF NOT EXISTS idx_achievements_category 
ON achievements(category, rarity);

CREATE INDEX IF NOT EXISTS idx_user_achievements_completed 
ON user_achievements(user_id) WHERE unlocked_at IS NOT NULL;

-- Create view for user leaderboard
CREATE OR REPLACE VIEW user_leaderboard AS
SELECT 
    u.username,
    up.level,
    up.xp,
    COALESCE(SUM(ss.score), 0) as total_score,
    up.streak,
    COUNT(ua.id) FILTER (WHERE ua.unlocked_at IS NOT NULL) as achievements_count,
    ROW_NUMBER() OVER (ORDER BY up.xp DESC) as rank
FROM users u
JOIN user_progress up ON u.id = up.user_id
LEFT JOIN subject_scores ss ON u.id = ss.user_id
LEFT JOIN user_achievements ua ON u.id = ua.user_id
WHERE u.is_active = true
GROUP BY u.id, u.username, up.level, up.xp, up.streak;

-- Comments on tables for documentation
COMMENT ON TABLE users IS 'Core user accounts and authentication information';
COMMENT ON TABLE user_progress IS 'User game progress including scores, levels, and streaks';
COMMENT ON TABLE subject_scores IS 'User subject scores';
COMMENT ON TABLE store_items IS 'Available items in the store with their properties';
COMMENT ON TABLE user_inventory IS 'Items owned by users';
COMMENT ON TABLE store_purchases IS 'Record of all store transactions';
COMMENT ON TABLE achievements IS 'Available achievements and their requirements';
COMMENT ON TABLE user_achievements IS 'User progress towards achievements';
COMMENT ON TABLE user_statistics IS 'Aggregate statistics for user activities';
