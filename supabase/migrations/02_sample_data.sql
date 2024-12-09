-- Clean up existing data and functions
DROP FUNCTION IF EXISTS purchase_item(UUID, TEXT);
DROP FUNCTION IF EXISTS check_achievements(UUID);
DROP FUNCTION IF EXISTS update_user_progress(UUID, INTEGER, INTEGER, TEXT, INTEGER);

-- Clean existing data
DELETE FROM user_achievements;
DELETE FROM store_purchases;
DELETE FROM user_inventory;
DELETE FROM user_statistics;
DELETE FROM user_progress;
DELETE FROM achievements;
DELETE FROM store_items;

-- Sample Store Items
INSERT INTO store_items (code, name, description, price, type, rarity, metadata) VALUES
-- Boosters
('xp_boost_24h', 'XP Boost 24h', 'Increase XP gain by 50% for 24 hours', 1000, 'booster', 'rare', 
 '{"boostType": "xp", "multiplier": 1.5, "duration": 86400}'),
('coin_boost_24h', 'Coin Boost 24h', 'Increase coin gain by 50% for 24 hours', 1000, 'booster', 'rare',
 '{"boostType": "coins", "multiplier": 1.5, "duration": 86400}'),
('mega_boost_24h', 'Mega Boost 24h', 'Increase all gains by 100% for 24 hours', 2500, 'booster', 'epic',
 '{"boostType": "all", "multiplier": 2.0, "duration": 86400}'),

-- Study Materials
('civil_basics', 'Civil Law Basics', 'Comprehensive study material for Civil Law fundamentals', 1500, 'material', 'common',
 '{"subject": "civil", "type": "study_guide", "pages": 50}'),
('constitutional_advanced', 'Advanced Constitutional', 'Advanced Constitutional Law study pack', 2000, 'material', 'rare',
 '{"subject": "constitutional", "type": "study_guide", "pages": 75}'),
('full_course_bundle', 'Complete Course Bundle', 'Full course materials for all subjects', 5000, 'material', 'legendary',
 '{"subjects": ["civil", "constitutional", "criminal", "administrative"], "type": "course_bundle"}'),

-- Expert Sessions
('expert_session_30', '30min Expert Session', '30-minute one-on-one session with a law expert', 3000, 'session', 'epic',
 '{"duration": 1800, "type": "one_on_one"}'),
('group_session_60', '60min Group Session', '60-minute group study session with an expert', 2000, 'session', 'rare',
 '{"duration": 3600, "type": "group", "max_participants": 5}'),

-- Cosmetics
('title_judge', 'Title: Judge', 'Unlock the prestigious Judge title', 1000, 'cosmetic', 'rare',
 '{"type": "title", "value": "Judge"}'),
('title_prosecutor', 'Title: Prosecutor', 'Show off your prosecutor title', 1000, 'cosmetic', 'rare',
 '{"type": "title", "value": "Prosecutor"}'),
('title_master', 'Title: Law Master', 'Display your mastery with this title', 2500, 'cosmetic', 'epic',
 '{"type": "title", "value": "Law Master"}');

