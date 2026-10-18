package com.senadso.englishday.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.senadso.englishday.model.Question;
import com.senadso.englishday.model.enums.QuestionType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Payload JSON emitido vía WebSocket STOMP al topic:
 * /topic/room/{roomId}/question (Contrato de Integración §4.1 y §4.3 / RF-08 / CU-03).
 *
 * ¡REGLA CRÍTICA DE SEGURIDAD!
 * El campo correctAnswer NUNCA se incluye en este payload para evitar trampas en el cliente.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionBroadcastResponse {

    /**
     * Identificador único de la pregunta (UUID v4).
     */
    private String questionId;

    /**
     * Tipo pedagógico de la pregunta (MULTIPLE_CHOICE, WORD_BLOCKS, TEXT_INPUT, VOICE).
     */
    private QuestionType type;

    /**
     * Enunciado de la pregunta o instrucción.
     */
    private String prompt;

    /**
     * Opciones disponibles para la respuesta (nullable para texto libre o voz).
     */
    private List<String> options;

    /**
     * Tiempo límite en segundos para responder.
     */
    private Integer timeLimitSeconds;

    /**
     * Duración en segundos de la pantalla de introducción antes de iniciar el conteo de respuesta.
     */
    private Integer introDurationSeconds;

    /**
     * Posición u orden de la pregunta en la secuencia de la partida.
     */
    private Integer order;

    /**
     * Marca temporal del servidor en formato ISO-8601 UTC (ej. 2026-09-21T14:10:00Z)
     * utilizada por el cliente para sincronizar el temporizador.
     */
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
    private LocalDateTime serverTimestamp;

    /**
     * Método fábrica para construir el DTO a partir de la entidad JPA Question
     * garantizando que correctAnswer quede excluido de la difusión.
     */
    public static QuestionBroadcastResponse fromEntity(Question question, LocalDateTime serverTimestamp) {
        return fromEntity(
                question,
                serverTimestamp,
                question.getOrder(),
                question.getTimeLimitSeconds(),
                3
        );
    }

    public static QuestionBroadcastResponse fromEntity(
            Question question,
            LocalDateTime serverTimestamp,
            Integer displayOrder,
            Integer effectiveTimeLimitSeconds,
            Integer introDurationSeconds) {
        return QuestionBroadcastResponse.builder()
                .questionId(question.getQuestionId())
                .type(question.getType())
                .prompt(question.getPrompt())
                .options(question.getOptions())
                .timeLimitSeconds(effectiveTimeLimitSeconds != null ? effectiveTimeLimitSeconds : question.getTimeLimitSeconds())
                .introDurationSeconds(introDurationSeconds != null ? introDurationSeconds : 3)
                .order(displayOrder != null ? displayOrder : question.getOrder())
                .serverTimestamp(serverTimestamp)
                .build();
    }
}
