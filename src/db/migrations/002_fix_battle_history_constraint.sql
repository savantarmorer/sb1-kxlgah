-- Drop existing constraints and policies
ALTER TABLE battle_history DROP CONSTRAINT IF EXISTS battle_history_opponent_id_fkey;
ALTER TABLE battle_history DROP CONSTRAINT IF EXISTS check_opponent_id_for_bots;
ALTER TABLE battle_history DROP CONSTRAINT IF EXISTS battle_history_winner_id_fkey;
ALTER TABLE battle_history DROP CONSTRAINT IF EXISTS battle_history_user_id_fkey;
ALTER TABLE battle_history DROP CONSTRAINT IF EXISTS battle_history_user_id_check;
ALTER TABLE battle_history DROP CONSTRAINT IF EXISTS battle_history_winner_id_check;
ALTER TABLE battles DROP CONSTRAINT IF EXISTS battles_opponent_id_fkey;
ALTER TABLE battles DROP CONSTRAINT IF EXISTS battles_check_opponent_id;
ALTER TABLE battle_history DROP CONSTRAINT IF EXISTS battle_history_bot_opponent_check;

-- Drop all RLS policies
DROP POLICY IF EXISTS "Users can view their own battle history" ON battle_history;
DROP POLICY IF EXISTS "Users can insert their own battles" ON battle_history;
DROP POLICY IF EXISTS "Users can update their own battles" ON battle_history;
DROP POLICY IF EXISTS "Users can delete their own battles" ON battle_history;

-- Drop all versions of complete_battle_transaction
DROP FUNCTION IF EXISTS public.complete_battle_transaction(integer,boolean,integer,integer,integer,integer,integer,integer,integer,integer);
DROP FUNCTION IF EXISTS public.complete_battle_transaction(integer,boolean,integer,integer,text,integer,integer,integer,integer,integer);
DROP FUNCTION IF EXISTS public.complete_battle_transaction(integer,boolean,integer,integer,text,integer,integer,integer,text,integer);
DROP FUNCTION IF EXISTS public.complete_battle_transaction(integer,boolean,integer,integer,uuid,integer,integer,integer,uuid,integer);

-- Drop all versions of complete_battle_transaction
DROP FUNCTION IF EXISTS public.complete_battle_transaction(p_user_id text, p_opponent_id text, p_is_bot_opponent boolean, p_score_player integer, p_score_opponent integer, p_xp_earned integer, p_coins_earned integer, p_streak_bonus integer, p_new_level integer, p_new_xp integer);
DROP FUNCTION IF EXISTS public.complete_battle_transaction(p_user_id uuid, p_opponent_id uuid, p_is_bot_opponent boolean, p_score_player integer, p_score_opponent integer, p_xp_earned integer, p_coins_earned integer, p_streak_bonus integer, p_new_level integer, p_new_xp integer);

-- Modify battle_history table to support text IDs
ALTER TABLE battle_history 
    ALTER COLUMN user_id TYPE text USING user_id::text,
    ALTER COLUMN opponent_id TYPE text USING opponent_id::text,
    ALTER COLUMN winner_id TYPE text USING winner_id::text;

-- Add new constraints that support text IDs and bot opponents
ALTER TABLE battle_history ADD CONSTRAINT battle_history_user_id_check 
    CHECK (
        -- For real users, must be a valid UUID
        (NOT is_bot_opponent AND user_id::uuid IS NOT NULL) OR
        -- For bots, can be any non-null text
        (is_bot_opponent AND user_id IS NOT NULL)
    );

ALTER TABLE battle_history ADD CONSTRAINT battle_history_winner_id_check
    CHECK (
        -- Winner must be either user_id or opponent_id
        winner_id IN (user_id, opponent_id)
    );

-- Recreate RLS policies with text type support
CREATE POLICY "Users can view their own battle history"
ON battle_history
FOR SELECT
USING (
    auth.uid()::text = user_id OR 
    auth.uid()::text = opponent_id OR 
    is_bot_opponent = true
);

CREATE POLICY "Users can insert their own battles"
ON battle_history
FOR INSERT
WITH CHECK (
    auth.uid()::text = user_id
);

CREATE POLICY "Users can update their own battles"
ON battle_history
FOR UPDATE
USING (
    auth.uid()::text = user_id
);

CREATE POLICY "Users can delete their own battles"
ON battle_history
FOR DELETE
USING (
    auth.uid()::text = user_id
);

