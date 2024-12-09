-- Function to update player stats after a match
CREATE OR REPLACE FUNCTION update_tournament_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update winner stats
    IF NEW.winner_id IS NOT NULL AND OLD.winner_id IS NULL THEN
        -- Update battle_stats
        UPDATE battle_stats
        SET 
            tournament_matches_played = tournament_matches_played + 1,
            tournament_matches_won = tournament_matches_won + 1,
            total_xp_earned = total_xp_earned + GREATEST(NEW.player1_score, NEW.player2_score),
            total_coins_earned = total_coins_earned + 
                (SELECT (rewards->>'coins')::integer FROM tournaments WHERE id = NEW.tournament_id),
            updated_at = NOW()
        WHERE user_id = NEW.winner_id;
        
        -- Update loser stats
        UPDATE battle_stats
        SET 
            tournament_matches_played = tournament_matches_played + 1,
            total_xp_earned = total_xp_earned + LEAST(NEW.player1_score, NEW.player2_score),
            updated_at = NOW()
        WHERE user_id = (
            CASE 
                WHEN NEW.player1_id = NEW.winner_id THEN NEW.player2_id
                ELSE NEW.player1_id
            END
        );

        -- Update user_progress
        UPDATE user_progress
        SET 
            xp = xp + GREATEST(NEW.player1_score, NEW.player2_score),
            coins = coins + (SELECT (rewards->>'coins')::integer FROM tournaments WHERE id = NEW.tournament_id),
            level = GREATEST(1, FLOOR(POWER((xp + GREATEST(NEW.player1_score, NEW.player2_score)) / 1000.0, 0.5))::integer),
            updated_at = NOW()
        WHERE user_id = NEW.winner_id;

        -- Update profiles
        UPDATE profiles
        SET 
            xp = xp + GREATEST(NEW.player1_score, NEW.player2_score),
            coins = coins + (SELECT (rewards->>'coins')::integer FROM tournaments WHERE id = NEW.tournament_id),
            level = GREATEST(1, FLOOR(POWER((xp + GREATEST(NEW.player1_score, NEW.player2_score)) / 1000.0, 0.5))::integer),
            updated_at = NOW()
        WHERE id = NEW.winner_id;
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

        -- Get tournament winner
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

        -- Update winner stats
        WITH tournament_data AS (
            SELECT rewards FROM tournaments WHERE id = v_tournament_id
        )
        UPDATE battle_stats
        SET 
            tournaments_played = tournaments_played + 1,
            tournaments_won = tournaments_won + 1,
            total_xp_earned = total_xp_earned + (tournament_data.rewards->>'xp')::integer,
            total_coins_earned = total_coins_earned + (tournament_data.rewards->>'coins')::integer,
            updated_at = NOW()
        FROM tournament_data
        WHERE user_id = (SELECT winner_id FROM tournaments WHERE id = v_tournament_id);

        -- Update other participants stats
        UPDATE battle_stats
        SET 
            tournaments_played = tournaments_played + 1,
            updated_at = NOW()
        WHERE user_id IN (
            SELECT user_id 
            FROM tournament_participants 
            WHERE tournament_id = v_tournament_id 
            AND user_id != (SELECT winner_id FROM tournaments WHERE id = v_tournament_id)
        );

        -- Create notification for winner
        INSERT INTO notification_history (
            user_id,
            type,
            title,
            message,
            data,
            created_at
        )
        SELECT
            winner_id,
            'tournament_victory',
            'Tournament Victory!',
            'Congratulations! You won the tournament: ' || title,
            jsonb_build_object(
                'tournament_id', id,
                'rewards', rewards
            ),
            NOW()
        FROM tournaments
        WHERE id = v_tournament_id;
    END IF;

    RETURN NEW;
END;
$$;

-- Function to calculate rating changes
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

