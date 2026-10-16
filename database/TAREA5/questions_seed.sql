-- =============================================================================
-- English Day — Plataforma Web de Gamificación (SENA ADSO)
-- Tarea 5: Script questions_seed.sql con datos de prueba, junto con QA
-- Motor de base de datos oficial: MySQL 8.0+ (Decisión Técnica #4)
-- Conforme al Contrato de Integración §2 y §4.3, y Manual de Despliegue Paso 1
-- =============================================================================

-- -----------------------------------------------------------------------------
-- BLOQUE 1: BANCO DE PREGUNTAS (Question)
-- Total: 20 preguntas pedagógicas documentadas por QA + 3 mecánicas interactivas
-- Nota: La columna correctAnswer es interna para validación en servidor;
-- no se expone en el payload público enviado por WebSocket (/topic/.../question).
-- -----------------------------------------------------------------------------

INSERT INTO Question (questionId, type, prompt, options, correctAnswer, timeLimitSeconds, `order`) VALUES
-- QA: Simple Present, Nivel 1 - Afirmativo
('11111111-1111-4111-8111-111111111111', 'MULTIPLE_CHOICE', 'Laura studies English every day. What does Laura do every day?', JSON_ARRAY('She plays soccer.', 'She studies English.', 'She watches TV.', 'She reads books.'), 'She studies English.', 15, 1),
('22222222-2222-4222-8222-222222222222', 'MULTIPLE_CHOICE', 'Tom and Peter walk to school every morning. How do they go to school?', JSON_ARRAY('They walk.', 'They drive.', 'They run.', 'They take a bus.'), 'They walk.', 15, 2),
('90000000-0000-4000-8000-000000000003', 'MULTIPLE_CHOICE', 'Choose the correct sentence.', JSON_ARRAY('She eat breakfast at seven.', 'She eats breakfast at seven.', 'She eating breakfast at seven.', 'She do eats breakfast at seven.'), 'She eats breakfast at seven.', 15, 3),
('90000000-0000-4000-8000-000000000004', 'MULTIPLE_CHOICE', 'Anna has a dog. She feeds her dog every morning. What does Anna do every morning?', JSON_ARRAY('She walks to school.', 'She feeds her dog.', 'She watches television.', 'She plays tennis.'), 'She feeds her dog.', 15, 4),

-- QA: Simple Present, Nivel 2 - Negativo
('90000000-0000-4000-8000-000000000005', 'MULTIPLE_CHOICE', 'David doesn''t drink coffee. What does the sentence mean?', JSON_ARRAY('David drinks coffee.', 'David likes coffee.', 'David doesn''t drink coffee.', 'David makes coffee.'), 'David doesn''t drink coffee.', 15, 5),
('90000000-0000-4000-8000-000000000006', 'MULTIPLE_CHOICE', 'They _____ play basketball after school.', JSON_ARRAY('doesn''t', 'don''t', 'isn''t', 'aren''t'), 'don''t', 15, 6),
('90000000-0000-4000-8000-000000000007', 'MULTIPLE_CHOICE', 'Maria likes fruit, but she doesn''t eat bananas. Which fruit doesn''t Maria eat?', JSON_ARRAY('Apples.', 'Oranges.', 'Grapes.', 'Bananas.'), 'Bananas.', 15, 7),
('90000000-0000-4000-8000-000000000008', 'MULTIPLE_CHOICE', 'Choose the correct sentence.', JSON_ARRAY('He don''t like pizza.', 'He doesn''t likes pizza.', 'He doesn''t like pizza.', 'He not like pizza.'), 'He doesn''t like pizza.', 15, 8),
('90000000-0000-4000-8000-000000000009', 'MULTIPLE_CHOICE', 'Lucas goes to school by bus. He doesn''t ride a bicycle. How does Lucas travel to school?', JSON_ARRAY('By bicycle.', 'By bus.', 'On foot.', 'By train.'), 'By bus.', 15, 9),

-- QA: Simple Present, Nivel 3 - Interrogativo
('90000000-0000-4000-8000-000000000010', 'MULTIPLE_CHOICE', 'Sarah plays tennis every Saturday. Does she play tennis every Saturday?', JSON_ARRAY('Yes, she does.', 'No, she don''t.', 'Yes, she is.', 'No, she doesn''t plays.'), 'Yes, she does.', 15, 10),
('90000000-0000-4000-8000-000000000011', 'MULTIPLE_CHOICE', '_____ you speak English?', JSON_ARRAY('Does', 'Are', 'Do', 'Is'), 'Do', 15, 11),
('90000000-0000-4000-8000-000000000012', 'MULTIPLE_CHOICE', 'Jack gets up at six o''clock. He eats breakfast at seven. What time does Jack get up?', JSON_ARRAY('At seven o''clock.', 'At eight o''clock.', 'At six o''clock.', 'At nine o''clock.'), 'At six o''clock.', 15, 12),
('90000000-0000-4000-8000-000000000013', 'MULTIPLE_CHOICE', 'Choose the correct question.', JSON_ARRAY('Does she likes music?', 'Do she like music?', 'Does she like music?', 'Is she like music?'), 'Does she like music?', 15, 13),
('90000000-0000-4000-8000-000000000014', 'MULTIPLE_CHOICE', 'Peter: Do you play video games? Mark: No, I don''t. I read books. What does Mark do?', JSON_ARRAY('He plays video games.', 'He reads books.', 'He watches movies.', 'He plays soccer.'), 'He reads books.', 15, 14),

-- QA: Simple Present - Refuerzo y Consolidación
('90000000-0000-4000-8000-000000000015', 'MULTIPLE_CHOICE', 'Emma is a student. She reads a book every night before sleeping. What does Emma do every night?', JSON_ARRAY('She watches TV.', 'She reads a book.', 'She plays soccer.', 'She listens to music.'), 'She reads a book.', 15, 15),
('90000000-0000-4000-8000-000000000016', 'MULTIPLE_CHOICE', 'My father _____ breakfast at 7:00 a.m.', JSON_ARRAY('eat', 'eating', 'eats', 'don''t eat'), 'eats', 15, 16),
('90000000-0000-4000-8000-000000000017', 'MULTIPLE_CHOICE', 'Kevin likes animals, but he doesn''t have a cat. He has a dog. Which animal does Kevin have?', JSON_ARRAY('A cat.', 'A rabbit.', 'A bird.', 'A dog.'), 'A dog.', 15, 17),
('90000000-0000-4000-8000-000000000018', 'MULTIPLE_CHOICE', 'Choose the correct sentence.', JSON_ARRAY('They doesn''t study English.', 'They don''t studies English.', 'They don''t study English.', 'They not study English.'), 'They don''t study English.', 15, 18),
('90000000-0000-4000-8000-000000000019', 'MULTIPLE_CHOICE', 'Lucy: Do you listen to music every day? Daniel: Yes, I do. I listen to music after school. When does Daniel listen to music?', JSON_ARRAY('Before school.', 'After school.', 'At midnight.', 'On Sundays only.'), 'After school.', 15, 19),

-- QA: WH Questions (English Quest)
('90000000-0000-4000-8000-000000000020', 'MULTIPLE_CHOICE', '_____ is your name?', JSON_ARRAY('Where', 'What', 'When', 'Who'), 'What', 15, 20),

-- Mecánicas interactivas especiales (Contrato §4.3)
('33333333-3333-4333-8333-333333333333', 'TEXT_INPUT', 'Write the past tense of the verb "eat".', NULL, 'ate', 20, 21),
('44444444-4444-4444-8444-444444444444', 'WORD_BLOCKS', 'Arrange the words to make a sentence about how you feel.', JSON_ARRAY('happy', 'I', 'am'), 'I am happy', 20, 22),
('55555555-5555-4555-8555-555555555555', 'VOICE', 'Say the phrase: "I am ready to learn".', NULL, 'I am ready to learn', 25, 23);

-- -----------------------------------------------------------------------------
-- BLOQUE 2: SALAS (Room)
-- Sala 1: WAITING_LOBBY (espera en lobby para probar /join y WebSocket lobby)
-- Sala 2: QUESTION_IN_PROGRESS (partida activa en pregunta 1 para probar flujo en vivo)
-- -----------------------------------------------------------------------------

INSERT INTO Room (roomId, pin, status, currentQuestionIndex, createdAt) VALUES
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '123456', 'WAITING_LOBBY', 0, '2026-09-21 14:30:00'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '654321', 'QUESTION_IN_PROGRESS', 1, '2026-09-21 14:45:00');

