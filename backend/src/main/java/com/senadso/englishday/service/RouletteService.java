package com.senadso.englishday.service;

import com.senadso.englishday.dto.RouletteResultResponse;
import com.senadso.englishday.exception.RoomNotFoundException;
import com.senadso.englishday.model.Answer;
import com.senadso.englishday.model.Player;
import com.senadso.englishday.model.Question;
import com.senadso.englishday.model.Room;
import com.senadso.englishday.model.enums.RoomStatus;
import com.senadso.englishday.repository.AnswerRepository;
import com.senadso.englishday.repository.PlayerRepository;
import com.senadso.englishday.repository.QuestionRepository;
import com.senadso.englishday.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Servicio de lógica de negocio para la ruleta interactiva de retroalimentación (RF-11 / CU-05).
 * Permite seleccionar al azar a un aprendiz conectado y exponer su respuesta para discusión pedagógica.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RouletteService {

    private final RoomRepository roomRepository;
    private final PlayerRepository playerRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Ejecuta el giro de la ruleta de retroalimentación para la sala.
     * Selecciona pseudoaleatoriamente a un participante conectado, extrae su respuesta,
     * actualiza el estado de la sala a ROULETTE_TIME y emite el evento en tiempo real.
     *
     * @param roomId Identificador UUID de la sala.
     * @param questionId Identificador UUID opcional de la pregunta (si es null, usa la actual de la sala).
     * @return Objeto con los datos del aprendiz seleccionado y su respuesta (RF-11).
     */
    @Transactional
    public RouletteResultResponse spinRoulette(String roomId, String questionId) {
        // 1. Obtener la sala
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RoomNotFoundException("Sala no encontrada"));

        // 2. Obtener la pregunta objetivo
        Question question;
        if (questionId != null && !questionId.isBlank()) {
            question = questionRepository.findById(questionId)
                    .orElseThrow(() -> new IllegalArgumentException("Pregunta no encontrada: " + questionId));
        } else {
            question = questionRepository.findByOrder(room.getCurrentQuestionIndex())
                    .orElseThrow(() -> new IllegalStateException("Pregunta actual no configurada para la sala"));
        }

        // 3. Obtener participantes conectados a la sala
        List<Player> players = playerRepository.findByRoom_RoomId(roomId);
        if (players.isEmpty()) {
            throw new IllegalStateException("No hay aprendices registrados en la sala para ejecutar la ruleta");
        }

        // 4. Seleccionar aleatoriamente un aprendiz mediante SecureRandom
        int selectedIndex = secureRandom.nextInt(players.size());
        Player selectedPlayer = players.get(selectedIndex);

        // 5. Consultar si el aprendiz seleccionado emitió respuesta
        Optional<Answer> answerOpt = answerRepository.findByPlayer_PlayerIdAndQuestion_QuestionId(
                selectedPlayer.getPlayerId(), question.getQuestionId()
        );

        String answerValue = answerOpt.map(Answer::getValue).orElse(null);
        Boolean isCorrect = answerOpt.map(Answer::getIsCorrect).orElse(false);

        // 6. Cambiar estado de la sala a ROULETTE_TIME
        room.setStatus(RoomStatus.ROULETTE_TIME);
        roomRepository.save(room);

        // 7. Emitir cambio de estado a /topic/room/{roomId}/status
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/status",
                Map.of("status", RoomStatus.ROULETTE_TIME.name()));

        // 8. Construir el payload del resultado de la ruleta
        RouletteResultResponse response = RouletteResultResponse.builder()
                .roomId(roomId)
                .playerId(selectedPlayer.getPlayerId())
                .nickname(selectedPlayer.getNickname())
                .questionId(question.getQuestionId())
                .value(answerValue)
                .isCorrect(isCorrect)
                .timestamp(LocalDateTime.now(ZoneOffset.UTC))
                .build();

        // 9. Difundir el resultado al canal WebSocket /topic/room/{roomId}/roulette (Contrato §4.1)
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/roulette", response);

        log.info("Ruleta ejecutada en sala {} - Aprendiz: {}, Pregunta: {}, Correcta: {}",
                roomId, selectedPlayer.getNickname(), question.getOrder(), isCorrect);

        return response;
    }
}
