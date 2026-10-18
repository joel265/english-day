package com.senadso.englishday.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Veredicto individual de la ronda para un aprendiz específico,
 * incluido en el mensaje de resultados para garantizar consistencia 100%
 * entre la validación del servidor y la pantalla del móvil.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlayerRoundVerdictDto {

    private String playerId;
    private String nickname;
    private String submittedValue;
    private Boolean isCorrect;
    private Integer pointsAwarded;
    private Integer totalScore;
}
