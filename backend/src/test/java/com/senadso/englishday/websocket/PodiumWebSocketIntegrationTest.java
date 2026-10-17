package com.senadso.englishday.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.senadso.englishday.dto.CreateRoomResponse;
import com.senadso.englishday.dto.JoinRoomRequest;
import com.senadso.englishday.dto.JoinRoomResponse;
import com.senadso.englishday.dto.PodiumResponse;
import com.senadso.englishday.model.Player;
import com.senadso.englishday.model.enums.RoomStatus;
import com.senadso.englishday.repository.PlayerRepository;
import com.senadso.englishday.repository.RoomRepository;
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
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Prueba de integración para la Tarea 11:
 * Emisión y recepción en tiempo real del Podio Final (Top 3) en /topic/room/{roomId}/podium (RF-10 / CU-06 / CP-11)
 * y transición de estado a FINISHED en /topic/room/{roomId}/status.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class PodiumWebSocketIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private RoomService roomService;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private PlayerRepository playerRepository;

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
        playerRepository.deleteAll();
        roomRepository.deleteAll();
    }

    @AfterEach
    void tearDown() {
        scoreRepository.deleteAll();
        playerRepository.deleteAll();
        roomRepository.deleteAll();
    }

    @Test
    @DisplayName("Tarea 11 / RF-10 / CU-06 / CP-11: Cierre de partida emite Top 3 a /topic/room/{roomId}/podium y estado FINISHED")
    void testPodiumBroadcastIntegration() throws Exception {
        // 1. Crear sala e incorporar 3 aprendices con puntajes distintos
        CreateRoomResponse room = roomService.createRoom();

        JoinRoomResponse p1 = roomService.joinRoom(room.getPin(), JoinRoomRequest.builder().nickname("camilo_dev").build());
        JoinRoomResponse p2 = roomService.joinRoom(room.getPin(), JoinRoomRequest.builder().nickname("laura_eng").build());
        JoinRoomResponse p3 = roomService.joinRoom(room.getPin(), JoinRoomRequest.builder().nickname("andres_code").build());

        // Asignar puntajes acumulados
        Player player1 = playerRepository.findById(p1.getPlayerId()).orElseThrow();
        player1.setTotalScore(5000);
        playerRepository.save(player1);

        Player player2 = playerRepository.findById(p2.getPlayerId()).orElseThrow();
        player2.setTotalScore(4200);
        playerRepository.save(player2);

        Player player3 = playerRepository.findById(p3.getPlayerId()).orElseThrow();
        player3.setTotalScore(3100);
        playerRepository.save(player3);

        // 2. Conectar cliente WebSocket STOMP
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

        // 3. Suscribirse a /topic/room/{roomId}/podium y /topic/room/{roomId}/status
        CompletableFuture<PodiumResponse> podiumFuture = new CompletableFuture<>();
        stompSession.subscribe("/topic/room/" + room.getRoomId() + "/podium", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return PodiumResponse.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                podiumFuture.complete((PodiumResponse) payload);
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

        // 4. Moderador finaliza la partida enviando mensaje a /app/room/{roomId}/podium
        stompSession.send("/app/room/" + room.getRoomId() + "/podium", "");

        // 5. Validar evento recibido en el podio (Top 3)
        PodiumResponse podiumEvent = podiumFuture.get(5, TimeUnit.SECONDS);
        assertThat(podiumEvent).isNotNull();
        assertThat(podiumEvent.getRoomId()).isEqualTo(room.getRoomId());
        assertThat(podiumEvent.getStatus()).isEqualTo(RoomStatus.FINISHED);
        assertThat(podiumEvent.getTop3()).hasSize(3);
        assertThat(podiumEvent.getTop3().get(0).getNickname()).isEqualTo("camilo_dev");
        assertThat(podiumEvent.getTop3().get(0).getScore()).isEqualTo(5000);
        assertThat(podiumEvent.getTop3().get(1).getNickname()).isEqualTo("laura_eng");
        assertThat(podiumEvent.getTop3().get(1).getScore()).isEqualTo(4200);
        assertThat(podiumEvent.getTop3().get(2).getNickname()).isEqualTo("andres_code");
        assertThat(podiumEvent.getTop3().get(2).getScore()).isEqualTo(3100);

        // 6. Validar evento de estado FINISHED
        Map statusEvent = statusFuture.get(5, TimeUnit.SECONDS);
        assertThat(statusEvent.get("status")).isEqualTo("FINISHED");

        stompSession.disconnect();
    }
}
