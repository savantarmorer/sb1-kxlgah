-- Battle history table
CREATE TABLE IF NOT EXISTS battle_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  opponent_id UUID REFERENCES auth.users(id),
  winner_id UUID REFERENCES auth.users(id),
  score_player INTEGER,
  score_opponent INTEGER,
  xp_earned INTEGER,
  coins_earned INTEGER,
  streak_bonus INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Battle ratings table
CREATE TABLE IF NOT EXISTS battle_ratings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  rating INTEGER DEFAULT 1000,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  highest_streak INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Questions table
CREATE TABLE IF NOT EXISTS battle_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answers TEXT[] NOT NULL,
  correct_answer INTEGER NOT NULL,
  category TEXT,
  difficulty INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
); 