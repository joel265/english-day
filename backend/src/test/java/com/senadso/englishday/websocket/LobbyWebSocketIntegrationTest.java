package com.senadso.englishday.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.senadso.englishday.dto.CreateRoomResponse;
import com.senadso.englishday.dto.JoinRoomRequest;
import com.senadso.englishday.dto.LobbyPlayerResponse;
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

import java.lang.reflect.Type;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Prueba de integración para la Tarea 6:
 * Topic /topic/room/{roomId}/lobby (jugadores conectados en vivo).
 * Valida que al unirse un aprendiz vía joinRoom, los suscriptores WebSocket
 * reciben en tiempo real la lista actualizada del lobby (RF-03 / CP-02).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class LobbyWebSocketIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private RoomService roomService;

    private WebSocketStompClient stompClient;

    @BeforeEach
    void setUp() {
        stompClient = new WebSocketStompClient(new StandardWebSocketClient());

        // Configurar conversor JSON con soporte para LocalDateTime de Java 8+
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        MappingJackson2MessageConverter messageConverter = new MappingJackson2MessageConverter();
        messageConverter.setObjectMapper(objectMapper);
        stompClient.setMessageConverter(messageConverter);
    }

    @Test
    @DisplayName("Tarea 6 / CP-02: Suscripción a /topic/room/{roomId}/lobby recibe lista de jugadores al unirse un aprendiz")
    void testLobbyBroadcastOnPlayerJoin() throws Exception {
        // 1. Crear una sala para la prueba
        CreateRoomResponse room = roomService.createRoom();
        String roomId = room.getRoomId();
        String pin = room.getPin();

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

        // 3. Suscribirse al topic del lobby: /topic/room/{roomId}/lobby
        CompletableFuture<List<LobbyPlayerResponse>> messageFuture = new CompletableFuture<>();
        String lobbyTopic = "/topic/room/" + roomId + "/lobby";

        stompSession.subscribe(lobbyTopic, new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return LobbyPlayerResponse[].class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                LobbyPlayerResponse[] playersArray = (LobbyPlayerResponse[]) payload;
                messageFuture.complete(Arrays.asList(playersArray));
            }
        });

        // Breve pausa para asegurar el registro de la suscripción en el broker en memoria
        Thread.sleep(500);

        // 4. Simular el registro de un aprendiz mediante joinRoom (Tarea 4)
        JoinRoomRequest joinRequest = JoinRoomRequest.builder()
                .nickname("camilo_dev")
                .build();
        roomService.joinRoom(pin, joinRequest);

        // 5. Esperar la recepción del mensaje por WebSocket (máximo 5 segundos)
        List<LobbyPlayerResponse> players = messageFuture.get(5, TimeUnit.SECONDS);
        assertThat(players).isNotNull();

        // 6. Validar que la lista contenga al jugador recién registrado
        assertThat(players).hasSize(1);
        assertThat(players.get(0).getNickname()).isEqualTo("camilo_dev");
        assertThat(players.get(0).getPlayerId()).isNotBlank();
        assertThat(players.get(0).getJoinedAt()).isNotNull();

        // Desconectar sesión WebSocket al finalizar
        stompSession.disconnect();
    }
}
