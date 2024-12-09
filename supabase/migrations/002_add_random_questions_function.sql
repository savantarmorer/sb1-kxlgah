-- Create function to get random battle questions
CREATE OR REPLACE FUNCTION get_random_battle_questions(
  difficulty_filter text DEFAULT NULL,
  questions_limit integer DEFAULT 5
)
RETURNS SETOF battle_questions
LANGUAGE plpgsql
AS $$
BEGIN
  IF difficulty_filter IS NOT NULL THEN
    RETURN QUERY
    SELECT *
    FROM battle_questions
    WHERE difficulty = difficulty_filter
    ORDER BY random()
    LIMIT questions_limit;
  ELSE
    RETURN QUERY
    SELECT *
    FROM battle_questions
    ORDER BY random()
    LIMIT questions_limit;
  END IF;
END;
$$;
