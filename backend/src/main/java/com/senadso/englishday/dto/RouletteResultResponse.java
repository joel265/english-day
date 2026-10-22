package com.senadso.englishday.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Payload emitido en /topic/room/{roomId}/roulette y retornado en POST /api/rooms/{roomId}/roulette.
 * Representa el resultado de la ruleta de retroalimentación interactiva (RF-11 / CU-05).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RouletteResultResponse {

    /**
     * Identificador UUID de la sala de juego.
     */
    private String roomId;

    /**
     * Identificador UUID del aprendiz seleccionado al azar.
     */
    private String playerId;

    /**
     * Alias público del aprendiz seleccionado.
     */
    private String nickname;

    /**
     * Avatar del aprendiz seleccionado.
     */
    private String avatar;

    /**
     * Pregunta sobre la cual se hace la retroalimentación.
     */
    private String questionId;

    /**
     * Respuesta emitida por el aprendiz (o null si no respondió antes del tiempo).
     */
    private String value;

    /**
     * Indica si la respuesta del aprendiz fue calificada como correcta.
     */
    private Boolean isCorrect;

    /**
     * Marca de tiempo en formato ISO-8601 UTC en que se ejecutó la ruleta.
     */
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    private LocalDateTime timestamp;
}
