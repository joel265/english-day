package com.senadso.englishday.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidad JPA que representa a un aprendiz participante en una sala de juego.
 * Definida en Contrato de Integración §2.2 y DAS §3.
 */
@Entity
@Table(name = "Player")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Player {

    /**
     * Identificador único del jugador (UUID v4).
     */
    @Id
    @Column(name = "playerId", length = 36, nullable = false, updatable = false)
    private String playerId;

    /**
     * Sala a la cual está conectado el jugador (FK -> Room.roomId).
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "roomId", nullable = false)
    private Room room;

    /**
     * Nombre visible o alias elegido por el aprendiz para la partida.
     */
    @Column(name = "nickname", length = 255, nullable = false)
    private String nickname;

    /**
     * Configuración o identificador del avatar/mascota del aprendiz.
     */
    @Column(name = "avatar", length = 500)
    private String avatar;

    /**
     * Fecha y hora en que el aprendiz ingresó a la sala.
     */
    @Column(name = "joinedAt", nullable = false, updatable = false)
    private LocalDateTime joinedAt;

    /**
     * Puntaje acumulado por el aprendiz en la sala.
     */
    @Column(name = "totalScore", nullable = false)
    @Builder.Default
    private Integer totalScore = 0;

    /**
     * Asigna automáticamente el UUID v4, la fecha de ingreso y el puntaje base antes de persistir.
     */
    @PrePersist
    public void prePersist() {
        if (this.playerId == null || this.playerId.isBlank()) {
            this.playerId = UUID.randomUUID().toString();
        }
        if (this.joinedAt == null) {
            this.joinedAt = LocalDateTime.now();
        }
        if (this.totalScore == null) {
            this.totalScore = 0;
        }
    }
}
