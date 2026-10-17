package com.senadso.englishday.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Payload opcional para solicitar el cálculo y difusión de resultados de una pregunta.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CloseQuestionRequest {

    /**
     * Identificador UUID de la pregunta a cerrar.
     */
    private String questionId;
}
