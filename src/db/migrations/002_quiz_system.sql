-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table
CREATE TABLE IF NOT EXISTS quiz_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    order_position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES quiz_categories(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    explanation TEXT,
    difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
    source TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Answers table
CREATE TABLE IF NOT EXISTS quiz_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User responses table
CREATE TABLE IF NOT EXISTS quiz_user_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
    answer_id UUID REFERENCES quiz_answers(id) ON DELETE CASCADE,
    is_correct BOOLEAN NOT NULL,
    response_time INTEGER, -- in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User quiz statistics
CREATE TABLE IF NOT EXISTS quiz_user_stats (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    total_questions INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    average_time INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    last_quiz_date TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questions_category ON quiz_questions(category_id);
CREATE INDEX IF NOT EXISTS idx_answers_question ON quiz_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_user_responses_user ON quiz_user_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_responses_question ON quiz_user_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON quiz_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_user_responses_created ON quiz_user_responses(created_at);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_quiz_categories_updated_at
    BEFORE UPDATE ON quiz_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quiz_questions_updated_at
    BEFORE UPDATE ON quiz_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quiz_answers_updated_at
    BEFORE UPDATE ON quiz_answers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quiz_user_stats_updated_at
    BEFORE UPDATE ON quiz_user_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE quiz_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_user_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_user_stats ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Categories (readable by all, writable by admins)
CREATE POLICY "Categories are viewable by everyone"
    ON quiz_categories FOR SELECT
    USING (true);

CREATE POLICY "Categories are editable by admins"
    ON quiz_categories FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_super_admin = true
        )
    );

-- Questions (readable by all, writable by admins)
CREATE POLICY "Questions are viewable by everyone"
    ON quiz_questions FOR SELECT
    USING (true);

CREATE POLICY "Questions are editable by admins"
    ON quiz_questions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_super_admin = true
        )
    );

-- Answers (readable by all, writable by admins)
CREATE POLICY "Answers are viewable by everyone"
    ON quiz_answers FOR SELECT
    USING (true);

CREATE POLICY "Answers are editable by admins"
    ON quiz_answers FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_super_admin = true
        )
    );

-- User responses (users can only see and modify their own responses)
CREATE POLICY "Users can view their own responses"
    ON quiz_user_responses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own responses"
    ON quiz_user_responses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- User stats (users can only see and modify their own stats)
CREATE POLICY "Users can view their own stats"
    ON quiz_user_stats FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
    ON quiz_user_stats FOR UPDATE
    USING (auth.uid() = user_id);

-- Seed initial categories
INSERT INTO quiz_categories (name, description, icon, color, order_position) VALUES
('Direito Constitucional', 'Questões sobre a Constituição Federal e princípios fundamentais', 'scale', 'blue', 1),
('Direito Civil', 'Questões sobre direitos civis, contratos e responsabilidade civil', 'book', 'green', 2),
('Direito Penal', 'Questões sobre crimes, penas e processo penal', 'shield', 'red', 3),
('Direito Administrativo', 'Questões sobre administração pública e atos administrativos', 'building', 'purple', 4)
ON CONFLICT DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE quiz_categories IS 'Quiz categories with metadata';
COMMENT ON TABLE quiz_questions IS 'Quiz questions with difficulty levels';
COMMENT ON TABLE quiz_answers IS 'Possible answers for quiz questions';
COMMENT ON TABLE quiz_user_responses IS 'User responses to quiz questions';
COMMENT ON TABLE quiz_user_stats IS 'User quiz statistics and progress';