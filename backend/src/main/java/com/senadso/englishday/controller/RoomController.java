package com.senadso.englishday.controller;

import com.senadso.englishday.dto.RoomResponse;
import com.senadso.englishday.service.RoomService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controlador REST para el recurso /api/rooms.
 * Cumple con Contrato de Integración §3 y Caso de Uso CU-01.
 */
@RestController
@RequestMapping("/api/rooms")
@CrossOrigin(origins = "*")
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    /**
     * Endpoint POST /api/rooms:
     * Crea una sala, genera el PIN de 6 dígitos y retorna HTTP 201 Created.
     */
    @PostMapping
    public ResponseEntity<RoomResponse> createRoom() {
        RoomResponse response = roomService.createRoom();
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
