-- First create the categories
INSERT INTO quiz_categories (id, name, description, icon, color, order_position, is_active) VALUES
  (uuid_generate_v4(), 'Direito Civil', 'Questões sobre direito civil e relações privadas', 'book', 'blue', 1, true),
  (uuid_generate_v4(), 'Direito Constitucional', 'Questões sobre direito constitucional', 'scale', 'red', 2, true),
  (uuid_generate_v4(), 'Direito Processual', 'Questões sobre processo civil', 'gavel', 'green', 3, true);

-- Store category IDs in variables
WITH categories AS (
  SELECT id, name FROM quiz_categories
),
-- Insert Civil Law questions using the correct category ID
civil_questions AS (
  INSERT INTO quiz_questions (id, question, category_id, difficulty, is_active)
  SELECT 
    uuid_generate_v4(),
    q.question,
    c.id as category_id,
    q.difficulty,
    true
  FROM (
    VALUES 
      ('Qual é o prazo prescricional geral previsto no Código Civil?', 1),
      ('O que caracteriza a responsabilidade civil objetiva?', 2),
      ('Qual é o prazo para o direito de arrependimento no CDC?', 1)
  ) as q(question, difficulty)
  CROSS JOIN (SELECT id FROM categories WHERE name = 'Direito Civil') c
  RETURNING id
),
-- Insert answers for Civil Law questions
civil_answers AS (
  INSERT INTO quiz_answers (question_id, answer_text, is_correct)
  SELECT 
    q.id,
    a.answer_text,
    a.is_correct
  FROM civil_questions q
  CROSS JOIN LATERAL (
    VALUES 
      ('10 anos', true),
      ('5 anos', false),
      ('15 anos', false),
      ('20 anos', false)
  ) as a(answer_text, is_correct)
),
-- Insert Constitutional Law questions
const_questions AS (
  INSERT INTO quiz_questions (id, question, category_id, difficulty, is_active)
  SELECT 
    uuid_generate_v4(),
    q.question,
    c.id as category_id,
    q.difficulty,
    true
  FROM (
    VALUES 
      ('Qual é o prazo do mandado de segurança?', 1),
      ('Quem pode propor Ação Direta de Inconstitucionalidade?', 2),
      ('Qual remédio constitucional protege o direito de locomoção?', 1)
  ) as q(question, difficulty)
  CROSS JOIN (SELECT id FROM categories WHERE name = 'Direito Constitucional') c
  RETURNING id
),
-- Insert answers for Constitutional Law questions
const_answers AS (
  INSERT INTO quiz_answers (question_id, answer_text, is_correct)
  SELECT 
    q.id,
    a.answer_text,
    a.is_correct
  FROM const_questions q
  CROSS JOIN LATERAL (
    VALUES 
      ('120 dias', true),
      ('60 dias', false),
      ('30 dias', false),
      ('180 dias', false)
  ) as a(answer_text, is_correct)
),
-- Insert Process Law questions
proc_questions AS (
  INSERT INTO quiz_questions (id, question, category_id, difficulty, is_active)
  SELECT 
    uuid_generate_v4(),
    q.question,
    c.id as category_id,
    q.difficulty,
    true
  FROM (
    VALUES 
      ('Qual é o prazo para contestação no procedimento comum?', 1),
      ('O que é preclusão temporal?', 2),
      ('Qual recurso é cabível contra decisão interlocutória?', 2)
  ) as q(question, difficulty)
  CROSS JOIN (SELECT id FROM categories WHERE name = 'Direito Processual') c
  RETURNING id
)
-- Insert answers for Process Law questions
INSERT INTO quiz_answers (question_id, answer_text, is_correct)
SELECT 
  q.id,
  a.answer_text,
  a.is_correct
FROM proc_questions q
CROSS JOIN LATERAL (
  VALUES 
    ('15 dias úteis', true),
    ('15 dias corridos', false),
    ('10 dias úteis', false),
    ('30 dias úteis', false)
  ) as a(answer_text, is_correct); 