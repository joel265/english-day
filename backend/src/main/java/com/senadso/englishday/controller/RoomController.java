package com.senadso.englishday.controller;

import com.senadso.englishday.dto.CloseQuestionRequest;
import com.senadso.englishday.dto.CreateRoomResponse;
import com.senadso.englishday.dto.JoinRoomRequest;
import com.senadso.englishday.dto.JoinRoomResponse;
import com.senadso.englishday.dto.LobbyPlayerResponse;
import com.senadso.englishday.dto.PodiumResponse;
import com.senadso.englishday.dto.QuestionBroadcastResponse;
import com.senadso.englishday.dto.QuestionResultsResponse;
import com.senadso.englishday.dto.RoomResponse;
import com.senadso.englishday.dto.RoomSettingsDto;
import com.senadso.englishday.dto.RoomSyncStateResponse;
import com.senadso.englishday.dto.RouletteResultResponse;
import com.senadso.englishday.model.Answer;
import com.senadso.englishday.model.Room;
import com.senadso.englishday.model.enums.RoomStatus;
import com.senadso.englishday.repository.AnswerRepository;
import com.senadso.englishday.service.RoomService;
import com.senadso.englishday.service.RouletteService;
import com.senadso.englishday.service.ScoreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST para operaciones síncronas de salas de juego.
 * Implementa las rutas del Contrato de Integración §3 bajo el prefijo /api/rooms.
 */
