package com.senadso.englishday.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.senadso.englishday.dto.CreateRoomResponse;
import com.senadso.englishday.dto.JoinRoomRequest;
import com.senadso.englishday.service.RoomService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Pruebas de integración del API REST para la gestión de salas y join (Tarea 4).
 * Valida los casos de prueba CP-01, CP-02 y CP-03 del Plan de Pruebas y QA.
 */
@SpringBootTest
@AutoConfigureMockMvc
class RoomControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RoomService roomService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("CP-01: POST /api/rooms debe crear sala y responder 201 Created con PIN de 6 dígitos")
    void testCreateRoom() throws Exception {
        mockMvc.perform(post("/api/rooms")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.roomId", notNullValue()))
                .andExpect(jsonPath("$.pin", matchesPattern("^[0-9]{6}$")))
                .andExpect(jsonPath("$.status", is("WAITING_LOBBY")))
                .andExpect(jsonPath("$.createdAt", notNullValue()));
    }

    @Test
    @DisplayName("CP-02: POST /api/rooms/{pin}/join con PIN válido debe retornar 200 OK y registrar jugador")
    void testJoinRoomSuccess() throws Exception {
        // Precondición: Crear una sala real en estado WAITING_LOBBY
        CreateRoomResponse room = roomService.createRoom();

        JoinRoomRequest request = JoinRoomRequest.builder()
                .nickname("camilo_dev")
                .build();

        mockMvc.perform(post("/api/rooms/" + room.getPin() + "/join")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.playerId", notNullValue()))
                .andExpect(jsonPath("$.roomId", is(room.getRoomId())))
                .andExpect(jsonPath("$.nickname", is("camilo_dev")))
                .andExpect(jsonPath("$.joinedAt", notNullValue()));
    }

    @Test
    @DisplayName("CP-03: POST /api/rooms/{pin}/join con PIN inexistente debe retornar 404 Not Found y { \"error\": \"PIN no encontrado\" }")
    void testJoinRoomInvalidPin() throws Exception {
        JoinRoomRequest request = JoinRoomRequest.builder()
                .nickname("aprendiz_test")
                .build();

        // PIN inexistente "000000"
        mockMvc.perform(post("/api/rooms/000000/join")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error", is("PIN no encontrado")));
    }

    @Autowired
    private com.senadso.englishday.repository.QuestionRepository questionRepository;

    @Autowired
    private com.senadso.englishday.repository.AnswerRepository answerRepository;

    @Test
    @DisplayName("Validación: POST /api/rooms/{pin}/join con nickname vacío debe retornar 400 Bad Request")
    void testJoinRoomBlankNickname() throws Exception {
        JoinRoomRequest request = JoinRoomRequest.builder()
                .nickname("")
                .build();

        mockMvc.perform(post("/api/rooms/123456/join")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", notNullValue()));
    }

    @Test
    @DisplayName("CU-03 / RF-08: POST /api/rooms/{roomId}/start debe iniciar la partida y responder 200 OK")
    void testStartGameSuccess() throws Exception {
        // Asegurar que exista la pregunta order = 1
        answerRepository.deleteAll();
        questionRepository.deleteAll();
        com.senadso.englishday.model.Question question = com.senadso.englishday.model.Question.builder()
                .type(com.senadso.englishday.model.enums.QuestionType.MULTIPLE_CHOICE)
                .prompt("Choose the correct answer")
                .options(java.util.List.of("A", "B", "C", "D"))
                .correctAnswer("A")
                .timeLimitSeconds(15)
                .order(1)
                .build();
        questionRepository.save(question);

        CreateRoomResponse room = roomService.createRoom();
        roomService.joinRoom(room.getPin(), new JoinRoomRequest("aprendiz_test"));

        mockMvc.perform(post("/api/rooms/" + room.getRoomId() + "/start")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roomId", is(room.getRoomId())))
                .andExpect(jsonPath("$.status", is("QUESTION_IN_PROGRESS")));
    }

    @Test
    @DisplayName("CU-03: POST /api/rooms/{roomId}/start sin jugadores conectados debe retornar 400 Bad Request")
    void testStartGameWithoutPlayersFails() throws Exception {
        CreateRoomResponse room = roomService.createRoom();

        mockMvc.perform(post("/api/rooms/" + room.getRoomId() + "/start")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("INVALID_ROOM_STATE")));
    }

    @Test
    @DisplayName("CU-03: POST /api/rooms/{roomId}/start con roomId inexistente debe retornar 404 Not Found")
    void testStartGameRoomNotFound() throws Exception {
        mockMvc.perform(post("/api/rooms/00000000-0000-0000-0000-000000000000/start")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error", is("Sala no encontrada")));
    }

    @Test
    @DisplayName("Tarea 11 / RF-10 / CU-06: GET /api/rooms/{roomId}/results retorna 200 OK con el Podio Top 3")
    void testGetFinalResultsSuccess() throws Exception {
        CreateRoomResponse room = roomService.createRoom();

        // Registrar participantes
        roomService.joinRoom(room.getPin(), JoinRoomRequest.builder().nickname("camilo_dev").build());
        roomService.joinRoom(room.getPin(), JoinRoomRequest.builder().nickname("laura_eng").build());

        mockMvc.perform(get("/api/rooms/" + room.getRoomId() + "/results")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roomId", is(room.getRoomId())))
                .andExpect(jsonPath("$.top3", hasSize(2)))
                .andExpect(jsonPath("$.totalPlayers", is(2)))
                .andExpect(jsonPath("$.timestamp", notNullValue()));
    }

    @Test
    @DisplayName("Tarea 11: GET /api/rooms/{roomId}/results con sala inexistente retorna 404 Not Found")
    void testGetFinalResultsRoomNotFound() throws Exception {
        mockMvc.perform(get("/api/rooms/00000000-0000-0000-0000-000000000000/results")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error", is("Sala no encontrada")));
    }

    @Test
    @DisplayName("Tarea 11 / CP-11: POST /api/rooms/{roomId}/finish finaliza la partida con estado FINISHED")
    void testFinishGameSuccess() throws Exception {
        CreateRoomResponse room = roomService.createRoom();

        mockMvc.perform(post("/api/rooms/" + room.getRoomId() + "/finish")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roomId", is(room.getRoomId())))
                .andExpect(jsonPath("$.status", is("FINISHED")))
                .andExpect(jsonPath("$.top3", notNullValue()));
    }

    @Test
    @DisplayName("RF-03 / Anexo A.4: GET /api/rooms/{pin} retorna 200 OK con el estado actual y playerCount")
    void testGetRoomByPinSuccess() throws Exception {
        CreateRoomResponse room = roomService.createRoom();
        roomService.joinRoom(room.getPin(), JoinRoomRequest.builder().nickname("ana_dev").build());

        mockMvc.perform(get("/api/rooms/" + room.getPin())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roomId", is(room.getRoomId())))
                .andExpect(jsonPath("$.pin", is(room.getPin())))
                .andExpect(jsonPath("$.status", is("WAITING_LOBBY")))
                .andExpect(jsonPath("$.playerCount", is(1)));
    }

    @Test
    @DisplayName("CU-03 / Tarea 14: POST /api/rooms/{roomId}/next avanza a la siguiente pregunta y responde 200 OK")
    void testNextQuestionSuccess() throws Exception {
        answerRepository.deleteAll();
        questionRepository.deleteAll();
        questionRepository.save(com.senadso.englishday.model.Question.builder()
                .type(com.senadso.englishday.model.enums.QuestionType.MULTIPLE_CHOICE)
                .prompt("Question 1")
                .options(java.util.List.of("A", "B"))
                .correctAnswer("A")
                .timeLimitSeconds(15)
                .order(1)
                .build());
        questionRepository.save(com.senadso.englishday.model.Question.builder()
                .type(com.senadso.englishday.model.enums.QuestionType.TEXT_INPUT)
                .prompt("Question 2")
                .options(null)
                .correctAnswer("ate")
                .timeLimitSeconds(20)
                .order(2)
                .build());

        CreateRoomResponse room = roomService.createRoom();
        roomService.joinRoom(room.getPin(), JoinRoomRequest.builder().nickname("camilo_dev").build());
        roomService.startGame(room.getRoomId());

        mockMvc.perform(post("/api/rooms/" + room.getRoomId() + "/next")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roomId", is(room.getRoomId())))
                .andExpect(jsonPath("$.status", is("QUESTION_IN_PROGRESS")))
                .andExpect(jsonPath("$.currentQuestionIndex", is(2)));
    }

    @Test
    @DisplayName("Validación Lobby: POST /api/rooms/{roomId}/start sin jugadores retorna 400 Bad Request")
    void testStartGameWithoutPlayersReturnsBadRequest() throws Exception {
        CreateRoomResponse room = roomService.createRoom();

        mockMvc.perform(post("/api/rooms/" + room.getRoomId() + "/start")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }
}
