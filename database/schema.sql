-- English Up - Esquema final de despliegue (MySQL 8.0+).
-- Contrato de Integración §2; nombres de tabla y columna compartidos con JPA.

CREATE TABLE Room (
    roomId VARCHAR(36) NOT NULL,
    pin VARCHAR(6) NOT NULL,
    status VARCHAR(50) NOT NULL,
    currentQuestionIndex INT NOT NULL DEFAULT 0,
    createdAt TIMESTAMP NOT NULL,
    PRIMARY KEY (roomId),
    UNIQUE (pin)
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4;

CREATE TABLE Player (
    playerId VARCHAR(36) NOT NULL,
    roomId VARCHAR(36) NOT NULL,
    nickname VARCHAR(255) NOT NULL,
    avatar VARCHAR(500) NULL,
    joinedAt TIMESTAMP NOT NULL,
    totalScore INT NOT NULL DEFAULT 0,
    PRIMARY KEY (playerId),
    CONSTRAINT fk_player_room
        FOREIGN KEY (roomId) REFERENCES Room(roomId)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4;

CREATE TABLE Question (
    questionId VARCHAR(36) NOT NULL,
    type VARCHAR(50) NOT NULL,
    prompt TEXT NOT NULL,
    options JSON NULL,
    correctAnswer VARCHAR(255) NOT NULL,
    timeLimitSeconds INT NOT NULL,
    `order` INT NOT NULL,
    PRIMARY KEY (questionId)
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4;

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
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4;

CREATE TABLE Score (
    playerId VARCHAR(36) NOT NULL,
    roomId VARCHAR(36) NOT NULL,
    totalPoints INT NOT NULL DEFAULT 0,
    `rank` INT NOT NULL DEFAULT 0,
    PRIMARY KEY (playerId, roomId),
    CONSTRAINT fk_score_player
        FOREIGN KEY (playerId) REFERENCES Player(playerId)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_score_room
        FOREIGN KEY (roomId) REFERENCES Room(roomId)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4;
