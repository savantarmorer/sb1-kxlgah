-- Create achievement_rewards table
CREATE TABLE achievement_rewards (
    id SERIAL PRIMARY KEY,
    achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'coins', 'gems', 'xp', 'title', 'avatar'
    value INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create achievement_milestones table
CREATE TABLE achievement_milestones (
    id SERIAL PRIMARY KEY,
    achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    progress INTEGER NOT NULL, -- percentage required
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create milestone_rewards table for rewards specific to milestones
CREATE TABLE milestone_rewards (
    id SERIAL PRIMARY KEY,
    milestone_id INTEGER NOT NULL REFERENCES achievement_milestones(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    value INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better query performance
CREATE INDEX idx_achievement_rewards_achievement_id ON achievement_rewards(achievement_id);
CREATE INDEX idx_achievement_milestones_achievement_id ON achievement_milestones(achievement_id);
CREATE INDEX idx_milestone_rewards_milestone_id ON milestone_rewards(milestone_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_achievement_rewards_updated_at
    BEFORE UPDATE ON achievement_rewards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_achievement_milestones_updated_at
    BEFORE UPDATE ON achievement_milestones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_milestone_rewards_updated_at
    BEFORE UPDATE ON milestone_rewards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 