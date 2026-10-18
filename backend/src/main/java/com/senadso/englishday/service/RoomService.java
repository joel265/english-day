package com.senadso.englishday.service;

import com.senadso.englishday.dto.CreateRoomResponse;
import com.senadso.englishday.dto.JoinRoomRequest;
import com.senadso.englishday.dto.JoinRoomResponse;
import com.senadso.englishday.dto.LobbyPlayerResponse;
import com.senadso.englishday.dto.QuestionBroadcastResponse;
import com.senadso.englishday.dto.QuestionResultsResponse;
import com.senadso.englishday.dto.RoomResponse;
import com.senadso.englishday.dto.RoomSettingsDto;
import com.senadso.englishday.dto.RouletteResultResponse;
import com.senadso.englishday.exception.PinNotFoundException;
import com.senadso.englishday.exception.RoomNotFoundException;
import com.senadso.englishday.model.Player;
import com.senadso.englishday.model.Question;
import com.senadso.englishday.model.Room;
import com.senadso.englishday.model.enums.QuestionType;
import com.senadso.englishday.model.enums.RoomStatus;
import com.senadso.englishday.repository.PlayerRepository;
import com.senadso.englishday.repository.QuestionRepository;
import com.senadso.englishday.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Collections;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Servicio de lógica de negocio para la gestión de salas, configuración de tiempos del moderador,
 * barajado aleatorio de preguntas por sala y registro de aprendices.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RoomService {

    private final RoomRepository roomRepository;
    private final PlayerRepository playerRepository;
    private final QuestionRepository questionRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final SecureRandom secureRandom = new SecureRandom();

    private final Map<String, RoomSettingsDto> roomSettingsByRoomId = new ConcurrentHashMap<>();
    private final Map<String, List<Question>> roomQuestionDecks = new ConcurrentHashMap<>();
    private final Map<String, Question> activeQuestionByRoomId = new ConcurrentHashMap<>();
    private final Map<String, LocalDateTime> questionStartedAtByRoomId = new ConcurrentHashMap<>();
    private final Map<String, QuestionBroadcastResponse> lastBroadcastQuestionByRoomId = new ConcurrentHashMap<>();
    private final Map<String, QuestionResultsResponse> lastQuestionResultsByRoomId = new ConcurrentHashMap<>();
    private final Map<String, RouletteResultResponse> lastRouletteByRoomId = new ConcurrentHashMap<>();
    private final Map<String, Boolean> questionClosedByRoomId = new ConcurrentHashMap<>();
    private final AtomicReference<QuestionType> lastOpeningMechanic = new AtomicReference<>(null);

    /**
     * Crea una nueva sala de juego con un PIN único de 6 dígitos (RF-01 / CU-01)
     * e inicializa sus parámetros de tiempo y orden aleatorio de preguntas.
     */
    @Transactional
    public CreateRoomResponse createRoom() {
        return createRoom(null);
    }

    @Transactional
    public CreateRoomResponse createRoom(RoomSettingsDto initialSettings) {
        String pin = generateUniquePin();

        Room room = Room.builder()
                .pin(pin)
                .status(RoomStatus.WAITING_LOBBY)
                .currentQuestionIndex(0)
                .build();

        Room savedRoom = roomRepository.save(room);

        RoomSettingsDto settings = initialSettings != null ? initialSettings : RoomSettingsDto.defaultSettings();
        settings.normalize();
        roomSettingsByRoomId.put(savedRoom.getRoomId(), settings);

        return CreateRoomResponse.builder()
                .roomId(savedRoom.getRoomId())
                .pin(savedRoom.getPin())
                .status(savedRoom.getStatus())
                .lanIp(resolveLocalLanIp())
                .createdAt(savedRoom.getCreatedAt())
                .build();
    }

    /**
     * Detecta la dirección IPv4 de red local (LAN) del servidor para que el código QR
     * proyectado funcione al ser escaneado desde celulares conectados a la misma red Wi-Fi.
     */
    public String resolveLocalLanIp() {
        try {
            java.util.Enumeration<java.net.NetworkInterface> interfaces = java.net.NetworkInterface.getNetworkInterfaces();
            while (interfaces != null && interfaces.hasMoreElements()) {
                java.net.NetworkInterface iface = interfaces.nextElement();
                if (!iface.isUp() || iface.isLoopback() || iface.isVirtual()) {
                    continue;
                }
                java.util.Enumeration<java.net.InetAddress> addresses = iface.getInetAddresses();
                while (addresses.hasMoreElements()) {
                    java.net.InetAddress addr = addresses.nextElement();
                    if (addr instanceof java.net.Inet4Address && !addr.isLoopbackAddress() && addr.isSiteLocalAddress()) {
                        return addr.getHostAddress();
                    }
                }
            }
        } catch (Exception ignored) {
            // Fallback silencioso a hostname actual del navegador
        }
        return null;
    }

    /**
     * Obtiene la configuración de tiempos y aleatoriedad de una sala.
     */
    public RoomSettingsDto getRoomSettings(String roomId) {
        return roomSettingsByRoomId.computeIfAbsent(roomId, id -> RoomSettingsDto.defaultSettings());
    }

    /**
     * Actualiza en caliente los parámetros de tiempo y aleatoriedad configurados por el moderador.
     */
    public RoomSettingsDto updateRoomSettings(String roomId, RoomSettingsDto newSettings) {
        if (!roomRepository.existsById(roomId)) {
            throw new RoomNotFoundException("Sala no encontrada");
        }
        RoomSettingsDto normalized = newSettings != null ? newSettings : RoomSettingsDto.defaultSettings();
        normalized.normalize();
        roomSettingsByRoomId.put(roomId, normalized);

        Room room = roomRepository.findById(roomId).orElse(null);
        if (room != null && room.getStatus() == RoomStatus.WAITING_LOBBY) {
            roomQuestionDecks.remove(roomId);
        }

        log.info("Parámetros de sala {} actualizados: MC={}s, TEXT={}s, BLOCKS={}s, VOICE={}s, intro={}s, aleatorio={}",
                roomId,
                normalized.getMultipleChoiceTimeSeconds(),
                normalized.getTextInputTimeSeconds(),
                normalized.getWordBlocksTimeSeconds(),
                normalized.getVoiceTimeSeconds(),
                normalized.getIntroDurationSeconds(),
                normalized.getShuffleQuestions());
        return normalized;
    }

    /**
     * Obtiene la pregunta actualmente activa en una sala (compatible con orden aleatorio o secuencial).
     */
    public Question getCurrentQuestionForRoom(String roomId) {
        Question active = activeQuestionByRoomId.get(roomId);
        if (active != null) {
            return active;
        }
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RoomNotFoundException("Sala no encontrada: " + roomId));
        int currentIndex = room.getCurrentQuestionIndex() != null && room.getCurrentQuestionIndex() > 0
                ? room.getCurrentQuestionIndex()
                : 1;
        List<Question> deck = roomQuestionDecks.get(roomId);
        if (deck != null && currentIndex <= deck.size()) {
            return deck.get(currentIndex - 1);
        }
        return questionRepository.findByOrder(currentIndex)
                .orElseThrow(() -> new IllegalStateException("Pregunta actual no configurada para la sala"));
    }

    /**
     * Calcula el tiempo límite efectivo (en segundos) para una pregunta en una sala dada,
     * aplicando los parámetros ajustados por el moderador.
     */
    public int getEffectiveTimeLimitSeconds(String roomId, Question question) {
        RoomSettingsDto settings = getRoomSettings(roomId);
        return settings.resolveTimeLimitForType(question.getType(), question.getTimeLimitSeconds());
    }

    /**
     * Devuelve el instante UTC en que comenzó la pregunta actual de la sala.
     */
    public LocalDateTime getQuestionStartedAt(String roomId) {
        return questionStartedAtByRoomId.get(roomId);
    }

    /**
     * Construye el mazo de preguntas para una sala.
     * Si shuffleQuestions es true, baraja tanto las preguntas dentro de cada mecánica como el orden
     * de las 4 mecánicas (VOICE, TEXT_INPUT, WORD_BLOCKS, MULTIPLE_CHOICE), garantizando que cada nuevo
     * juego comience con una mecánica distinta (por ejemplo, uno con VOICE y otro escribiendo palabras).
     */
    private List<Question> getOrCreateQuestionDeck(String roomId) {
        return roomQuestionDecks.computeIfAbsent(roomId, id -> {
            List<Question> allQuestions = new ArrayList<>(questionRepository.findAllByOrderByOrderAsc());
            if (allQuestions.isEmpty()) {
                throw new IllegalStateException("No hay preguntas configuradas para iniciar la partida");
            }

            RoomSettingsDto settings = getRoomSettings(id);
            if (!Boolean.TRUE.equals(settings.getShuffleQuestions())) {
                return allQuestions;
            }

            Map<QuestionType, List<Question>> byType = new EnumMap<>(QuestionType.class);
            for (QuestionType type : QuestionType.values()) {
                byType.put(type, new ArrayList<>());
            }
            for (Question q : allQuestions) {
                byType.get(q.getType()).add(q);
            }
            for (List<Question> group : byType.values()) {
                Collections.shuffle(group, secureRandom);
            }

            List<QuestionType> availableTypes = new ArrayList<>();
            for (QuestionType type : QuestionType.values()) {
                if (!byType.get(type).isEmpty()) {
                    availableTypes.add(type);
                }
            }

            // Elegir la primera mecánica de forma aleatoria evitando repetir la misma mecánica inicial del juego anterior
            Collections.shuffle(availableTypes, secureRandom);
            QuestionType previousOpening = lastOpeningMechanic.get();
            if (availableTypes.size() > 1 && availableTypes.get(0) == previousOpening) {
                int swapIdx = 1 + secureRandom.nextInt(availableTypes.size() - 1);
                Collections.swap(availableTypes, 0, swapIdx);
            }
            if (!availableTypes.isEmpty()) {
                lastOpeningMechanic.set(availableTypes.get(0));
            }

            List<Question> randomizedDeck = new ArrayList<>(allQuestions.size());
            // Primera ronda rotando las 4 mecánicas en orden aleatorio
            for (QuestionType type : availableTypes) {
                List<Question> pool = byType.get(type);
                if (!pool.isEmpty()) {
                    randomizedDeck.add(pool.remove(0));
                }
            }

            // Ciclos subsiguientes mezclando las preguntas restantes de todas las mecánicas
            List<Question> remaining = new ArrayList<>();
            for (List<Question> pool : byType.values()) {
                remaining.addAll(pool);
            }
            Collections.shuffle(remaining, secureRandom);
            randomizedDeck.addAll(remaining);

            log.info("Mazo aleatorio generado para sala {} ({} preguntas). Primera pregunta: [{} - {}]",
                    id,
                    randomizedDeck.size(),
                    randomizedDeck.get(0).getType(),
                    randomizedDeck.get(0).getPrompt());
            return randomizedDeck;
        });
    }

    /**
     * Registra a un aprendiz en una sala activa mediante su PIN y nickname (RF-02 / CU-02).
     * Si el aprendiz ya estaba registrado en la sala con el mismo nickname y la partida sigue activa,
     * devuelve su sesión existente para permitir reconexión transparente tras reiniciar el navegador.
     */
    @Transactional
    public JoinRoomResponse joinRoom(String pin, JoinRoomRequest request) {
        Room room = roomRepository.findByPin(pin)
                .orElseThrow(() -> new PinNotFoundException("PIN no encontrado"));

        String normalizedNickname = request.getNickname().trim();
        Optional<Player> existingPlayer = playerRepository.findByRoom_RoomId(room.getRoomId())
                .stream()
                .filter(p -> p.getNickname() != null && p.getNickname().trim().equalsIgnoreCase(normalizedNickname))
                .findFirst();

        if (existingPlayer.isPresent() && room.getStatus() != RoomStatus.FINISHED) {
            Player existing = existingPlayer.get();
            broadcastLobbyUpdate(room.getRoomId());
            return JoinRoomResponse.builder()
                    .playerId(existing.getPlayerId())
                    .roomId(room.getRoomId())
                    .nickname(existing.getNickname())
                    .joinedAt(existing.getJoinedAt())
                    .build();
        }

        if (room.getStatus() != RoomStatus.WAITING_LOBBY) {
            throw new IllegalStateException("La sala no está aceptando nuevos jugadores");
        }

        Player player = Player.builder()
                .room(room)
                .nickname(normalizedNickname)
                .totalScore(0)
                .build();

        Player savedPlayer = playerRepository.save(player);

        broadcastLobbyUpdate(room.getRoomId());

        return JoinRoomResponse.builder()
                .playerId(savedPlayer.getPlayerId())
                .roomId(room.getRoomId())
                .nickname(savedPlayer.getNickname())
                .joinedAt(savedPlayer.getJoinedAt())
                .build();
    }

    /**
     * Retira a un aprendiz de la sala de espera y notifica en tiempo real al lobby y al moderador.
     */
    @Transactional
    public void leaveRoom(String roomId, String playerId) {
        if (!roomRepository.existsById(roomId)) {
            throw new RoomNotFoundException("Sala no encontrada");
        }
        playerRepository.findById(playerId).ifPresent(player -> {
            if (player.getRoom() != null && roomId.equals(player.getRoom().getRoomId())) {
                playerRepository.delete(player);
                playerRepository.flush();
                log.info("Aprendiz {} ({}) salió de la sala {}", player.getNickname(), playerId, roomId);
            }
        });
        broadcastLobbyUpdate(roomId);
    }

    /**
     * Emite la lista de jugadores conectados al canal STOMP del lobby.
     */
    public void broadcastLobbyUpdate(String roomId) {
        List<LobbyPlayerResponse> lobbyPlayers = getLobbyPlayers(roomId);
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/lobby", lobbyPlayers);
    }

    /**
     * Obtiene la lista actual de aprendices en el lobby en formato DTO.
     */
    public List<LobbyPlayerResponse> getLobbyPlayers(String roomId) {
        return playerRepository.findByRoom_RoomId(roomId)
                .stream()
                .map(p -> LobbyPlayerResponse.builder()
                        .playerId(p.getPlayerId())
                        .nickname(p.getNickname())
                        .joinedAt(p.getJoinedAt())
                        .build())
                .toList();
    }

    /**
     * Inicia la partida interactiva (CU-03 / RF-08).
     */
    @Transactional
    public RoomResponse startGame(String roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RoomNotFoundException("Sala no encontrada"));

        if (room.getStatus() != RoomStatus.WAITING_LOBBY) {
            throw new IllegalStateException("La partida ya ha sido iniciada o finalizada");
        }

        if (playerRepository.findByRoom_RoomId(roomId).isEmpty()) {
            throw new IllegalStateException("Debe haber al menos 1 aprendiz conectado en la sala para iniciar la partida");
        }

        List<Question> deck = getOrCreateQuestionDeck(roomId);
        Question firstQuestion = deck.get(0);

        room.setStatus(RoomStatus.QUESTION_IN_PROGRESS);
        room.setCurrentQuestionIndex(1);
        Room updatedRoom = roomRepository.save(room);

        activeQuestionByRoomId.put(roomId, firstQuestion);
        LocalDateTime serverTimestamp = LocalDateTime.now(ZoneOffset.UTC);
        RoomSettingsDto settings = getRoomSettings(roomId);
        int effectiveTimeLimit = settings.resolveTimeLimitForType(firstQuestion.getType(), firstQuestion.getTimeLimitSeconds());
        int introSeconds = settings.getIntroDurationSeconds() != null ? settings.getIntroDurationSeconds() : 3;
        questionStartedAtByRoomId.put(roomId, serverTimestamp.plusSeconds(introSeconds));
        questionClosedByRoomId.put(roomId, false);
        lastRouletteByRoomId.remove(roomId);

        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/status",
                Map.of("status", updatedRoom.getStatus().name()));

        QuestionBroadcastResponse broadcastPayload = QuestionBroadcastResponse.fromEntity(
                firstQuestion,
                serverTimestamp,
                1,
                effectiveTimeLimit,
                introSeconds
        );
        lastBroadcastQuestionByRoomId.put(roomId, broadcastPayload);
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/question", broadcastPayload);

        return RoomResponse.fromEntity(updatedRoom);
    }

    /**
     * Consulta el estado actual de una sala mediante su PIN de 6 dígitos (Contrato §3 / Anexo A.4 / RF-03).
     */
    @Transactional(readOnly = true)
    public RoomResponse getRoomByPin(String pin) {
        if (pin == null || !pin.matches("^[0-9]{6}$")) {
            throw new IllegalArgumentException("El PIN debe tener 6 dígitos");
        }
        Room room = roomRepository.findByPin(pin)
                .orElseThrow(() -> new PinNotFoundException("PIN no encontrado"));
        int playerCount = playerRepository.findByRoom_RoomId(room.getRoomId()).size();
        return RoomResponse.fromEntityWithCount(room, playerCount);
    }

    @Transactional(readOnly = true)
    public Room findRoomByPinOrThrow(String pin) {
        if (pin == null || !pin.matches("^[0-9]{6}$")) {
            throw new IllegalArgumentException("El PIN debe tener 6 dígitos");
        }
        return roomRepository.findByPin(pin)
                .orElseThrow(() -> new PinNotFoundException("PIN no encontrado"));
    }

    public void recordQuestionResults(String roomId, QuestionResultsResponse results) {
        if (roomId != null && results != null) {
            lastQuestionResultsByRoomId.put(roomId, results);
            questionClosedByRoomId.put(roomId, true);
        }
    }

    public void recordRouletteResult(String roomId, RouletteResultResponse roulette) {
        if (roomId != null && roulette != null) {
            lastRouletteByRoomId.put(roomId, roulette);
        }
    }

    public QuestionBroadcastResponse getLastBroadcastQuestion(String roomId) {
        return lastBroadcastQuestionByRoomId.get(roomId);
    }

    public QuestionResultsResponse getLastQuestionResults(String roomId) {
        return lastQuestionResultsByRoomId.get(roomId);
    }

    public RouletteResultResponse getLastRouletteResult(String roomId) {
        return lastRouletteByRoomId.get(roomId);
    }

    public boolean isQuestionClosed(String roomId) {
        return Boolean.TRUE.equals(questionClosedByRoomId.get(roomId));
    }

    public int getRemainingQuestionSeconds(String roomId) {
        if (isQuestionClosed(roomId)) {
            return 0;
        }
        QuestionBroadcastResponse currentQ = lastBroadcastQuestionByRoomId.get(roomId);
        LocalDateTime startedAt = questionStartedAtByRoomId.get(roomId);
        if (currentQ == null || startedAt == null) {
            return 0;
        }
        int limitSec = currentQ.getTimeLimitSeconds() != null ? currentQ.getTimeLimitSeconds() : 15;
        LocalDateTime deadline = startedAt.plusSeconds(limitSec);
        long remaining = Duration.between(LocalDateTime.now(ZoneOffset.UTC), deadline).getSeconds();
        return (int) Math.max(0, Math.min(limitSec, remaining));
    }

    /**
     * Avanza a la siguiente pregunta de la partida (Contrato §4.2 /app/room/{roomId}/moderator/next y CU-03).
     */
    @Transactional
    public RoomResponse nextQuestion(String roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RoomNotFoundException("Sala no encontrada"));

        if (room.getStatus() == RoomStatus.FINISHED) {
            throw new IllegalStateException("La partida ya ha finalizado");
        }

        List<Question> deck = getOrCreateQuestionDeck(roomId);
        int nextOrder = (room.getCurrentQuestionIndex() == null ? 0 : room.getCurrentQuestionIndex()) + 1;
        if (nextOrder < 1 || nextOrder > deck.size()) {
            throw new IllegalStateException("No hay más preguntas disponibles en el banco");
        }
        Question nextQuestion = deck.get(nextOrder - 1);

        room.setStatus(RoomStatus.QUESTION_IN_PROGRESS);
        room.setCurrentQuestionIndex(nextOrder);
        Room updatedRoom = roomRepository.save(room);

        activeQuestionByRoomId.put(roomId, nextQuestion);
        LocalDateTime serverTimestamp = LocalDateTime.now(ZoneOffset.UTC);
        RoomSettingsDto settings = getRoomSettings(roomId);
        int effectiveTimeLimit = settings.resolveTimeLimitForType(nextQuestion.getType(), nextQuestion.getTimeLimitSeconds());
        int introSeconds = settings.getIntroDurationSeconds() != null ? settings.getIntroDurationSeconds() : 3;
        questionStartedAtByRoomId.put(roomId, serverTimestamp.plusSeconds(introSeconds));
        questionClosedByRoomId.put(roomId, false);
        lastRouletteByRoomId.remove(roomId);

        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/status",
                Map.of("status", updatedRoom.getStatus().name()));

        QuestionBroadcastResponse broadcastPayload = QuestionBroadcastResponse.fromEntity(
                nextQuestion,
                serverTimestamp,
                nextOrder,
                effectiveTimeLimit,
                introSeconds
        );
        lastBroadcastQuestionByRoomId.put(roomId, broadcastPayload);
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/question", broadcastPayload);

        return RoomResponse.fromEntity(updatedRoom);
    }

    private String generateUniquePin() {
        String pin;
        do {
            int number = secureRandom.nextInt(1_000_000);
            pin = String.format("%06d", number);
        } while (roomRepository.existsByPin(pin));
        return pin;
    }
}
