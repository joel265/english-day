-- =============================================================================
-- English Up - Carga final de datos de prueba para despliegue (MySQL 8.0+).
-- Banco refactorizado en las 6 temáticas oficiales:
--   1. Pronouns
--   2. Verb To Be
--   3. Possessive Adjectives
--   4. Simple Present (Affirmative, Negative, Interrogative)
--   5. Present Continuous (Affirmative, Negative, Interrogative)
--   6. WH QUESTION
-- Motor de base de datos oficial: MySQL 8.0+ (Decisión Técnica #4)
-- =============================================================================

START TRANSACTION;

INSERT INTO Question (questionId, type, prompt, options, correctAnswer, timeLimitSeconds, `order`) VALUES
-- 1. Simple Present (Affirmative, Negative, Interrogative) & Verb To Be (orden 1..5 para flujo secuencial base)
('11111111-1111-4111-8111-111111111111', 'MULTIPLE_CHOICE', '[Simple Present · Affirmative] Laura studies English every day. What does Laura do every day?', JSON_ARRAY('She plays soccer.', 'She studies English.', 'She watches TV.', 'She reads books.'), 'She studies English.', 15, 1),
('22222222-2222-4222-8222-222222222222', 'MULTIPLE_CHOICE', '[Verb To Be] Choose the correct form of Verb To Be: "They _____ students at SENA."', JSON_ARRAY('am', 'is', 'are', 'be'), 'are', 15, 2),
('33333333-3333-4333-8333-333333333333', 'TEXT_INPUT', '[Simple Present · Affirmative] Complete with the correct Simple Present verb form: "She _____ (study) English every day."', NULL, 'studies|she studies english every day|she studies english', 20, 3),
('44444444-4444-4444-8444-444444444444', 'WORD_BLOCKS', '[Verb To Be] Arrange the words to make a sentence with the Verb To Be.', JSON_ARRAY('happy', 'I', 'am', 'today'), 'I am happy today|I am happy|Today I am happy', 20, 4),
('55555555-5555-4555-8555-555555555555', 'VOICE', '[Verb To Be] Say the phrase: "I am ready to learn".', NULL, 'I am ready to learn', 25, 5),

-- 2. Pronouns
('90000000-0000-4000-8000-000000000003', 'MULTIPLE_CHOICE', '[Pronouns] Maria is my classmate. _____ is very intelligent.', JSON_ARRAY('He', 'She', 'They', 'It'), 'She', 15, 6),
('33333333-3333-4333-8333-333333333334', 'TEXT_INPUT', '[Pronouns] Write the subject pronoun for ''Carlos and I'': "_____ are good friends."', NULL, 'We|we are good friends', 20, 7),
('44444444-4444-4444-8444-444444444445', 'WORD_BLOCKS', '[Pronouns] Arrange the words to form a sentence with subject and object pronouns.', JSON_ARRAY('helps', 'She', 'every', 'us', 'day'), 'She helps us every day|She helps us|Every day she helps us', 20, 8),
('55555555-5555-4555-8555-555555555556', 'VOICE', '[Pronouns] Say the sentence: "They are my best friends".', NULL, 'They are my best friends', 25, 9),

-- 3. Verb To Be (adicional)
('33333333-3333-4333-8333-333333333335', 'TEXT_INPUT', '[Verb To Be] Complete with the Verb To Be (am, is, are): "He _____ a software developer."', NULL, 'is|he is a software developer', 20, 10),

-- 4. Possessive Adjectives
('90000000-0000-4000-8000-000000000004', 'MULTIPLE_CHOICE', '[Possessive Adjectives] David has a new laptop. _____ laptop is very fast.', JSON_ARRAY('Her', 'His', 'Their', 'Our'), 'His', 15, 11),
('33333333-3333-4333-8333-333333333336', 'TEXT_INPUT', '[Possessive Adjectives] Write the possessive adjective for ''I'': "I love _____ family."', NULL, 'my|i love my family', 20, 12),
('44444444-4444-4444-8444-444444444446', 'WORD_BLOCKS', '[Possessive Adjectives] Arrange the words to form a sentence with a possessive adjective.', JSON_ARRAY('is', 'Our', 'classroom', 'very', 'big'), 'Our classroom is very big|Our classroom is big', 20, 13),
('55555555-5555-4555-8555-555555555557', 'VOICE', '[Possessive Adjectives] Say the sentence: "This is our English class".', NULL, 'This is our English class', 25, 14),

-- 5. Simple Present (Negative & Interrogative)
('90000000-0000-4000-8000-000000000006', 'MULTIPLE_CHOICE', '[Simple Present · Negative] They _____ play basketball after school.', JSON_ARRAY('doesn''t', 'don''t', 'isn''t', 'aren''t'), 'don''t', 15, 15),
('44444444-4444-4444-8444-444444444447', 'WORD_BLOCKS', '[Simple Present · Negative] Arrange the words to form a negative sentence in Simple Present.', JSON_ARRAY('like', 'He', 'pizza', 'doesn''t', 'today'), 'He doesn''t like pizza today|He doesn''t like pizza|Today he doesn''t like pizza', 20, 16),
('44444444-4444-4444-8444-444444444448', 'WORD_BLOCKS', '[Simple Present · Interrogative] Arrange the words to form an interrogative sentence in Simple Present.', JSON_ARRAY('speak', 'you', 'English', 'Do', 'every day'), 'Do you speak English every day|Do you speak English', 20, 17),

-- 6. Present Continuous (Affirmative, Negative, Interrogative)
('90000000-0000-4000-8000-000000000005', 'MULTIPLE_CHOICE', '[Present Continuous · Affirmative] Look! The students _____ English right now.', JSON_ARRAY('is speaking', 'are speaking', 'speaks', 'speak'), 'are speaking', 15, 18),
('90000000-0000-4000-8000-000000000010', 'MULTIPLE_CHOICE', '[Present Continuous · Negative] Choose the correct negative sentence in Present Continuous.', JSON_ARRAY('He isn''t watching TV right now.', 'He don''t watching TV right now.', 'He not watching TV right now.', 'He aren''t watching TV right now.'), 'He isn''t watching TV right now.', 15, 19),
('33333333-3333-4333-8333-333333333337', 'TEXT_INPUT', '[Present Continuous · Affirmative] Write the -ing form of the verb "read": "She is _____ a book right now."', NULL, 'reading|she is reading a book right now|she is reading', 20, 20),
('44444444-4444-4444-8444-444444444449', 'WORD_BLOCKS', '[Present Continuous · Interrogative] Arrange the words to form a question in Present Continuous.', JSON_ARRAY('studying', 'Are', 'English', 'they', 'now'), 'Are they studying English now|Are they studying English|Are they studying now', 20, 21),
('55555555-5555-4555-8555-555555555558', 'VOICE', '[Present Continuous · Affirmative] Say the sentence: "We are learning English right now".', NULL, 'We are learning English right now', 25, 22),

-- 7. WH QUESTION
('90000000-0000-4000-8000-000000000020', 'MULTIPLE_CHOICE', '[WH Question] _____ is your name?', JSON_ARRAY('Where', 'What', 'When', 'Who'), 'What', 15, 23),
('55555555-5555-4555-8555-555555555559', 'VOICE', '[WH Question] Say the question: "Where are you from".', NULL, 'Where are you from', 25, 24);

-- -----------------------------------------------------------------------------
-- BLOQUE 2: SALAS (Room)
-- -----------------------------------------------------------------------------
INSERT INTO Room (roomId, pin, status, currentQuestionIndex, createdAt) VALUES
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '123456', 'WAITING_LOBBY', 0, '2026-09-21 14:30:00'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '654321', 'QUESTION_IN_PROGRESS', 1, '2026-09-21 14:45:00');

