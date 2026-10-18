package com.senadso.englishday.service;

import com.senadso.englishday.dto.AnswerSegmentDto;
import com.senadso.englishday.model.Question;
import com.senadso.englishday.model.enums.QuestionType;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Corrector pedagógico: compara palabra por palabra la respuesta del aprendiz con la respuesta esperada
 * (alineación de edición tipo Levenshtein sobre palabras) para marcar qué parte falló, y construye
 * la breve explicación de por qué la respuesta correcta es la que es.
 */
public final class AnswerFeedbackBuilder {

    public static final String OK = "OK";
    public static final String TYPO = "TYPO";
    public static final String WRONG = "WRONG";
    public static final String MISSING = "MISSING";

    private static final int COST_TYPO = 1;
    private static final int COST_SUBSTITUTION = 3;
    private static final int COST_INDEL = 2;

    /**
     * Banco de explicaciones por pregunta sembrada (questionId -> explicación en español).
     */
    private static final Map<String, String> QUESTION_EXPLANATIONS = Map.ofEntries(
            Map.entry("11111111-1111-4111-8111-111111111111",
                    "El texto dice «Laura studies English every day». En Simple Present, la 3.ª persona (he/she/it) añade -s al verbo: studies."),
            Map.entry("22222222-2222-4222-8222-222222222222",
                    "«They» es plural y el Verb To Be que va con they/we/you es «are». «Am» solo se usa con I, y «is» con he/she/it."),
            Map.entry("33333333-3333-4333-8333-333333333333",
                    "Con «she» (3.ª persona singular) el verbo en Simple Present lleva -s/-es. Study termina en consonante + y, así que la y cambia a -ies: studies."),
            Map.entry("44444444-4444-4444-8444-444444444444",
                    "Con «I» el Verb To Be es «am». La estructura afirmativa es Sujeto + To Be + complemento: I am happy (today)."),
            Map.entry("55555555-5555-4555-8555-555555555555",
                    "Con «I» usamos «am» (I am = I'm). «Ready to learn» completa la idea: I am ready to learn."),
            Map.entry("90000000-0000-4000-8000-000000000003",
                    "María es mujer, por eso el pronombre sujeto es «She». «He» es para hombres, «they» para plural e «it» para cosas o animales."),
            Map.entry("33333333-3333-4333-8333-333333333334",
                    "«Carlos and I» incluye al hablante y a otra persona; el pronombre sujeto que los reemplaza es «We» (nosotros)."),
            Map.entry("44444444-4444-4444-8444-444444444445",
                    "Orden: sujeto (She) + verbo con -s (helps) + pronombre objeto (us) + tiempo (every day). «Us» es el pronombre objeto de «we»."),
            Map.entry("55555555-5555-4555-8555-555555555556",
                    "«They» reemplaza a varias personas; su To Be es «are» y «friends» va en plural porque son varios amigos."),
            Map.entry("33333333-3333-4333-8333-333333333335",
                    "Con «he» el Verb To Be es «is»: He is a software developer."),
            Map.entry("90000000-0000-4000-8000-000000000004",
                    "David es hombre, así que el adjetivo posesivo es «His» (su, de él). «Her» es de ella, «their» de ellos y «our» de nosotros."),
            Map.entry("33333333-3333-4333-8333-333333333336",
                    "El adjetivo posesivo de «I» es «my» (mi) y va antes del sustantivo: I love my family."),
            Map.entry("44444444-4444-4444-8444-444444444446",
                    "«Our» (nuestro) va antes del sustantivo (classroom); luego el verbo «is» y el adjetivo: Our classroom is (very) big."),
            Map.entry("55555555-5555-4555-8555-555555555557",
                    "«Our» es el adjetivo posesivo de «we» y va antes del sustantivo: This is our English class."),
            Map.entry("90000000-0000-4000-8000-000000000006",
                    "Con «they» (plural) el auxiliar negativo del Simple Present es «don't». «Doesn't» es para he/she/it; isn't/aren't pertenecen al verbo To Be."),
            Map.entry("44444444-4444-4444-8444-444444444447",
                    "Negativo en Simple Present con «he»: Sujeto + doesn't + verbo base (sin -s) + complemento: He doesn't like pizza."),
            Map.entry("44444444-4444-4444-8444-444444444448",
                    "Pregunta en Simple Present: Do + sujeto + verbo base + complemento: Do you speak English?"),
            Map.entry("90000000-0000-4000-8000-000000000005",
                    "«Look!» y «right now» indican una acción en este momento: Present Continuous = To Be + verbo-ing. «The students» es plural, así que: are speaking."),
            Map.entry("90000000-0000-4000-8000-000000000010",
                    "Negativo en Present Continuous: sujeto + To Be + not + verbo-ing. Con «he» es «isn't watching»."),
            Map.entry("33333333-3333-4333-8333-333333333337",
                    "El Present Continuous usa verbo + -ing: read → reading. Por eso: She is reading a book."),
            Map.entry("44444444-4444-4444-8444-444444444449",
                    "Pregunta en Present Continuous: To Be + sujeto + verbo-ing: Are they studying English now?"),
            Map.entry("55555555-5555-4555-8555-555555555558",
                    "«We are + verbo-ing» describe algo que ocurre ahora: We are learning English right now."),
            Map.entry("90000000-0000-4000-8000-000000000020",
                    "Para preguntar el nombre se usa «What» (qué/cuál). Who = quién, Where = dónde, When = cuándo."),
            Map.entry("55555555-5555-4555-8555-555555555559",
                    "«Where» pregunta por el lugar de origen y con «you» el To Be es «are»: Where are you from?")
    );

