package com.senadso.englishday.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.TextNode;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.senadso.englishday.dto.CreateRoomResponse;
import com.senadso.englishday.dto.JoinRoomRequest;
import com.senadso.englishday.dto.JoinRoomResponse;
import com.senadso.englishday.dto.RouletteResultResponse;
import com.senadso.englishday.dto.SubmitAnswerRequest;
import com.senadso.englishday.model.Question;
import com.senadso.englishday.model.Room;
import com.senadso.englishday.model.enums.QuestionType;
import com.senadso.englishday.model.enums.RoomStatus;
import com.senadso.englishday.repository.AnswerRepository;
import com.senadso.englishday.repository.PlayerRepository;
import com.senadso.englishday.repository.QuestionRepository;
import com.senadso.englishday.repository.RoomRepository;
import com.senadso.englishday.repository.ScoreRepository;
import com.senadso.englishday.service.RoomService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.StompFrameHandler;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

import java.lang.reflect.Type;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Prueba de integración para la Tarea 10:
 * Endpoint POST /api/rooms/{roomId}/roulette y emisión en tiempo real a /topic/room/{roomId}/roulette (RF-11 / CU-05).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class RouletteWebSocketIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private RoomService roomService;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private AnswerRepository answerRepository;

    @Autowired
    private ScoreRepository scoreRepository;

    private WebSocketStompClient stompClient;

    @BeforeEach
    void setUp() {
        stompClient = new WebSocketStompClient(new StandardWebSocketClient());

        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        MappingJackson2MessageConverter messageConverter = new MappingJackson2MessageConverter();
        messageConverter.setObjectMapper(objectMapper);
        stompClient.setMessageConverter(messageConverter);

        scoreRepository.deleteAll();
        answerRepository.deleteAll();
        playerRepository.deleteAll();
        roomRepository.deleteAll();
        questionRepository.deleteAll();
    }

    @AfterEach
    void tearDown() {
        scoreRepository.deleteAll();
        answerRepository.deleteAll();
        playerRepository.deleteAll();
        roomRepository.deleteAll();
        questionRepository.deleteAll();
    }

    @Test
    @DisplayName("Tarea 10 / RF-11: Ruleta vía STOMP y REST difunde a /topic/room/{roomId}/roulette con estado ROULETTE_TIME")
    void testRouletteExecutionViaStompAndRest() throws Exception {
        // 1. Configurar pregunta de prueba
        Question question = Question.builder()
                .type(QuestionType.MULTIPLE_CHOICE)
                .prompt("Choose the correct past tense of \"go\".")
                .options(List.of("goed", "went", "gone", "going"))
                .correctAnswer("went")
                .timeLimitSeconds(15)
                .order(1)
                .build();
        Question savedQuestion = questionRepository.save(question);

        // 2. Crear sala e incorporar participante
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

        // 4. Suscribirse a /topic/room/{roomId}/roulette y /topic/room/{roomId}/status
        CompletableFuture<RouletteResultResponse> rouletteFuture = new CompletableFuture<>();
        stompSession.subscribe("/topic/room/" + room.getRoomId() + "/roulette", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return RouletteResultResponse.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                rouletteFuture.complete((RouletteResultResponse) payload);
            }
        });

        CompletableFuture<Map> statusFuture = new CompletableFuture<>();
        stompSession.subscribe("/topic/room/" + room.getRoomId() + "/status", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return Map.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                statusFuture.complete((Map) payload);
            }
        });

        Thread.sleep(500);

        // 5. Enviar respuesta del jugador por STOMP
        SubmitAnswerRequest answerRequest = SubmitAnswerRequest.builder()
                .playerId(player.getPlayerId())
                .questionId(savedQuestion.getQuestionId())
                .value(new TextNode("went"))
                .clientTimestamp(LocalDateTime.now(ZoneOffset.UTC))
                .build();

        stompSession.send("/app/room/" + room.getRoomId() + "/answer", answerRequest);
        Thread.sleep(500);

        // 6. Activar la ruleta mediante el canal STOMP del moderador (/app/room/{roomId}/moderator/roulette)
        stompSession.send("/app/room/" + room.getRoomId() + "/moderator/roulette", "");

        // 7. Validar evento STOMP recibido en la ruleta
        RouletteResultResponse rouletteEvent = rouletteFuture.get(5, TimeUnit.SECONDS);
        assertThat(rouletteEvent).isNotNull();
        assertThat(rouletteEvent.getRoomId()).isEqualTo(room.getRoomId());
        assertThat(rouletteEvent.getNickname()).isEqualTo("camilo_dev");
        assertThat(rouletteEvent.getValue()).isEqualTo("went");
        assertThat(rouletteEvent.getIsCorrect()).isTrue();

        // Validar cambio de estado en /topic/room/{roomId}/status
        Map statusEvent = statusFuture.get(5, TimeUnit.SECONDS);
        assertThat(statusEvent.get("status")).isEqualTo("ROULETTE_TIME");

        // 8. Validar también el endpoint REST POST /api/rooms/{roomId}/roulette (Contrato §3)
        ResponseEntity<RouletteResultResponse> restResponse = restTemplate.postForEntity(
                "/api/rooms/" + room.getRoomId() + "/roulette",
                null,
                RouletteResultResponse.class
        );

        assertThat(restResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(restResponse.getBody()).isNotNull();
        assertThat(restResponse.getBody().getNickname()).isEqualTo("camilo_dev");

        // Validar persistencia en BD del estado de la sala
        Room dbRoom = roomRepository.findById(room.getRoomId()).orElseThrow();
        assertThat(dbRoom.getStatus()).isEqualTo(RoomStatus.ROULETTE_TIME);

        stompSession.disconnect();
    }
}