@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;
    private final RouletteService rouletteService;
    private final ScoreService scoreService;
    private final AnswerRepository answerRepository;

    /**
     * Endpoint para crear una sala y generar el PIN de 6 dígitos, aceptando
     * opcionalmente los parámetros de tiempos y aleatoriedad del moderador.
     * Ruta: POST /api/rooms (Contrato §3.1 / RF-01 / CU-01).
     */
    @PostMapping
    public ResponseEntity<CreateRoomResponse> createRoom(
            @RequestBody(required = false) RoomSettingsDto initialSettings) {
        CreateRoomResponse response = roomService.createRoom(initialSettings);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Endpoint para consultar los parámetros de tiempo y aleatoriedad de una sala.
     */
    @GetMapping("/{roomId}/settings")
    public ResponseEntity<RoomSettingsDto> getRoomSettings(@PathVariable String roomId) {
        return ResponseEntity.ok(roomService.getRoomSettings(roomId));
    }

    /**
     * Endpoint para que el moderador actualice en tiempo real los parámetros de tiempos
     * de las preguntas y el modo aleatorio de la sala.
     */
    @PutMapping("/{roomId}/settings")
    public ResponseEntity<RoomSettingsDto> updateRoomSettings(
            @PathVariable String roomId,
            @RequestBody RoomSettingsDto settings) {
        RoomSettingsDto updated = roomService.updateRoomSettings(roomId, settings);
        return ResponseEntity.ok(updated);
    }

    /**
     * Endpoint para registrar a un jugador en la sala mediante su PIN.
     * Ruta: POST /api/rooms/{pin}/join (Contrato §3.2 / RF-02 / CU-02).
     */
    @PostMapping("/{pin}/join")
    public ResponseEntity<JoinRoomResponse> joinRoom(
            @PathVariable String pin,
            @Valid @RequestBody JoinRoomRequest request) {

        JoinRoomResponse response = roomService.joinRoom(pin, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint para que un aprendiz salga voluntariamente de la sala de espera.
     */
    @DeleteMapping("/{roomId}/players/{playerId}")
    public ResponseEntity<java.util.Map<String, String>> leaveRoom(
            @PathVariable String roomId,
            @PathVariable String playerId) {
        roomService.leaveRoom(roomId, playerId);
        return ResponseEntity.ok(java.util.Map.of("status", "LEFT", "playerId", playerId));
    }

    @PostMapping("/{roomId}/players/{playerId}/leave")
    public ResponseEntity<java.util.Map<String, String>> leaveRoomPost(
            @PathVariable String roomId,
            @PathVariable String playerId) {
        roomService.leaveRoom(roomId, playerId);
        return ResponseEntity.ok(java.util.Map.of("status", "LEFT", "playerId", playerId));
    }

    /**
     * Endpoint para consultar el estado actual de la sala por PIN (reconexión).
     * Ruta: GET /api/rooms/{pin} (Contrato §3 y Anexo A.4 / RF-03).
     */
    @GetMapping("/{pin}")
    public ResponseEntity<RoomResponse> getRoomByPin(@PathVariable String pin) {
        RoomResponse response = roomService.getRoomByPin(pin);
        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint de sincronización completa del estado de la sala para persistencia y restauración
     * de sesión tanto del Moderador como del Aprendiz tras recargar o reiniciar el navegador.
     */
    @GetMapping("/{pin}/state")
    public ResponseEntity<RoomSyncStateResponse> getRoomSyncState(
            @PathVariable String pin,
            @RequestParam(required = false) String playerId) {
        Room room = roomService.findRoomByPinOrThrow(pin);
        String roomId = room.getRoomId();
        List<LobbyPlayerResponse> players = roomService.getLobbyPlayers(roomId);
        QuestionBroadcastResponse currentQ = roomService.getLastBroadcastQuestion(roomId);
        boolean questionClosed = roomService.isQuestionClosed(roomId);
        int remainingSec = roomService.getRemainingQuestionSeconds(roomId);

        LobbyPlayerResponse matchedPlayer = null;
        String submittedAnswer = null;
        if (playerId != null && !playerId.isBlank()) {
            matchedPlayer = players.stream()
                    .filter(p -> playerId.equals(p.getPlayerId()))
                    .findFirst()
                    .orElse(null);
            if (matchedPlayer != null && currentQ != null && currentQ.getQuestionId() != null) {
                submittedAnswer = answerRepository
                        .findByPlayer_PlayerIdAndQuestion_QuestionId(playerId, currentQ.getQuestionId())
                        .map(Answer::getValue)
                        .orElse(null);
            }
        }

        PodiumResponse podium = room.getStatus() == RoomStatus.FINISHED
                ? scoreService.getPodiumResults(roomId)
                : null;

        RoomSyncStateResponse sync = RoomSyncStateResponse.builder()
                .roomId(roomId)
                .pin(room.getPin())
                .lanIp(roomService.resolveLocalLanIp())
                .status(room.getStatus())
                .currentQuestionIndex(room.getCurrentQuestionIndex())
                .playerCount(players.size())
                .players(players)
                .settings(roomService.getRoomSettings(roomId))
                .questionClosed(questionClosed)
                .remainingSeconds(remainingSec)
                .currentQuestion(currentQ)
                .lastResults(roomService.getLastQuestionResults(roomId))
                .lastRoulette(roomService.getLastRouletteResult(roomId))
                .podium(podium)
                .player(matchedPlayer)
                .playerSubmittedAnswer(submittedAnswer)
                .build();

        return ResponseEntity.ok(sync);
    }

    /**
     * Endpoint para que el moderador inicie la partida.
     * Ruta: POST /api/rooms/{roomId}/start (Contrato §3 / CU-03 / RF-08).
     */
    @PostMapping("/{roomId}/start")
    public ResponseEntity<RoomResponse> startGame(
            @PathVariable String roomId,
            @RequestBody(required = false) RoomSettingsDto settings) {
        if (settings != null) {
            roomService.updateRoomSettings(roomId, settings);
        }
        RoomResponse response = roomService.startGame(roomId);
        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint para que el moderador avance a la siguiente pregunta.
     * Ruta: POST /api/rooms/{roomId}/next (CU-03 / Tarea 14 Panel de Moderador).
     */
    @PostMapping("/{roomId}/next")
    public ResponseEntity<RoomResponse> nextQuestion(
            @PathVariable String roomId,
            @RequestBody(required = false) RoomSettingsDto settings) {
        if (settings != null) {
            roomService.updateRoomSettings(roomId, settings);
        }
        RoomResponse response = roomService.nextQuestion(roomId);
        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint para que el moderador cierre la pregunta actual y emita el Top 5 a /topic/room/{roomId}/results.
     * Ruta: POST /api/rooms/{roomId}/close-question (RF-10).
     */
    @PostMapping("/{roomId}/close-question")
    public ResponseEntity<QuestionResultsResponse> closeQuestion(
            @PathVariable String roomId,
            @RequestBody(required = false) CloseQuestionRequest request) {
        String questionId = request != null ? request.getQuestionId() : null;
        QuestionResultsResponse response = scoreService.broadcastQuestionResults(roomId, questionId);
        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint para que el moderador active la ruleta de retroalimentación interactiva.
     * Ruta: POST /api/rooms/{roomId}/roulette (Contrato §3 / RF-11 / CU-05).
     */
    @PostMapping("/{roomId}/roulette")
    public ResponseEntity<RouletteResultResponse> spinRoulette(@PathVariable String roomId) {
        RouletteResultResponse response = rouletteService.spinRoulette(roomId, null);
        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint para obtener el podio final (Top 3) al culminar la partida.
     * Ruta: GET /api/rooms/{roomId}/results (Contrato §3 / RF-10 / CU-06).
     */
    @GetMapping("/{roomId}/results")
    public ResponseEntity<PodiumResponse> getFinalResults(@PathVariable String roomId) {
        PodiumResponse response = scoreService.getPodiumResults(roomId);
        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint para que el moderador finalice la partida y emita el podio final al topic /topic/room/{roomId}/podium.
     * Ruta: POST /api/rooms/{roomId}/finish (Contrato §3 / RF-10 / CU-06 / CP-11).
     */
    @PostMapping("/{roomId}/finish")
    public ResponseEntity<PodiumResponse> finishGame(@PathVariable String roomId) {
        PodiumResponse response = scoreService.finalizeGameAndBroadcastPodium(roomId);
        return ResponseEntity.ok(response);
    }
}
