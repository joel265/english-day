package com.senadso.englishday.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO que modela a un aprendiz presente en la lista en vivo del lobby.
 * Se difunde a través de WebSocket STOMP al canal:
 * /topic/room/{roomId}/lobby (Contrato de Integración §4.1 / RF-03).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LobbyPlayerResponse {

    /**
     * Identificador único del aprendiz (UUID v4).
     */
    private String playerId;

    /**
     * Nickname visible del aprendiz en la sala.
     */
    private String nickname;

    /**
     * Fecha y hora en que se unió al lobby en formato ISO-8601 UTC.
     */
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
    private LocalDateTime joinedAt;
}
