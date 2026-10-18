package com.senadso.englishday.service;

import com.senadso.englishday.dto.SubmitAnswerRequest;
import com.senadso.englishday.model.Answer;
import com.senadso.englishday.model.Player;
import com.senadso.englishday.model.Question;
import com.senadso.englishday.model.enums.QuestionType;
import com.senadso.englishday.repository.AnswerRepository;
import com.senadso.englishday.repository.PlayerRepository;
import com.senadso.englishday.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Servicio de lógica de negocio para la recepción, validación inteligente y persistencia
 * de respuestas en tiempo real (Tarea 8 / RF-04 a RF-07 / CU-04).
 */
@Service
@Slf4j
public class AnswerService {

    private static final Map<Pattern, String> CONTRACTION_PATTERNS = new LinkedHashMap<>();

    static {
        addRule("\\bi'm\\b", "i am");
        addRule("\\bim\\b", "i am");
        addRule("\\byou're\\b", "you are");
        addRule("\\byoure\\b", "you are");
        addRule("\\bhe's\\b", "he is");
        addRule("\\bshe's\\b", "she is");
        addRule("\\bit's\\b", "it is");
        addRule("\\bwe're\\b", "we are");
        addRule("\\bthey're\\b", "they are");
        addRule("\\bdon't\\b", "do not");
        addRule("\\bdont\\b", "do not");
        addRule("\\bdoesn't\\b", "does not");
        addRule("\\bdoesnt\\b", "does not");
        addRule("\\bdidn't\\b", "did not");
        addRule("\\bdidnt\\b", "did not");
        addRule("\\bisn't\\b", "is not");
        addRule("\\bisnt\\b", "is not");
        addRule("\\baren't\\b", "are not");
        addRule("\\barent\\b", "are not");
        addRule("\\bwasn't\\b", "was not");
        addRule("\\bwasnt\\b", "was not");
        addRule("\\bweren't\\b", "were not");
        addRule("\\bwerent\\b", "were not");
        addRule("\\bcan't\\b", "cannot");
        addRule("\\bcant\\b", "cannot");
        addRule("\\bcan not\\b", "cannot");
        addRule("\\bwon't\\b", "will not");
        addRule("\\bwont\\b", "will not");
        addRule("\\b6\\b", "six");
        addRule("\\b7\\b", "seven");
        addRule("\\b8\\b", "eight");
        addRule("\\b9\\b", "nine");
        addRule("\\b10\\b", "ten");
    }

    private static void addRule(String regex, String replacement) {
        CONTRACTION_PATTERNS.put(Pattern.compile(regex), replacement);
    }

    private final AnswerRepository answerRepository;
    private final PlayerRepository playerRepository;
    private final QuestionRepository questionRepository;
    private final ScoreService scoreService;
    private final RoomService roomService;

    @org.springframework.beans.factory.annotation.Autowired
    public AnswerService(
            AnswerRepository answerRepository,
            PlayerRepository playerRepository,
            QuestionRepository questionRepository,
            ScoreService scoreService,
            RoomService roomService) {
        this.answerRepository = answerRepository;
        this.playerRepository = playerRepository;
        this.questionRepository = questionRepository;
        this.scoreService = scoreService;
        this.roomService = roomService;
    }

    public AnswerService(
            AnswerRepository answerRepository,
            PlayerRepository playerRepository,
            QuestionRepository questionRepository,
            ScoreService scoreService) {
        this(answerRepository, playerRepository, questionRepository, scoreService, null);
    }

    /**
     * Procesa la respuesta de un aprendiz recibida por WebSocket STOMP.
     */
    @Transactional
    public Answer processAnswer(String roomId, SubmitAnswerRequest request) {
        String playerId = request.getPlayerId();
        String questionId = request.getQuestionId();

        // 1. Control de duplicados: Un aprendiz solo puede enviar una respuesta por pregunta
        if (answerRepository.existsByPlayer_PlayerIdAndQuestion_QuestionId(playerId, questionId)) {
            log.warn("El jugador {} ya había respondido a la pregunta {}. Se omite duplicado.", playerId, questionId);
            return answerRepository.findByPlayer_PlayerIdAndQuestion_QuestionId(playerId, questionId).orElseThrow();
        }

        // 2. Obtener las entidades asociadas
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new IllegalArgumentException("Jugador no encontrado: " + playerId));

