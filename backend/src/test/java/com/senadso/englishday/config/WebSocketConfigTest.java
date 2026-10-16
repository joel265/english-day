package com.senadso.englishday.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.messaging.converter.StringMessageConverter;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Pruebas de integración para la Tarea 5 (Handshake WebSocket STOMP).
 * Valida que el endpoint /ws-englishday responde al handshake SockJS y STOMP.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class WebSocketConfigTest {

    @LocalServerPort
    private int port;

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("SockJS: GET /ws-englishday/info debe responder 200 OK y habilitar websocket")
    void testSockJsInfoEndpoint() throws Exception {
        mockMvc.perform(get("/ws-englishday/info"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.websocket", is(true)));
    }

    @Test
    @DisplayName("STOMP: Handshake exitoso conectándose a /ws-englishday")
    void testStompWebSocketHandshake() throws Exception {
        WebSocketStompClient stompClient = new WebSocketStompClient(new StandardWebSocketClient());
        stompClient.setMessageConverter(new StringMessageConverter());

        String url = "ws://localhost:" + port + "/ws-englishday";
        CompletableFuture<StompSession> sessionFuture = new CompletableFuture<>();

        stompClient.connectAsync(url, new StompSessionHandlerAdapter() {
            @Override
            public void afterConnected(StompSession session, StompHeaders connectedHeaders) {
                sessionFuture.complete(session);
            }
        });

        StompSession session = sessionFuture.get(5, TimeUnit.SECONDS);
        assertThat(session).isNotNull();
        assertThat(session.isConnected()).isTrue();

        session.disconnect();
    }
}
