-- Enable necessary extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
    winner_id UUID REFERENCES auth.users(id),
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
    error_count INTEGER DEFAULT 0,
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
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    answered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(match_id, question_id)
);

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

-- Add tournament-specific columns to existing tables
ALTER TABLE battle_stats
ADD COLUMN IF NOT EXISTS tournaments_played INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tournaments_won INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tournament_matches_played INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tournament_matches_won INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tournament_rating INTEGER DEFAULT 1000;

-- Add tournament-specific achievements
WITH max_order AS (
    SELECT COALESCE(MAX(order_num), 0) as max_num FROM achievements
)
INSERT INTO achievements (
    id,
    title,
    description,
    category,
    points,
    rarity,
    unlocked,
    unlocked_at,
    prerequisites,
    dependents,
    trigger_conditions,
    created_at,
    updated_at,
    order_num
) VALUES 
    (
        uuid_generate_v4(),
        'Tournament Victor',
        'Win your first tournament',
        'tournament',
        1000,
        'rare',
        false,
        NULL,
        ARRAY[]::text[],
        ARRAY[]::text[],
        jsonb_build_object('tournaments_won', 1),
        NOW(),
        NOW(),
        (SELECT max_num + 1 FROM max_order)
    ),
    (
        uuid_generate_v4(),
        'Tournament Master',
        'Win 5 tournaments',
        'tournament',
        5000,
        'epic',
        false,
        NULL,
        ARRAY[]::text[],
        ARRAY[]::text[],
        jsonb_build_object('tournaments_won', 5),
        NOW(),
        NOW(),
        (SELECT max_num + 2 FROM max_order)
    ),
    (
        uuid_generate_v4(),
        'Tournament Legend',
        'Win 10 tournaments',
        'tournament',
        10000,
        'legendary',
        false,
        NULL,
        ARRAY[]::text[],
        ARRAY[]::text[],
        jsonb_build_object('tournaments_won', 10),
        NOW(),
        NOW(),
        (SELECT max_num + 3 FROM max_order)
    );

-- Indexes for performance
CREATE INDEX idx_tournament_participants_tournament ON tournament_participants(tournament_id);
CREATE INDEX idx_tournament_matches_tournament ON tournament_matches(tournament_id);
CREATE INDEX idx_match_questions_match ON match_questions(match_id);
CREATE INDEX idx_tournament_metrics_tournament ON tournament_metrics(tournament_id);
CREATE INDEX idx_tournament_status ON tournaments(status);
CREATE INDEX idx_tournament_dates ON tournaments(start_date, end_date);

-- Row Level Security Policies
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_metrics ENABLE ROW LEVEL SECURITY;

-- Tournament RLS Policies
CREATE POLICY "Public tournaments are viewable by everyone"
    ON tournaments FOR SELECT
    USING (true);

CREATE POLICY "Only admins can create tournaments"
    ON tournaments FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT id FROM profiles WHERE is_super_admin = true
    ));

CREATE POLICY "Only admins can update tournaments"
    ON tournaments FOR UPDATE
    USING (auth.uid() IN (
        SELECT id FROM profiles WHERE is_super_admin = true
    ));

CREATE POLICY "Only admins can delete tournaments"
    ON tournaments FOR DELETE
    USING (auth.uid() IN (
        SELECT id FROM profiles WHERE is_super_admin = true
    ));

-- Tournament Participants RLS Policies
CREATE POLICY "Users can view tournament participants"
    ON tournament_participants FOR SELECT
    USING (true);

CREATE POLICY "Users can join tournaments"
    ON tournament_participants FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM tournaments t
            WHERE t.id = tournament_id
            AND t.status = 'registration'
            AND (
                SELECT COUNT(*) FROM tournament_participants tp
                WHERE tp.tournament_id = t.id
            ) < t.max_participants
        )
    );

CREATE POLICY "Users can update their own participation"
    ON tournament_participants FOR UPDATE
    USING (auth.uid() = user_id);

-- Tournament Matches RLS Policies
CREATE POLICY "Users can view matches they're part of"
    ON tournament_matches FOR SELECT
    USING (
        auth.uid() = player1_id OR 
        auth.uid() = player2_id OR
        EXISTS (
            SELECT 1 FROM tournament_participants tp
            WHERE tp.tournament_id = tournament_id
            AND tp.user_id = auth.uid()
        )
    );

CREATE POLICY "Only admins can create matches"
    ON tournament_matches FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT id FROM profiles WHERE is_super_admin = true
    ));

CREATE POLICY "Players can update their own matches"
    ON tournament_matches FOR UPDATE
    USING (
        (auth.uid() = player1_id OR auth.uid() = player2_id) AND
        status = 'in_progress'
    );

-- Match Questions RLS Policies
CREATE POLICY "Players can view their match questions"
    ON match_questions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tournament_matches tm
            WHERE tm.id = match_id AND
            (tm.player1_id = auth.uid() OR tm.player2_id = auth.uid())
        )
    );

CREATE POLICY "Players can answer their match questions"
    ON match_questions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM tournament_matches tm
            WHERE tm.id = match_id AND
            (tm.player1_id = auth.uid() OR tm.player2_id = auth.uid()) AND
            tm.status = 'in_progress'
        )
    );

