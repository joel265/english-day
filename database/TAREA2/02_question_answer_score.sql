-- Tarea 2 - Base de Datos
-- Bloque 2: Question, Answer y Score
-- Nota: se conserva el nombre exacto de cada campo del Contrato de Integración §2.
-- Se interpreta Question.options como JSON para compatibilidad entre MySQL y PostgreSQL.
-- Se interpreta Score como clave compuesta (playerId, roomId) para evitar duplicados por sala.

CREATE TABLE Question (
    questionId VARCHAR(36) NOT NULL,
    type VARCHAR(50) NOT NULL,
    prompt TEXT NOT NULL,
    options JSON NULL,
    correctAnswer VARCHAR(255) NOT NULL,
    timeLimitSeconds INT NOT NULL,
    "order" INT NOT NULL,
    PRIMARY KEY (questionId)
);

CREATE TABLE Answer (
    answerId VARCHAR(36) NOT NULL,
    playerId VARCHAR(36) NOT NULL,
    questionId VARCHAR(36) NOT NULL,
    value TEXT NOT NULL,
    isCorrect BOOLEAN NOT NULL,
    responseTimeMs INT NOT NULL,
    pointsAwarded INT NOT NULL DEFAULT 0,
    PRIMARY KEY (answerId),
    CONSTRAINT fk_answer_player
        FOREIGN KEY (playerId) REFERENCES Player(playerId)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_answer_question
        FOREIGN KEY (questionId) REFERENCES Question(questionId)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE Score (
    playerId VARCHAR(36) NOT NULL,
    roomId VARCHAR(36) NOT NULL,
    totalPoints INT NOT NULL DEFAULT 0,
    rank INT NOT NULL DEFAULT 0,
    PRIMARY KEY (playerId, roomId),
    CONSTRAINT fk_score_player
        FOREIGN KEY (playerId) REFERENCES Player(playerId)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_score_room
        FOREIGN KEY (roomId) REFERENCES Room(roomId)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- Observación importante para Backend:
-- 1) Si en la práctica usan un enum real de BD para Question.type o Room.status, se debe ajustar la definición.
-- 2) Si prefieren un scoreId artificial, se debe cambiar la PK y la lógica del modelo.
-- 3) Si Question.options va a ser un array nativo o texto estructurado, se debe validar el tipo exacto antes de cerrar la implementación final.
