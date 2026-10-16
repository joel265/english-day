package com.senadso.englishday.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;

/**
 * Clave primaria compuesta para la entidad Score (playerId + roomId).
 * Representa que un jugador tiene un único registro de puntaje acumulado por sala.
 * Definida en schema.sql y Contrato §2.2.
 */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
@Builder
public class ScoreId implements Serializable {

    @Column(name = "playerId", length = 36, nullable = false)
    private String playerId;

    @Column(name = "roomId", length = 36, nullable = false)
    private String roomId;
}
