-- Tarea 3 - Operaciones principales de English Up
-- Motor objetivo: MySQL 8.0+ (backend/src/main/resources/application.properties).
-- Parametros ? para PreparedStatement/JPA native query. No concatenar valores.
-- Estas consultas deben integrarse desde servicios Backend con transacciones.

-- 1. Crear sala (POST /api/rooms).
-- Backend genera roomId (UUID v4), pin unico de 6 digitos y createdAt UTC.
INSERT INTO Room (roomId, pin, status, currentQuestionIndex, createdAt)
VALUES (?, ?, 'WAITING_LOBBY', 0, ?);

-- Si el PIN colisiona con la restriccion UNIQUE de Room.pin, Backend genera otro y reintenta.

-- 2. Leer el estado de una sala por PIN (GET /api/rooms/{pin}).
SELECT roomId, pin, status, currentQuestionIndex, createdAt
FROM Room
WHERE pin = ?;

-- 3. Buscar la sala disponible para unirse (POST /api/rooms/{pin}/join).
-- Un resultado vacio significa PIN inexistente o sala que ya no admite jugadores.
SELECT roomId, status
FROM Room
WHERE pin = ?
  AND status = 'WAITING_LOBBY';

-- 4. Registrar jugador y su puntaje inicial (POST /api/rooms/{pin}/join).
-- Ejecutar ambas inserciones en una misma transaccion despues de validar la sala.
-- playerId y joinedAt son generados por Backend.
INSERT INTO Player (playerId, roomId, nickname, joinedAt, totalScore)
VALUES (?, ?, ?, ?, 0);

INSERT INTO Score (playerId, roomId, totalPoints, `rank`)
VALUES (?, ?, 0, 0);

-- 5. Consultar jugadores del lobby de una sala.
SELECT playerId, roomId, nickname, joinedAt, totalScore
FROM Player
WHERE roomId = ?
ORDER BY joinedAt ASC, playerId ASC;

-- 6. Consultar las preguntas en el orden definido por el banco global.
-- Esta consulta es para el payload publico: nunca seleccionar correctAnswer.
SELECT questionId, type, prompt, options, timeLimitSeconds, `order`
FROM Question
ORDER BY `order` ASC;

-- 7. Consultar la pregunta actual asociada al indice de la sala.
-- El indice comienza en 0 y Question.order comienza en 1 (Tarea 4).
-- No devolver correctAnswer al cliente.
SELECT q.questionId, q.type, q.prompt, q.options, q.timeLimitSeconds, q.`order`
FROM Room r
JOIN Question q
  ON q.`order` = r.currentQuestionIndex + 1
WHERE r.roomId = ?;

-- 8. Validar que el jugador pertenece a la sala y que responde la pregunta actual.
-- Parametros, en orden: questionId, roomId, playerId.
SELECT p.playerId, q.questionId
FROM Room r
JOIN Player p
  ON p.roomId = r.roomId
JOIN Question q
  ON q.questionId = ?
 AND q.`order` = r.currentQuestionIndex + 1
WHERE r.roomId = ?
  AND p.playerId = ?
  AND r.status = 'QUESTION_IN_PROGRESS';

-- 9. Leer correctAnswer solo para validacion interna del servidor.
SELECT correctAnswer
FROM Question
WHERE questionId = ?;

-- 10. Guardar una respuesta ya validada y puntuada por Backend.
-- No confiar en valores calculados enviados por el cliente.
INSERT INTO Answer (
    answerId, playerId, questionId, value, isCorrect, responseTimeMs, pointsAwarded
)
VALUES (?, ?, ?, ?, ?, ?, ?);

-- 11. Consultar Top 5 para /topic/room/{roomId}/results.
-- Score debe estar sincronizado por Backend con las respuestas/puntajes.
SELECT p.nickname, s.totalPoints AS score
FROM Score s
JOIN Player p
  ON p.playerId = s.playerId
 AND p.roomId = s.roomId
WHERE s.roomId = ?
ORDER BY s.totalPoints DESC, p.nickname ASC, p.playerId ASC
LIMIT 5;

-- 12. Consultar Top 3 para GET /api/rooms/{roomId}/results.
SELECT p.nickname, s.totalPoints AS score
FROM Score s
JOIN Player p
  ON p.playerId = s.playerId
 AND p.roomId = s.roomId
WHERE s.roomId = ?
ORDER BY s.totalPoints DESC, p.nickname ASC, p.playerId ASC
LIMIT 3;
