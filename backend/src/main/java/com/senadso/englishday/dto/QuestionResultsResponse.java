package com.senadso.englishday.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * Payload emitido en /topic/room/{roomId}/results al finalizar cada ronda/pregunta.
 * Estructura fijada en Contrato de Integración §4.5 (RF-10 / CU-06).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionResultsResponse {

    /**
     * Respuesta correcta de la pregunta que acaba de concluir.
     */
    private String correctAnswer;

    /**
     * Tabla de clasificación con los 5 mejores aprendices de la sala.
     */
    private List<LeaderboardEntryDto> top5;
}
