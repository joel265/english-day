package com.senadso.englishday.service;

import com.senadso.englishday.dto.AnswerSegmentDto;
import com.senadso.englishday.dto.LeaderboardEntryDto;
import com.senadso.englishday.dto.PlayerRoundVerdictDto;
import com.senadso.englishday.dto.PodiumResponse;
import com.senadso.englishday.dto.QuestionResultsResponse;
import com.senadso.englishday.exception.RoomNotFoundException;
import com.senadso.englishday.model.Answer;
import com.senadso.englishday.model.Player;
import com.senadso.englishday.model.Question;
import com.senadso.englishday.model.Room;
import com.senadso.englishday.model.Score;
import com.senadso.englishday.model.ScoreId;
import com.senadso.englishday.model.enums.RoomStatus;
import com.senadso.englishday.repository.AnswerRepository;
import com.senadso.englishday.repository.PlayerRepository;
import com.senadso.englishday.repository.QuestionRepository;
import com.senadso.englishday.repository.RoomRepository;
import com.senadso.englishday.repository.ScoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Servicio de lógica de negocio para el cálculo de puntajes y gestión de clasificaciones.
 * Implementa el algoritmo de puntuación dinámica (RF-09 / Contrato §5 / Bitácora #2)
 * y la emisión del leaderboard Top 5 a /topic/room/{roomId}/results (RF-10 / Contrato §4.5).
 */
@Service
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
    private final AnswerRepository answerRepository;
    private final RoomService roomService;
    private final SimpMessagingTemplate messagingTemplate;

    @org.springframework.beans.factory.annotation.Autowired
    public ScoreService(
            ScoreRepository scoreRepository,
            PlayerRepository playerRepository,
            QuestionRepository questionRepository,
            RoomRepository roomRepository,
            AnswerRepository answerRepository,
            RoomService roomService,
            SimpMessagingTemplate messagingTemplate) {
        this.scoreRepository = scoreRepository;
        this.playerRepository = playerRepository;
        this.questionRepository = questionRepository;
        this.roomRepository = roomRepository;
        this.answerRepository = answerRepository;
        this.roomService = roomService;
        this.messagingTemplate = messagingTemplate;
    }

    public ScoreService(
            ScoreRepository scoreRepository,
            PlayerRepository playerRepository,
            QuestionRepository questionRepository,
            RoomRepository roomRepository,
            SimpMessagingTemplate messagingTemplate) {
        this(scoreRepository, playerRepository, questionRepository, roomRepository, null, null, messagingTemplate);
    }

    /**
     * Calcula los puntos otorgados según la fórmula de velocidad y acierto (RF-09 / Contrato §5):
     * pointsAwarded = round(BASE_POINTS * (isCorrect ? 1 : 0) * max(0.5, 1 - (responseTimeMs / (timeLimitSeconds * 1000))))
     */
    public int calculatePoints(boolean isCorrect, int responseTimeMs, Integer timeLimitSeconds) {
        if (!isCorrect) {
            return 0;
        }

        int limitSec = (timeLimitSeconds != null && timeLimitSeconds > 0) ? timeLimitSeconds : 15;
        double limitMs = limitSec * 1000.0;
        double timeTaken = Math.max(0.0, (double) responseTimeMs);

        double speedFactor = Math.max(0.5, 1.0 - (timeTaken / limitMs));

        return (int) Math.round(BASE_POINTS * speedFactor);
    }

    /**
     * Actualiza el puntaje acumulado de un jugador tanto en su entidad Player como en la entidad Score.
     */
    @Transactional
    public int updatePlayerScore(Player player, Room room, int pointsAwarded) {
        int currentScore = (player.getTotalScore() != null) ? player.getTotalScore() : 0;
        int newTotal = currentScore + pointsAwarded;
        player.setTotalScore(newTotal);
        playerRepository.save(player);

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
     */
    @Transactional(readOnly = true)
    public List<LeaderboardEntryDto> getTop5Leaderboard(String roomId) {
        return playerRepository.findTop5ByRoom_RoomIdOrderByTotalScoreDesc(roomId)
                .stream()
                .map(player -> LeaderboardEntryDto.builder()
                        .nickname(player.getNickname())
                        .avatar(player.getAvatar())
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
     * Cierra la pregunta actual, actualiza los rankings de la sala y difunde los resultados,
     * la respuesta correcta y los veredictos individuales al canal STOMP /topic/room/{roomId}/results.
     */
    @Transactional
    public QuestionResultsResponse broadcastQuestionResults(String roomId, String questionId) {
        Question question;
        if (questionId != null && !questionId.isBlank()) {
            question = questionRepository.findById(questionId)
                    .orElseGet(() -> roomService != null
                            ? roomService.getCurrentQuestionForRoom(roomId)
                            : questionRepository.findByOrder(1).orElseThrow());
        } else if (roomService != null) {
            question = roomService.getCurrentQuestionForRoom(roomId);
        } else {
            Room room = roomRepository.findById(roomId)
                    .orElseThrow(() -> new IllegalArgumentException("Sala no encontrada: " + roomId));
            question = questionRepository.findByOrder(room.getCurrentQuestionIndex())
                    .orElseThrow(() -> new IllegalStateException("Pregunta actual no configurada para la sala"));
        }

        updateRoomRanks(roomId);

        List<LeaderboardEntryDto> top5 = getTop5Leaderboard(roomId);

        Map<String, PlayerRoundVerdictDto> playerVerdicts = new LinkedHashMap<>();
        if (answerRepository != null) {
            List<Answer> roundAnswers = answerRepository.findByPlayer_Room_RoomIdAndQuestion_QuestionId(
                    roomId,
                    question.getQuestionId()
            );
            for (Answer ans : roundAnswers) {
                Player p = ans.getPlayer();
                if (p != null) {
                    boolean answerCorrect = Boolean.TRUE.equals(ans.getIsCorrect());
                    List<AnswerSegmentDto> segments =
                            AnswerFeedbackBuilder.buildSegments(question, ans.getValue(), answerCorrect);
                    playerVerdicts.put(
                            p.getPlayerId(),
                            PlayerRoundVerdictDto.builder()
                                    .playerId(p.getPlayerId())
                                    .nickname(p.getNickname())
                                    .avatar(p.getAvatar())
                                    .submittedValue(ans.getValue())
                                    .isCorrect(answerCorrect)
                                    .pointsAwarded(ans.getPointsAwarded() != null ? ans.getPointsAwarded() : 0)
                                    .totalScore(p.getTotalScore() != null ? p.getTotalScore() : 0)
                                    .segments(segments)
                                    .hints(AnswerFeedbackBuilder.buildHints(segments))
                                    .build()
                    );
                }
            }
        }

        String primaryCorrectAnswer = question.getCorrectAnswer() != null
                ? question.getCorrectAnswer().split("\\|")[0].trim()
                : "";

        QuestionResultsResponse response = QuestionResultsResponse.builder()
                .questionId(question.getQuestionId())
                .correctAnswer(primaryCorrectAnswer)
                .top5(top5)
                .playerVerdicts(playerVerdicts)
                .explanation(AnswerFeedbackBuilder.buildExplanation(question))
                .build();

        if (roomService != null) {
            roomService.recordQuestionResults(roomId, response);
        }

        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/results", response);
        log.info("Leaderboard Top 5 emitido en /topic/room/{}/results para pregunta '{}' con {} participantes",
                roomId, question.getPrompt(), top5.size());

        return response;
    }

    /**
     * Obtiene el Top 3 de aprendices con mayor puntaje en la sala para el podio final (RF-10 / CU-06).
     */
    @Transactional(readOnly = true)
    public List<LeaderboardEntryDto> getTop3Podium(String roomId) {
        return playerRepository.findTop3ByRoom_RoomIdOrderByTotalScoreDesc(roomId)
                .stream()
                .map(player -> LeaderboardEntryDto.builder()
                        .nickname(player.getNickname())
                        .avatar(player.getAvatar())
                        .score(player.getTotalScore())
                        .build())
                .toList();
    }

    /**
     * Obtiene el podio final actual de la sala (Top 3) para la consulta REST (RF-10 / CU-06).
     */
    @Transactional(readOnly = true)
    public PodiumResponse getPodiumResults(String roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RoomNotFoundException("Sala no encontrada"));

        List<LeaderboardEntryDto> top3 = getTop3Podium(roomId);
        int totalPlayers = playerRepository.findByRoom_RoomId(roomId).size();

        return PodiumResponse.builder()
                .roomId(room.getRoomId())
                .status(room.getStatus())
                .top3(top3)
                .totalPlayers(totalPlayers)
                .timestamp(LocalDateTime.now(ZoneOffset.UTC))
                .build();
    }

    /**
     * Finaliza oficialmente la partida y emite el podio final vía WebSocket STOMP.
     */
    @Transactional
    public PodiumResponse finalizeGameAndBroadcastPodium(String roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RoomNotFoundException("Sala no encontrada"));

        room.setStatus(RoomStatus.FINISHED);
        Room savedRoom = roomRepository.save(room);

        updateRoomRanks(roomId);

        List<LeaderboardEntryDto> top3 = getTop3Podium(roomId);
        int totalPlayers = playerRepository.findByRoom_RoomId(roomId).size();

        PodiumResponse podiumResponse = PodiumResponse.builder()
                .roomId(savedRoom.getRoomId())
                .status(savedRoom.getStatus())
                .top3(top3)
                .totalPlayers(totalPlayers)
                .timestamp(LocalDateTime.now(ZoneOffset.UTC))
                .build();

        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/status",
                Map.of("status", RoomStatus.FINISHED.name()));

        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/podium", podiumResponse);
        log.info("Podio final emitido a /topic/room/{}/podium con {} jugadores clasificados", roomId, top3.size());

        return podiumResponse;
    }
}
