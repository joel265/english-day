package com.senadso.englishday.model;

import com.senadso.englishday.model.enums.RoomStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidad JPA que representa una sala de juego interactiva.
 * Definida en Contrato de Integración §2.2 y DAS §3.
 */
@Entity
@Table(name = "Room")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Room {

    /**
     * Identificador único de la sala en formato UUID v4.
     */
    @Id
    @Column(name = "roomId", length = 36, nullable = false, updatable = false)
    private String roomId;

    /**
     * PIN numérico de 6 dígitos para que los aprendices se unan desde el móvil.
     * Siempre es String para conservar posibles ceros a la izquierda (Contrato §1).
     */
    @Column(name = "pin", length = 6, nullable = false, unique = true)
    private String pin;

    /**
     * Estado del ciclo de vida de la partida.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 50, nullable = false)
    @Builder.Default
    private RoomStatus status = RoomStatus.WAITING_LOBBY;

    /**
     * Índice de la pregunta actual dentro de la secuencia del juego.
     */
    @Column(name = "currentQuestionIndex", nullable = false)
    @Builder.Default
    private Integer currentQuestionIndex = 0;

    /**
     * Fecha y hora de creación de la sala en UTC.
     */
    @Column(name = "createdAt", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Asigna automáticamente el UUID v4 y la fecha de creación antes de persistir.
     */
    @PrePersist
    public void prePersist() {
        if (this.roomId == null || this.roomId.isBlank()) {
            this.roomId = UUID.randomUUID().toString();
        }
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = RoomStatus.WAITING_LOBBY;
        }
        if (this.currentQuestionIndex == null) {
            this.currentQuestionIndex = 0;
        }
    }
}
