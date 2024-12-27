-- Function to get current match question
CREATE OR REPLACE FUNCTION get_current_match_question(match_id UUID)
RETURNS TABLE (
  id UUID,
  text TEXT,
  options JSONB,
  correct_answer TEXT,
  subject_area TEXT,
  difficulty INTEGER,
  time_limit INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT q.*
  FROM tournament_matches m
  JOIN tournament_questions tq ON m.tournament_id = tq.tournament_id
  JOIN questions q ON tq.question_id = q.id
  WHERE m.id = match_id
  AND tq.question_number = (
    SELECT COUNT(*) + 1
    FROM match_answers
    WHERE match_id = m.id
  )
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to award tournament prize
CREATE OR REPLACE FUNCTION award_tournament_prize(
  p_user_id UUID,
  p_amount INTEGER,
  p_tournament_id UUID,
  p_rank INTEGER
) RETURNS void AS $$
BEGIN
  -- Update user's balance
  UPDATE users
  SET balance = balance + p_amount
  WHERE id = p_user_id;

  -- Record prize award
  INSERT INTO tournament_prizes (
    tournament_id,
    user_id,
    amount,
    rank,
    awarded_at
  ) VALUES (
    p_tournament_id,
    p_user_id,
    p_amount,
    p_rank,
    NOW()
  );

  -- Update user achievements
  INSERT INTO user_achievements (user_id, achievement_id, earned_at)
  SELECT p_user_id, a.id, NOW()
  FROM achievements a
  WHERE a.type = 'tournament_win'
  AND p_rank = 1
  AND NOT EXISTS (
    SELECT 1 FROM user_achievements ua
    WHERE ua.user_id = p_user_id
    AND ua.achievement_id = a.id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_action TEXT
) RETURNS TABLE (
  allowed BOOLEAN,
  reset_at TIMESTAMPTZ
) AS $$
DECLARE
  v_limit INTEGER;
  v_window INTEGER;
  v_count INTEGER;
  v_reset TIMESTAMPTZ;
BEGIN
  -- Get limit configuration
  SELECT 
    CASE p_action
      WHEN 'join_tournament' THEN 5
      WHEN 'submit_answer' THEN 30
      WHEN 'spectate' THEN 10
      ELSE 100
    END INTO v_limit;

  SELECT 
    CASE p_action
      WHEN 'join_tournament' THEN 3600  -- 1 hour
      WHEN 'submit_answer' THEN 60      -- 1 minute
      WHEN 'spectate' THEN 300          -- 5 minutes
      ELSE 3600
    END INTO v_window;

  -- Calculate window
  v_reset := date_trunc('second', now()) + (v_window || ' seconds')::interval;

  -- Count recent actions
  SELECT COUNT(*)
  INTO v_count
  FROM user_actions
  WHERE user_id = p_user_id
  AND action = p_action
  AND created_at > now() - (v_window || ' seconds')::interval;

  -- Record this action attempt
  INSERT INTO user_actions (user_id, action, created_at)
  VALUES (p_user_id, p_action, now());

  -- Return result
  RETURN QUERY
  SELECT 
    v_count < v_limit as allowed,
    v_reset as reset_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update tournament rankings
CREATE OR REPLACE FUNCTION update_tournament_rankings(p_tournament_id UUID)
RETURNS void AS $$
BEGIN
  WITH rankings AS (
    SELECT
      user_id,
      ROW_NUMBER() OVER (
        ORDER BY score DESC,
        (SELECT COUNT(*) FROM tournament_matches m
         WHERE (m.player1_id = tp.user_id OR m.player2_id = tp.user_id)
         AND m.winner_id = tp.user_id) DESC
      ) as new_rank
    FROM tournament_participants tp
    WHERE tournament_id = p_tournament_id
  )
  UPDATE tournament_participants tp
  SET rank = r.new_rank
  FROM rankings r
  WHERE tp.tournament_id = p_tournament_id
  AND tp.user_id = r.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 