package com.senadso.englishday.controller;

import com.senadso.englishday.dto.SubmitAnswerRequest;
import com.senadso.englishday.service.AnswerService;
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
}