-- Sample Achievements
INSERT INTO achievements (id, title, description, category, points, rarity, prerequisites, dependents, trigger_conditions, order_num) VALUES
('first_login', 'Primeiro Login', 'Complete seu primeiro login no sistema', 'general', 10, 'common', NULL, NULL, '{"type": "login", "count": 1}', 1),
('study_streak_3', 'Dedicação Inicial', 'Mantenha uma sequência de estudo por 3 dias', 'streak', 20, 'common', NULL, NULL, '{"type": "streak", "days": 3}', 2),
('study_streak_7', 'Dedicação Bronze', 'Mantenha uma sequência de estudo por 7 dias', 'streak', 50, 'rare', ARRAY['study_streak_3'], NULL, '{"type": "streak", "days": 7}', 3),
('study_streak_30', 'Dedicação Prata', 'Mantenha uma sequência de estudo por 30 dias', 'streak', 200, 'epic', ARRAY['study_streak_7'], NULL, '{"type": "streak", "days": 30}', 4),
('study_streak_100', 'Dedicação Ouro', 'Mantenha uma sequência de estudo por 100 dias', 'streak', 1000, 'legendary', ARRAY['study_streak_30'], NULL, '{"type": "streak", "days": 100}', 5),
('answer_10', 'Iniciante', 'Responda 10 questões', 'study', 30, 'common', NULL, NULL, '{"type": "answers", "count": 10}', 6),
('answer_50', 'Estudioso', 'Responda 50 questões', 'study', 100, 'rare', ARRAY['answer_10'], NULL, '{"type": "answers", "count": 50}', 7),
('answer_100', 'Mestre', 'Responda 100 questões', 'study', 300, 'epic', ARRAY['answer_50'], NULL, '{"type": "answers", "count": 100}', 8),
('answer_1000', 'Lenda', 'Responda 1000 questões', 'study', 2000, 'legendary', ARRAY['answer_100'], NULL, '{"type": "answers", "count": 1000}', 9),
('perfect_quiz', 'Perfeição', 'Complete um quiz com 100% de acerto', 'study', 100, 'rare', NULL, NULL, '{"type": "perfect_quiz"}', 10),
('social_share', 'Compartilhador', 'Compartilhe seu progresso nas redes sociais', 'social', 50, 'common', NULL, NULL, '{"type": "share"}', 11),
('first_purchase', 'Primeiro Item', 'Faça sua primeira compra na loja', 'store', 30, 'common', NULL, NULL, '{"type": "purchase", "count": 1}', 12),
('collector', 'Colecionador', 'Adquira 10 itens diferentes', 'store', 100, 'rare', ARRAY['first_purchase'], NULL, '{"type": "unique_items", "count": 10}', 13);

-- Sample Store Items
INSERT INTO store_items (code, name, description, price, type, rarity, metadata) VALUES
-- Boosters
('xp_boost_24h', 'XP Boost 24h', 'Aumente seu ganho de XP em 50% por 24 horas', 1000, 'booster', 'rare', 
 '{"boostType": "xp", "multiplier": 1.5, "duration": 86400}'),
('coin_boost_24h', 'Coin Boost 24h', 'Aumente seu ganho de moedas em 50% por 24 horas', 1000, 'booster', 'rare',
 '{"boostType": "coins", "multiplier": 1.5, "duration": 86400}'),
('mega_boost_24h', 'Mega Boost 24h', 'Aumente seu ganho de XP e moedas em 100% por 24 horas', 2500, 'booster', 'epic',
 '{"boostType": "all", "multiplier": 2.0, "duration": 86400}'),

-- Study Materials
('civil_basics', 'Fundamentos do Direito Civil', 'Material de estudo sobre os princípios básicos do Direito Civil', 500, 'material', 'common',
 '{"type": "study_material", "subject": "civil", "format": "pdf"}'),
('const_basics', 'Fundamentos do Direito Constitucional', 'Material de estudo sobre os princípios constitucionais', 500, 'material', 'common',
 '{"type": "study_material", "subject": "constitutional", "format": "pdf"}'),
('proc_civil_basics', 'Fundamentos do Processo Civil', 'Material de estudo sobre os princípios do Processo Civil', 500, 'material', 'common',
 '{"type": "study_material", "subject": "procedural_civil", "format": "pdf"}'),

-- Cosmetics
('avatar_judge', 'Avatar de Juiz', 'Um avatar exclusivo de juiz para seu perfil', 2000, 'cosmetic', 'epic',
 '{"type": "avatar", "category": "profile"}'),
('avatar_lawyer', 'Avatar de Advogado', 'Um avatar exclusivo de advogado para seu perfil', 2000, 'cosmetic', 'epic',
 '{"type": "avatar", "category": "profile"}'),
('title_master', 'Título: Mestre do Direito', 'Um título exclusivo para seu perfil', 5000, 'cosmetic', 'legendary',
 '{"type": "title", "category": "profile"}');

-- Sample Quests
INSERT INTO quests (id, title, description, requirements, rewards, category, difficulty, time_limit) VALUES
('daily_login', 'Login Diário', 'Faça login no sistema hoje', 
 '{"type": "login", "count": 1}',
 '{"xp": 100, "coins": 50}',
 'daily', 'easy', 86400),
