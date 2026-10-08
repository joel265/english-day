CREATE TABLE Room (
    roomId CHAR(36) NOT NULL,
    pin CHAR(6) NOT NULL,
    status ENUM(
        'WAITING_LOBBY',
        'QUESTION_IN_PROGRESS',
        'ROULETTE_TIME',
        'FINISHED'
    ) NOT NULL,
    currentQuestionIndex INT NOT NULL,
    createdAt DATETIME NOT NULL,
    PRIMARY KEY (roomId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Question (
    questionId CHAR(36) NOT NULL,
    type ENUM(
        'MULTIPLE_CHOICE',
        'WORD_BLOCKS',
        'TEXT_INPUT',
        'VOICE'
    ) NOT NULL,
    prompt TEXT NOT NULL,
    options JSON NULL,
    correctAnswer TEXT NOT NULL,
    timeLimitSeconds INT NOT NULL,
    `order` INT NOT NULL,
    PRIMARY KEY (questionId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Player (
    playerId CHAR(36) NOT NULL,
    roomId CHAR(36) NOT NULL,
    nickname TEXT NOT NULL,
    joinedAt DATETIME NOT NULL,
    totalScore INT NOT NULL,
    PRIMARY KEY (playerId),
    UNIQUE KEY uq_Player_playerId_roomId (playerId, roomId),
    CONSTRAINT fk_Player_Room
        FOREIGN KEY (roomId) REFERENCES Room (roomId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Answer (
    answerId CHAR(36) NOT NULL,
    playerId CHAR(36) NOT NULL,
    questionId CHAR(36) NOT NULL,
    value TEXT NOT NULL,
    isCorrect BOOLEAN NOT NULL,
    responseTimeMs INT NOT NULL,
    pointsAwarded INT NOT NULL,
    PRIMARY KEY (answerId),
    CONSTRAINT fk_Answer_Player
        FOREIGN KEY (playerId) REFERENCES Player (playerId),
    CONSTRAINT fk_Answer_Question
        FOREIGN KEY (questionId) REFERENCES Question (questionId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Score (
    playerId CHAR(36) NOT NULL,
    roomId CHAR(36) NOT NULL,
    totalPoints INT NOT NULL,
    `rank` INT NOT NULL,
    PRIMARY KEY (playerId, roomId),
    CONSTRAINT fk_Score_PlayerRoom
        FOREIGN KEY (playerId, roomId)
        REFERENCES Player (playerId, roomId),
    CONSTRAINT fk_Score_Room
        FOREIGN KEY (roomId) REFERENCES Room (roomId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;