-- Create the single text-based version of complete_battle_transaction
CREATE OR REPLACE FUNCTION public.complete_battle_transaction(
    p_user_id text,
    p_opponent_id text,
    p_is_bot_opponent boolean,
    p_score_player integer,
    p_score_opponent integer,
    p_xp_earned integer,
    p_coins_earned integer,
    p_streak_bonus integer,
    p_new_level integer,
    p_new_xp integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE 
    v_user_uuid uuid;
    v_current_coins integer;
    v_current_streak integer;
    v_current_battle_stats jsonb;
    v_result jsonb;
BEGIN
    -- Validate input parameters
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'user_id cannot be null';
    END IF;

    -- Convert text to UUID for real users
    IF NOT p_is_bot_opponent THEN
        BEGIN
            v_user_uuid := p_user_id::uuid;
        EXCEPTION WHEN invalid_text_representation THEN
            RAISE EXCEPTION 'Invalid UUID format for user_id: %', p_user_id;
        END;
    END IF;
    
    -- Insert battle history record
    INSERT INTO battle_history (
        user_id,
        opponent_id,
        is_bot_opponent,
        score_player,
        score_opponent,
        winner_id,
        xp_earned,
        coins_earned,
        streak_bonus
    ) VALUES (
        p_user_id,
        p_opponent_id,
        p_is_bot_opponent,
        p_score_player,
        p_score_opponent,
        CASE 
            WHEN p_score_player > p_score_opponent THEN p_user_id
            ELSE p_opponent_id
        END,
        p_xp_earned,
        p_coins_earned,
        p_streak_bonus
    );

    -- Update user progress (only for real users)
    IF NOT p_is_bot_opponent THEN
        -- Get current user progress
        SELECT 
            coins, 
            streak,
            battle_stats
        INTO 
            v_current_coins, 
            v_current_streak,
            v_current_battle_stats
        FROM user_progress 
        WHERE user_id = v_user_uuid;

        -- Prepare updated battle stats
        v_current_battle_stats := COALESCE(v_current_battle_stats, '{}'::jsonb);
        v_current_battle_stats := jsonb_set(
            v_current_battle_stats,
            '{last_battle_time}',
            to_jsonb(CURRENT_TIMESTAMP)
        );
        v_current_battle_stats := jsonb_set(
            v_current_battle_stats,
            '{daily_battles}',
            to_jsonb(COALESCE((v_current_battle_stats->>'daily_battles')::integer, 0) + 1)
        );

        -- Insert or update user progress
        INSERT INTO user_progress (
            user_id,
            xp,
            level,
            coins,
            streak,
            battle_stats,
            updated_at
        ) VALUES (
            v_user_uuid,
            p_new_xp,
            p_new_level,
            COALESCE(v_current_coins, 0) + p_coins_earned,
            CASE 
                WHEN p_score_player > p_score_opponent THEN COALESCE(v_current_streak, 0) + 1
                ELSE 0
            END,
            v_current_battle_stats,
            CURRENT_TIMESTAMP
        )
        ON CONFLICT (user_id) 
        DO UPDATE SET
            xp = EXCLUDED.xp,
            level = EXCLUDED.level,
            coins = user_progress.coins + p_coins_earned,
            streak = CASE 
                WHEN p_score_player > p_score_opponent THEN user_progress.streak + 1
                ELSE 0
            END,
            battle_stats = EXCLUDED.battle_stats,
            updated_at = CURRENT_TIMESTAMP
        RETURNING jsonb_build_object(
            'xp', xp,
            'level', level,
            'coins', coins,
            'streak', streak,
            'battle_stats', battle_stats
        ) INTO v_result;

        -- Update battle stats
        INSERT INTO battle_stats (
            user_id,
            total_battles,
            wins,
            losses,
            win_streak,
            highest_streak,
            total_xp_earned,
            total_coins_earned,
            updated_at
        ) VALUES (
            v_user_uuid,
            1,
            CASE WHEN p_score_player > p_score_opponent THEN 1 ELSE 0 END,
            CASE WHEN p_score_player < p_score_opponent THEN 1 ELSE 0 END,
            CASE WHEN p_score_player > p_score_opponent THEN 1 ELSE 0 END,
            CASE WHEN p_score_player > p_score_opponent THEN 1 ELSE 0 END,
            p_xp_earned,
            p_coins_earned,
            CURRENT_TIMESTAMP
        )
        ON CONFLICT (user_id) 
        DO UPDATE SET
            total_battles = battle_stats.total_battles + 1,
            wins = battle_stats.wins + CASE WHEN p_score_player > p_score_opponent THEN 1 ELSE 0 END,
            losses = battle_stats.losses + CASE WHEN p_score_player < p_score_opponent THEN 1 ELSE 0 END,
            win_streak = CASE 
                WHEN p_score_player > p_score_opponent THEN battle_stats.win_streak + 1
                ELSE 0
            END,
            highest_streak = CASE 
                WHEN p_score_player > p_score_opponent AND battle_stats.win_streak + 1 > battle_stats.highest_streak 
                THEN battle_stats.win_streak + 1
                ELSE battle_stats.highest_streak
            END,
            total_xp_earned = battle_stats.total_xp_earned + p_xp_earned,
            total_coins_earned = battle_stats.total_coins_earned + p_coins_earned,
            updated_at = CURRENT_TIMESTAMP;
    END IF;

    RETURN COALESCE(v_result, '{}'::jsonb);
END;
$function$;

-- Migration verification
DO $$
DECLARE
    bot_with_opponent integer;
BEGIN
    -- Bot battles that still have opponent_id
    SELECT COUNT(*) INTO bot_with_opponent
    FROM battle_history
    WHERE is_bot_opponent = true AND opponent_id IS NOT NULL;

    -- Update existing records in battles table to match battle_history
    UPDATE battles b
    SET opponent_id = NULL
    FROM battle_history bh
    WHERE b.player_id::text = bh.user_id 
    AND b.created_at = bh.created_at
    AND bh.is_bot_opponent = true;

    -- Final verification
    IF bot_with_opponent > 0 THEN
        RAISE NOTICE 'Found % bot battles with opponent_id set', bot_with_opponent;
    END IF;
END $$;
