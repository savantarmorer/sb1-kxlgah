-- Add difficulty column to battle_stats table
ALTER TABLE battle_stats
ADD COLUMN IF NOT EXISTS difficulty INTEGER DEFAULT 1;

-- Update existing rows to have default difficulty
UPDATE battle_stats
SET difficulty = 1
WHERE difficulty IS NULL; 