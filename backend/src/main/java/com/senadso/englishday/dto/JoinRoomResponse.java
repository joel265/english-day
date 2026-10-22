package com.senadso.englishday.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Payload JSON que el servidor responde con status 200 OK a POST /api/rooms/{pin}/join.
 * Definido en Contrato de Integración §3.2.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JoinRoomResponse {

    /**
     * Identificador único asignado al aprendiz (UUID v4).
     */
    private String playerId;

    /**
     * Identificador único de la sala a la que se unió (UUID v4).
     */
    private String roomId;

    /**
     * Nickname confirmado del aprendiz.
     */
    private String nickname;

    /**
     * Avatar seleccionado por el aprendiz.
     */
    private String avatar;

    /**
     * Marca temporal en formato ISO-8601 UTC (ej. 2026-09-21T14:02:11Z).
     */
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
    private LocalDateTime joinedAt;
}
