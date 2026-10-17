package com.senadso.englishday.config;

import com.senadso.englishday.model.Question;
import com.senadso.englishday.model.enums.QuestionType;
import com.senadso.englishday.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Inicializador automático del banco de preguntas pedagógicas cuando la tabla Question está vacía
 * en cualquier entorno (H2 o MySQL/producción).
 * Si database/questions_seed.sql ya fue ejecutado en MySQL, detecta count() > 0 y no duplica registros.
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
public class QuestionDataInitializer {

    private final QuestionRepository questionRepository;

    @Bean
    public CommandLineRunner seedQuestionsIfEmpty() {
        return args -> {
            if (questionRepository.count() > 0) {
                return;
            }
            List<Question> seedQuestions = List.of(
                    Question.builder()
                            .questionId("11111111-1111-4111-8111-111111111111")
                            .type(QuestionType.MULTIPLE_CHOICE)
                            .prompt("Laura studies English every day. What does Laura do every day?")
                            .options(List.of("She plays soccer.", "She studies English.", "She watches TV.", "She reads books."))
                            .correctAnswer("She studies English.")
                            .timeLimitSeconds(15)
                            .order(1)
                            .build(),
                    Question.builder()
                            .questionId("22222222-2222-4222-8222-222222222222")
                            .type(QuestionType.MULTIPLE_CHOICE)
                            .prompt("Tom and Peter walk to school every morning. How do they go to school?")
                            .options(List.of("They walk.", "They drive.", "They run.", "They take a bus."))
                            .correctAnswer("They walk.")
                            .timeLimitSeconds(15)
                            .order(2)
                            .build(),
                    Question.builder()
                            .questionId("33333333-3333-4333-8333-333333333333")
                            .type(QuestionType.TEXT_INPUT)
                            .prompt("Write the past tense of the verb \"eat\".")
                            .options(null)
                            .correctAnswer("ate")
                            .timeLimitSeconds(20)
                            .order(3)
                            .build(),
                    Question.builder()
                            .questionId("44444444-4444-4444-8444-444444444444")
                            .type(QuestionType.WORD_BLOCKS)
                            .prompt("Arrange the words to make a sentence about how you feel.")
                            .options(List.of("happy", "I", "am"))
                            .correctAnswer("I am happy")
                            .timeLimitSeconds(20)
                            .order(4)
                            .build(),
                    Question.builder()
                            .questionId("55555555-5555-4555-8555-555555555555")
                            .type(QuestionType.VOICE)
                            .prompt("Say the phrase: \"I am ready to learn\".")
                            .options(null)
                            .correctAnswer("I am ready to learn")
                            .timeLimitSeconds(25)
                            .order(5)
                            .build(),
                    Question.builder()
                            .questionId("90000000-0000-4000-8000-000000000003")
                            .type(QuestionType.MULTIPLE_CHOICE)
                            .prompt("Choose the correct sentence.")
                            .options(List.of("She eat breakfast at seven.", "She eats breakfast at seven.", "She eating breakfast at seven.", "She do eats breakfast at seven."))
                            .correctAnswer("She eats breakfast at seven.")
                            .timeLimitSeconds(15)
                            .order(6)
                            .build(),
                    Question.builder()
                            .questionId("90000000-0000-4000-8000-000000000004")
                            .type(QuestionType.MULTIPLE_CHOICE)
                            .prompt("Anna has a dog. She feeds her dog every morning. What does Anna do every morning?")
                            .options(List.of("She walks to school.", "She feeds her dog.", "She watches television.", "She plays tennis."))
                            .correctAnswer("She feeds her dog.")
                            .timeLimitSeconds(15)
                            .order(7)
                            .build(),
                    Question.builder()
                            .questionId("90000000-0000-4000-8000-000000000005")
                            .type(QuestionType.MULTIPLE_CHOICE)
                            .prompt("David doesn't drink coffee. What does the sentence mean?")
                            .options(List.of("David drinks coffee.", "David likes coffee.", "David doesn't drink coffee.", "David makes coffee."))
                            .correctAnswer("David doesn't drink coffee.")
                            .timeLimitSeconds(15)
                            .order(8)
                            .build(),
                    Question.builder()
                            .questionId("90000000-0000-4000-8000-000000000006")
                            .type(QuestionType.MULTIPLE_CHOICE)
                            .prompt("They _____ play basketball after school.")
                            .options(List.of("doesn't", "don't", "isn't", "aren't"))
                            .correctAnswer("don't")
                            .timeLimitSeconds(15)
                            .order(9)
                            .build(),
                    Question.builder()
                            .questionId("90000000-0000-4000-8000-000000000010")
                            .type(QuestionType.MULTIPLE_CHOICE)
                            .prompt("Sarah plays tennis every Saturday. Does she play tennis every Saturday?")
                            .options(List.of("Yes, she does.", "No, she don't.", "Yes, she is.", "No, she doesn't plays."))
                            .correctAnswer("Yes, she does.")
                            .timeLimitSeconds(15)
                            .order(10)
                            .build()
            );
            questionRepository.saveAll(seedQuestions);
            log.info("Banco inicial de {} preguntas cargado automáticamente para perfil H2.", seedQuestions.size());
        };
    }
}
