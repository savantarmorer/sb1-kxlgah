-- Function to get active connections
CREATE OR REPLACE FUNCTION get_active_connections()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT count(*)::integer
        FROM pg_stat_activity
        WHERE state = 'active'
    );
END;
$$;

-- Function to get average response time
CREATE OR REPLACE FUNCTION get_average_response_time()
RETURNS FLOAT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT avg(response_time)::float
        FROM system_metrics
        WHERE timestamp >= NOW() - INTERVAL '5 minutes'
    );
END;
$$;

-- Function to update player stats after a match
CREATE OR REPLACE FUNCTION update_player_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update winner stats
    IF NEW.winner_id IS NOT NULL AND OLD.winner_id IS NULL THEN
        UPDATE player_stats
        SET 
            matches_played = matches_played + 1,
            matches_won = matches_won + 1,
            total_score = total_score + GREATEST(NEW.player1_score, NEW.player2_score),
            updated_at = NOW()
        WHERE user_id = NEW.winner_id;
        
        -- Update loser stats
        UPDATE player_stats
        SET 
            matches_played = matches_played + 1,
            total_score = total_score + LEAST(NEW.player1_score, NEW.player2_score),
            updated_at = NOW()
        WHERE user_id = (
            CASE 
                WHEN NEW.player1_id = NEW.winner_id THEN NEW.player2_id
                ELSE NEW.player1_id
            END
        );
    END IF;
    RETURN NEW;
END;
$$;

-- Function to update tournament progress
CREATE OR REPLACE FUNCTION update_tournament_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tournament_id UUID;
    v_all_matches_complete BOOLEAN;
BEGIN
    v_tournament_id := NEW.tournament_id;

    -- Check if all matches in the tournament are complete
    SELECT bool_and(status = 'completed') INTO v_all_matches_complete
    FROM tournament_matches
    WHERE tournament_id = v_tournament_id;

    IF v_all_matches_complete THEN
        -- Update tournament status
        UPDATE tournaments
        SET 
            status = 'completed',
            updated_at = NOW()
        WHERE id = v_tournament_id;

        -- Update tournament winner
        WITH winner AS (
            SELECT 
                user_id,
                score
            FROM tournament_participants
            WHERE tournament_id = v_tournament_id
            ORDER BY score DESC
            LIMIT 1
        )
        UPDATE tournaments
        SET 
            winner_id = winner.user_id,
            updated_at = NOW()
        FROM winner
        WHERE id = v_tournament_id;

        -- Award tournament rewards
        WITH tournament_data AS (
            SELECT rewards FROM tournaments WHERE id = v_tournament_id
        )
        UPDATE profiles
        SET 
            xp = xp + (tournament_data.rewards->>'xp')::integer,
            coins = coins + (tournament_data.rewards->>'coins')::integer,
            level = GREATEST(1, FLOOR(POWER((xp + (tournament_data.rewards->>'xp')::integer) / 1000.0, 0.5))::integer),
            updated_at = NOW()
        FROM tournament_data
        WHERE user_id IN (
            SELECT user_id 
            FROM tournament_participants 
            WHERE tournament_id = v_tournament_id
        );
    END IF;

    RETURN NEW;
END;
$$;

