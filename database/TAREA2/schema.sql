-- Schema final sugerido para la Tarea 2
-- Mantiene los nombres exactos del Contrato de Integración §2.
-- Nota: los tipos para Question.type, Room.status y Question.options se dejan como
-- VARCHAR/JSON para compatibilidad entre MySQL y PostgreSQL.
-- Si Backend define ENUM real o arrays nativos, ajustar este script.

CREATE TABLE Room (
    roomId VARCHAR(36) NOT NULL,
    pin VARCHAR(6) NOT NULL,
    status VARCHAR(50) NOT NULL,
    currentQuestionIndex INT NOT NULL DEFAULT 0,
    createdAt TIMESTAMP NOT NULL,
    PRIMARY KEY (roomId),
    UNIQUE (pin)
);

CREATE TABLE Player (
    playerId VARCHAR(36) NOT NULL,
    roomId VARCHAR(36) NOT NULL,
    nickname VARCHAR(255) NOT NULL,
    joinedAt TIMESTAMP NOT NULL,
    totalScore INT NOT NULL DEFAULT 0,
    PRIMARY KEY (playerId),
    CONSTRAINT fk_player_room
        FOREIGN KEY (roomId) REFERENCES Room(roomId)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

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
