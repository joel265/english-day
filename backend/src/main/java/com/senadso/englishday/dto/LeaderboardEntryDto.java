package com.senadso.englishday.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Representa una posición individual en la tabla de clasificación (Top 5 / Podio).
 * Definido en Contrato de Integración §4.5 (RF-10).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaderboardEntryDto {

    /**
     * Nombre público o alias del aprendiz.
     */
    private String nickname;

    /**
     * Puntaje acumulado en la sala.
     */
    private Integer score;
}
