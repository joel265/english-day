package com.senadso.englishday.controller;

import com.senadso.englishday.dto.CloseQuestionRequest;
import com.senadso.englishday.dto.SubmitAnswerRequest;
import com.senadso.englishday.service.AnswerService;
import com.senadso.englishday.service.RouletteService;
import com.senadso.englishday.service.ScoreService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

/**
 * Controlador de entrada WebSocket STOMP para interacciones en tiempo real del juego.
 * Implementa los destinos /app definidos en el Contrato de Integración §4.2.
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class GameWebSocketController {

    private final AnswerService answerService;
    private final ScoreService scoreService;
    private final RouletteService rouletteService;

    /**
     * Procesa la respuesta enviada por un aprendiz desde su dispositivo móvil.
     * Destino STOMP: /app/room/{roomId}/answer (Contrato §4.2 y §4.4 / RF-04 a RF-07 / CU-04).
     *
     * @param roomId Identificador UUID de la sala.
     * @param request Payload con la respuesta enviada ({ playerId, questionId, value, clientTimestamp }).
     */
    @MessageMapping("/room/{roomId}/answer")
    public void submitAnswer(
            @DestinationVariable String roomId,
            @Payload SubmitAnswerRequest request) {

        log.info("Mensaje WebSocket recibido en /app/room/{}/answer para pregunta {}",
                roomId, request.getQuestionId());

        answerService.processAnswer(roomId, request);
    }

    /**
     * Cierra la pregunta actual, actualiza los puestos y difunde el leaderboard Top 5
     * junto con la respuesta correcta a todos los participantes en /topic/room/{roomId}/results (RF-10 / Contrato §4.5).
     *
     * @param roomId Identificador UUID de la sala.
     * @param request Datos opcionales con el questionId específico.
     */
    @MessageMapping("/room/{roomId}/results")
    public void publishResults(
            @DestinationVariable String roomId,
            @Payload(required = false) CloseQuestionRequest request) {

        log.info("Mensaje WebSocket recibido en /app/room/{}/results para sala {}", roomId, roomId);
        String questionId = (request != null) ? request.getQuestionId() : null;
        scoreService.broadcastQuestionResults(roomId, questionId);
    }

    /**
     * Activa la ruleta de retroalimentación interactiva por parte del moderador.
     * Destino STOMP: /app/room/{roomId}/moderator/roulette (Contrato §4.2 / RF-11 / CU-05).
     *
     * @param roomId Identificador UUID de la sala.
     */
    @MessageMapping("/room/{roomId}/moderator/roulette")
    public void spinRoulette(@DestinationVariable String roomId) {
        log.info("Mensaje WebSocket recibido en /app/room/{}/moderator/roulette", roomId);
        rouletteService.spinRoulette(roomId, null);
    }
}
