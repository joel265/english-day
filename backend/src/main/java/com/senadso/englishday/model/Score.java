package com.senadso.englishday.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * Entidad JPA que representa el puntaje acumulado y posición (ranking) de un jugador en una sala.
 * Crucial para el Leaderboard Top 5 (/topic/.../results) y el Podio Final (/topic/.../podium).
 * Definida en Contrato de Integración §2.2 y DAS §3.
 */
@Entity
@Table(name = "Score")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Score {

    /**
     * Clave primaria compuesta formada por (playerId, roomId).
     */
    @EmbeddedId
    private ScoreId id;

    /**
     * Jugador asociado al puntaje.
     * MapsId("playerId") sincroniza la clave foránea con el atributo playerId de ScoreId.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("playerId")
    @JoinColumn(name = "playerId", nullable = false)
    private Player player;

    /**
     * Sala asociada al puntaje.
     * MapsId("roomId") sincroniza la clave foránea con el atributo roomId de ScoreId.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("roomId")
    @JoinColumn(name = "roomId", nullable = false)
    private Room room;

    /**
     * Puntos totales acumulados por el jugador durante la partida.
     */
    @Column(name = "totalPoints", nullable = false)
    @Builder.Default
    private Integer totalPoints = 0;

    /**
     * Posición del jugador en el ranking de la sala (1 = primer lugar).
     * En MySQL 8.0+, 'rank' es palabra reservada por las funciones de ventana, por lo que se escapa.
     */
    @Column(name = "`rank`", nullable = false)
    @Builder.Default
    private Integer rank = 0;

    /**
     * Asigna valores por defecto si no fueron especificados.
     */
    @PrePersist
    public void prePersist() {
        if (this.totalPoints == null) {
            this.totalPoints = 0;
        }
        if (this.rank == null) {
            this.rank = 0;
        }
        if (this.id == null && this.player != null && this.room != null) {
            this.id = new ScoreId(this.player.getPlayerId(), this.room.getRoomId());
        }
    }
}
