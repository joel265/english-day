package com.senadso.englishday.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.TextNode;
import com.senadso.englishday.dto.SubmitAnswerRequest;
import com.senadso.englishday.model.enums.QuestionType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Pruebas unitarias para la validación de los 4 tipos de respuesta (Tarea 8).
 * Valida RF-04, RF-05, RF-06, RF-07 y la Decisión Técnica #1 de la Bitácora.
 */
class AnswerValidationTest {

    private AnswerService answerService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        answerService = new AnswerService(null, null, null, null);
        objectMapper = new ObjectMapper();
    }

    @Test
    @DisplayName("RF-04: MULTIPLE_CHOICE - Valida opción correcta e incorrecta")
    void testMultipleChoiceValidation() {
        String expected = "went";

        assertThat(answerService.validateAnswer(QuestionType.MULTIPLE_CHOICE, "went", expected)).isTrue();
        assertThat(answerService.validateAnswer(QuestionType.MULTIPLE_CHOICE, " WENT ", expected)).isTrue();
        assertThat(answerService.validateAnswer(QuestionType.MULTIPLE_CHOICE, "goed", expected)).isFalse();
    }

    @Test
    @DisplayName("RF-05: WORD_BLOCKS - Valida oración construida con arreglo de bloques")
    void testWordBlocksValidation() {
        ArrayNode arrayNode = objectMapper.createArrayNode();
        arrayNode.add("I");
        arrayNode.add("went");
        arrayNode.add("home");

        SubmitAnswerRequest request = SubmitAnswerRequest.builder()
                .playerId("p1")
                .questionId("q1")
                .value(arrayNode)
                .build();

        String normalizedValue = request.getNormalizedStringValue();
        assertThat(normalizedValue).isEqualTo("I went home");

        String expected = "I went home";
        assertThat(answerService.validateAnswer(QuestionType.WORD_BLOCKS, normalizedValue, expected)).isTrue();
        assertThat(answerService.validateAnswer(QuestionType.WORD_BLOCKS, "I home went", expected)).isFalse();
    }

    @Test
    @DisplayName("RF-06: TEXT_INPUT - Ignora mayúsculas, tildes y espacios (Bitácora #1)")
    void testTextInputValidation() {
        String expected = "cancion";

        assertThat(answerService.validateAnswer(QuestionType.TEXT_INPUT, "Canción", expected)).isTrue();
        assertThat(answerService.validateAnswer(QuestionType.TEXT_INPUT, "  CANCIÓN  ", expected)).isTrue();
        assertThat(answerService.validateAnswer(QuestionType.TEXT_INPUT, "cancion.", expected)).isTrue();
        assertThat(answerService.validateAnswer(QuestionType.TEXT_INPUT, "oración", expected)).isFalse();
    }

    @Test
    @DisplayName("RF-07: VOICE - Validación robusta de transcripción de voz Web Speech API y Anexo B.6")
    void testVoiceValidation() {
        String expected = "She lives in London";

        assertThat(answerService.validateAnswer(QuestionType.VOICE, "she lives in london", expected)).isTrue();
        assertThat(answerService.validateAnswer(QuestionType.VOICE, "SHE LIVES IN LONDON.", expected)).isTrue();
        assertThat(answerService.validateAnswer(QuestionType.VOICE, "she lived in london", expected)).isFalse();

        // Anexo B.6: Conserva apóstrofo y guion pero elimina signos de puntuación periféricos
        assertThat(answerService.validateAnswer(QuestionType.VOICE, "I don't know!", "i don't know")).isTrue();
        assertThat(answerService.validateAnswer(QuestionType.TEXT_INPUT, "well-known,", "well-known")).isTrue();
    }
}
