-- Seed sample questions and answers
DO $$ 
DECLARE
    v_category_id UUID;
BEGIN
    -- Get Constitutional Law category ID
    SELECT id INTO v_category_id FROM quiz_categories 
    WHERE name = 'Direito Constitucional' 
    LIMIT 1;

    -- Insert sample questions
    WITH new_question AS (
        INSERT INTO quiz_questions (
            category_id,
            question,
            explanation,
            difficulty,
            source
        ) VALUES (
            v_category_id,
            'Qual é o princípio fundamental que estabelece a separação dos Poderes na Constituição Federal?',
            'A separação dos Poderes é um princípio fundamental estabelecido no Art. 2º da Constituição Federal, que determina que os Poderes Legislativo, Executivo e Judiciário são independentes e harmônicos entre si.',
            2,
            'CF/88, Art. 2º'
        ) RETURNING id
    )
    INSERT INTO quiz_answers (question_id, answer_text, is_correct, explanation)
    SELECT id, 'Independência e harmonia entre os Poderes', true, 'Resposta correta conforme Art. 2º da CF/88'
    FROM new_question
    UNION ALL
    SELECT id, 'Subordinação do Judiciário ao Executivo', false, 'Incorreto, pois viola o princípio da independência'
    FROM new_question
    UNION ALL
    SELECT id, 'Hierarquia entre os Poderes', false, 'Incorreto, pois os Poderes são independentes'
    FROM new_question
    UNION ALL
    SELECT id, 'Unificação dos Poderes', false, 'Incorreto, pois contraria o princípio da separação'
    FROM new_question;

    -- Insert another question
    WITH new_question AS (
        INSERT INTO quiz_questions (
            category_id,
            question,
            explanation,
            difficulty,
            source
        ) VALUES (
            v_category_id,
            'Quais são os direitos fundamentais garantidos no Art. 5º da Constituição Federal?',
            'O Art. 5º da CF/88 estabelece os direitos e garantias fundamentais, incluindo o direito à vida, liberdade, igualdade, segurança e propriedade.',
            1,
            'CF/88, Art. 5º'
        ) RETURNING id
    )
    INSERT INTO quiz_answers (question_id, answer_text, is_correct, explanation)
    SELECT id, 'Vida, liberdade, igualdade, segurança e propriedade', true, 'Resposta correta conforme caput do Art. 5º'
    FROM new_question
    UNION ALL
    SELECT id, 'Apenas direito à vida e liberdade', false, 'Incompleto, existem outros direitos fundamentais'
    FROM new_question
    UNION ALL
    SELECT id, 'Somente direitos políticos', false, 'Incorreto, os direitos políticos estão em outro artigo'
    FROM new_question
    UNION ALL
    SELECT id, 'Exclusivamente direitos sociais', false, 'Incorreto, direitos sociais estão no Art. 6º'
    FROM new_question;

    -- Get Civil Law category ID
    SELECT id INTO v_category_id FROM quiz_categories 
    WHERE name = 'Direito Civil' 
    LIMIT 1;

    -- Insert Civil Law question
    WITH new_question AS (
        INSERT INTO quiz_questions (
            category_id,
            question,
            explanation,
            difficulty,
            source
        ) VALUES (
            v_category_id,
            'Qual é o prazo geral de prescrição previsto no Código Civil?',
            'O Art. 205 do Código Civil estabelece que a prescrição ocorre em 10 anos, quando a lei não lhe haja fixado prazo menor.',
            2,
            'Código Civil, Art. 205'
        ) RETURNING id
    )
    INSERT INTO quiz_answers (question_id, answer_text, is_correct, explanation)
    SELECT id, '10 anos', true, 'Correto, conforme Art. 205 do CC'
    FROM new_question
    UNION ALL
    SELECT id, '5 anos', false, 'Incorreto, este é um dos prazos especiais'
    FROM new_question
    UNION ALL
    SELECT id, '15 anos', false, 'Incorreto, prazo não previsto no CC'
    FROM new_question
    UNION ALL
    SELECT id, '20 anos', false, 'Incorreto, prazo não previsto no CC'
    FROM new_question;
END $$;