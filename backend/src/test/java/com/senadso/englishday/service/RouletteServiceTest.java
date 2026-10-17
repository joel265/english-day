package com.senadso.englishday.service;

import com.senadso.englishday.dto.RouletteResultResponse;
import com.senadso.englishday.model.Answer;
import com.senadso.englishday.model.Player;
import com.senadso.englishday.model.Question;
import com.senadso.englishday.model.Room;
import com.senadso.englishday.model.enums.QuestionType;
import com.senadso.englishday.model.enums.RoomStatus;
import com.senadso.englishday.repository.AnswerRepository;
import com.senadso.englishday.repository.PlayerRepository;
import com.senadso.englishday.repository.QuestionRepository;
import com.senadso.englishday.repository.RoomRepository;
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
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Pruebas unitarias para la ruleta de retroalimentación interactiva (RF-11 / CU-05).
 */
@ExtendWith(MockitoExtension.class)
class RouletteServiceTest {

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private PlayerRepository playerRepository;

    @Mock
    private QuestionRepository questionRepository;

    @Mock
    private AnswerRepository answerRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    private RouletteService rouletteService;

    @BeforeEach
    void setUp() {
        rouletteService = new RouletteService(
                roomRepository,
                playerRepository,
                questionRepository,
                answerRepository,
                messagingTemplate
        );
    }

    @Test
    @DisplayName("RF-11 / CU-05: Ruleta selecciona participante con respuesta registrada y cambia estado a ROULETTE_TIME")
    void testSpinRouletteWithAnsweredPlayer() {
        String roomId = "room-123";
        String questionId = "question-456";

        Room room = Room.builder()
                .roomId(roomId)
                .status(RoomStatus.QUESTION_IN_PROGRESS)
                .currentQuestionIndex(1)
                .build();

        Question question = Question.builder()
                .questionId(questionId)
                .type(QuestionType.MULTIPLE_CHOICE)
                .prompt("Choose past tense of go")
                .correctAnswer("went")
                .order(1)
                .build();

        Player player = Player.builder()
                .playerId("player-789")
                .nickname("camilo_dev")
                .room(room)
                .build();

        Answer answer = Answer.builder()
                .answerId("ans-1")
                .player(player)
                .question(question)
                .value("went")
                .isCorrect(true)
                .build();

        when(roomRepository.findById(roomId)).thenReturn(Optional.of(room));
        when(questionRepository.findByOrder(1)).thenReturn(Optional.of(question));
        when(playerRepository.findByRoom_RoomId(roomId)).thenReturn(List.of(player));
        when(answerRepository.findByPlayer_PlayerIdAndQuestion_QuestionId("player-789", questionId))
                .thenReturn(Optional.of(answer));

        RouletteResultResponse response = rouletteService.spinRoulette(roomId, null);

        assertThat(response).isNotNull();
        assertThat(response.getRoomId()).isEqualTo(roomId);
        assertThat(response.getPlayerId()).isEqualTo("player-789");
        assertThat(response.getNickname()).isEqualTo("camilo_dev");
        assertThat(response.getQuestionId()).isEqualTo(questionId);
        assertThat(response.getValue()).isEqualTo("went");
        assertThat(response.getIsCorrect()).isTrue();
        assertThat(response.getTimestamp()).isNotNull();

        assertThat(room.getStatus()).isEqualTo(RoomStatus.ROULETTE_TIME);
        verify(roomRepository).save(room);

        // Verifica emisión en ambos canales
        verify(messagingTemplate).convertAndSend(eq("/topic/room/" + roomId + "/status"), anyMap());
        verify(messagingTemplate).convertAndSend(eq("/topic/room/" + roomId + "/roulette"), eq(response));
    }

    @Test
    @DisplayName("RF-11 / CU-05: Ruleta maneja participante conectado que no alcanzó a responder")
    void testSpinRouletteWithUnansweredPlayer() {
        String roomId = "room-123";
        String questionId = "question-456";

        Room room = Room.builder()
                .roomId(roomId)
                .status(RoomStatus.QUESTION_IN_PROGRESS)
                .currentQuestionIndex(1)
                .build();

        Question question = Question.builder()
                .questionId(questionId)
                .type(QuestionType.MULTIPLE_CHOICE)
                .correctAnswer("went")
                .order(1)
                .build();

        Player player = Player.builder()
                .playerId("player-999")
                .nickname("laura_eng")
                .room(room)
                .build();

        when(roomRepository.findById(roomId)).thenReturn(Optional.of(room));
        when(questionRepository.findByOrder(1)).thenReturn(Optional.of(question));
        when(playerRepository.findByRoom_RoomId(roomId)).thenReturn(List.of(player));
        when(answerRepository.findByPlayer_PlayerIdAndQuestion_QuestionId("player-999", questionId))
                .thenReturn(Optional.empty());

        RouletteResultResponse response = rouletteService.spinRoulette(roomId, null);

        assertThat(response).isNotNull();
        assertThat(response.getNickname()).isEqualTo("laura_eng");
        assertThat(response.getValue()).isNull();
        assertThat(response.getIsCorrect()).isFalse();
    }

    @Test
    @DisplayName("RF-11: Lanza excepción si la sala no tiene participantes")
    void testSpinRouletteEmptyRoomThrows() {
        String roomId = "room-123";

        Room room = Room.builder()
                .roomId(roomId)
                .status(RoomStatus.QUESTION_IN_PROGRESS)
                .currentQuestionIndex(1)
                .build();

        Question question = Question.builder().questionId("q1").order(1).build();

        when(roomRepository.findById(roomId)).thenReturn(Optional.of(room));
        when(questionRepository.findByOrder(1)).thenReturn(Optional.of(question));
        when(playerRepository.findByRoom_RoomId(roomId)).thenReturn(List.of());

        assertThatThrownBy(() -> rouletteService.spinRoulette(roomId, null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("No hay aprendices");
    }
}