    private static final Map<String, String> THEME_EXPLANATIONS = Map.of(
            "pronouns", "Los pronombres sujeto (I, you, he, she, it, we, they) reemplazan al sustantivo; los de objeto (me, you, him, her, it, us, them) van después del verbo.",
            "verb to be", "Verb To Be: I am, he/she/it is, we/you/they are. Se usa para identidad, estado y descripción.",
            "possessive adjectives", "Los adjetivos posesivos (my, your, his, her, its, our, their) van antes del sustantivo y indican a quién pertenece.",
            "simple present", "Simple Present: acciones habituales. Con he/she/it el verbo lleva -s; en negativo e interrogativo se usa do/does + verbo base.",
            "present continuous", "Present Continuous: acciones que ocurren ahora = To Be + verbo-ing. Negativo: To Be + not; pregunta: To Be al inicio.",
            "wh question", "Las WH questions piden información: What (qué), Where (dónde), When (cuándo), Who (quién), Why (por qué), How (cómo)."
    );

    private AnswerFeedbackBuilder() {
    }

    /**
     * Explicación breve de por qué la respuesta correcta es esa (específica de la pregunta o, si no existe,
     * basada en la temática gramatical del enunciado).
     */
    public static String buildExplanation(Question question) {
        if (question == null) {
            return "";
        }
        String specific = question.getQuestionId() != null ? QUESTION_EXPLANATIONS.get(question.getQuestionId()) : null;
        if (specific != null) {
            return specific;
        }
        String prompt = question.getPrompt() == null ? "" : question.getPrompt();
        if (prompt.startsWith("[") && prompt.indexOf(']') > 1) {
            String theme = prompt.substring(1, prompt.indexOf(']')).toLowerCase();
            for (Map.Entry<String, String> entry : THEME_EXPLANATIONS.entrySet()) {
                if (theme.contains(entry.getKey())) {
                    return entry.getValue();
                }
            }
        }
        return "";
    }

