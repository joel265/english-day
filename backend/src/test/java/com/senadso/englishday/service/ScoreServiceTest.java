package com.senadso.englishday.service;

import com.senadso.englishday.dto.LeaderboardEntryDto;
import com.senadso.englishday.dto.PodiumResponse;
import com.senadso.englishday.dto.QuestionResultsResponse;
import com.senadso.englishday.model.enums.RoomStatus;
import com.senadso.englishday.model.Player;
import com.senadso.englishday.model.Question;
import com.senadso.englishday.model.Room;
import com.senadso.englishday.model.Score;
import com.senadso.englishday.model.enums.QuestionType;
import com.senadso.englishday.repository.PlayerRepository;
import com.senadso.englishday.repository.QuestionRepository;
import com.senadso.englishday.repository.RoomRepository;
import com.senadso.englishday.repository.ScoreRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Pruebas unitarias para el algoritmo de puntuación dinámica (RF-09 / CP-10)
 * y la emisión del leaderboard Top 5 (RF-10 / CU-06).
 */
@ExtendWith(MockitoExtension.class)
class ScoreServiceTest {

    @Mock
    private ScoreRepository scoreRepository;

    @Mock
    private PlayerRepository playerRepository;

    @Mock
    private QuestionRepository questionRepository;

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    private ScoreService scoreService;

    @BeforeEach
    void setUp() {
        scoreService = new ScoreService(
                scoreRepository,
                playerRepository,
                questionRepository,
                roomRepository,
                messagingTemplate
        );
    }

    @Test
    @DisplayName("RF-09: Respuesta incorrecta siempre otorga 0 puntos")
    void testIncorrectAnswerGivesZeroPoints() {
        int points = scoreService.calculatePoints(false, 1500, 15);
        assertThat(points).isZero();
    }

    @Test
    @DisplayName("RF-09: Respuesta correcta instantánea (0 ms) otorga puntaje máximo (1000 pts)")
    void testInstantAnswerGivesMaxPoints() {
        int points = scoreService.calculatePoints(true, 0, 15);
        assertThat(points).isEqualTo(1000);
    }

    @Test
    @DisplayName("RF-09 / CP-10: Jugador rápido (2s) obtiene mayor puntaje que jugador lento (10s)")
    void testDynamicScoreBySpeed() {
        int scoreFast = scoreService.calculatePoints(true, 2000, 15);  // ~867 pts
        int scoreSlow = scoreService.calculatePoints(true, 10000, 15); // 500 pts (piso mín)

        assertThat(scoreFast).isGreaterThan(scoreSlow);
        assertThat(scoreFast).isEqualTo(867);
        assertThat(scoreSlow).isEqualTo(500);
    }

    @Test
    @DisplayName("RF-09: Respuesta en el tiempo límite o excedida respeta el piso mínimo de 500 pts")
    void testScoreFloorAtTimeLimit() {
        int pointsAtLimit = scoreService.calculatePoints(true, 15000, 15);
        int pointsOverLimit = scoreService.calculatePoints(true, 25000, 15);

        assertThat(pointsAtLimit).isEqualTo(500);
        assertThat(pointsOverLimit).isEqualTo(500);
    }

    @Test
    @DisplayName("RF-09: Actualización acumulativa de puntaje en Player y entidad Score")
    void testUpdatePlayerScore() {
        Room room = Room.builder().roomId("r-1").build();
        Player player = Player.builder()
                .playerId("p-1")
                .nickname("camilo_dev")
                .totalScore(1000)
                .build();

        when(scoreRepository.findById_PlayerIdAndId_RoomId("p-1", "r-1"))
                .thenReturn(Optional.empty());

        int updated = scoreService.updatePlayerScore(player, room, 850);

        assertThat(updated).isEqualTo(1850);
        assertThat(player.getTotalScore()).isEqualTo(1850);
        verify(playerRepository).save(player);

        ArgumentCaptor<Score> scoreCaptor = ArgumentCaptor.forClass(Score.class);
        verify(scoreRepository).save(scoreCaptor.capture());
        Score savedScore = scoreCaptor.getValue();
        assertThat(savedScore.getTotalPoints()).isEqualTo(1850);
        assertThat(savedScore.getId().getPlayerId()).isEqualTo("p-1");
        assertThat(savedScore.getId().getRoomId()).isEqualTo("r-1");
    }

    @Test
    @DisplayName("RF-10 / Contrato §4.5: Emisión de resultados a /topic/room/{roomId}/results con Top 5 y correctAnswer")
    void testBroadcastQuestionResults() {
        String roomId = "room-uuid-123";
        String questionId = "question-uuid-456";

        Question question = Question.builder()
                .questionId(questionId)
                .prompt("Choose past tense of go")
                .type(QuestionType.MULTIPLE_CHOICE)
                .correctAnswer("went")
                .timeLimitSeconds(15)
                .order(1)
                .build();

        when(questionRepository.findById(questionId)).thenReturn(Optional.of(question));

        List<Player> topPlayers = List.of(
                Player.builder().playerId("p1").nickname("camilo_dev").totalScore(4200).build(),
                Player.builder().playerId("p2").nickname("laura_eng").totalScore(3950).build()
        );
        when(playerRepository.findTop5ByRoom_RoomIdOrderByTotalScoreDesc(roomId)).thenReturn(topPlayers);

        QuestionResultsResponse response = scoreService.broadcastQuestionResults(roomId, questionId);

        assertThat(response).isNotNull();
        assertThat(response.getCorrectAnswer()).isEqualTo("went");
        assertThat(response.getTop5()).hasSize(2);
        assertThat(response.getTop5().get(0).getNickname()).isEqualTo("camilo_dev");
        assertThat(response.getTop5().get(0).getScore()).isEqualTo(4200);

        verify(messagingTemplate).convertAndSend(
                eq("/topic/room/" + roomId + "/results"),
                eq(response)
        );
    }

