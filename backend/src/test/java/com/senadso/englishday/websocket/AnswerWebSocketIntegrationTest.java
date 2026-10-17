package com.senadso.englishday.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.TextNode;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.senadso.englishday.dto.CreateRoomResponse;
import com.senadso.englishday.dto.JoinRoomRequest;
import com.senadso.englishday.dto.JoinRoomResponse;
import com.senadso.englishday.dto.SubmitAnswerRequest;
import com.senadso.englishday.model.Answer;
import com.senadso.englishday.model.Question;
import com.senadso.englishday.model.enums.QuestionType;
import com.senadso.englishday.repository.AnswerRepository;
import com.senadso.englishday.repository.QuestionRepository;
import com.senadso.englishday.service.RoomService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Prueba de integración para la Tarea 8:
 * Envío de respuestas vía WebSocket STOMP al destino /app/room/{roomId}/answer.
 * Valida la recepción, procesamiento y persistencia de Answer en la base de datos (CU-04).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class AnswerWebSocketIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private RoomService roomService;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private AnswerRepository answerRepository;

    private WebSocketStompClient stompClient;

    @BeforeEach
    void setUp() {
        stompClient = new WebSocketStompClient(new StandardWebSocketClient());

        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        MappingJackson2MessageConverter messageConverter = new MappingJackson2MessageConverter();
        messageConverter.setObjectMapper(objectMapper);
        stompClient.setMessageConverter(messageConverter);
    }

    @Test
    @DisplayName("Tarea 8 / CU-04: Enviar respuesta por /app/room/{roomId}/answer persiste la entidad Answer con isCorrect=true")
    void testSubmitAnswerViaWebSocket() throws Exception {
        // 1. Crear pregunta
        questionRepository.deleteAll();
        answerRepository.deleteAll();

        Question question = Question.builder()
                .type(QuestionType.MULTIPLE_CHOICE)
                .prompt("Choose the correct past tense of \"go\".")
                .options(List.of("goed", "went", "gone", "going"))
                .correctAnswer("went")
                .timeLimitSeconds(15)
                .order(1)
                .build();
        Question savedQuestion = questionRepository.save(question);

        // 2. Crear sala y unir jugador
        CreateRoomResponse room = roomService.createRoom();
        JoinRoomResponse player = roomService.joinRoom(room.getPin(), JoinRoomRequest.builder().nickname("camilo_dev").build());

        // Iniciar la partida
        roomService.startGame(room.getRoomId());

        // 3. Conectar cliente WebSocket STOMP
        String wsUrl = "ws://localhost:" + port + "/ws-englishday";
        CompletableFuture<StompSession> sessionFuture = new CompletableFuture<>();

        stompClient.connectAsync(wsUrl, new StompSessionHandlerAdapter() {
            @Override
            public void afterConnected(StompSession session, StompHeaders connectedHeaders) {
                sessionFuture.complete(session);
            }
        });

        StompSession stompSession = sessionFuture.get(5, TimeUnit.SECONDS);
        assertThat(stompSession.isConnected()).isTrue();

        // 4. Enviar respuesta por /app/room/{roomId}/answer
        SubmitAnswerRequest answerRequest = SubmitAnswerRequest.builder()
                .playerId(player.getPlayerId())
                .questionId(savedQuestion.getQuestionId())
                .value(new TextNode("went"))
                .clientTimestamp(LocalDateTime.now(ZoneOffset.UTC))
                .build();

        String destination = "/app/room/" + room.getRoomId() + "/answer";
        stompSession.send(destination, answerRequest);

        // 5. Esperar procesamiento asíncrono y verificar en la BD
        Thread.sleep(1000);

        Optional<Answer> savedAnswerOpt = answerRepository.findByPlayer_PlayerIdAndQuestion_QuestionId(
                player.getPlayerId(), savedQuestion.getQuestionId()
        );

        assertThat(savedAnswerOpt).isPresent();
        Answer savedAnswer = savedAnswerOpt.get();
        assertThat(savedAnswer.getIsCorrect()).isTrue();
        assertThat(savedAnswer.getValue()).isEqualTo("went");
        assertThat(savedAnswer.getPlayer().getPlayerId()).isEqualTo(player.getPlayerId());

        // 6. Verificar prevención de duplicados: enviar nuevamente
        stompSession.send(destination, answerRequest);
        Thread.sleep(500);

        List<Answer> answersForQuestion = answerRepository.findByQuestion_QuestionId(savedQuestion.getQuestionId());
        assertThat(answersForQuestion).hasSize(1);

        stompSession.disconnect();
    }
}
