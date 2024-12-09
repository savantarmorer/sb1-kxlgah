sql
CREATE POLICY "Admin full access to [table]"
ON [table] FOR ALL
USING (EXISTS (
SELECT 1 FROM profiles
WHERE id = auth.uid() AND is_super_admin = true
));
sql
-- Read own records
CREATE POLICY "Users can view their own [records]"
ON [table] FOR SELECT
USING (auth.uid() = user_id);
-- Create own records
CREATE POLICY "Users can insert their own [records]"
ON [table] FOR INSERT
WITH CHECK (auth.uid() = user_id);
-- Update own records
CREATE POLICY "Users can update their own [records]"
ON [table] FOR UPDATE
USING (auth.uid() = user_id);
-- Delete own records
CREATE POLICY "Users can delete their own [records]"
ON [table] FOR DELETE
USING (auth.uid() = user_id);
sql
CREATE POLICY "Users can view [table]"
ON [table] FOR SELECT
USING (true);
sql
-- Create new achievement
INSERT INTO achievements (id, title, description, ...)
VALUES (...)
WHERE auth.uid() IN (SELECT id FROM profiles WHERE is_super_admin = true);
-- Update quest status
UPDATE quests
SET status = 'disabled'
WHERE id = $1
AND auth.uid() IN (SELECT id FROM profiles WHERE is_super_admin = true);
sql
-- View own achievements
SELECT FROM user_achievements WHERE user_id = auth.uid();
-- Update quest progress
UPDATE user_quests
SET progress = progress + 1
WHERE user_id = auth.uid() AND quest_id = $1;
-- Claim daily reward
INSERT INTO user_daily_rewards (user_id, reward_id)
VALUES (auth.uid(), $1);
typescript:src/types/database.ts
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]
export interface Database {
public: {
Tables: {
achievements: Achievement
battle_stats: battle_stats
daily_rewards: DailyReward
items: Item
notification_history: NotificationHistory
profiles: Profile
quest_requirements: QuestRequirement
quests: Quest
user_achievements: UserAchievement
user_daily_rewards: UserDailyReward
user_inventory: UserInventory
user_logins: UserLogin
user_quests: UserQuest
}
Views: {
[ in never]: never
}
Functions: {
[ in never]: never
}
Enums: {
quest_requirement_type: 'score' | 'time' | 'battles' | 'streak' | 'study_time' | 'items' | 'achievements'
}
}
}
// Continue with individual interfaces?
Would you like me to continue with the individual table interfaces? 
## Table Schemas and Relationships

### Core Tables
1. `profiles`
   - Primary user data
   - Referenced by all user-specific tables
   - Contains admin status

2. `achievements`
   - Achievement definitions
   - Referenced by user_achievements
   - Admin managed

3. `quests`
   - Quest definitions
   - Referenced by user_quests and quest_requirements
   - Admin managed

### Junction Tables
1. `user_achievements`
   - Links users to achievements
   - Tracks achievement progress
   - User managed

2. `user_quests`
   - Links users to quests
   - Tracks quest progress
   - User managed

3. `user_inventory`
   - Links users to items
   - Tracks item ownership and status
   - User managed

### Progress Tracking
1. `battle_stats`
   - User battle statistics
   - One record per user
   - Automatically updated

2. `user_logins`
   - Login history
   - Streak tracking
   - Automatically created

### Notification System
1. `notification_history`
   - User notifications
   - System and user generated
   - Automatic cleanup

## Common Operations

### Admin Operations