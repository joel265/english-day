package com.senadso.englishday.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para la difusión en vivo de reacciones interactivas hacia todos
 * los participantes y moderador conectados en /topic/room/{roomId}/reactions.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReactionResponse {

    /**
     * Tipo de reacción: "GREETING" o "CONFETTI".
     */
    private String type;

    /**
     * Identificador del aprendiz que originó la reacción.
     */
    private String playerId;

    /**
     * Nombre en pantalla (nickname) del aprendiz.
     */
    private String nickname;

    /**
     * Marca temporal en milisegundos UTC de la emisión.
     */
    private long timestamp;
}
