package com.senadso.englishday.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Fragmento (palabra) de la respuesta del aprendiz con su diagnóstico de corrección.
 * El cliente lo usa para subrayar exactamente la parte en la que falló.
 *
 * status:
 *  - OK: palabra correcta.
 *  - TYPO: error ortográfico leve tolerado (se subraya en amarillo con la forma correcta en {@code expected}).
 *  - WRONG: palabra incorrecta (se subraya en rojo); {@code expected} contiene la palabra esperada,
 *           o es null si la palabra sobra.
 *  - MISSING: palabra que faltaba en la respuesta ({@code text} es la palabra esperada).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnswerSegmentDto {

    private String text;
    private String status;
    private String expected;
}
