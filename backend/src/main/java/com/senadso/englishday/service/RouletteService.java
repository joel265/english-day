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
@Slf4j
public class RouletteService {

    private final RoomRepository roomRepository;
    private final PlayerRepository playerRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final RoomService roomService;
    private final SimpMessagingTemplate messagingTemplate;
    private final SecureRandom secureRandom = new SecureRandom();

    @org.springframework.beans.factory.annotation.Autowired
    public RouletteService(
            RoomRepository roomRepository,
            PlayerRepository playerRepository,
            QuestionRepository questionRepository,
            AnswerRepository answerRepository,
            RoomService roomService,
            SimpMessagingTemplate messagingTemplate) {
        this.roomRepository = roomRepository;
        this.playerRepository = playerRepository;
        this.questionRepository = questionRepository;
        this.answerRepository = answerRepository;
        this.roomService = roomService;
        this.messagingTemplate = messagingTemplate;
    }

    public RouletteService(
            RoomRepository roomRepository,
            PlayerRepository playerRepository,
            QuestionRepository questionRepository,
            AnswerRepository answerRepository,
            SimpMessagingTemplate messagingTemplate) {
        this(roomRepository, playerRepository, questionRepository, answerRepository, null, messagingTemplate);
    }

    /**
     * Ejecuta el giro de la ruleta de retroalimentación para la sala.
     */
    @Transactional
    public RouletteResultResponse spinRoulette(String roomId, String questionId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RoomNotFoundException("Sala no encontrada"));

        Question question;
        if (questionId != null && !questionId.isBlank()) {
            question = questionRepository.findById(questionId)
                    .orElseGet(() -> roomService != null
                            ? roomService.getCurrentQuestionForRoom(roomId)
                            : questionRepository.findByOrder(room.getCurrentQuestionIndex()).orElseThrow());
        } else if (roomService != null) {
            question = roomService.getCurrentQuestionForRoom(roomId);
        } else {
            question = questionRepository.findByOrder(room.getCurrentQuestionIndex())
                    .orElseThrow(() -> new IllegalStateException("Pregunta actual no configurada para la sala"));
        }

        List<Player> players = playerRepository.findByRoom_RoomId(roomId);
        if (players.isEmpty()) {
            throw new IllegalStateException("No hay aprendices registrados en la sala para ejecutar la ruleta");
        }

        int selectedIndex = secureRandom.nextInt(players.size());
        Player selectedPlayer = players.get(selectedIndex);

        Optional<Answer> answerOpt = answerRepository.findByPlayer_PlayerIdAndQuestion_QuestionId(
                selectedPlayer.getPlayerId(), question.getQuestionId()
        );

        String answerValue = answerOpt.map(Answer::getValue).orElse(null);
        Boolean isCorrect = answerOpt.map(Answer::getIsCorrect).orElse(false);

        room.setStatus(RoomStatus.ROULETTE_TIME);
        roomRepository.save(room);

        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/status",
                Map.of("status", RoomStatus.ROULETTE_TIME.name()));

        RouletteResultResponse response = RouletteResultResponse.builder()
                .roomId(roomId)
                .playerId(selectedPlayer.getPlayerId())
                .nickname(selectedPlayer.getNickname())
                .questionId(question.getQuestionId())
                .value(answerValue)
                .isCorrect(isCorrect)
                .timestamp(LocalDateTime.now(ZoneOffset.UTC))
                .build();

        if (roomService != null) {
            roomService.recordRouletteResult(roomId, response);
        }

        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/roulette", response);

        log.info("Ruleta ejecutada en sala {} - Aprendiz: {}, Pregunta: {}, Correcta: {}",
                roomId, selectedPlayer.getNickname(), question.getQuestionId(), isCorrect);

        return response;
    }
}
