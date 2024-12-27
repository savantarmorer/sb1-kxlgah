-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User profile table
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    username TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    coins INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tournament tables
CREATE TABLE tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    entry_fee INTEGER NOT NULL DEFAULT 0,
    max_participants INTEGER NOT NULL,
    min_level INTEGER DEFAULT 1,
    status TEXT NOT NULL CHECK (status IN ('upcoming', 'registration', 'in_progress', 'completed', 'cancelled')),
    rules JSONB DEFAULT '{}'::jsonb,
    rewards JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE tournament_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    score INTEGER DEFAULT 0,
    matches_played INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'eliminated', 'winner')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tournament_id, user_id)
);

CREATE TABLE tournament_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    round INTEGER NOT NULL,
    player1_id UUID REFERENCES auth.users(id),
    player2_id UUID REFERENCES auth.users(id),
    winner_id UUID REFERENCES auth.users(id),
    player1_score INTEGER DEFAULT 0,
    player2_score INTEGER DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('waiting', 'ready', 'in_progress', 'completed')),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE match_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES tournament_matches(id) ON DELETE CASCADE,
    question_id UUID NOT NULL,
    order_number INTEGER NOT NULL,
    player1_answer TEXT,
    player2_answer TEXT,
    player1_score INTEGER DEFAULT 0,
    player2_score INTEGER DEFAULT 0,
    answered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(match_id, question_id)
);

-- Analytics tables
CREATE TABLE tournament_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    active_players INTEGER,
    matches_in_progress INTEGER,
    average_match_duration INTEGER,
    error_rate FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE player_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    tournaments_played INTEGER DEFAULT 0,
    tournaments_won INTEGER DEFAULT 0,
    matches_played INTEGER DEFAULT 0,
    matches_won INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    rating INTEGER DEFAULT 1000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification system
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievement system
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_url TEXT,
    requirements JSONB NOT NULL,
    rewards JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE player_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    achievement_id UUID REFERENCES achievements(id),
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- Functions and triggers
CREATE OR REPLACE FUNCTION update_player_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update winner stats
    IF NEW.winner_id IS NOT NULL AND OLD.winner_id IS NULL THEN
        UPDATE player_stats
        SET matches_played = matches_played + 1,
            matches_won = matches_won + 1,
            total_score = total_score + GREATEST(NEW.player1_score, NEW.player2_score),
            updated_at = NOW()
        WHERE user_id = NEW.winner_id;
        
        -- Update loser stats
        UPDATE player_stats
        SET matches_played = matches_played + 1,
            total_score = total_score + LEAST(NEW.player1_score, NEW.player2_score),
            updated_at = NOW()
        WHERE user_id = (
            CASE 
                WHEN NEW.player1_id = NEW.winner_id THEN NEW.player2_id
                ELSE NEW.player1_id
            END
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stats_after_match
    AFTER UPDATE ON tournament_matches
    FOR EACH ROW
    WHEN (OLD.status != 'completed' AND NEW.status = 'completed')
    EXECUTE FUNCTION update_player_stats();

-- Function to award tournament rewards
CREATE OR REPLACE FUNCTION award_tournament_rewards(
    p_user_id UUID,
    p_xp INTEGER,
    p_coins INTEGER,
    p_items JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Update user profile
    UPDATE profiles
    SET xp = xp + p_xp,
        coins = coins + p_coins,
        level = GREATEST(1, FLOOR(POWER((xp + p_xp) / 1000.0, 0.5))::INTEGER),
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Handle special items if provided
    IF p_items IS NOT NULL THEN
        -- Implementation depends on your item system
        -- This is a placeholder for item handling logic
        NULL;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Indexes for performance
CREATE INDEX idx_tournament_participants_tournament ON tournament_participants(tournament_id);
CREATE INDEX idx_tournament_matches_tournament ON tournament_matches(tournament_id);
CREATE INDEX idx_match_questions_match ON match_questions(match_id);
CREATE INDEX idx_tournament_metrics_tournament ON tournament_metrics(tournament_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, read);
CREATE INDEX idx_player_achievements_user ON player_achievements(user_id);

-- Row Level Security Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_achievements ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (customize based on your needs)
CREATE POLICY "Public tournaments are viewable by everyone"
    ON tournaments FOR SELECT
    USING (true);

CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

-- Initial data (optional)
INSERT INTO achievements (title, description, requirements, rewards) VALUES
    ('Tournament Victor', 'Win your first tournament', 
     '{"tournaments_won": 1}'::jsonb, 
     '{"xp": 1000, "coins": 500}'::jsonb),
    ('Battle Hardened', 'Play 100 tournament matches', 
     '{"matches_played": 100}'::jsonb, 
     '{"xp": 2000, "coins": 1000}'::jsonb),
    ('Perfect Score', 'Get a perfect score in a tournament match', 
     '{"perfect_matches": 1}'::jsonb, 
     '{"xp": 500, "coins": 250}'::jsonb); 