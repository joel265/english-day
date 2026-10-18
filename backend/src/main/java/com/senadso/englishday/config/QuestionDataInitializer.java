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
 * Refactorizado en torno a las 6 temáticas oficiales solicitadas:
 * 1. Pronouns
 * 2. Verb To Be
 * 3. Possessive Adjectives
 * 4. Simple Present (Affirmative, Negative, Interrogative)
 * 5. Present Continuous (Affirmative, Negative, Interrogative)
 * 6. WH Questions
 * Distribuidas en las 4 mecánicas interactivas (MULTIPLE_CHOICE, TEXT_INPUT, WORD_BLOCKS, VOICE).
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
                    // 1. Simple Present (Affirmative) - MULTIPLE_CHOICE (order 1)
                    Question.builder()
                            .questionId("11111111-1111-4111-8111-111111111111")
                            .type(QuestionType.MULTIPLE_CHOICE)
                            .prompt("[Simple Present · Affirmative] Laura studies English every day. What does Laura do every day?")
                            .options(List.of("She plays soccer.", "She studies English.", "She watches TV.", "She reads books."))
                            .correctAnswer("She studies English.")
                            .timeLimitSeconds(15)
                            .order(1)
                            .build(),

                    // 2. Verb To Be (Affirmative) - MULTIPLE_CHOICE (order 2)
                    Question.builder()
                            .questionId("22222222-2222-4222-8222-222222222222")
                            .type(QuestionType.MULTIPLE_CHOICE)
                            .prompt("[Verb To Be] Choose the correct form of Verb To Be: \"They _____ students at SENA.\"")
                            .options(List.of("am", "is", "are", "be"))
                            .correctAnswer("are")
                            .timeLimitSeconds(15)
                            .order(2)
                            .build(),

                    // 3. Simple Present (Affirmative) - TEXT_INPUT (order 3)
                    Question.builder()
                            .questionId("33333333-3333-4333-8333-333333333333")
                            .type(QuestionType.TEXT_INPUT)
                            .prompt("[Simple Present · Affirmative] Complete with the correct Simple Present verb form: \"She _____ (study) English every day.\"")
                            .options(null)
                            .correctAnswer("studies|she studies english every day|she studies english")
                            .timeLimitSeconds(20)
                            .order(3)
                            .build(),

                    // 4. Verb To Be (Affirmative) - WORD_BLOCKS (order 4)
                    Question.builder()
                            .questionId("44444444-4444-4444-8444-444444444444")
                            .type(QuestionType.WORD_BLOCKS)
                            .prompt("[Verb To Be] Arrange the words to make a sentence with the Verb To Be.")
                            .options(List.of("happy", "I", "am", "today"))
                            .correctAnswer("I am happy today|I am happy|Today I am happy")
                            .timeLimitSeconds(20)
                            .order(4)
                            .build(),

                    // 5. Verb To Be (Affirmative) - VOICE (order 5)
                    Question.builder()
                            .questionId("55555555-5555-4555-8555-555555555555")
                            .type(QuestionType.VOICE)
                            .prompt("[Verb To Be] Say the phrase: \"I am ready to learn\".")
                            .options(null)
                            .correctAnswer("I am ready to learn")
                            .timeLimitSeconds(25)
                            .order(5)
                            .build(),

                    // 6. Pronouns - MULTIPLE_CHOICE (order 6)
                    Question.builder()
                            .questionId("90000000-0000-4000-8000-000000000003")
                            .type(QuestionType.MULTIPLE_CHOICE)
                            .prompt("[Pronouns] Maria is my classmate. _____ is very intelligent.")
                            .options(List.of("He", "She", "They", "It"))
                            .correctAnswer("She")
                            .timeLimitSeconds(15)
                            .order(6)
                            .build(),

                    // 7. Pronouns - TEXT_INPUT (order 7)
                    Question.builder()
                            .questionId("33333333-3333-4333-8333-333333333334")
                            .type(QuestionType.TEXT_INPUT)
                            .prompt("[Pronouns] Write the subject pronoun for 'Carlos and I': \"_____ are good friends.\"")
                            .options(null)
                            .correctAnswer("We|we are good friends")
                            .timeLimitSeconds(20)
                            .order(7)
                            .build(),

                    // 8. Pronouns - WORD_BLOCKS (order 8)
                    Question.builder()
                            .questionId("44444444-4444-4444-8444-444444444445")
                            .type(QuestionType.WORD_BLOCKS)
                            .prompt("[Pronouns] Arrange the words to form a sentence with subject and object pronouns.")
                            .options(List.of("helps", "She", "every", "us", "day"))
                            .correctAnswer("She helps us every day|She helps us|Every day she helps us")
                            .timeLimitSeconds(20)
                            .order(8)
                            .build(),

                    // 9. Pronouns - VOICE (order 9)
                    Question.builder()
                            .questionId("55555555-5555-4555-8555-555555555556")
                            .type(QuestionType.VOICE)
                            .prompt("[Pronouns] Say the sentence: \"They are my best friends\".")
                            .options(null)
                            .correctAnswer("They are my best friends")
                            .timeLimitSeconds(25)
                            .order(9)
                            .build(),

                    // 10. Verb To Be - TEXT_INPUT (order 10)
                    Question.builder()
                            .questionId("33333333-3333-4333-8333-333333333335")
                            .type(QuestionType.TEXT_INPUT)
                            .prompt("[Verb To Be] Complete with the Verb To Be (am, is, are): \"He _____ a software developer.\"")
                            .options(null)
                            .correctAnswer("is|he is a software developer")
                            .timeLimitSeconds(20)
                            .order(10)
                            .build(),

                    // 11. Possessive Adjectives - MULTIPLE_CHOICE (order 11)
                    Question.builder()
                            .questionId("90000000-0000-4000-8000-000000000004")
                            .type(QuestionType.MULTIPLE_CHOICE)
                            .prompt("[Possessive Adjectives] David has a new laptop. _____ laptop is very fast.")
                            .options(List.of("Her", "His", "Their", "Our"))
                            .correctAnswer("His")
                            .timeLimitSeconds(15)
                            .order(11)
                            .build(),

                    // 12. Possessive Adjectives - TEXT_INPUT (order 12)
                    Question.builder()
                            .questionId("33333333-3333-4333-8333-333333333336")
                            .type(QuestionType.TEXT_INPUT)
                            .prompt("[Possessive Adjectives] Write the possessive adjective for 'I': \"I love _____ family.\"")
                            .options(null)
                            .correctAnswer("my|i love my family")
                            .timeLimitSeconds(20)
                            .order(12)
                            .build(),

                    // 13. Possessive Adjectives - WORD_BLOCKS (order 13)
                    Question.builder()
                            .questionId("44444444-4444-4444-8444-444444444446")
                            .type(QuestionType.WORD_BLOCKS)
                            .prompt("[Possessive Adjectives] Arrange the words to form a sentence with a possessive adjective.")
                            .options(List.of("is", "Our", "classroom", "very", "big"))
                            .correctAnswer("Our classroom is very big|Our classroom is big")
                            .timeLimitSeconds(20)
                            .order(13)
                            .build(),

                    // 14. Possessive Adjectives - VOICE (order 14)
                    Question.builder()
                            .questionId("55555555-5555-4555-8555-555555555557")
                            .type(QuestionType.VOICE)
                            .prompt("[Possessive Adjectives] Say the sentence: \"This is our English class\".")
                            .options(null)
                            .correctAnswer("This is our English class")
                            .timeLimitSeconds(25)
                            .order(14)
                            .build(),

                    // 15. Simple Present (Negative) - MULTIPLE_CHOICE (order 15)
                    Question.builder()
                            .questionId("90000000-0000-4000-8000-000000000006")
                            .type(QuestionType.MULTIPLE_CHOICE)
                            .prompt("[Simple Present · Negative] They _____ play basketball after school.")
                            .options(List.of("doesn't", "don't", "isn't", "aren't"))
                            .correctAnswer("don't")
                            .timeLimitSeconds(15)
                            .order(15)
                            .build(),

                    // 16. Simple Present (Negative) - WORD_BLOCKS (order 16)
                    Question.builder()
                            .questionId("44444444-4444-4444-8444-444444444447")
                            .type(QuestionType.WORD_BLOCKS)
                            .prompt("[Simple Present · Negative] Arrange the words to form a negative sentence in Simple Present.")
                            .options(List.of("like", "He", "pizza", "doesn't", "today"))
                            .correctAnswer("He doesn't like pizza today|He doesn't like pizza|Today he doesn't like pizza")
                            .timeLimitSeconds(20)
                            .order(16)
                            .build(),

                    // 17. Simple Present (Interrogative) - WORD_BLOCKS (order 17)
                    Question.builder()
                            .questionId("44444444-4444-4444-8444-444444444448")
                            .type(QuestionType.WORD_BLOCKS)
                            .prompt("[Simple Present · Interrogative] Arrange the words to form an interrogative sentence in Simple Present.")
                            .options(List.of("speak", "you", "English", "Do", "every day"))
                            .correctAnswer("Do you speak English every day|Do you speak English")
                            .timeLimitSeconds(20)
                            .order(17)
                            .build(),

                    // 18. Present Continuous (Affirmative) - MULTIPLE_CHOICE (order 18)
                    Question.builder()
                            .questionId("90000000-0000-4000-8000-000000000005")
                            .type(QuestionType.MULTIPLE_CHOICE)
                            .prompt("[Present Continuous · Affirmative] Look! The students _____ English right now.")
                            .options(List.of("is speaking", "are speaking", "speaks", "speak"))
                            .correctAnswer("are speaking")
                            .timeLimitSeconds(15)
                            .order(18)
                            .build(),

                    // 19. Present Continuous (Negative) - MULTIPLE_CHOICE (order 19)
                    Question.builder()
                            .questionId("90000000-0000-4000-8000-000000000010")
                            .type(QuestionType.MULTIPLE_CHOICE)
                            .prompt("[Present Continuous · Negative] Choose the correct negative sentence in Present Continuous.")
                            .options(List.of(
                                    "He isn't watching TV right now.",
                                    "He don't watching TV right now.",
                                    "He not watching TV right now.",
                                    "He aren't watching TV right now."
                            ))
                            .correctAnswer("He isn't watching TV right now.")
                            .timeLimitSeconds(15)
                            .order(19)
                            .build(),

                    // 20. Present Continuous (Affirmative) - TEXT_INPUT (order 20)
                    Question.builder()
                            .questionId("33333333-3333-4333-8333-333333333337")
                            .type(QuestionType.TEXT_INPUT)
                            .prompt("[Present Continuous · Affirmative] Write the -ing form of the verb \"read\": \"She is _____ a book right now.\"")
                            .options(null)
                            .correctAnswer("reading|she is reading a book right now|she is reading")
                            .timeLimitSeconds(20)
                            .order(20)
                            .build(),

                    // 21. Present Continuous (Interrogative) - WORD_BLOCKS (order 21)
                    Question.builder()
                            .questionId("44444444-4444-4444-8444-444444444449")
                            .type(QuestionType.WORD_BLOCKS)
                            .prompt("[Present Continuous · Interrogative] Arrange the words to form a question in Present Continuous.")
                            .options(List.of("studying", "Are", "English", "they", "now"))
                            .correctAnswer("Are they studying English now|Are they studying English|Are they studying now")
                            .timeLimitSeconds(20)
                            .order(21)
                            .build(),

                    // 22. Present Continuous (Affirmative) - VOICE (order 22)
                    Question.builder()
                            .questionId("55555555-5555-4555-8555-555555555558")
                            .type(QuestionType.VOICE)
                            .prompt("[Present Continuous · Affirmative] Say the sentence: \"We are learning English right now\".")
                            .options(null)
                            .correctAnswer("We are learning English right now")
                            .timeLimitSeconds(25)
                            .order(22)
                            .build(),

                    // 23. WH Question - MULTIPLE_CHOICE (order 23)
                    Question.builder()
                            .questionId("90000000-0000-4000-8000-000000000020")
                            .type(QuestionType.MULTIPLE_CHOICE)
                            .prompt("[WH Question] _____ is your name?")
                            .options(List.of("Where", "What", "When", "Who"))
                            .correctAnswer("What")
                            .timeLimitSeconds(15)
                            .order(23)
                            .build(),

                    // 24. WH Question - VOICE (order 24)
                    Question.builder()
                            .questionId("55555555-5555-4555-8555-555555555559")
                            .type(QuestionType.VOICE)
                            .prompt("[WH Question] Say the question: \"Where are you from\".")
                            .options(null)
                            .correctAnswer("Where are you from")
                            .timeLimitSeconds(25)
                            .order(24)
                            .build()
            );
            questionRepository.saveAll(seedQuestions);
            log.info("Banco inicial de {} preguntas cargado automáticamente para perfil H2.", seedQuestions.size());
        };
    }
}
