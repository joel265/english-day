package com.senadso.englishday.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.TextNode;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.senadso.englishday.dto.CloseQuestionRequest;
import com.senadso.englishday.dto.CreateRoomResponse;
import com.senadso.englishday.dto.JoinRoomRequest;
import com.senadso.englishday.dto.JoinRoomResponse;
import com.senadso.englishday.dto.QuestionResultsResponse;
import com.senadso.englishday.dto.SubmitAnswerRequest;
import com.senadso.englishday.model.Question;
import com.senadso.englishday.model.enums.QuestionType;
import com.senadso.englishday.repository.AnswerRepository;
import com.senadso.englishday.repository.QuestionRepository;
import com.senadso.englishday.repository.ScoreRepository;
import com.senadso.englishday.service.RoomService;
import org.junit.jupiter.api.AfterEach;
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

import java.lang.reflect.Type;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Prueba de integración para la Tarea 9:
 * Emisión y recepción en tiempo real del Leaderboard Top 5 en /topic/room/{roomId}/results (RF-10 / CU-06)
 * con cálculo del algoritmo de puntuación (RF-09 / Contrato §5).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ResultsWebSocketIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private RoomService roomService;

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
        questionRepository.deleteAll();
    }

    @AfterEach
    void tearDown() {
        scoreRepository.deleteAll();
        answerRepository.deleteAll();
        questionRepository.deleteAll();
    }

    @Test
    @DisplayName("Tarea 9 / RF-09 y RF-10: Cierre de pregunta emite Top 5 y correctAnswer a /topic/room/{roomId}/results")
    void testQuestionResultsBroadcast() throws Exception {
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

        // 2. Crear sala y registrar 2 jugadores
        CreateRoomResponse room = roomService.createRoom();
        JoinRoomResponse player1 = roomService.joinRoom(room.getPin(), JoinRoomRequest.builder().nickname("camilo_dev").build());
        JoinRoomResponse player2 = roomService.joinRoom(room.getPin(), JoinRoomRequest.builder().nickname("laura_eng").build());

        // Iniciar la partida
        roomService.startGame(room.getRoomId());

        // 3. Conectar cliente STOMP
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

        // 4. Suscribirse al topic /topic/room/{roomId}/results
        CompletableFuture<QuestionResultsResponse> resultsFuture = new CompletableFuture<>();
        stompSession.subscribe("/topic/room/" + room.getRoomId() + "/results", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return QuestionResultsResponse.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                resultsFuture.complete((QuestionResultsResponse) payload);
            }
        });

        // Breve pausa para asegurar suscripción activa en SimpleBroker
        Thread.sleep(500);

        // 5. Enviar respuesta correcta del jugador 1
        SubmitAnswerRequest answerRequest = SubmitAnswerRequest.builder()
                .playerId(player1.getPlayerId())
                .questionId(savedQuestion.getQuestionId())
                .value(new TextNode("went"))
                .clientTimestamp(LocalDateTime.now(ZoneOffset.UTC))
                .build();

        stompSession.send("/app/room/" + room.getRoomId() + "/answer", answerRequest);
        Thread.sleep(600);

        // 6. Enviar evento de solicitud de resultados a /app/room/{roomId}/results
        CloseQuestionRequest closeRequest = CloseQuestionRequest.builder()
                .questionId(savedQuestion.getQuestionId())
                .build();

        stompSession.send("/app/room/" + room.getRoomId() + "/results", closeRequest);

        // 7. Validar payload recibido en el topic
        QuestionResultsResponse response = resultsFuture.get(5, TimeUnit.SECONDS);
        assertThat(response).isNotNull();
        assertThat(response.getCorrectAnswer()).isEqualTo("went");
        assertThat(response.getTop5()).isNotEmpty();

        // Validar que camilo_dev esté en primer puesto con puntaje positivo (RF-09 / RF-10)
        assertThat(response.getTop5().get(0).getNickname()).isEqualTo("camilo_dev");
        assertThat(response.getTop5().get(0).getScore()).isGreaterThanOrEqualTo(500);

        stompSession.disconnect();
    }
}
