-- Seed initial achievements
INSERT INTO public.achievements (id, title, description, category, points, rarity, unlocked, order_num) 
VALUES 
  ('first_login', 'First Steps', 'Login for the first time', 'progress', 10, 'common', false, 1),
  ('streak_3', 'Consistent Learner', 'Maintain a 3-day streak', 'progress', 20, 'common', false, 2),
  ('streak_7', 'Weekly Warrior', 'Maintain a 7-day streak', 'progress', 50, 'rare', false, 3),
  ('streak_30', 'Monthly Master', 'Maintain a 30-day streak', 'progress', 200, 'epic', false, 4),
  ('first_battle', 'Battle Initiate', 'Complete your first battle', 'battle', 30, 'common', false, 5),
  ('battle_master', 'Battle Master', 'Win 10 battles', 'battle', 100, 'rare', false, 6),
  ('perfect_score', 'Perfect Score', 'Get 100% on a battle', 'battle', 50, 'rare', false, 7),
  ('first_quest', 'Quest Beginner', 'Complete your first quest', 'quests', 20, 'common', false, 8),
  ('quest_master', 'Quest Master', 'Complete 10 quests', 'quests', 100, 'epic', false, 9),
  ('rich_player', 'Fortune Seeker', 'Earn 10000 coins', 'progress', 150, 'epic', false, 10)
ON CONFLICT (id) DO NOTHING;

-- Seed initial quests
INSERT INTO public.quests (id, title, description, type, status, xp_reward, coin_reward, category, order_num)
VALUES 
  ('daily_login', 'Daily Login', 'Login to the game', 'daily', 'available', 100, 50, 'daily', 1),
  ('win_battle', 'Win a Battle', 'Win a battle against another player', 'daily', 'available', 200, 100, 'battle', 2),
  ('perfect_score', 'Perfect Score', 'Get a perfect score in battle', 'achievement', 'available', 500, 250, 'battle', 3),
  ('study_streak', 'Study Streak', 'Maintain a 3-day study streak', 'weekly', 'available', 300, 150, 'progress', 4),
  ('constitutional_master', 'Constitutional Law Master', 'Score 90% or higher in Constitutional Law', 'achievement', 'available', 1000, 500, 'study', 5)
ON CONFLICT (id) DO NOTHING;

-- Seed initial items
INSERT INTO public.items (id, name, description, type, rarity, cost, effects)
VALUES 
  ('xp_boost', 'XP Boost', 'Increases XP gain by 50% for 1 hour', 'consumable', 'rare', 500, '[{"type": "xp_multiplier", "value": 1.5, "duration": 3600}]'),
  ('coin_boost', 'Coin Boost', 'Increases coin gain by 50% for 1 hour', 'consumable', 'rare', 500, '[{"type": "coin_multiplier", "value": 1.5, "duration": 3600}]'),
  ('golden_title', 'Golden Title', 'Adds a golden color to your name', 'cosmetic', 'epic', 1000, '[{"type": "title_color", "value": "#FFD700"}]'),
  ('streak_shield', 'Streak Shield', 'Protects your streak for one day', 'consumable', 'epic', 750, '[{"type": "streak_protection", "value": 1}]'),
  ('legendary_frame', 'Legendary Frame', 'A legendary frame for your profile', 'cosmetic', 'legendary', 2000, '[{"type": "profile_frame", "value": "legendary_1"}]')
ON CONFLICT (id) DO NOTHING;

-- Seed initial daily rewards
INSERT INTO public.daily_rewards (id, day, reward_type, reward_value, rarity)
VALUES 
  ('day_1', 1, 'coins', 100, 'common'),
  ('day_2', 2, 'xp', 200, 'common'),
  ('day_3', 3, 'coins', 300, 'rare'),
  ('day_4', 4, 'xp', 400, 'rare'),
  ('day_5', 5, 'coins', 500, 'epic'),
  ('day_6', 6, 'xp', 600, 'epic'),
  ('day_7', 7, 'item', 1, 'legendary')
ON CONFLICT (id) DO NOTHING;

-- Create admin user if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@admin'
  ) THEN
    INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
    VALUES ('admin@admin', crypt('admin123', gen_salt('bf')), now());
    
    INSERT INTO public.profiles (
      id,
      name,
      email,
      is_super_admin,
      level,
      xp,
      coins,
      streak,
      study_time,
      constitutional_score,
      civil_score,
      criminal_score,
      administrative_score
    )
    VALUES (
      (SELECT id FROM auth.users WHERE email = 'admin@admin'),
      'Admin',
      'admin@admin',
      true,
      99,
      10000,
      999999,
      0,
      0,
      100,
      100,
      100,
      100
    );
  END IF;
END $$; 