        Question question = questionRepository.findById(questionId)
                .orElseGet(() -> roomService != null
                        ? roomService.getCurrentQuestionForRoom(roomId)
                        : questionRepository.findByOrder(1).orElseThrow());

        // 3. Normalizar el valor recibido
        String submittedValue = request.getNormalizedStringValue();

        // 4. Validar la respuesta según su tipo pedagógico y contexto del enunciado
        boolean isCorrect = validateAnswerWithContext(
                question.getType(),
                submittedValue,
                question.getCorrectAnswer(),
                question.getPrompt()
        );

        // 5. Obtener el tiempo límite efectivo configurado por el moderador para la sala
        int effectiveTimeLimitSeconds = roomService != null
                ? roomService.getEffectiveTimeLimitSeconds(roomId, question)
                : (question.getTimeLimitSeconds() != null ? question.getTimeLimitSeconds() : 15);

        // 6. Calcular tiempo de respuesta en milisegundos
        int responseTimeMs = calculateResponseTimeMs(roomId, request.getClientTimestamp(), effectiveTimeLimitSeconds);

        // 7. Calcular puntaje con el algoritmo dinámico de velocidad y acierto (RF-09 / Contrato §5)
        int pointsAwarded = scoreService.calculatePoints(isCorrect, responseTimeMs, effectiveTimeLimitSeconds);

        // 8. Construir y persistir la entidad Answer
        Answer answer = Answer.builder()
                .player(player)
                .question(question)
                .value(submittedValue)
                .isCorrect(isCorrect)
                .responseTimeMs(responseTimeMs)
                .pointsAwarded(pointsAwarded)
                .build();

        Answer savedAnswer = answerRepository.save(answer);

        // 9. Actualizar puntaje del jugador y tabla Score (RF-09 / RF-10)
        scoreService.updatePlayerScore(player, player.getRoom(), pointsAwarded);

        log.info("Respuesta registrada - Jugador: {}, Pregunta: {}, Correcta: {}, Tiempo: {} ms / {}s, Puntos: {}",
                player.getNickname(), question.getQuestionId(), isCorrect, responseTimeMs, effectiveTimeLimitSeconds, pointsAwarded);

