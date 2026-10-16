package com.senadso.englishday.model;

import com.senadso.englishday.model.converter.StringListJsonConverter;
import com.senadso.englishday.model.enums.QuestionType;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Entidad JPA que representa una pregunta del banco pedagógico de inglés.
 * Definida en Contrato de Integración §2.2 y DAS §3.
 */
@Entity
@Table(name = "Question")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Question {

    /**
     * Identificador único de la pregunta (UUID v4).
     */
    @Id
    @Column(name = "questionId", length = 36, nullable = false, updatable = false)
    private String questionId;

    /**
     * Tipo pedagógico de la pregunta (MULTIPLE_CHOICE, WORD_BLOCKS, TEXT_INPUT, VOICE).
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "type", length = 50, nullable = false)
    private QuestionType type;

    /**
     * Enunciado de la pregunta o instrucción.
     */
    @Column(name = "prompt", columnDefinition = "TEXT", nullable = false)
    private String prompt;

    /**
     * Opciones disponibles para selección múltiple o bloques de palabras.
     * Almacenado como JSON en MySQL para mantener compatibilidad con schema.sql.
     */
    @Convert(converter = StringListJsonConverter.class)
    @Column(name = "options", columnDefinition = "JSON")
    @Builder.Default
    private List<String> options = new ArrayList<>();

    /**
     * Respuesta correcta esperada.
     * ¡CRÍTICO! Este campo nunca se envía al cliente antes de validar (Contrato §1, regla 13).
     */
    @Column(name = "correctAnswer", length = 255, nullable = false)
    private String correctAnswer;

    /**
     * Tiempo límite en segundos para responder la pregunta en tiempo real.
     */
    @Column(name = "timeLimitSeconds", nullable = false)
    private Integer timeLimitSeconds;

    /**
     * Posición u orden de la pregunta en la partida.
     * En MySQL 'order' es palabra reservada, por lo que se escapa con backticks (`order`).
     */
    @Column(name = "`order`", nullable = false)
    private Integer order;

    /**
     * Asigna automáticamente el UUID v4 si no se suministra.
     */
    @PrePersist
    public void prePersist() {
        if (this.questionId == null || this.questionId.isBlank()) {
            this.questionId = UUID.randomUUID().toString();
        }
    }
}
