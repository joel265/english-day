-- Tarea 2 - Base de Datos
-- Bloque inicial: Room y Player
-- Nota: este script corresponde a la primera parte del modelo y se entrega
-- siguiendo el orden del Backlog de Base de Datos.

CREATE TABLE Room (
    roomId VARCHAR(36) NOT NULL,
    pin VARCHAR(6) NOT NULL,
    status VARCHAR(50) NOT NULL,
    currentQuestionIndex INT NOT NULL DEFAULT 0,
    createdAt DATETIME NOT NULL,
    PRIMARY KEY (roomId),
    UNIQUE (pin)
);

CREATE TABLE Player (
    playerId VARCHAR(36) NOT NULL,
    roomId VARCHAR(36) NOT NULL,
    nickname VARCHAR(255) NOT NULL,
    joinedAt DATETIME NOT NULL,
    totalScore INT NOT NULL DEFAULT 0,
    PRIMARY KEY (playerId),
    CONSTRAINT fk_player_room
        FOREIGN KEY (roomId) REFERENCES Room(roomId)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- Continuación pendiente:
-- Question, Answer y Score
-- Se entregarán cuando se confirme la siguiente parte de la tarea 2 del backlog.
