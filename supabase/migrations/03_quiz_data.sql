-- Create quiz categories
INSERT INTO quiz_categories (id, name, description, is_active) VALUES
('civil', 'Direito Civil', 'Questões de Direito Civil', true);

-- Sample quiz questions for Civil Law
INSERT INTO quiz_questions (id, question, category_id, difficulty, is_active, created_at) VALUES
('q1', 'Qual é o prazo prescricional geral previsto no Código Civil?', 'civil', 1, true, CURRENT_TIMESTAMP),
('q2', 'Em qual artigo do Código Civil está prevista a responsabilidade civil objetiva?', 'civil', 1, true, CURRENT_TIMESTAMP),
('q3', 'Qual é o prazo de prescrição para ação de reparação civil?', 'civil', 1, true, CURRENT_TIMESTAMP),
('q4', 'Qual é o prazo decadencial para anulação do negócio jurídico por vício redibitório?', 'civil', 2, true, CURRENT_TIMESTAMP),
('q5', 'Em que situação ocorre a confusão como forma de extinção da obrigação?', 'civil', 2, true, CURRENT_TIMESTAMP);

-- Sample answers for each question
INSERT INTO quiz_answers (id, question_id, answer_text, is_correct) VALUES
-- Q1 answers
('a1_1', 'q1', '10 anos', true),
('a1_2', 'q1', '5 anos', false),
('a1_3', 'q1', '3 anos', false),
('a1_4', 'q1', '15 anos', false),

-- Q2 answers
('a2_1', 'q2', 'Art. 927', true),
('a2_2', 'q2', 'Art. 186', false),
('a2_3', 'q2', 'Art. 187', false),
('a2_4', 'q2', 'Art. 188', false),

-- Q3 answers
('a3_1', 'q3', '3 anos', true),
('a3_2', 'q3', '5 anos', false),
('a3_3', 'q3', '10 anos', false),
('a3_4', 'q3', '2 anos', false),

-- Q4 answers
('a4_1', 'q4', '30 dias para bens móveis e 1 ano para imóveis', true),
('a4_2', 'q4', '90 dias para bens móveis e 1 ano para imóveis', false),
('a4_3', 'q4', '60 dias para bens móveis e 6 meses para imóveis', false),
('a4_4', 'q4', '180 dias para qualquer bem', false),

-- Q5 answers
('a5_1', 'q5', 'Quando as qualidades de credor e devedor se reúnem na mesma pessoa', true),
('a5_2', 'q5', 'Quando o credor perdoa a dívida do devedor', false),
('a5_3', 'q5', 'Quando o devedor paga a dívida', false),
('a5_4', 'q5', 'Quando o credor aceita objeto diverso do que lhe é devido', false);
