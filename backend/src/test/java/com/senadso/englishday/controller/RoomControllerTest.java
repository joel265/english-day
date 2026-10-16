package com.senadso.englishday.controller;

import com.senadso.englishday.dto.RoomResponse;
import com.senadso.englishday.model.enums.RoomStatus;
import com.senadso.englishday.service.RoomService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Prueba unitaria para el caso de prueba CP-01 (Crear Sala).
 */
@WebMvcTest(RoomController.class)
class RoomControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RoomService roomService;

    @Test
    @DisplayName("CP-01: POST /api/rooms debe responder 201 Created con estructura del Contrato")
    void shouldCreateRoomSuccessfully() throws Exception {
        RoomResponse mockResponse = RoomResponse.builder()
                .roomId("8f14e45f-1234-4a5b-9c7d-e8f0a1b2c3d4")
                .pin("048213")
                .status(RoomStatus.WAITING_LOBBY)
                .createdAt(LocalDateTime.of(2026, 9, 21, 14, 0, 0))
                .build();

        Mockito.when(roomService.createRoom()).thenReturn(mockResponse);

        mockMvc.perform(post("/api/rooms")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.roomId", is("8f14e45f-1234-4a5b-9c7d-e8f0a1b2c3d4")))
                .andExpect(jsonPath("$.pin", is("048213")))
                .andExpect(jsonPath("$.pin", hasLength(6)))
                .andExpect(jsonPath("$.status", is("WAITING_LOBBY")))
                .andExpect(jsonPath("$.createdAt", notNullValue()));
    }
}
