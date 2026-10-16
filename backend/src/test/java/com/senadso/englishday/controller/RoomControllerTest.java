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
}