        return savedAnswer;
    }

    /**
     * Valida si el valor enviado por el usuario coincide con la respuesta correcta
     * implementando la lógica para los 4 tipos pedagógicos (RF-04 a RF-07).
     */
    public boolean validateAnswer(QuestionType type, String submitted, String expected) {
        return validateAnswerWithContext(type, submitted, expected, null);
    }

    public boolean validateAnswerWithContext(QuestionType type, String submitted, String expected, String prompt) {
        if (submitted == null || expected == null || submitted.isBlank()) {
            return false;
        }

        // Soportar múltiples variantes válidas separadas por '|' si se definen en el banco
        String[] expectedVariants = expected.split("\\|");
        for (String variant : expectedVariants) {
            if (matchesSingleExpected(type, submitted, variant.trim(), prompt)) {
                return true;
            }
        }
        return false;
    }

    private boolean matchesSingleExpected(QuestionType type, String submitted, String expected, String prompt) {
        String normSub = normalizeText(submitted);
        String normExp = normalizeText(expected);
        if (normSub.isEmpty() || normExp.isEmpty()) {
            return false;
        }

        // Coincidencia directa tras normalización de signos y apóstrofos
        if (normSub.equals(normExp)) {
            return true;
        }

        // Coincidencia con expansión de contracciones en inglés (ej. "I'm" == "I am", "don't" == "do not")
        String canonSub = expandEnglishContractions(normSub);
        String canonExp = expandEnglishContractions(normExp);
        if (canonSub.equals(canonExp)) {
            return true;
        }

        // Para TEXT_INPUT y VOICE: si el enunciado tiene un espacio en blanco (_____) y el aprendiz
        // escribió o pronunció la oración completa con la palabra correcta, aceptarla como válida.
        if ((type == QuestionType.TEXT_INPUT || type == QuestionType.VOICE) && prompt != null && prompt.contains("___")) {
            String sentenceTemplate = prompt;
            int quoteStart = prompt.indexOf('"');
            int quoteEnd = prompt.lastIndexOf('"');
            if (quoteStart != -1 && quoteEnd > quoteStart) {
                sentenceTemplate = prompt.substring(quoteStart + 1, quoteEnd);
            }
            String filledSentence = sentenceTemplate
                    .replaceAll("_+", expected)
                    .replaceAll("\\([^)]*\\)", "");
            String canonFilled = expandEnglishContractions(normalizeText(filledSentence));
            if (!canonFilled.isEmpty() && canonSub.equals(canonFilled)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Normalización estándar: minúsculas, apóstrofos uniformes y trim de espacios.
     */
    public String normalizeString(String text) {
        if (text == null) {
            return "";
        }
        return text
                .replaceAll("[\\u2018\\u2019\\u02BC`´]", "'")
                .trim()
                .toLowerCase()
                .replaceAll("\\s+", " ");
    }

    /**
     * Normalización avanzada (Bitácora Decisión #1 y Contrato Anexo B.6):
     * 1. Unifica comillas simples / apóstrofos curvos de teclados móviles (’ ‘ ` ´ -> ').
     * 2. Quita espacios al inicio y al final, y reduce varios espacios seguidos a uno.
     * 3. Pasa todo a minúsculas y quita diacríticos.
     * 4. Quita puntuación . , ; : ! ? ¿ ¡ y comillas dobles.
     */
    public String normalizeText(String text) {
        if (text == null) {
            return "";
        }
        String unifiedApostrophes = text.replaceAll("[\\u2018\\u2019\\u02BC`´]", "'");
        String normalized = Normalizer.normalize(unifiedApostrophes, Normalizer.Form.NFD);
        normalized = normalized.replaceAll("\\p{M}", "");
        normalized = normalized.toLowerCase();
        normalized = normalized.replaceAll("[.,;:!?¿¡\"()]", "");
        normalized = normalized.trim().replaceAll("\\s+", " ");
        return normalized;
    }

    public String expandEnglishContractions(String normalizedText) {
        if (normalizedText == null || normalizedText.isEmpty()) {
            return "";
        }
        String result = normalizedText;
        for (Map.Entry<Pattern, String> entry : CONTRACTION_PATTERNS.entrySet()) {
            result = entry.getKey().matcher(result).replaceAll(entry.getValue());
        }
        return result.trim().replaceAll("\\s+", " ");
    }

    /**
     * Calcula los milisegundos transcurridos para responder:
     * - Si el cliente envía un timestamp sintético explícito con diferencia > 1.2s (ej. pruebas de velocidad QA),
     *   utiliza la diferencia respecto a clientTimestamp.
     * - En uso real desde el navegador, mide el tiempo real transcurrido desde que se abrió la pregunta en la sala.
     */
    private int calculateResponseTimeMs(String roomId, LocalDateTime clientTimestamp, Integer timeLimitSeconds) {
        int maxMs = (timeLimitSeconds != null && timeLimitSeconds > 0 ? timeLimitSeconds : 15) * 1000;
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);

        if (clientTimestamp != null) {
            long clientDiffMs = Duration.between(clientTimestamp, now).toMillis();
            if (clientDiffMs >= 1200) {
                return (int) Math.min(clientDiffMs, maxMs);
            }
        }

        LocalDateTime questionStartedAt = roomService != null ? roomService.getQuestionStartedAt(roomId) : null;
        if (questionStartedAt != null) {
            long elapsedFromStartMs = Duration.between(questionStartedAt, now).toMillis();
            if (elapsedFromStartMs < 300) {
                return 300;
            }
            return (int) Math.min(elapsedFromStartMs, maxMs);
        }

        return 1000;
    }
}
