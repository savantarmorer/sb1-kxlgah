-- Create subject_scores table
CREATE TABLE IF NOT EXISTS subject_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL CHECK (subject IN ('constitutional', 'civil', 'criminal', 'administrative')),
    score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, subject)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS subject_scores_user_id_idx ON subject_scores(user_id);
CREATE INDEX IF NOT EXISTS subject_scores_subject_idx ON subject_scores(subject);

-- Add RLS policies
ALTER TABLE subject_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own scores"
    ON subject_scores
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own scores"
    ON subject_scores
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scores"
    ON subject_scores
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_subject_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subject_scores_updated_at
    BEFORE UPDATE ON subject_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_subject_scores_updated_at();