-- Function to update ratings after a match
CREATE OR REPLACE FUNCTION update_tournament_ratings()
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
        SELECT tournament_rating INTO winner_current_rating
        FROM battle_stats
        WHERE user_id = NEW.winner_id;

        SELECT tournament_rating INTO loser_current_rating
        FROM battle_stats
        WHERE user_id = (
            CASE 
                WHEN NEW.player1_id = NEW.winner_id THEN NEW.player2_id
                ELSE NEW.player1_id
            END
        );

        -- Calculate rating change
        rating_change := calculate_rating_change(winner_current_rating, loser_current_rating);

        -- Update winner rating
        UPDATE battle_stats
        SET 
            tournament_rating = tournament_rating + rating_change,
            updated_at = NOW()
        WHERE user_id = NEW.winner_id;

        -- Update loser rating
        UPDATE battle_stats
        SET 
            tournament_rating = tournament_rating - rating_change,
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

-- Function to check achievements
CREATE OR REPLACE FUNCTION check_tournament_achievements(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_stats RECORD;
    v_achievement RECORD;
BEGIN
    -- Get player stats
    SELECT * INTO v_stats
    FROM battle_stats
    WHERE user_id = p_user_id;

    -- Check tournament-specific achievements
    FOR v_achievement IN 
        SELECT * FROM achievements 
        WHERE category = 'tournament'
        AND id NOT IN (
            SELECT achievement_id 
            FROM user_achievements 
            WHERE user_id = p_user_id
        )
    LOOP
        -- Check if achievement conditions are met
        IF (v_stats.tournaments_won >= (v_achievement.trigger_conditions->>'tournaments_won')::integer) THEN
            -- Award achievement
            INSERT INTO user_achievements (
                user_id,
                achievement_id,
                unlocked_at,
                updated_at
            ) VALUES (
                p_user_id,
                v_achievement.id,
                NOW(),
                NOW()
            );

            -- Update user progress
            UPDATE user_progress
            SET 
                xp = xp + v_achievement.points,
                updated_at = NOW()
            WHERE user_id = p_user_id;

            -- Create notification
            INSERT INTO notification_history (
                user_id,
                type,
                title,
                message,
                data,
                created_at
            ) VALUES (
                p_user_id,
                'achievement_unlocked',
                'Achievement Unlocked!',
                format('You''ve earned the "%s" achievement!', v_achievement.title),
                jsonb_build_object(
                    'achievement_id', v_achievement.id,
                    'points', v_achievement.points
                ),
                NOW()
            );
        END IF;
    END LOOP;
END;
$$;

-- Create triggers
CREATE TRIGGER update_tournament_stats_after_match
    AFTER UPDATE ON tournament_matches
    FOR EACH ROW
    WHEN (OLD.status != 'completed' AND NEW.status = 'completed')
    EXECUTE FUNCTION update_tournament_stats();

CREATE TRIGGER update_tournament_after_match
    AFTER UPDATE ON tournament_matches
    FOR EACH ROW
    WHEN (OLD.status != 'completed' AND NEW.status = 'completed')
    EXECUTE FUNCTION update_tournament_progress();

CREATE TRIGGER update_tournament_ratings_after_match
    AFTER UPDATE ON tournament_matches
    FOR EACH ROW
    WHEN (OLD.status != 'completed' AND NEW.status = 'completed')
    EXECUTE FUNCTION update_tournament_ratings();

-- Function to get match feedback summary
CREATE OR REPLACE FUNCTION get_match_feedback_summary(p_match_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT json_build_object(
      'total_responses', COUNT(*),
      'average_rating', ROUND(AVG(rating)::numeric, 2),
      'average_latency', ROUND(AVG(latency_rating)::numeric, 2),
      'average_balance', ROUND(AVG(balance_rating)::numeric, 2),
      'common_issues', (
        SELECT json_object_agg(issue, count)
        FROM (
          SELECT unnest(issues) as issue, COUNT(*) as count
          FROM match_feedback
          WHERE match_id = p_match_id
          GROUP BY issue
          ORDER BY count DESC
          LIMIT 5
        ) issues
      )
    )
    FROM match_feedback
    WHERE match_id = p_match_id
  );
END;
$$;

-- Function to get tournament feedback summary
CREATE OR REPLACE FUNCTION get_tournament_feedback_summary(p_tournament_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT json_build_object(
      'total_responses', COUNT(*),
      'average_rating', ROUND(AVG(overall_experience)::numeric, 2),
      'would_play_again_rate', ROUND((COUNT(*) FILTER (WHERE would_play_again) * 100.0 / COUNT(*))::numeric, 2),
      'format_rating', ROUND(AVG(format_rating)::numeric, 2),
      'common_suggestions', (
        SELECT json_agg(suggestion)
        FROM (
          SELECT suggestions as suggestion, COUNT(*) as count
          FROM tournament_feedback
          WHERE tournament_id = p_tournament_id
          AND suggestions IS NOT NULL
          GROUP BY suggestions
          ORDER BY count DESC
          LIMIT 5
        ) suggestions
      )
    )
    FROM tournament_feedback
    WHERE tournament_id = p_tournament_id
  );
END;
$$;

-- Function to get system health metrics
CREATE OR REPLACE FUNCTION get_system_health_metrics(p_timeframe interval)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_time timestamptz;
BEGIN
  v_start_time := NOW() - p_timeframe;
  
  RETURN (
    SELECT json_build_object(
      'cpu_usage', json_build_object(
        'current', ROUND(cpu_usage::numeric, 2),
        'average', ROUND(AVG(cpu_usage)::numeric, 2),
        'peak', ROUND(MAX(cpu_usage)::numeric, 2)
      ),
      'memory_usage', json_build_object(
        'current', ROUND(memory_usage::numeric, 2),
        'average', ROUND(AVG(memory_usage)::numeric, 2),
        'peak', ROUND(MAX(memory_usage)::numeric, 2)
      ),
      'error_rate', json_build_object(
        'current', ROUND(error_rate::numeric, 2),
        'average', ROUND(AVG(error_rate)::numeric, 2),
        'peak', ROUND(MAX(error_rate)::numeric, 2)
      ),
      'response_time', json_build_object(
        'current', response_time,
        'average', ROUND(AVG(response_time)::numeric, 2),
        'p95', percentile_cont(0.95) WITHIN GROUP (ORDER BY response_time)
      ),
      'load_analysis', json_build_object(
        'peak_times', (
          SELECT json_agg(peak)
          FROM (
            SELECT timestamp as peak
            FROM system_metrics
            WHERE timestamp >= v_start_time
            AND cpu_usage > 80
            ORDER BY timestamp DESC
            LIMIT 5
          ) peaks
        ),
        'bottlenecks', (
          SELECT json_agg(bottleneck)
          FROM (
            SELECT 
              CASE 
                WHEN cpu_usage > 90 THEN 'High CPU usage'
                WHEN memory_usage > 90 THEN 'High memory usage'
                WHEN error_rate > 5 THEN 'High error rate'
                WHEN response_time > 1000 THEN 'High response time'
              END as bottleneck,
              COUNT(*) as occurrences
            FROM system_metrics
            WHERE timestamp >= v_start_time
            AND (
              cpu_usage > 90 OR
              memory_usage > 90 OR
              error_rate > 5 OR
              response_time > 1000
            )
            GROUP BY bottleneck
            HAVING COUNT(*) > 0
          ) bottlenecks
        )
      )
    )
    FROM system_metrics
    WHERE timestamp >= v_start_time
  );
END;
$$;

-- Function to get player retention metrics
CREATE OR REPLACE FUNCTION get_player_retention_metrics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_players integer;
  v_daily_active integer;
  v_weekly_active integer;
  v_monthly_active integer;
BEGIN
  SELECT COUNT(*) INTO v_total_players FROM players;
  
  SELECT COUNT(DISTINCT player_id)
  INTO v_daily_active
  FROM tournament_participants
  WHERE last_active >= NOW() - interval '1 day';
  
  SELECT COUNT(DISTINCT player_id)
  INTO v_weekly_active
  FROM tournament_participants
  WHERE last_active >= NOW() - interval '7 days';
  
  SELECT COUNT(DISTINCT player_id)
  INTO v_monthly_active
  FROM tournament_participants
  WHERE last_active >= NOW() - interval '30 days';
  
  RETURN json_build_object(
    'total_players', v_total_players,
    'daily_active_users', v_daily_active,
    'weekly_active_users', v_weekly_active,
    'monthly_active_users', v_monthly_active,
    'retention_rates', json_build_object(
      'daily', ROUND((v_daily_active * 100.0 / v_total_players)::numeric, 2),
      'weekly', ROUND((v_weekly_active * 100.0 / v_total_players)::numeric, 2),
      'monthly', ROUND((v_monthly_active * 100.0 / v_total_players)::numeric, 2)
    ),
    'churn_rate', ROUND(((v_total_players - v_monthly_active) * 100.0 / v_total_players)::numeric, 2)
  );
END;
$$;

-- Function to track metric alert
CREATE OR REPLACE FUNCTION track_metric_alert(
  p_alert_id UUID,
  p_metric_value float,
  p_resolution_note text DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_history_id UUID;
BEGIN
  INSERT INTO alert_history (
    alert_id,
    metric_value,
    resolution_note,
    resolved_at
  )
  VALUES (
    p_alert_id,
    p_metric_value,
    p_resolution_note,
    CASE WHEN p_resolution_note IS NOT NULL THEN NOW() END
  )
  RETURNING id INTO v_history_id;
  
  RETURN v_history_id;
END;
$$;

-- Function to check metric alerts
CREATE OR REPLACE FUNCTION check_metric_alerts(p_metric_name text, p_value float)
RETURNS SETOF metric_alerts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM metric_alerts
  WHERE metric_name = p_metric_name
  AND status = 'active'::metric_status
  AND (
    (condition = 'greater_than'::metric_condition AND p_value > threshold) OR
    (condition = 'less_than'::metric_condition AND p_value < threshold) OR
    (condition = 'equals'::metric_condition AND p_value = threshold)
  );
END;
$$;

-- Function to aggregate feedback metrics
CREATE OR REPLACE FUNCTION aggregate_feedback_metrics(p_type text, p_timeframe interval)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_time timestamptz;
BEGIN
  v_start_time := NOW() - p_timeframe;
  
  IF p_type = 'match' THEN
    RETURN (
      SELECT json_build_object(
        'average_ratings', json_build_object(
          'overall', ROUND(AVG(rating)::numeric, 2),
          'latency', ROUND(AVG(latency_rating)::numeric, 2),
          'balance', ROUND(AVG(balance_rating)::numeric, 2)
        ),
        'total_feedback', COUNT(*),
        'issues_frequency', (
          SELECT json_object_agg(issue, count)
          FROM (
            SELECT unnest(issues) as issue, COUNT(*) as count
            FROM match_feedback
            WHERE created_at >= v_start_time
            GROUP BY issue
            ORDER BY count DESC
          ) issues
        )
      )
      FROM match_feedback
      WHERE created_at >= v_start_time
    );
  ELSE
    RETURN (
      SELECT json_build_object(
        'average_ratings', json_build_object(
          'overall', ROUND(AVG(overall_experience)::numeric, 2),
          'format', ROUND(AVG(format_rating)::numeric, 2)
        ),
        'total_feedback', COUNT(*),
        'would_play_again_rate', ROUND((COUNT(*) FILTER (WHERE would_play_again) * 100.0 / COUNT(*))::numeric, 2)
      )
      FROM tournament_feedback
      WHERE created_at >= v_start_time
    );
  END IF;
END;
$$; 