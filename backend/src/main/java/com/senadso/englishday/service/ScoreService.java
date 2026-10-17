package com.senadso.englishday.service;

import com.senadso.englishday.dto.LeaderboardEntryDto;
import com.senadso.englishday.dto.QuestionResultsResponse;
import com.senadso.englishday.model.Player;
import com.senadso.englishday.model.Question;
import com.senadso.englishday.model.Room;
import com.senadso.englishday.model.Score;
import com.senadso.englishday.model.ScoreId;
import com.senadso.englishday.repository.PlayerRepository;
import com.senadso.englishday.repository.QuestionRepository;
import com.senadso.englishday.repository.RoomRepository;
import com.senadso.englishday.repository.ScoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Servicio de lógica de negocio para el cálculo de puntajes y gestión de clasificaciones.
 * Implementa el algoritmo de puntuación dinámica (RF-09 / Contrato §5 / Bitácora #2)
 * y la emisión del leaderboard Top 5 a /topic/room/{roomId}/results (RF-10 / Contrato §4.5).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ScoreService {

    /**
     * Puntos base por respuesta correcta fijados en Contrato §5 y Bitácora Decisión #2.
     */
    public static final int BASE_POINTS = 1000;

    private final ScoreRepository scoreRepository;
    private final PlayerRepository playerRepository;
    private final QuestionRepository questionRepository;
    private final RoomRepository roomRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Calcula los puntos otorgados según la fórmula de velocidad y acierto (RF-09 / Contrato §5):
     * pointsAwarded = round(BASE_POINTS * (isCorrect ? 1 : 0) * max(0.5, 1 - (responseTimeMs / (timeLimitSeconds * 1000))))
     *
     * @param isCorrect Indica si la respuesta del aprendiz fue validada como correcta.
     * @param responseTimeMs Tiempo transcurrido en responder en milisegundos.
     * @param timeLimitSeconds Tiempo límite configurado para la pregunta (en segundos).
     * @return Puntos calculados (entre 0 y 1000).
     */
    public int calculatePoints(boolean isCorrect, int responseTimeMs, Integer timeLimitSeconds) {
        if (!isCorrect) {
            return 0;
        }

        int limitSec = (timeLimitSeconds != null && timeLimitSeconds > 0) ? timeLimitSeconds : 15;
        double limitMs = limitSec * 1000.0;
        double timeTaken = Math.max(0.0, (double) responseTimeMs);

        // Bonificación por velocidad: se degrada linealmente hasta un piso mínimo de 0.5 (500 pts)
        double speedFactor = Math.max(0.5, 1.0 - (timeTaken / limitMs));

        return (int) Math.round(BASE_POINTS * speedFactor);
    }

    /**
     * Actualiza el puntaje acumulado de un jugador tanto en su entidad Player como en la entidad Score.
     *
     * @param player Aprendiz que respondió.
     * @param room Sala en la que participa.
     * @param pointsAwarded Puntos obtenidos en la última respuesta.
     * @return Puntaje acumulado total actualizado del jugador.
     */
    @Transactional
    public int updatePlayerScore(Player player, Room room, int pointsAwarded) {
        // 1. Acumular en la entidad Player
        int currentScore = (player.getTotalScore() != null) ? player.getTotalScore() : 0;
        int newTotal = currentScore + pointsAwarded;
        player.setTotalScore(newTotal);
        playerRepository.save(player);

        // 2. Sincronizar en la entidad Score de la sala
        Score score = scoreRepository.findById_PlayerIdAndId_RoomId(player.getPlayerId(), room.getRoomId())
                .orElseGet(() -> Score.builder()
                        .id(new ScoreId(player.getPlayerId(), room.getRoomId()))
                        .player(player)
                        .room(room)
                        .totalPoints(0)
                        .rank(0)
                        .build());

        score.setTotalPoints(newTotal);
        scoreRepository.save(score);

        return newTotal;
    }

    /**
     * Obtiene el Top 5 de aprendices con mayor puntaje en la sala para el leaderboard (RF-10).
     *
     * @param roomId Identificador UUID de la sala.
     * @return Lista de hasta 5 participantes ordenados descendentemente por puntaje.
     */
    @Transactional(readOnly = true)
    public List<LeaderboardEntryDto> getTop5Leaderboard(String roomId) {
        return playerRepository.findTop5ByRoom_RoomIdOrderByTotalScoreDesc(roomId)
                .stream()
                .map(player -> LeaderboardEntryDto.builder()
                        .nickname(player.getNickname())
                        .score(player.getTotalScore())
                        .build())
                .toList();
    }

    /**
     * Recalcula los puestos (rank) de todos los jugadores de la sala en la tabla Score.
     */
    @Transactional
    public void updateRoomRanks(String roomId) {
        List<Score> scores = scoreRepository.findByRoom_RoomIdOrderByTotalPointsDesc(roomId);
        int currentRank = 1;
        for (Score score : scores) {
            score.setRank(currentRank++);
        }
        scoreRepository.saveAll(scores);
    }

    /**
     * Cierra la pregunta actual, actualiza los rankings de la sala y difunde los resultados
     * y la respuesta correcta al canal STOMP /topic/room/{roomId}/results (RF-10 / Contrato §4.5).
     *
     * @param roomId Identificador UUID de la sala.
     * @param questionId Identificador UUID de la pregunta (opcional; si es null, toma la actual de la sala).
     * @return Payload de resultados emitido.
     */
    @Transactional
    public QuestionResultsResponse broadcastQuestionResults(String roomId, String questionId) {
        // 1. Obtener la pregunta finalizada
        Question question;
        if (questionId != null && !questionId.isBlank()) {
            question = questionRepository.findById(questionId)
                    .orElseThrow(() -> new IllegalArgumentException("Pregunta no encontrada: " + questionId));
        } else {
            Room room = roomRepository.findById(roomId)
                    .orElseThrow(() -> new IllegalArgumentException("Sala no encontrada: " + roomId));
            question = questionRepository.findByOrder(room.getCurrentQuestionIndex())
                    .orElseThrow(() -> new IllegalStateException("Pregunta actual no configurada para la sala"));
        }

        // 2. Actualizar posiciones (ranks) en la base de datos
        updateRoomRanks(roomId);

        // 3. Obtener el Top 5 ordenado
        List<LeaderboardEntryDto> top5 = getTop5Leaderboard(roomId);

        // 4. Construir el payload según Contrato §4.5
        QuestionResultsResponse response = QuestionResultsResponse.builder()
                .correctAnswer(question.getCorrectAnswer())
                .top5(top5)
                .build();

        // 5. Emitir por WebSocket STOMP
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/results", response);
        log.info("Leaderboard Top 5 emitido en /topic/room/{}/results para pregunta '{}' con {} participantes",
                roomId, question.getPrompt(), top5.size());

        return response;
    }
}
