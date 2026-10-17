package com.senadso.englishday.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Payload JSON que el aprendiz envía vía WebSocket STOMP al destino:
 * /app/room/{roomId}/answer (Contrato de Integración §4.2 y §4.4 / CU-04).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmitAnswerRequest {

    /**
     * Identificador único del aprendiz que responde (UUID v4).
     */
    @NotBlank(message = "El playerId es obligatorio")
    private String playerId;

    /**
     * Identificador único de la pregunta respondida (UUID v4).
     */
    @NotBlank(message = "El questionId es obligatorio")
    private String questionId;

    /**
     * Valor de la respuesta enviada por el aprendiz.
     * Puede ser un string (MULTIPLE_CHOICE, TEXT_INPUT, VOICE)
     * o un arreglo de strings (WORD_BLOCKS según Contrato §4.4).
     */
    @NotNull(message = "El value es obligatorio")
    private JsonNode value;

    /**
     * Marca temporal enviada por el cliente en formato ISO-8601 UTC.
     */
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
    private LocalDateTime clientTimestamp;

    /**
     * Normaliza el valor a una cadena de texto para almacenamiento y validación.
     * Si viene como arreglo ["I", "went", "home"], retorna "I went home".
     * Si viene como cadena simple "went", retorna "went".
     */
    public String getNormalizedStringValue() {
        if (value == null || value.isNull()) {
            return "";
        }
        if (value.isArray()) {
            List<String> tokens = new ArrayList<>();
            for (JsonNode item : value) {
                tokens.add(item.asText().trim());
            }
            return String.join(" ", tokens);
        }
        return value.asText().trim();
    }
}
