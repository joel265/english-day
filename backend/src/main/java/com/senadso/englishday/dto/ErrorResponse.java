package com.senadso.englishday.dto;

import lombok.*;

/**
 * Estructura estándar para respuestas de error de la API.
 * Cumple con Contrato §3.2: { "error": "PIN no encontrado" }
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ErrorResponse {

    private String error;
}