('answer_5_today', 'Questões do Dia', 'Responda 5 questões hoje', 
 '{"type": "answer", "count": 5}',
 '{"xp": 200, "coins": 100}',
 'daily', 'medium', 86400),
('perfect_quiz_week', 'Quiz Perfeito da Semana', 'Complete um quiz com 100% de acerto esta semana', 
 '{"type": "perfect_quiz", "count": 1}',
 '{"xp": 500, "coins": 250}',
 'weekly', 'hard', 604800);

-- Functions for game mechanics
CREATE OR REPLACE FUNCTION update_user_progress(
    p_user_id UUID,
    p_xp_gain INTEGER DEFAULT 0,
    p_coin_gain INTEGER DEFAULT 0,
    p_subject TEXT DEFAULT NULL,
    p_score_value INTEGER DEFAULT 0,
    p_update_streak BOOLEAN DEFAULT false
) RETURNS VOID AS $$
DECLARE
    v_current_level INTEGER;
    v_new_level INTEGER;
    v_xp_for_level INTEGER;
    v_streak INTEGER;
BEGIN
    -- Get current streak if updating
    IF p_update_streak THEN
        SELECT streak INTO v_streak
        FROM user_progress 
        WHERE user_id = p_user_id;
        
        -- Increment streak
        v_streak := COALESCE(v_streak, 0) + 1;
    END IF;

    -- Update basic progress
    UPDATE user_progress
    SET 
        xp = xp + p_xp_gain,
        coins = coins + p_coin_gain,
        streak = CASE WHEN p_update_streak THEN v_streak ELSE streak END
    WHERE user_id = p_user_id;

    -- Update subject score if provided
    IF p_subject IS NOT NULL AND p_score_value != 0 THEN
        INSERT INTO subject_scores (user_id, subject, score)
        VALUES (p_user_id, p_subject, p_score_value)
        ON CONFLICT (user_id, subject)
        DO UPDATE SET score = subject_scores.score + p_score_value;
    END IF;

    -- Update statistics
    UPDATE user_statistics
    SET 
        total_xp_earned = total_xp_earned + p_xp_gain,
        total_coins_earned = total_coins_earned + p_coin_gain
    WHERE user_id = p_user_id;

    -- Check for level up
    SELECT level, xp INTO v_current_level, v_xp_for_level
    FROM user_progress
    WHERE user_id = p_user_id;

    -- Simple level calculation (can be made more sophisticated)
    v_new_level := 1 + (v_xp_for_level / 1000);

    IF v_new_level > v_current_level THEN
        UPDATE user_progress
        SET level = v_new_level
        WHERE user_id = p_user_id;
    END IF;

    -- Check achievements
    PERFORM check_achievements(p_user_id);
END;
$$ LANGUAGE plpgsql;

-- Function to check and update achievements
CREATE OR REPLACE FUNCTION check_achievements(p_user_id UUID) RETURNS VOID AS $$
DECLARE
    v_achievement RECORD;
    v_progress INTEGER;
    v_completed BOOLEAN;
BEGIN
    FOR v_achievement IN 
        SELECT a.* 
        FROM achievements a
        LEFT JOIN user_achievements ua ON ua.achievement_id = a.id AND ua.user_id = p_user_id
        WHERE ua.unlocked_at IS NULL
    LOOP
        -- Calculate progress based on trigger conditions
        v_progress := calculate_achievement_progress(p_user_id, v_achievement.trigger_conditions);
        
        -- Check if achievement is completed
        v_completed := v_progress >= 100;

        -- Insert or update progress
        INSERT INTO user_achievements (user_id, achievement_id, progress, unlocked_at)
        VALUES (p_user_id, v_achievement.id, v_progress, CASE WHEN v_completed THEN CURRENT_TIMESTAMP ELSE NULL END)
        ON CONFLICT (user_id, achievement_id)
        DO UPDATE SET 
            progress = EXCLUDED.progress,
            unlocked_at = EXCLUDED.unlocked_at;

        -- If completed, grant rewards
        IF v_completed THEN
            PERFORM update_user_progress(
                p_user_id := p_user_id,
                p_xp_gain := v_achievement.points,
                p_coin_gain := v_achievement.points / 2
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
