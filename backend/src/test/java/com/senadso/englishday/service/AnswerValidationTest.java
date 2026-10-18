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

    @Test
    @DisplayName("RF-06 & RF-07: Margen de error ortográfico y fonético sin confundir tiempos ni pronombres")
    void testFuzzySpellingAndPronunciationTolerance() {
        // Error común en Simple Present (-y -> -ies) y typo de 1 letra
        assertThat(answerService.validateAnswer(QuestionType.TEXT_INPUT, "studys", "studies")).isTrue();
        assertThat(answerService.validateAnswer(QuestionType.TEXT_INPUT, "studeis", "studies")).isTrue();

        // Error común en Present Continuous (-ing)
        assertThat(answerService.validateAnswer(QuestionType.TEXT_INPUT, "are studing", "are studying")).isTrue();
        assertThat(answerService.validateAnswer(QuestionType.VOICE, "They are my best frends", "They are my best friends")).isTrue();
        assertThat(answerService.validateAnswer(QuestionType.VOICE, "She studies English evry day", "She studies English every day")).isTrue();

        // Protección gramatical: no debe confundir presente con pasado ni pronombres/auxiliares opuestos
        assertThat(answerService.validateAnswer(QuestionType.VOICE, "she lived in london", "She lives in London")).isFalse();
        assertThat(answerService.validateAnswer(QuestionType.TEXT_INPUT, "do", "does")).isFalse();
        assertThat(answerService.validateAnswer(QuestionType.TEXT_INPUT, "he", "she")).isFalse();
    }

    @Test
    @DisplayName("Sentido: error de concordancia (friend/friends) o palabra faltante NO es un descuido ortográfico")
    void testGrammarAgreementIsNotSpellingSlip() {
        String expected = "They are my best friends";
        assertThat(answerService.validateAnswer(QuestionType.VOICE, "they are my best friend", expected)).isFalse();
        assertThat(answerService.validateAnswer(QuestionType.TEXT_INPUT, "they are best friends", expected)).isFalse();
        assertThat(answerService.validateAnswer(QuestionType.TEXT_INPUT, "they are me best friends", expected)).isFalse();
        assertThat(answerService.validateAnswer(QuestionType.TEXT_INPUT, "she studie", "she studies")).isFalse();
        // Un artículo omitido sí se tolera
        assertThat(answerService.validateAnswer(QuestionType.VOICE, "he is software developer", "he is a software developer")).isTrue();
    }

    @Test
    @DisplayName("Teclas vecinas: 'ny' se reconoce como typo de 'my'")
    void testKeyboardNeighborTypoOnShortWords() {
        String expected = "They are my best friends";
        assertThat(answerService.validateAnswer(QuestionType.TEXT_INPUT, "they are ny best friends", expected)).isTrue();
        assertThat(answerService.validateAnswer(QuestionType.TEXT_INPUT, "they are me best friends", expected)).isFalse();
    }

    @Test
    @DisplayName("Corrector: marca la palabra con error, el typo y la palabra faltante")
    void testFeedbackBuilderMarksWrongTypoAndMissing() {
        com.senadso.englishday.model.Question q = com.senadso.englishday.model.Question.builder()
                .questionId("55555555-5555-4555-8555-555555555556")
                .type(QuestionType.VOICE)
                .prompt("[Pronouns] Say the sentence: \"They are my best friends\".")
                .correctAnswer("They are my best friends")
                .timeLimitSeconds(25)
                .order(9)
                .build();

        var segments = AnswerFeedbackBuilder.buildSegments(q, "they are ny best friend", false);
        assertThat(segments).extracting("status").containsExactly("OK", "OK", "TYPO", "OK", "WRONG");
        assertThat(segments.get(2).getExpected()).isEqualTo("my");
        assertThat(segments.get(4).getExpected()).isEqualTo("friends");

        var missing = AnswerFeedbackBuilder.buildSegments(q, "they are best friends", false);
        assertThat(missing).extracting("status").contains("MISSING");

        assertThat(AnswerFeedbackBuilder.buildHints(segments)).isNotEmpty();
        assertThat(AnswerFeedbackBuilder.buildExplanation(q)).contains("plural");
    }

    @Test
    @DisplayName("RF-05: WORD_BLOCKS - Rechaza cláusulas que terminan en verbo sin complemento")
    void testWordBlocksRejectsDanglingVerb() {
        assertThat(answerService.validateAnswer(QuestionType.WORD_BLOCKS, "He doesn't like", "He doesn't like pizza today")).isFalse();
        assertThat(answerService.validateAnswer(QuestionType.WORD_BLOCKS, "Do you speak", "Do you speak English every day")).isFalse();
        assertThat(answerService.validateAnswer(QuestionType.WORD_BLOCKS, "Do you speak English", "Do you speak English every day")).isTrue();
    }

    @Test
    @DisplayName("RF-05: WORD_BLOCKS - Acepta cláusula parcial con sentido gramatical y rechaza desorden")
    void testWordBlocksPartialClauseWithSense() {
        String expected = "I am happy today";
        assertThat(answerService.validateAnswer(QuestionType.WORD_BLOCKS, "I am happy today", expected)).isTrue();
        assertThat(answerService.validateAnswer(QuestionType.WORD_BLOCKS, "I am happy", expected)).isTrue();
        assertThat(answerService.validateAnswer(QuestionType.WORD_BLOCKS, "Today I am happy", expected)).isTrue();
        assertThat(answerService.validateAnswer(QuestionType.WORD_BLOCKS, "happy I am", expected)).isFalse();

        String expectedPresent = "She studies English every day";
        assertThat(answerService.validateAnswer(QuestionType.WORD_BLOCKS, "She studies English", expectedPresent)).isTrue();
        assertThat(answerService.validateAnswer(QuestionType.WORD_BLOCKS, "She English studies", expectedPresent)).isFalse();
    }
}

