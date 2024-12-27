-- Add metadata column to achievements table
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Update existing rows to have default metadata with icon
UPDATE achievements 
SET metadata = jsonb_build_object('icon', '🏆')
WHERE metadata IS NULL; 