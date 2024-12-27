CREATE OR REPLACE FUNCTION public.complete_battle_transaction(
    p_coins_earned INTEGER,
    p_is_bot_opponent BOOLEAN,
    p_new_level INTEGER,
    p_new_xp INTEGER,
    p_opponent_id UUID,  
    p_score_opponent INTEGER,
    p_score_player INTEGER,
    p_streak_bonus INTEGER,
    p_user_id UUID,     
    p_xp_earned INTEGER
) RETURNS VOID AS $$
BEGIN
    -- Insert battle record into battle_history
    INSERT INTO battle_history (
        user_id,
        opponent_id,
        winner_id,
        score_player,
        score_opponent,
        xp_earned,
        coins_earned,
        streak_bonus,
        is_bot_opponent,
        created_at
    ) VALUES (
        p_user_id,
        CASE 
            WHEN p_is_bot_opponent THEN NULL  
            ELSE p_opponent_id
        END,
        CASE 
            WHEN p_score_player > p_score_opponent THEN p_user_id 
            ELSE p_opponent_id
        END,
        p_score_player,
        p_score_opponent,
        p_xp_earned,
        p_coins_earned,
        p_streak_bonus,
        p_is_bot_opponent,
        NOW()
    );

    -- Update user profile with new XP, level, and coins
    UPDATE profiles
    SET xp = p_new_xp,
        level = p_new_level,
        coins = coins + p_coins_earned,
        updated_at = NOW()
    WHERE id = p_user_id;  

    -- Update battle stats
    INSERT INTO battle_stats (
        user_id,
        total_battles,
        wins,
        losses,
        total_xp_earned,
        total_coins_earned,
        updated_at
    )
    VALUES (
        p_user_id,
        1,
        CASE WHEN p_score_player > p_score_opponent THEN 1 ELSE 0 END,
        CASE WHEN p_score_player <= p_score_opponent THEN 1 ELSE 0 END,
        p_xp_earned,
        p_coins_earned,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE
    SET total_battles = battle_stats.total_battles + 1,
        wins = battle_stats.wins + CASE WHEN p_score_player > p_score_opponent THEN 1 ELSE 0 END,
        losses = battle_stats.losses + CASE WHEN p_score_player <= p_score_opponent THEN 1 ELSE 0 END,
        total_xp_earned = battle_stats.total_xp_earned + p_xp_earned,
        total_coins_earned = battle_stats.total_coins_earned + p_coins_earned,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