    @Test
    @DisplayName("Tarea 11 / RF-10: getTop3Podium retorna exactamente los 3 mejores jugadores ordenados")
    void testGetTop3Podium() {
        String roomId = "room-test-11";
        List<Player> top3Players = List.of(
                Player.builder().playerId("p1").nickname("camilo_dev").totalScore(5000).build(),
                Player.builder().playerId("p2").nickname("laura_eng").totalScore(4500).build(),
                Player.builder().playerId("p3").nickname("andres_code").totalScore(4000).build()
        );
        when(playerRepository.findTop3ByRoom_RoomIdOrderByTotalScoreDesc(roomId)).thenReturn(top3Players);

        List<LeaderboardEntryDto> podium = scoreService.getTop3Podium(roomId);

        assertThat(podium).hasSize(3);
        assertThat(podium.get(0).getNickname()).isEqualTo("camilo_dev");
        assertThat(podium.get(0).getScore()).isEqualTo(5000);
        assertThat(podium.get(1).getNickname()).isEqualTo("laura_eng");
        assertThat(podium.get(1).getScore()).isEqualTo(4500);
        assertThat(podium.get(2).getNickname()).isEqualTo("andres_code");
        assertThat(podium.get(2).getScore()).isEqualTo(4000);
    }

    @Test
    @DisplayName("Tarea 11 / CU-06: getPodiumResults retorna DTO completo con Top 3 y total de jugadores")
    void testGetPodiumResults() {
        String roomId = "room-test-11";
        Room room = Room.builder().roomId(roomId).status(RoomStatus.FINISHED).build();
        when(roomRepository.findById(roomId)).thenReturn(Optional.of(room));

        List<Player> top3Players = List.of(
                Player.builder().playerId("p1").nickname("camilo_dev").totalScore(5000).build()
        );
        when(playerRepository.findTop3ByRoom_RoomIdOrderByTotalScoreDesc(roomId)).thenReturn(top3Players);
        when(playerRepository.findByRoom_RoomId(roomId)).thenReturn(top3Players);

        PodiumResponse response = scoreService.getPodiumResults(roomId);

        assertThat(response).isNotNull();
        assertThat(response.getRoomId()).isEqualTo(roomId);
        assertThat(response.getStatus()).isEqualTo(RoomStatus.FINISHED);
        assertThat(response.getTop3()).hasSize(1);
        assertThat(response.getTotalPlayers()).isEqualTo(1);
        assertThat(response.getTimestamp()).isNotNull();
    }

    @Test
    @DisplayName("Tarea 11 / RF-10 / CP-11: finalizeGameAndBroadcastPodium actualiza a FINISHED y emite a /topic/room/{roomId}/podium")
    void testFinalizeGameAndBroadcastPodium() {
        String roomId = "room-test-11";
        Room room = Room.builder().roomId(roomId).status(RoomStatus.QUESTION_IN_PROGRESS).build();
        when(roomRepository.findById(roomId)).thenReturn(Optional.of(room));
        when(roomRepository.save(any(Room.class))).thenAnswer(invocation -> invocation.getArgument(0));

        List<Player> top3Players = List.of(
                Player.builder().playerId("p1").nickname("gold_winner").totalScore(6000).build(),
                Player.builder().playerId("p2").nickname("silver_winner").totalScore(5500).build(),
                Player.builder().playerId("p3").nickname("bronze_winner").totalScore(4800).build()
        );
        when(playerRepository.findTop3ByRoom_RoomIdOrderByTotalScoreDesc(roomId)).thenReturn(top3Players);
        when(playerRepository.findByRoom_RoomId(roomId)).thenReturn(top3Players);

        PodiumResponse response = scoreService.finalizeGameAndBroadcastPodium(roomId);

        assertThat(response).isNotNull();
        assertThat(response.getRoomId()).isEqualTo(roomId);
        assertThat(response.getStatus()).isEqualTo(RoomStatus.FINISHED);
        assertThat(response.getTop3()).hasSize(3);

        // Validar emisión de podio a /topic/room/{roomId}/podium
        verify(messagingTemplate).convertAndSend(
                eq("/topic/room/" + roomId + "/podium"),
                eq(response)
        );

        // Validar emisión de estado a /topic/room/{roomId}/status
        verify(messagingTemplate).convertAndSend(
                eq("/topic/room/" + roomId + "/status"),
                eq(java.util.Map.of("status", "FINISHED"))
        );
    }
}
