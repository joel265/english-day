package com.senadso.englishday.service;

import com.senadso.englishday.dto.SubmitAnswerRequest;
import com.senadso.englishday.model.Answer;
import com.senadso.englishday.model.Player;
import com.senadso.englishday.model.Question;
import com.senadso.englishday.model.enums.QuestionType;
import com.senadso.englishday.repository.AnswerRepository;
import com.senadso.englishday.repository.PlayerRepository;
import com.senadso.englishday.repository.QuestionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Servicio de lógica de negocio para la recepción, validación inteligente y persistencia
 * de respuestas en tiempo real (Tarea 8 / RF-04 a RF-07 / CU-04).
 * Incluye tolerancia ortográfica/fonética para respuestas escritas (TEXT_INPUT) y habladas (VOICE),
 * así como validación de cláusulas parciales con sentido gramatical en bloques (WORD_BLOCKS).
 */
@Service
@Slf4j
public class AnswerService {

    private static final Map<Pattern, String> CONTRACTION_PATTERNS = new LinkedHashMap<>();

    /**
     * Grupos de palabras gramaticalmente excluyentes entre sí: no deben confundirse como
     * "errores de escritura" por distancia de edición (ej. lives vs lived, he vs she, is vs are).
     */
    private static final List<Set<String>> CONFLICTING_GRAMMAR_GROUPS = List.of(
            Set.of("i", "he", "she", "it", "we", "you", "they", "me", "him", "her", "us", "them"),
            Set.of("my", "your", "his", "her", "its", "our", "their"),
            Set.of("am", "is", "are", "was", "were", "be", "been"),
            Set.of("do", "does", "did", "done"),
            Set.of("have", "has", "had"),
            Set.of("what", "where", "when", "who", "why", "which", "whose", "how"),
            Set.of("live", "lives", "lived", "living"),
            Set.of("study", "studies", "studied", "studying"),
            Set.of("play", "plays", "played", "playing"),
            Set.of("work", "works", "worked", "working"),
            Set.of("read", "reads", "reading"),
            Set.of("speak", "speaks", "spoke", "speaking"),
            Set.of("eat", "eats", "ate", "eating"),
            Set.of("go", "goes", "went", "going"),
            Set.of("like", "likes", "liked"),
            Set.of("know", "knows", "knew"),
            Set.of("help", "helps", "helped")
    );

    /**
     * Palabras funcionales que no pueden quedar colgando al final de una oración parcial en WORD_BLOCKS.
     */
    private static final Set<String> DANGLING_END_TOKENS = Set.of(
            "i", "you", "he", "she", "it", "we", "they",
            "am", "is", "are", "was", "were", "do", "does", "did", "not",
            "my", "your", "his", "her", "its", "our", "their",
            "a", "an", "the", "to", "in", "on", "at", "for", "with", "of",
            "very", "every", "right", "what", "where", "when", "who", "why", "how"
    );

    private static final Set<String> CLAUSE_VERBS_AND_AUXILIARIES = Set.of(
            "am", "is", "are", "was", "were",
            "do", "does", "did",
            "study", "studies", "studying",
            "play", "plays", "playing",
            "work", "works", "working",
            "read", "reads", "reading",
            "speak", "speaks", "speaking",
            "learn", "learns", "learning",
            "watch", "watches", "watching",
            "live", "lives", "living",
            "like", "likes", "know", "knows", "help", "helps",
            "eat", "eats", "ate", "go", "goes", "went", "walk", "walks", "feeds", "drink", "drinks"
    );

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
        addRule("\\bwhat's\\b", "what is");
        addRule("\\bwhats\\b", "what is");
        addRule("\\bwhere's\\b", "where is");
        addRule("\\bwheres\\b", "where is");
        addRule("\\bwho's\\b", "who is");
        addRule("\\bwhos\\b", "who is");
        addRule("\\bhow's\\b", "how is");
        addRule("\\bthat's\\b", "that is");
        addRule("\\bthere's\\b", "there is");
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

        // 1. Coincidencia directa tras normalización de signos y apóstrofos
        if (normSub.equals(normExp)) {
            return true;
        }

        // 2. Coincidencia con expansión de contracciones en inglés (ej. "I'm" == "I am", "don't" == "do not")
        String canonSub = expandEnglishContractions(normSub);
        String canonExp = expandEnglishContractions(normExp);
        if (canonSub.equals(canonExp)) {
            return true;
        }

