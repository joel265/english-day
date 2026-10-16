package com.senadso.englishday.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Entidad JPA que registra la respuesta emitida por un aprendiz a una pregunta específica.
 * Fundamental para el cálculo de puntajes (RF-09) y la ruleta de retroalimentación (RF-11 / CU-05).
 * Definida en Contrato de Integración §2.2 y DAS §3.
 */
@Entity
@Table(name = "Answer")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Answer {

    /**
     * Identificador único de la respuesta (UUID v4).
     */
    @Id
    @Column(name = "answerId", length = 36, nullable = false, updatable = false)
    private String answerId;

    /**
     * Jugador que emitió la respuesta (FK -> Player.playerId).
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "playerId", nullable = false)
    private Player player;

    /**
     * Pregunta a la cual corresponde la respuesta (FK -> Question.questionId).
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "questionId", nullable = false)
    private Question question;

    /**
     * Valor enviado por el jugador (opción seleccionada, bloque ordenado o transcripción de voz).
     */
    @Column(name = "value", columnDefinition = "TEXT", nullable = false)
    private String value;

    /**
     * Indica si la respuesta coincide con correctAnswer según la lógica de validación del servidor.
     */
    @Column(name = "isCorrect", nullable = false)
    private Boolean isCorrect;

    /**
     * Tiempo en milisegundos que tardó el jugador en responder (usado para el algoritmo de velocidad).
     */
    @Column(name = "responseTimeMs", nullable = false)
    private Integer responseTimeMs;

    /**
     * Puntos otorgados calculados con el algoritmo de RF-09 / Contrato §5.
     */
    @Column(name = "pointsAwarded", nullable = false)
    @Builder.Default
    private Integer pointsAwarded = 0;

    /**
     * Asigna automáticamente el UUID v4 antes de persistir.
     */
    @PrePersist
    public void prePersist() {
        if (this.answerId == null || this.answerId.isBlank()) {
            this.answerId = UUID.randomUUID().toString();
        }
        if (this.pointsAwarded == null) {
            this.pointsAwarded = 0;
        }
    }
}