-- -----------------------------------------------------------------------------
-- BLOQUE 3: JUGADORES (Player)
-- Relación Room (1) -> Player (N)
-- -----------------------------------------------------------------------------

INSERT INTO Player (playerId, roomId, nickname, joinedAt, totalScore) VALUES
-- Jugadores en Sala 1 (Lobby inicial)
('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Ana', '2026-09-21 14:31:00', 0),
('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Luis', '2026-09-21 14:32:00', 0),

-- Jugadores en Sala 2 (Partida en curso)
('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Sofia', '2026-09-21 14:46:00', 2000),
('12121212-1212-4212-8212-121212121212', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Carlos', '2026-09-21 14:46:30', 0);

-- -----------------------------------------------------------------------------
-- BLOQUE 4: RESPUESTAS (Answer)
-- Relaciones: Player (1) -> Answer (N), Question (1) -> Answer (N)
-- Puntuaciones basadas en Decisión Técnica #1 y #2 (BASE_POINTS = 1000)
-- -----------------------------------------------------------------------------

INSERT INTO Answer (answerId, playerId, questionId, value, isCorrect, responseTimeMs, pointsAwarded) VALUES
-- Respuestas de Sofia en Sala 2 (Preguntas 1 y 2 correctas con puntuación de velocidad)
('f1f1f1f1-cccc-4ccc-8ccc-cccccccccccc', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', '11111111-1111-4111-8111-111111111111', 'She studies English.', TRUE, 1850, 1000),
('f3f3f3f3-eeee-4eee-8eee-eeeeeeeeeeee', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', '22222222-2222-4222-8222-222222222222', 'They walk.', TRUE, 2100, 1000),

-- Respuesta de Carlos en Sala 2 (Pregunta 1 incorrecta)
('f2f2f2f2-dddd-4ddd-8ddd-dddddddddddd', '12121212-1212-4212-8212-121212121212', '11111111-1111-4111-8111-111111111111', 'She plays soccer.', FALSE, 2400, 0);

-- -----------------------------------------------------------------------------
-- BLOQUE 5: PUNTUACIONES / RANKING CONSOLIDADO (Score)
-- Clave primaria compuesta (playerId, roomId) para unicidad por sala
-- `rank` usa backticks por ser palabra reservada en MySQL 8.0+
-- -----------------------------------------------------------------------------

INSERT INTO Score (playerId, roomId, totalPoints, `rank`) VALUES
-- Ranking Sala 2 (Sofia en puesto 1 con 2000 pts, Carlos en puesto 2 con 0 pts)
('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 2000, 1),
('12121212-1212-4212-8212-121212121212', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 0, 2),

-- Ranking inicial Sala 1 (Lobby de espera, 0 puntos)
('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 0, 1),
('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 0, 2);
