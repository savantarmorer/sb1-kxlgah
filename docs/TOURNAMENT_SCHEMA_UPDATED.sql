-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create enum types for tournament metrics
DO $$ BEGIN
    CREATE TYPE metric_condition AS ENUM ('greater_than', 'less_than', 'equals');
    CREATE TYPE metric_status AS ENUM ('active', 'paused', 'deleted');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create tournaments table matching current schema
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    entry_fee INTEGER DEFAULT 0,
    max_participants INTEGER NOT NULL,
    min_level INTEGER DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'upcoming',
    rules JSONB DEFAULT '{}'::jsonb,
    rewards JSONB DEFAULT '{}'::jsonb,
    winner_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_date > start_date)
);

-- Create tournament_participants table
CREATE TABLE IF NOT EXISTS tournament_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    score INTEGER DEFAULT 0,
    matches_played INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tournament_id, user_id)
);

-- Create tournament_matches table
CREATE TABLE IF NOT EXISTS tournament_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    round INTEGER NOT NULL,
    player1_id UUID NOT NULL REFERENCES auth.users(id),
    player2_id UUID NOT NULL REFERENCES auth.users(id),
    winner_id UUID REFERENCES auth.users(id),
    player1_score INTEGER DEFAULT 0,
    player2_score INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'waiting',
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    error_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (player1_id != player2_id)
);

-- Create tournament_metrics table
CREATE TABLE IF NOT EXISTS tournament_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    active_players INTEGER NOT NULL DEFAULT 0,
    matches_in_progress INTEGER NOT NULL DEFAULT 0,
    average_match_duration INTEGER,
    error_rate FLOAT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament_id ON tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_user_id ON tournament_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament_id ON tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_players ON tournament_matches(player1_id, player2_id);
CREATE INDEX IF NOT EXISTS idx_tournament_metrics_tournament_id ON tournament_metrics(tournament_id);

-- Row Level Security Policies
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_metrics ENABLE ROW LEVEL SECURITY;

-- Tournaments policies
CREATE POLICY "Tournaments are viewable by all authenticated users"
    ON tournaments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Tournament creation requires authentication"
    ON tournaments FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Tournaments can be updated by admins"
    ON tournaments FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = auth.users.id
            AND auth.users.is_super_admin = true
        )
    );

-- Tournament participants policies
CREATE POLICY "Participants are viewable by all authenticated users"
    ON tournament_participants FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can join tournaments"
    ON tournament_participants FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation"
    ON tournament_participants FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Tournament matches policies
CREATE POLICY "Matches are viewable by all authenticated users"
    ON tournament_matches FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Match updates require player participation"
    ON tournament_matches FOR UPDATE
    TO authenticated
    USING (
        auth.uid() IN (player1_id, player2_id) OR
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = auth.users.id
            AND auth.users.is_super_admin = true
        )
    );

-- Tournament metrics policies
CREATE POLICY "Metrics are viewable by all authenticated users"
    ON tournament_metrics FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Metrics can be updated by admins"
    ON tournament_metrics FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = auth.users.id
            AND auth.users.is_super_admin = true
        )
    ); 