-- -----------------------------------------------------------------------------
-- BLOQUE 3: JUGADORES (Player)
-- -----------------------------------------------------------------------------
INSERT INTO Player (playerId, roomId, nickname, joinedAt, totalScore) VALUES
('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Ana', '2026-09-21 14:31:00', 0),
('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Luis', '2026-09-21 14:32:00', 0),
('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Sofia', '2026-09-21 14:46:00', 2000),
('12121212-1212-4212-8212-121212121212', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Carlos', '2026-09-21 14:46:30', 0);

-- -----------------------------------------------------------------------------
-- BLOQUE 4: RESPUESTAS (Answer)
-- -----------------------------------------------------------------------------
INSERT INTO Answer (answerId, playerId, questionId, value, isCorrect, responseTimeMs, pointsAwarded) VALUES
('f1f1f1f1-cccc-4ccc-8ccc-cccccccccccc', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', '11111111-1111-4111-8111-111111111111', 'She studies English.', TRUE, 1850, 1000),
('f3f3f3f3-eeee-4eee-8eee-eeeeeeeeeeee', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', '22222222-2222-4222-8222-222222222222', 'are', TRUE, 2100, 1000),
('f2f2f2f2-dddd-4ddd-8ddd-dddddddddddd', '12121212-1212-4212-8212-121212121212', '11111111-1111-4111-8111-111111111111', 'She plays soccer.', FALSE, 2400, 0);

-- -----------------------------------------------------------------------------
-- BLOQUE 5: PUNTUACIONES / RANKING CONSOLIDADO (Score)
-- -----------------------------------------------------------------------------
INSERT INTO Score (playerId, roomId, totalPoints, `rank`) VALUES
('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 2000, 1),
('12121212-1212-4212-8212-121212121212', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 0, 2),
('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 0, 1),
('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 0, 2);

COMMIT;