-- Function to calculate player rating changes
CREATE OR REPLACE FUNCTION calculate_rating_change(
    winner_rating INTEGER,
    loser_rating INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    k_factor INTEGER := 32;
    expected_score FLOAT;
    rating_change INTEGER;
BEGIN
    -- Calculate expected score using ELO formula
    expected_score := 1.0 / (1.0 + power(10.0, (loser_rating - winner_rating) / 400.0));
    
    -- Calculate rating change
    rating_change := round(k_factor * (1 - expected_score));
    
    RETURN rating_change;
END;
$$;

-- Function to update player ratings after a match
CREATE OR REPLACE FUNCTION update_player_ratings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    winner_current_rating INTEGER;
    loser_current_rating INTEGER;
    rating_change INTEGER;
BEGIN
    IF NEW.winner_id IS NOT NULL AND OLD.winner_id IS NULL THEN
        -- Get current ratings
        SELECT rating INTO winner_current_rating
        FROM player_stats
        WHERE user_id = NEW.winner_id;

        SELECT rating INTO loser_current_rating
        FROM player_stats
        WHERE user_id = (
            CASE 
                WHEN NEW.player1_id = NEW.winner_id THEN NEW.player2_id
                ELSE NEW.player1_id
            END
        );

        -- Calculate rating change
        rating_change := calculate_rating_change(winner_current_rating, loser_current_rating);

        -- Update winner rating
        UPDATE player_stats
        SET 
            rating = rating + rating_change,
            updated_at = NOW()
        WHERE user_id = NEW.winner_id;

        -- Update loser rating
        UPDATE player_stats
        SET 
            rating = rating - rating_change,
            updated_at = NOW()
        WHERE user_id = (
            CASE 
                WHEN NEW.player1_id = NEW.winner_id THEN NEW.player2_id
                ELSE NEW.player1_id
            END
        );
    END IF;

    RETURN NEW;
END;
$$;

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION check_achievements(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_achievement RECORD;
    v_stats RECORD;
    v_requirements JSONB;
    v_achieved BOOLEAN;
BEGIN
    -- Get player stats
    SELECT * INTO v_stats
    FROM player_stats
    WHERE user_id = p_user_id;

    -- Check each achievement
    FOR v_achievement IN 
        SELECT * FROM achievements
        WHERE id NOT IN (
            SELECT achievement_id 
            FROM player_achievements 
            WHERE user_id = p_user_id
        )
    LOOP
        v_achieved := TRUE;
        v_requirements := v_achievement.requirements;

        -- Check each requirement
        FOR requirement IN 
            SELECT * FROM jsonb_each(v_requirements)
        LOOP
            IF (v_stats.matches_played < (requirement.value::integer)) THEN
                v_achieved := FALSE;
                EXIT;
            END IF;
        END LOOP;

        -- Award achievement if achieved
        IF v_achieved THEN
            INSERT INTO player_achievements (
                user_id,
                achievement_id,
                unlocked_at
            ) VALUES (
                p_user_id,
                v_achievement.id,
                NOW()
            );

            -- Update player profile with rewards
            UPDATE profiles
            SET 
                xp = xp + (v_achievement.rewards->>'xp')::integer,
                coins = coins + (v_achievement.rewards->>'coins')::integer,
                level = GREATEST(1, FLOOR(POWER((xp + (v_achievement.rewards->>'xp')::integer) / 1000.0, 0.5))::integer),
                updated_at = NOW()
            WHERE user_id = p_user_id;

            -- Create notification
            INSERT INTO notifications (
                user_id,
                type,
                title,
                message,
                data
            ) VALUES (
                p_user_id,
                'achievement',
                'Achievement Unlocked!',
                format('You''ve earned the "%s" achievement!', v_achievement.title),
                jsonb_build_object(
                    'achievement_id', v_achievement.id,
                    'rewards', v_achievement.rewards
                )
            );
        END IF;
    END LOOP;
END;
$$;

-- Create triggers
CREATE TRIGGER update_stats_after_match
    AFTER UPDATE ON tournament_matches
    FOR EACH ROW
    WHEN (OLD.status != 'completed' AND NEW.status = 'completed')
    EXECUTE FUNCTION update_player_stats();

CREATE TRIGGER update_tournament_after_match
    AFTER UPDATE ON tournament_matches
    FOR EACH ROW
    WHEN (OLD.status != 'completed' AND NEW.status = 'completed')
    EXECUTE FUNCTION update_tournament_progress();

CREATE TRIGGER update_ratings_after_match
    AFTER UPDATE ON tournament_matches
    FOR EACH ROW
    WHEN (OLD.status != 'completed' AND NEW.status = 'completed')
    EXECUTE FUNCTION update_player_ratings(); 