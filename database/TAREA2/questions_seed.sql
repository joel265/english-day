-- Seed de preguntas para English Day
-- Se usa un banco inicial de ejemplo para probar el flujo de la partida.
-- En la práctica, este archivo se completa con 20-40 preguntas reales.

INSERT INTO Question (questionId, type, prompt, options, correctAnswer, timeLimitSeconds, "order") VALUES
('11111111-1111-4111-8111-111111111111', 'MULTIPLE_CHOICE', 'Choose the correct translation of "hola".', JSON_ARRAY('Goodbye', 'Hello', 'Thank you', 'Please'), 'Hello', 15, 1),
('22222222-2222-4222-8222-222222222222', 'MULTIPLE_CHOICE', 'Which sentence is correct?', JSON_ARRAY('She go to school every day.', 'She goes to school every day.', 'She going to school every day.', 'She gone to school every day.'), 'She goes to school every day.', 15, 2),
('33333333-3333-4333-8333-333333333333', 'TEXT_INPUT', 'Write the past tense of the verb "eat".', NULL, 'ate', 20, 3),
('44444444-4444-4444-8444-444444444444', 'WORD_BLOCKS', 'Order the words: "I / am / happy".', JSON_ARRAY('I', 'am', 'happy'), 'I am happy', 20, 4),
('55555555-5555-4555-8555-555555555555', 'VOICE', 'Say the phrase: "I am ready to learn".', NULL, 'I am ready to learn', 25, 5);

INSERT INTO Room (roomId, pin, status, currentQuestionIndex, createdAt) VALUES
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '123456', 'WAITING_LOBBY', 0, '2026-09-21 14:30:00'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '654321', 'QUESTION_IN_PROGRESS', 1, '2026-09-21 14:45:00');

INSERT INTO Player (playerId, roomId, nickname, joinedAt, totalScore) VALUES
('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Ana', '2026-09-21 14:31:00', 0),
('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Luis', '2026-09-21 14:32:00', 0),
('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Sofia', '2026-09-21 14:46:00', 0);

INSERT INTO Answer (answerId, playerId, questionId, value, isCorrect, responseTimeMs, pointsAwarded) VALUES
('f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f1', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', '11111111-1111-4111-8111-111111111111', 'Hello', TRUE, 1900, 1000),
('f2f2f2f2-f2f2-4f2f-8f2f-f2f2f2f2f2f2', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', '11111111-1111-4111-8111-111111111111', 'Goodbye', FALSE, 2300, 0),
('f3f3f3f3-f3f3-4f3f-8f3f-f3f3f3f3f3f3', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', '22222222-2222-4222-8222-222222222222', 'She goes to school every day.', TRUE, 2100, 1000);

INSERT INTO Score (playerId, roomId, totalPoints, rank) VALUES
('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 1000, 1),
('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 0, 2),
('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 1000, 1);
