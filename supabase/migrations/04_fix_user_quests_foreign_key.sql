-- Add foreign key constraint between user_quests and quests tables
ALTER TABLE user_quests
DROP CONSTRAINT IF EXISTS user_quests_quest_id_fkey;

ALTER TABLE user_quests
ADD CONSTRAINT user_quests_quest_id_fkey 
FOREIGN KEY (quest_id) 
REFERENCES quests(id) 
ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_quests_quest_id 
ON user_quests(quest_id); 