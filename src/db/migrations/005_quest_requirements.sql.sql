-- First, ensure the extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Update existing quests table to use UUID
ALTER TABLE quests 
ALTER COLUMN id SET DATA TYPE UUID 
USING COALESCE(id::uuid, uuid_generate_v4());

-- Create the quest requirement type enum
CREATE TYPE quest_requirement_type AS ENUM (
  'score',
  'time',
  'battles',
  'streak',
  'study_time',
  'items',
  'achievements'
);

-- Create quest requirements table with proper UUID references
CREATE TABLE quest_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quest_id UUID NOT NULL,
    requirement_type VARCHAR(50) NOT NULL,
    requirement_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE
);

-- Create index for performance
CREATE INDEX idx_quest_requirements_quest_id ON quest_requirements(quest_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_quest_requirements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_quest_requirements_updated_at
    BEFORE UPDATE ON quest_requirements
    FOR EACH ROW
    EXECUTE FUNCTION update_quest_requirements_updated_at();

-- Enable RLS
ALTER TABLE quest_requirements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users"
    ON quest_requirements FOR SELECT
    USING (true);

CREATE POLICY "Enable write access for admin users"
    ON quest_requirements FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_super_admin = true
        )
    );

-- Add comment for documentation
COMMENT ON TABLE quest_requirements IS 'Stores requirements for completing quests'; 