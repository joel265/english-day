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

/**
 * Servicio de lógica de negocio para la recepción, validación y persistencia
 * de respuestas en tiempo real (Tarea 8 / RF-04 a RF-07 / CU-04).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AnswerService {

    private final AnswerRepository answerRepository;
    private final PlayerRepository playerRepository;
    private final QuestionRepository questionRepository;
    private final ScoreService scoreService;

    /**
     * Procesa la respuesta de un aprendiz recibida por WebSocket STOMP.
     * Valida sintácticamente los 4 tipos de pregunta, calcula el puntaje dinámico (RF-09)
     * y persiste la entidad Answer y actualiza la tabla Score.
     *
     * @param roomId Identificador de la sala en curso.
     * @param request Datos de la respuesta ({ playerId, questionId, value, clientTimestamp }).
     * @return Entidad Answer persistida.
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
                .orElseThrow(() -> new IllegalArgumentException("Pregunta no encontrada: " + questionId));

        // 3. Normalizar el valor recibido
        String submittedValue = request.getNormalizedStringValue();

        // 4. Validar la respuesta según su tipo pedagógico
        boolean isCorrect = validateAnswer(question.getType(), submittedValue, question.getCorrectAnswer());

        // 5. Calcular tiempo de respuesta en milisegundos
        int responseTimeMs = calculateResponseTimeMs(request.getClientTimestamp(), question.getTimeLimitSeconds());

        // 6. Calcular puntaje con el algoritmo dinámico de velocidad y acierto (RF-09 / Contrato §5)
        int pointsAwarded = scoreService.calculatePoints(isCorrect, responseTimeMs, question.getTimeLimitSeconds());

        // 7. Construir y persistir la entidad Answer
        Answer answer = Answer.builder()
                .player(player)
                .question(question)
                .value(submittedValue)
                .isCorrect(isCorrect)
                .responseTimeMs(responseTimeMs)
                .pointsAwarded(pointsAwarded)
                .build();

        Answer savedAnswer = answerRepository.save(answer);

        // 8. Actualizar puntaje del jugador y tabla Score (RF-09 / RF-10)
        scoreService.updatePlayerScore(player, player.getRoom(), pointsAwarded);

        log.info("Respuesta registrada - Jugador: {}, Pregunta: {}, Correcta: {}, Tiempo: {} ms, Puntos: {}",
                player.getNickname(), question.getOrder(), isCorrect, responseTimeMs, pointsAwarded);

        return savedAnswer;
    }

    /**
     * Valida si el valor enviado por el usuario coincide con la respuesta correcta
     * implementando la lógica para los 4 tipos pedagógicos (RF-04 a RF-07).
     *
     * @param type Tipo de pregunta.
     * @param submitted Valor ingresado por el jugador.
     * @param expected Respuesta correcta configurada en el banco de datos.
     * @return true si es correcta, false si es incorrecta.
     */
    public boolean validateAnswer(QuestionType type, String submitted, String expected) {
        if (submitted == null || expected == null) {
            return false;
        }

        switch (type) {
            case MULTIPLE_CHOICE:
                // RF-04: Selección Múltiple - Coincidencia directa de la opción elegida
                return normalizeString(submitted).equals(normalizeString(expected));

            case WORD_BLOCKS:
                // RF-05: Construcción de oración con bloques - Comparación de la frase armada
                return normalizeString(submitted).equals(normalizeString(expected));

            case TEXT_INPUT:
            case VOICE:
                // RF-06 y RF-07: Entrada de texto y voz
                // Aplicación estricta de la Decisión Técnica #1 de la Bitácora:
                // Ignorar mayúsculas, tildes y espacios extra al inicio/final.
                return normalizeText(submitted).equals(normalizeText(expected));

            default:
                return false;
        }
    }

    /**
     * Normalización estándar: minúsculas y trim de espacios exteriores e interiores.
     */
    public String normalizeString(String text) {
        if (text == null) {
            return "";
        }
        return text.trim().toLowerCase().replaceAll("\\s+", " ");
    }

    /**
     * Normalización avanzada (Bitácora Decisión #1):
     * - Remueve acentos y tildes (ej. 'canción' -> 'cancion')
     * - Convierte a minúsculas
     * - Reduce secuencias de espacios a uno solo
     * - Elimina signos de puntuación periféricos comunes
     */
    public String normalizeText(String text) {
        if (text == null) {
            return "";
        }
        String normalized = Normalizer.normalize(text, Normalizer.Form.NFD);
        // Elimina caracteres diacríticos (tildes)
        normalized = normalized.replaceAll("\\p{M}", "");
        // Convierte a minúsculas y limpia espacios
        normalized = normalized.trim().toLowerCase().replaceAll("\\s+", " ");
        // Remueve punto final si el usuario o speech-to-text lo insertó
        if (normalized.endsWith(".")) {
            normalized = normalized.substring(0, normalized.length() - 1).trim();
        }
        return normalized;
    }

    /**
     * Calcula los milisegundos transcurridos de forma segura con un valor por defecto.
     */
    private int calculateResponseTimeMs(LocalDateTime clientTimestamp, Integer timeLimitSeconds) {
        int maxMs = (timeLimitSeconds != null ? timeLimitSeconds : 15) * 1000;
        if (clientTimestamp == null) {
            return 1000; // Valor seguro por defecto si el cliente no reportó timestamp
        }
        long ms = Duration.between(clientTimestamp, LocalDateTime.now(ZoneOffset.UTC)).toMillis();
        if (ms < 0) {
            return 500;
        }
        return (int) Math.min(ms, maxMs);
    }
}
