package com.senadso.englishday.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Configuración de WebSockets con protocolo STOMP para la plataforma English Day.
 * Cumple con las especificaciones del Contrato de Integración (§4):
 * - Handshake en /ws-englishday (con soporte para WebSocket puro y fallback SockJS).
 * - Prefijo de difusión hacia clientes: /topic
 * - Prefijo para mensajes enviados desde los clientes: /app
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Endpoint nativo WebSocket (STOMP directo)
        registry.addEndpoint("/ws-englishday")
                .setAllowedOriginPatterns("*");

        // Endpoint con fallback de SockJS para navegadores móviles
        registry.addEndpoint("/ws-englishday")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Habilita el broker en memoria para enviar mensajes hacia los clientes suscritos a /topic/...
        registry.enableSimpleBroker("/topic");

        // Prefijo para enrutar mensajes enviados desde el cliente hacia métodos @MessageMapping
        registry.setApplicationDestinationPrefixes("/app");
    }
}
