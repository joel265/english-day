package com.senadso.englishday.dto;

import com.senadso.englishday.model.enums.QuestionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Parámetros configurables por el moderador para cada sala:
 * - Tiempos límite en segundos por tipo de mecánica pedagógica.
 * - Duración de la pantalla de introducción antes de cada pregunta.
 * - Orden aleatorio de preguntas y mecánicas en cada nueva sala.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomSettingsDto {

    @Builder.Default
    private Integer multipleChoiceTimeSeconds = 15;

    @Builder.Default
    private Integer textInputTimeSeconds = 20;

    @Builder.Default
    private Integer wordBlocksTimeSeconds = 20;

    @Builder.Default
    private Integer voiceTimeSeconds = 25;

    @Builder.Default
    private Integer introDurationSeconds = 3;

    @Builder.Default
    private Boolean shuffleQuestions = true;

    public static RoomSettingsDto defaultSettings() {
        return RoomSettingsDto.builder()
                .multipleChoiceTimeSeconds(15)
                .textInputTimeSeconds(20)
                .wordBlocksTimeSeconds(20)
                .voiceTimeSeconds(25)
                .introDurationSeconds(3)
                .shuffleQuestions(true)
                .build();
    }

    public void normalize() {
        this.multipleChoiceTimeSeconds = clamp(this.multipleChoiceTimeSeconds, 5, 180, 15);
        this.textInputTimeSeconds = clamp(this.textInputTimeSeconds, 5, 180, 20);
        this.wordBlocksTimeSeconds = clamp(this.wordBlocksTimeSeconds, 5, 180, 20);
        this.voiceTimeSeconds = clamp(this.voiceTimeSeconds, 5, 180, 25);
        this.introDurationSeconds = clamp(this.introDurationSeconds, 0, 15, 3);
        if (this.shuffleQuestions == null) {
            this.shuffleQuestions = true;
        }
    }

    public int resolveTimeLimitForType(QuestionType type, Integer fallbackSeconds) {
        if (type == null) {
            return fallbackSeconds != null && fallbackSeconds > 0 ? fallbackSeconds : 15;
        }
        return switch (type) {
            case MULTIPLE_CHOICE -> clamp(this.multipleChoiceTimeSeconds, 5, 180, 15);
            case TEXT_INPUT -> clamp(this.textInputTimeSeconds, 5, 180, 20);
            case WORD_BLOCKS -> clamp(this.wordBlocksTimeSeconds, 5, 180, 20);
            case VOICE -> clamp(this.voiceTimeSeconds, 5, 180, 25);
        };
    }

    private static int clamp(Integer value, int min, int max, int defaultValue) {
        if (value == null) {
            return defaultValue;
        }
        return Math.max(min, Math.min(max, value));
    }
}