    /**
     * Compara la respuesta del aprendiz con la mejor variante esperada y devuelve la lista de segmentos.
     * En respuestas de opción múltiple no se genera corrección palabra por palabra.
     */
    public static List<AnswerSegmentDto> buildSegments(Question question, String submitted, boolean isCorrect) {
        if (question == null || submitted == null || submitted.isBlank()
                || question.getType() == QuestionType.MULTIPLE_CHOICE) {
            return List.of();
        }

        String[] subDisplay = displayTokens(submitted);
        String[] subNorm = normalizedTokens(submitted);
        if (subNorm.length == 0) {
            return List.of();
        }

        List<AnswerSegmentDto> best = null;
        int bestCost = Integer.MAX_VALUE;
        for (String variant : candidateVariants(question)) {
            String[] expDisplay = displayTokens(variant);
            String[] expNorm = normalizedTokens(variant);
            if (expNorm.length == 0) {
                continue;
            }
            int[] costHolder = new int[1];
            List<AnswerSegmentDto> segments = align(subDisplay, subNorm, expDisplay, expNorm, costHolder);
            if (costHolder[0] < bestCost) {
                bestCost = costHolder[0];
                best = segments;
            }
        }
        if (best == null) {
            return List.of();
        }

        if (isCorrect) {
            // La respuesta fue aceptada (p. ej. cláusula parcial o modificador movido): solo se conservan las
            // advertencias ortográficas leves; el resto se considera válido.
            List<AnswerSegmentDto> lenient = new ArrayList<>();
            for (AnswerSegmentDto seg : best) {
                if (MISSING.equals(seg.getStatus())) {
                    continue;
                }
                if (WRONG.equals(seg.getStatus())) {
                    lenient.add(AnswerSegmentDto.builder().text(seg.getText()).status(OK).build());
                } else {
                    lenient.add(seg);
                }
            }
            return lenient;
        }
        return best;
    }

    /**
     * Pistas breves en español derivadas de los segmentos marcados.
     */
    public static List<String> buildHints(List<AnswerSegmentDto> segments) {
        List<String> hints = new ArrayList<>();
        if (segments == null) {
            return hints;
        }
        for (AnswerSegmentDto seg : segments) {
            switch (seg.getStatus()) {
                case TYPO -> hints.add("Ortografía: «" + seg.getText() + "» se escribe «" + seg.getExpected() + "».");
                case MISSING -> hints.add("Falta la palabra «" + seg.getText() + "».");
                case WRONG -> {
                    if (seg.getExpected() == null) {
                        hints.add("Sobra la palabra «" + seg.getText() + "».");
                    } else if (sameStem(seg.getText(), seg.getExpected())) {
                        hints.add("Revisa la terminación: «" + seg.getText() + "» debe ser «" + seg.getExpected()
                                + "» (plural, 3.ª persona o tiempo verbal).");
                    } else {
                        hints.add("Cambia «" + seg.getText() + "» por «" + seg.getExpected() + "».");
                    }
                }
                default -> {
                }
            }
        }
        return hints;
    }

    private static boolean sameStem(String a, String b) {
        String x = AnswerService.normalizeText(a);
        String y = AnswerService.normalizeText(b);
        int prefix = 0;
        while (prefix < x.length() && prefix < y.length() && x.charAt(prefix) == y.charAt(prefix)) {
            prefix++;
        }
        return prefix >= 3 && prefix >= Math.min(x.length(), y.length()) - 1 && !x.equals(y);
    }

    private static List<String> candidateVariants(Question question) {
        List<String> variants = new ArrayList<>();
        String correct = question.getCorrectAnswer() == null ? "" : question.getCorrectAnswer();
        for (String v : correct.split("\\|")) {
            if (!v.isBlank()) {
                variants.add(v.trim());
            }
        }
        String prompt = question.getPrompt();
        if ((question.getType() == QuestionType.TEXT_INPUT || question.getType() == QuestionType.VOICE)
                && prompt != null && prompt.contains("___") && !variants.isEmpty()) {
            String template = prompt;
            int qs = prompt.indexOf('"');
            int qe = prompt.lastIndexOf('"');
            if (qs != -1 && qe > qs) {
                template = prompt.substring(qs + 1, qe);
            }
            String filled = template.replaceAll("_+", variants.get(0))
                    .replaceAll("\\([^)]*\\)", "")
                    .replaceAll("\\[[^]]*\\]", "")
                    .trim()
                    .replaceAll("\\s+", " ");
            variants.add(filled);
        }
        return variants;
    }

