-- Tarea 6 - Reporte post-evento: participacion y aciertos
-- El reporte usa las tablas Room, Player y Answer del schema.sql.
-- Sintaxis agregada compatible con MySQL 8.0+ y PostgreSQL.

-- 1. Resumen por sala.
-- Participacion = jugadores registrados con al menos una respuesta / jugadores registrados.
-- Porcentaje de acierto = respuestas correctas / respuestas registradas.
WITH player_metrics AS (
    SELECT
        p.roomId,
        p.playerId,
        COUNT(a.answerId) AS submittedAnswers,
        SUM(CASE WHEN a.isCorrect THEN 1 ELSE 0 END) AS correctAnswers,
        SUM(CASE WHEN NOT a.isCorrect THEN 1 ELSE 0 END) AS incorrectAnswers
    FROM Player p
    LEFT JOIN Answer a
        ON a.playerId = p.playerId
    GROUP BY p.roomId, p.playerId
)
SELECT
    r.roomId,
    r.pin,
    r.status,
    COUNT(pm.playerId) AS registeredPlayers,
    SUM(CASE WHEN pm.submittedAnswers > 0 THEN 1 ELSE 0 END) AS participatingPlayers,
    COALESCE(
        ROUND(
            100.0 * SUM(CASE WHEN pm.submittedAnswers > 0 THEN 1 ELSE 0 END)
            / NULLIF(COUNT(pm.playerId), 0),
            2
        ),
        0
    ) AS participationPercent,
    COALESCE(SUM(pm.submittedAnswers), 0) AS submittedAnswers,
    COALESCE(SUM(pm.correctAnswers), 0) AS correctAnswers,
    COALESCE(SUM(pm.incorrectAnswers), 0) AS incorrectAnswers,
    COALESCE(
        ROUND(
            100.0 * SUM(pm.correctAnswers)
            / NULLIF(SUM(pm.submittedAnswers), 0),
            2
        ),
        0
    ) AS accuracyPercent
FROM Room r
LEFT JOIN player_metrics pm
    ON pm.roomId = r.roomId
GROUP BY r.roomId, r.pin, r.status
ORDER BY r.roomId ASC;

-- 2. Detalle por jugador, incluyendo quienes no enviaron respuestas.
SELECT
    r.roomId,
    r.pin,
    p.playerId,
    p.nickname,
    CASE
        WHEN COUNT(a.answerId) > 0 THEN 'PARTICIPO'
        ELSE 'SIN_RESPUESTAS'
    END AS participationStatus,
    COUNT(a.answerId) AS submittedAnswers,
    SUM(CASE WHEN a.isCorrect THEN 1 ELSE 0 END) AS correctAnswers,
    SUM(CASE WHEN NOT a.isCorrect THEN 1 ELSE 0 END) AS incorrectAnswers,
    COALESCE(
        ROUND(
            100.0 * SUM(CASE WHEN a.isCorrect THEN 1 ELSE 0 END)
            / NULLIF(COUNT(a.answerId), 0),
            2
        ),
        0
    ) AS accuracyPercent,
    ROUND(AVG(a.responseTimeMs), 2) AS averageResponseTimeMs
FROM Room r
JOIN Player p
    ON p.roomId = r.roomId
LEFT JOIN Answer a
    ON a.playerId = p.playerId
GROUP BY r.roomId, r.pin, p.playerId, p.nickname
ORDER BY r.roomId ASC, p.nickname ASC, p.playerId ASC;