        // 3. Para TEXT_INPUT y VOICE: si el enunciado tiene un espacio en blanco (_____) y el aprendiz
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
                    .replaceAll("\\([^)]*\\)", "")
                    .replaceAll("\\[[^]]*\\]", "");
            String canonFilled = expandEnglishContractions(normalizeText(filledSentence));
            if (!canonFilled.isEmpty() && (canonSub.equals(canonFilled) || matchesFuzzyTextOrVoice(canonSub, canonFilled))) {
                return true;
            }
        }

        // 4. Para WORD_BLOCKS: aceptar si el aprendiz construye una parte de los bloques que tiene sentido
        // gramatical completo (Sujeto + Verbo/Auxiliar + Complemento en orden sintáctico válido)
        // o mueve adverbios de tiempo al inicio/final.
        if (type == QuestionType.WORD_BLOCKS) {
            return matchesWordBlocksWithSense(canonSub, canonExp);
        }

        // 5. Para TEXT_INPUT y VOICE: permitir margen de error ortográfico / fonético leve (Damerau-Levenshtein)
        // sin confundir tiempos verbales ni pronombres distintos.
        if (type == QuestionType.TEXT_INPUT || type == QuestionType.VOICE) {
            return matchesFuzzyTextOrVoice(canonSub, canonExp);
        }

        return false;
    }

    /**
     * Valida si los bloques seleccionados por el aprendiz en WORD_BLOCKS forman una oración o cláusula
     * gramaticalmente coherente respecto a la oración objetivo:
     * - Permite mover modificadores de tiempo/modo al inicio o al final ("Today I am happy" == "I am happy today").
     * - Permite construir una sub-oración con sentido gramatical completo (p. ej. "I am happy" de "I am happy today",
     *   "She studies English" de "She studies English every day", "Our classroom is big" de "Our classroom is very big")
     *   siempre que mantenga el orden sintáctico Sujeto -> Verbo -> Complemento, incluya el verbo de la oración
     *   y no termine en una palabra funcional incompleta.
     */
    public boolean matchesWordBlocksWithSense(String canonSub, String canonExp) {
        String strippedSub = stripOptionalModifiers(canonSub);
        String strippedExp = stripOptionalModifiers(canonExp);
        if (!strippedSub.isEmpty() && strippedSub.equals(strippedExp)) {
            return true;
        }

        List<String> subTokens = Arrays.asList(canonSub.split("\\s+"));
        List<String> expTokens = Arrays.asList(canonExp.split("\\s+"));

        if (subTokens.size() < 3 || expTokens.size() < 4) {
            return false;
        }

        // No debe terminar en un pronombre, auxiliar, preposición o artículo suelto
        String lastToken = subTokens.get(subTokens.size() - 1);
        if (DANGLING_END_TOKENS.contains(lastToken)) {
            return false;
        }

        // Verificar que la polaridad negativa ("not") se conserve si existe en la oración objetivo
        if (expTokens.contains("not") != subTokens.contains("not")) {
            return false;
        }

        // Debe contener al menos un verbo o auxiliar principal presente en la oración esperada
        boolean hasVerb = subTokens.stream().anyMatch(CLAUSE_VERBS_AND_AUXILIARIES::contains);
        if (!hasVerb) {
            return false;
        }

        // Verificar que todos los bloques enviados pertenezcan a la oración esperada en orden sintáctico estrictamente creciente
        int expIdx = 0;
        List<Integer> matchedIndices = new ArrayList<>();
        for (String token : subTokens) {
            int foundAt = -1;
            for (int j = expIdx; j < expTokens.size(); j++) {
                if (expTokens.get(j).equals(token)) {
                    foundAt = j;
                    break;
                }
            }
            if (foundAt == -1) {
                return false;
            }
            matchedIndices.add(foundAt);
            expIdx = foundAt + 1;
        }

        // Debe conservar el inicio de la estructura (sujeto o auxiliar/WH inicial en índice 0)
        // y cubrir al menos el 60% de los bloques de la oración objetivo.
        boolean startsWithMainSubjectOrWh = matchedIndices.get(0) == 0;
        boolean hasEnoughBlocks = subTokens.size() >= Math.max(3, (int) Math.ceil(expTokens.size() * 0.6));
        return startsWithMainSubjectOrWh && hasEnoughBlocks;
    }

    private String stripOptionalModifiers(String sentence) {
        return sentence
                .replaceAll("\\b(right now|every day|every morning|in the morning|after school|very well|today|now|fluently|very)\\b", "")
                .trim()
                .replaceAll("\\s+", " ");
    }

    /**
     * Evalúa margen de error de escritura (TEXT_INPUT) o pronunciación (VOICE):
     * - Normaliza errores ortográficos frecuentes en inglés (-ys -> -ies, -ing con consonante simple/doble, -in -> -ing).
     * - Permite distancia de edición Damerau-Levenshtein <= 1 en palabras de 4 a 7 letras y <= 2 en palabras de 8+ letras,
     *   protegiendo palabras gramaticalmente opuestas o de distinto tiempo verbal (ej. lives != lived, he != she, is != are).
     */
    public boolean matchesFuzzyTextOrVoice(String canonSub, String canonExp) {
        String[] subTokens = canonSub.split("\\s+");
        String[] expTokens = canonExp.split("\\s+");

        // Conservar polaridad ("not")
        boolean subHasNot = Arrays.asList(subTokens).contains("not");
        boolean expHasNot = Arrays.asList(expTokens).contains("not");
        if (subHasNot != expHasNot) {
            return false;
        }

        if (subTokens.length == 1 && expTokens.length == 1) {
            return isTokenFuzzyMatch(subTokens[0], expTokens[0]);
        }

        // Si tienen la misma cantidad de palabras, verificar palabra por palabra con margen ortográfico
        if (subTokens.length == expTokens.length) {
            int fuzzyCount = 0;
            for (int i = 0; i < expTokens.length; i++) {
                if (subTokens[i].equals(expTokens[i])) {
                    continue;
                }
                if (isTokenFuzzyMatch(subTokens[i], expTokens[i])) {
                    fuzzyCount++;
                } else {
                    return false;
                }
            }
            int maxFuzzyWords = expTokens.length <= 3 ? 1 : 2;
            return fuzzyCount <= maxFuzzyWords;
        }

        // Si difieren en 1 palabra en frases de 4+ palabras (p. ej. artículo u omisión menor en voz),
        // verificar alineación secuencial >= 80% sin conflictos gramaticales
        if (expTokens.length >= 4 && Math.abs(subTokens.length - expTokens.length) == 1) {
            for (String sTok : subTokens) {
                for (String eTok : expTokens) {
                    if (areConflictingGrammarTokens(sTok, eTok) && !Arrays.asList(expTokens).contains(sTok)) {
                        return false;
                    }
                }
            }
            int matched = 0;
            int sIdx = 0;
            for (String eTok : expTokens) {
                for (int j = sIdx; j < subTokens.length; j++) {
                    if (isTokenFuzzyMatch(subTokens[j], eTok)) {
                        matched++;
                        sIdx = j + 1;
                        break;
                    }
                }
            }
            return matched >= expTokens.length - 1;
        }

        return false;
    }

    private boolean isTokenFuzzyMatch(String subToken, String expToken) {
        if (subToken.equals(expToken)) {
            return true;
        }
        if (areConflictingGrammarTokens(subToken, expToken)) {
            return false;
        }

        String normLearnerSub = normalizeLearnerSpelling(subToken);
        String normLearnerExp = normalizeLearnerSpelling(expToken);
        if (normLearnerSub.equals(normLearnerExp)) {
            return true;
        }

        int len = expToken.length();
        if (len <= 2 || subToken.length() <= 2) {
            return false;
        }

        int dist = damerauLevenshtein(subToken, expToken);
        if (len == 3) {
            // Para palabras de 3 letras (ej. "are" -> "aer", "our" -> "oru"), solo permitir transposición/typo
            // si comparten la primera letra y no son palabras gramaticales conflictivas
            return dist == 1 && subToken.charAt(0) == expToken.charAt(0);
        }
        if (len <= 7) {
            return dist <= 1;
        }
        return dist <= 2;
    }

    private boolean areConflictingGrammarTokens(String a, String b) {
        if (a.equals(b)) {
            return false;
        }
        for (Set<String> group : CONFLICTING_GRAMMAR_GROUPS) {
            if (group.contains(a) && group.contains(b)) {
                return true;
            }
        }
        return false;
    }

    private String normalizeLearnerSpelling(String word) {
        String w = word;
        if (w.endsWith("ys") && w.length() >= 4) {
            w = w.substring(0, w.length() - 2) + "ies";
        }
        if (w.endsWith("in") && w.length() >= 5) {
            w = w + "g";
        }
        w = w.replace("studing", "studying")
                .replace("writting", "writing")
                .replace("runing", "running")
                .replace("swiming", "swimming")
                .replace("comming", "coming")
                .replace("thier", "their")
                .replace("freind", "friend")
                .replace("frends", "friends");
        return w;
    }

    /**
     * Distancia de edición Damerau-Levenshtein (inserción, eliminación, sustitución y transposición adyacente).
     */
    public int damerauLevenshtein(String a, String b) {
        int lenA = a.length();
        int lenB = b.length();
        int[][] dp = new int[lenA + 1][lenB + 1];

        for (int i = 0; i <= lenA; i++) dp[i][0] = i;
        for (int j = 0; j <= lenB; j++) dp[0][j] = j;

        for (int i = 1; i <= lenA; i++) {
            for (int j = 1; j <= lenB; j++) {
                int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                dp[i][j] = Math.min(
                        Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1),
                        dp[i - 1][j - 1] + cost
                );
                if (i > 1 && j > 1
                        && a.charAt(i - 1) == b.charAt(j - 2)
                        && a.charAt(i - 2) == b.charAt(j - 1)) {
                    dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
                }
            }
        }
        return dp[lenA][lenB];
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
