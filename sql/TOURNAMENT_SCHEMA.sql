-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can join tournaments" ON tournament_participants;
DROP POLICY IF EXISTS "Users can view tournament matches" ON tournament_matches;
DROP POLICY IF EXISTS "Users can update their own matches" ON tournament_matches;

-- Tournament Chat
CREATE TABLE IF NOT EXISTS tournament_chat (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Tournament Spectators
CREATE TABLE IF NOT EXISTS tournament_spectators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES tournament_matches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, user_id)
);

-- Match Answers for Analytics and Anti-cheat
CREATE TABLE IF NOT EXISTS match_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES tournament_matches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  answer_time INTEGER NOT NULL, -- in milliseconds
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suspicious Activities for Anti-cheat
CREATE TABLE IF NOT EXISTS suspicious_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  match_id UUID REFERENCES tournament_matches(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Sessions for Anti-cheat
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  browser_fingerprint TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tournament Leaderboard
CREATE TABLE IF NOT EXISTS tournament_leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  matches_won INTEGER NOT NULL DEFAULT 0,
  accuracy_rate DECIMAL NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, user_id)
);

-- Add RLS Policies

-- Tournament Chat
ALTER TABLE tournament_chat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tournament chat"
  ON tournament_chat FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tournament_participants tp
      WHERE tp.tournament_id = tournament_chat.tournament_id
      AND tp.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM tournament_spectators ts
      JOIN tournament_matches tm ON ts.match_id = tm.id
      WHERE tm.tournament_id = tournament_chat.tournament_id
      AND ts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send chat messages"
  ON tournament_chat FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tournament_participants tp
      WHERE tp.tournament_id = tournament_chat.tournament_id
      AND tp.user_id = auth.uid()
    )
  );

-- Tournament Spectators
ALTER TABLE tournament_spectators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view spectators"
  ON tournament_spectators FOR SELECT
  USING (true);

CREATE POLICY "Users can become spectators"
  ON tournament_spectators FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    NOT EXISTS (
      SELECT 1 FROM tournament_matches tm
      WHERE tm.id = match_id
      AND (tm.player1_id = auth.uid() OR tm.player2_id = auth.uid())
    )
  );

-- Match Answers
ALTER TABLE match_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own answers"
  ON match_answers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can submit answers"
  ON match_answers FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM tournament_matches tm
      WHERE tm.id = match_id
      AND (tm.player1_id = auth.uid() OR tm.player2_id = auth.uid())
      AND tm.status = 'in_progress'
    )
  );

-- Suspicious Activities
ALTER TABLE suspicious_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view suspicious activities"
  ON suspicious_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

-- User Sessions
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
  ON user_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
  ON user_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Tournament Leaderboard
ALTER TABLE tournament_leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view leaderboard"
  ON tournament_leaderboard FOR SELECT
  USING (true);

-- Recreate original policies
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
      ) < t.max_players
    )
  );

CREATE POLICY "Users can view tournament matches"
  ON tournament_matches FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own matches"
  ON tournament_matches FOR UPDATE
  USING (
    player1_id = auth.uid() OR
    player2_id = auth.uid()
  )
  WITH CHECK (
    player1_id = auth.uid() OR
    player2_id = auth.uid()
  ); 