    private static String[] normalizedTokens(String text) {
        String canon = AnswerService.expandEnglishContractions(AnswerService.normalizeText(text));
        return canon.isEmpty() ? new String[0] : canon.split("\\s+");
    }

    /**
     * Palabras para mostrar: se conservan las originales del aprendiz si la expansión de contracciones
     * no cambió la cantidad de palabras; de lo contrario se muestran las palabras expandidas.
     */
    private static String[] displayTokens(String text) {
        String[] canon = normalizedTokens(text);
        String trimmed = text.trim();
        if (trimmed.isEmpty()) {
            return new String[0];
        }
        String[] original = trimmed.split("\\s+");
        if (original.length != canon.length) {
            return canon;
        }
        String[] cleaned = new String[original.length];
        for (int i = 0; i < original.length; i++) {
            String stripped = original[i].replaceAll("^[^\\p{L}\\p{N}']+|[^\\p{L}\\p{N}']+$", "");
            cleaned[i] = stripped.isEmpty() ? canon[i] : stripped;
        }
        return cleaned;
    }

    private static List<AnswerSegmentDto> align(String[] subDisplay, String[] subNorm,
                                                String[] expDisplay, String[] expNorm, int[] costOut) {
        int n = subNorm.length;
        int m = expNorm.length;
        int[][] dp = new int[n + 1][m + 1];
        for (int i = 1; i <= n; i++) {
            dp[i][0] = i * COST_INDEL;
        }
        for (int j = 1; j <= m; j++) {
            dp[0][j] = j * COST_INDEL;
        }
        for (int i = 1; i <= n; i++) {
            for (int j = 1; j <= m; j++) {
                int pair = dp[i - 1][j - 1] + pairCost(subNorm[i - 1], expNorm[j - 1]);
                int del = dp[i - 1][j] + COST_INDEL;
                int ins = dp[i][j - 1] + COST_INDEL;
                dp[i][j] = Math.min(pair, Math.min(del, ins));
            }
        }
        costOut[0] = dp[n][m];

        List<AnswerSegmentDto> reversed = new ArrayList<>();
        int i = n;
        int j = m;
        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && dp[i][j] == dp[i - 1][j - 1] + pairCost(subNorm[i - 1], expNorm[j - 1])) {
                int cost = pairCost(subNorm[i - 1], expNorm[j - 1]);
                if (cost == 0) {
                    reversed.add(AnswerSegmentDto.builder().text(subDisplay[i - 1]).status(OK).build());
                } else if (cost == COST_TYPO) {
                    reversed.add(AnswerSegmentDto.builder().text(subDisplay[i - 1]).status(TYPO)
                            .expected(expDisplay[j - 1]).build());
                } else {
                    reversed.add(AnswerSegmentDto.builder().text(subDisplay[i - 1]).status(WRONG)
                            .expected(expDisplay[j - 1]).build());
                }
                i--;
                j--;
            } else if (i > 0 && dp[i][j] == dp[i - 1][j] + COST_INDEL) {
                reversed.add(AnswerSegmentDto.builder().text(subDisplay[i - 1]).status(WRONG).build());
                i--;
            } else {
                reversed.add(AnswerSegmentDto.builder().text(expDisplay[j - 1]).status(MISSING).build());
                j--;
            }
        }
        List<AnswerSegmentDto> ordered = new ArrayList<>(reversed.size());
        for (int k = reversed.size() - 1; k >= 0; k--) {
            ordered.add(reversed.get(k));
        }
        return ordered;
    }

    private static int pairCost(String sub, String exp) {
        if (sub.equals(exp)) {
            return 0;
        }
        if (AnswerService.isTokenFuzzyMatch(sub, exp)) {
            return COST_TYPO;
        }
        return COST_SUBSTITUTION;
    }
}
