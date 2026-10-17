package com.senadso.englishday.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

/**
 * Estructura estándar para respuestas de error de la API.
 * Cumple con Contrato §3.2 y Anexo A.1: { "code": "...", "error": "PIN no encontrado" }
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {

    private String code;
    private String error;

    public ErrorResponse(String error) {
        this.error = error;
    }
}
