package com.senadso.englishday.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.senadso.englishday.dto.CreateRoomResponse;
import com.senadso.englishday.dto.QuestionBroadcastResponse;
import com.senadso.englishday.model.Question;
import com.senadso.englishday.model.enums.QuestionType;
import com.senadso.englishday.model.enums.RoomStatus;
import com.senadso.englishday.repository.QuestionRepository;
import com.senadso.englishday.service.RoomService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.StompFrameHandler;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

import java.lang.reflect.Field;
import java.lang.reflect.Type;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Pruebas de integración para la Tarea 7:
 * POST /api/rooms/{roomId}/start + topic /topic/room/{roomId}/question.
 * Valida CU-03 / RF-08 y la regla crítica anti-trampas (ausencia de correctAnswer).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class QuestionWebSocketIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private RoomService roomService;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private com.senadso.englishday.repository.AnswerRepository answerRepository;

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
    @DisplayName("Tarea 7 / CU-03 / RF-08: Iniciar partida emite pregunta y timer por WebSocket sin correctAnswer")
    void testStartGameBroadcastsQuestion() throws Exception {
        // 1. Precondición: Limpiar tablas y crear una pregunta semilla con order = 1
        answerRepository.deleteAll();
        questionRepository.deleteAll();
        Question question = Question.builder()
                .type(QuestionType.MULTIPLE_CHOICE)
                .prompt("Choose the correct past tense of \"go\".")
                .options(List.of("goed", "went", "gone", "going"))
                .correctAnswer("went")
                .timeLimitSeconds(15)
                .order(1)
                .build();
        questionRepository.save(question);

        // 2. Crear la sala en estado WAITING_LOBBY
        CreateRoomResponse room = roomService.createRoom();
        String roomId = room.getRoomId();

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

        // 4. Suscribirse a /topic/room/{roomId}/question
        CompletableFuture<QuestionBroadcastResponse> questionFuture = new CompletableFuture<>();
        String questionTopic = "/topic/room/" + roomId + "/question";

        stompSession.subscribe(questionTopic, new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return QuestionBroadcastResponse.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                questionFuture.complete((QuestionBroadcastResponse) payload);
            }
        });

        // 5. Suscribirse a /topic/room/{roomId}/status
        CompletableFuture<Map<String, Object>> statusFuture = new CompletableFuture<>();
        String statusTopic = "/topic/room/" + roomId + "/status";

        stompSession.subscribe(statusTopic, new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return Map.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                @SuppressWarnings("unchecked")
                Map<String, Object> map = (Map<String, Object>) payload;
                statusFuture.complete(map);
            }
        });

        // Breve pausa para asegurar el registro de las suscripciones en el broker
        Thread.sleep(500);

        // 6. El moderador inicia la partida (POST /api/rooms/{roomId}/start)
        var startResponse = roomService.startGame(roomId);
        assertThat(startResponse.getStatus()).isEqualTo(RoomStatus.QUESTION_IN_PROGRESS);

        // 7. Validar mensaje en /topic/room/{roomId}/question
        QuestionBroadcastResponse broadcastResponse = questionFuture.get(5, TimeUnit.SECONDS);
        assertThat(broadcastResponse).isNotNull();
        assertThat(broadcastResponse.getType()).isEqualTo(QuestionType.MULTIPLE_CHOICE);
        assertThat(broadcastResponse.getPrompt()).isEqualTo("Choose the correct past tense of \"go\".");
        assertThat(broadcastResponse.getOptions()).containsExactly("goed", "went", "gone", "going");
        assertThat(broadcastResponse.getTimeLimitSeconds()).isEqualTo(15);
        assertThat(broadcastResponse.getOrder()).isEqualTo(1);
        assertThat(broadcastResponse.getServerTimestamp()).isNotNull();

        // REGLA CRÍTICA DE SEGURIDAD (Contrato §1 y §4.3): Validar que el DTO no expone el campo correctAnswer
        List<String> fieldNames = Arrays.stream(QuestionBroadcastResponse.class.getDeclaredFields())
                .map(Field::getName)
                .toList();
        assertThat(fieldNames).doesNotContain("correctAnswer");

        // 8. Validar mensaje en /topic/room/{roomId}/status
        Map<String, Object> statusMap = statusFuture.get(5, TimeUnit.SECONDS);
        assertThat(statusMap).containsEntry("status", "QUESTION_IN_PROGRESS");

        stompSession.disconnect();
    }
}
