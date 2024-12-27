-- Add is_bot column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT false;

-- Add is_bot_opponent column to battle_history
ALTER TABLE battle_history ADD COLUMN IF NOT EXISTS is_bot_opponent BOOLEAN DEFAULT false;

-- Update RLS policies for bot profiles
ALTER POLICY "Public profiles are viewable by everyone" ON public.profiles
  USING (true);  -- Allow viewing all profiles, including bots

-- Create policy for bot creation
CREATE POLICY "Allow bot profile creation" ON public.profiles
  FOR INSERT WITH CHECK (is_bot = true);

-- Create policy for bot updates
CREATE POLICY "Allow bot profile updates" ON public.profiles
  FOR UPDATE USING (is_bot = true)
  WITH CHECK (is_bot = true);

-- Add index for bot queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_bot ON profiles(is_bot);
CREATE INDEX IF NOT EXISTS idx_battle_history_is_bot ON battle_history(is_bot_opponent);
