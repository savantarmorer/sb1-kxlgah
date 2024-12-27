# Database Policies Documentation

## Table Access Patterns

### Admin-Managed Tables (Read-only for users)
- achievements
- daily_rewards
- items
- quest_requirements
- quests

These tables have two policies:
- `Users can view [table]`: Allows all users to SELECT
- `Admin full access to [table]`: Allows admins full CRUD access

### User-Specific Tables (CRUD for own data)
- battle_stats
- notification_history
- profiles
- user_achievements
- user_daily_rewards
- user_inventory
- user_logins
- user_quests

These tables have policies:
- `Users can view their own [records]`: SELECT WHERE user_id = auth.uid()
- `Users can insert their own [records]`: INSERT WITH CHECK user_id = auth.uid()
- `Users can update their own [records]`: UPDATE WHERE user_id = auth.uid()
- `Users can delete their own [records]`: DELETE WHERE user_id = auth.uid()
- `Admin full access to [table]`: Full CRUD for admins

## Policy Patterns

### Admin Access