-- Tournament Metrics RLS Policies
CREATE POLICY "Only admins can view metrics"
    ON tournament_metrics FOR SELECT
    USING (auth.uid() IN (
        SELECT id FROM profiles WHERE is_super_admin = true
    ));

CREATE POLICY "Only admins can insert metrics"
    ON tournament_metrics FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT id FROM profiles WHERE is_super_admin = true
    ));

CREATE POLICY "Only admins can update metrics"
    ON tournament_metrics FOR UPDATE
    USING (auth.uid() IN (
        SELECT id FROM profiles WHERE is_super_admin = true
    )); 

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE metric_condition AS ENUM ('greater_than', 'less_than', 'equals');
CREATE TYPE metric_status AS ENUM ('active', 'paused', 'deleted');

-- Match Feedback Table
CREATE TABLE match_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES tournament_matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  latency_rating INTEGER NOT NULL CHECK (latency_rating BETWEEN 1 AND 5),
  balance_rating INTEGER NOT NULL CHECK (balance_rating BETWEEN 1 AND 5),
  comments TEXT,
  issues TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(match_id, player_id)
);

-- Tournament Feedback Table
CREATE TABLE tournament_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  overall_experience INTEGER NOT NULL CHECK (overall_experience BETWEEN 1 AND 5),
  would_play_again BOOLEAN NOT NULL,
  format_rating INTEGER NOT NULL CHECK (format_rating BETWEEN 1 AND 5),
  suggestions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tournament_id, player_id)
);

-- System Metrics Table
CREATE TABLE system_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cpu_usage FLOAT NOT NULL CHECK (cpu_usage BETWEEN 0 AND 100),
  memory_usage FLOAT NOT NULL CHECK (memory_usage BETWEEN 0 AND 100),
  error_rate FLOAT NOT NULL DEFAULT 0,
  response_time INTEGER NOT NULL, -- in milliseconds
  active_connections INTEGER NOT NULL DEFAULT 0,
  requests_per_second INTEGER NOT NULL DEFAULT 0
);

-- Feedback Metrics Table
CREATE TABLE feedback_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('match', 'tournament')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metrics JSONB NOT NULL
);

-- Metric Alerts Table
CREATE TABLE metric_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name TEXT NOT NULL,
  condition metric_condition NOT NULL,
  threshold FLOAT NOT NULL,
  status metric_status NOT NULL DEFAULT 'active',
  notification_channels JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alert History Table
CREATE TABLE alert_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id UUID NOT NULL REFERENCES metric_alerts(id) ON DELETE CASCADE,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metric_value FLOAT NOT NULL,
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT
);

-- Create indexes for performance
CREATE INDEX idx_match_feedback_match_id ON match_feedback(match_id);
CREATE INDEX idx_match_feedback_player_id ON match_feedback(player_id);
CREATE INDEX idx_tournament_feedback_tournament_id ON tournament_feedback(tournament_id);
CREATE INDEX idx_tournament_feedback_player_id ON tournament_feedback(player_id);
CREATE INDEX idx_system_metrics_timestamp ON system_metrics(timestamp);
CREATE INDEX idx_feedback_metrics_type_timestamp ON feedback_metrics(type, timestamp);
CREATE INDEX idx_alert_history_alert_id ON alert_history(alert_id);
CREATE INDEX idx_alert_history_triggered_at ON alert_history(triggered_at);

-- Add RLS policies
ALTER TABLE match_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;

-- Match feedback policies
CREATE POLICY "Users can view their own match feedback"
  ON match_feedback FOR SELECT
  USING (auth.uid() = player_id);

CREATE POLICY "Users can create their own match feedback"
  ON match_feedback FOR INSERT
  WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Tournament organizers can view match feedback"
  ON match_feedback FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tournaments t
    JOIN tournament_matches tm ON tm.tournament_id = t.id
    WHERE tm.id = match_feedback.match_id
    AND t.organizer_id = auth.uid()
  ));

-- Tournament feedback policies
CREATE POLICY "Users can view their own tournament feedback"
  ON tournament_feedback FOR SELECT
  USING (auth.uid() = player_id);

CREATE POLICY "Users can create their own tournament feedback"
  ON tournament_feedback FOR INSERT
  WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Tournament organizers can view tournament feedback"
  ON tournament_feedback FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tournaments t
    WHERE t.id = tournament_feedback.tournament_id
    AND t.organizer_id = auth.uid()
  ));

-- System metrics policies
CREATE POLICY "Only admins can view system metrics"
  ON system_metrics FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'admin'
  ));

CREATE POLICY "Only system can insert metrics"
  ON system_metrics FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'system'
  ));

-- Feedback metrics policies
CREATE POLICY "Only admins can view feedback metrics"
  ON feedback_metrics FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'admin'
  ));

CREATE POLICY "Only system can insert feedback metrics"
  ON feedback_metrics FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'system'
  ));

-- Metric alerts policies
CREATE POLICY "Only admins can manage alerts"
  ON metric_alerts FOR ALL
  USING (auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'admin'
  ));

-- Alert history policies
CREATE POLICY "Only admins can view alert history"
  ON alert_history FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'admin'
  ));

CREATE POLICY "Only system can insert alert history"
  ON alert_history FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'system'
  )); 