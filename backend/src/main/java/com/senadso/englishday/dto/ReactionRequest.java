package com.senadso.englishday.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para la solicitud de envío de una reacción interactiva en vivo
 * (saludo 👋 o confeti 🎉) desde un dispositivo aprendiz.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReactionRequest {

    /**
     * Tipo de reacción: "GREETING" o "CONFETTI".
     */
    private String type;

    /**
     * Identificador del aprendiz que emite la reacción (opcional).
     */
    private String playerId;

    /**
     * Nombre en pantalla (nickname) del aprendiz (opcional).
     */
    private String nickname;
}
