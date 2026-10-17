package com.senadso.englishday.controller;

import com.senadso.englishday.dto.CreateRoomResponse;
import com.senadso.englishday.dto.JoinRoomRequest;
import com.senadso.englishday.dto.JoinRoomResponse;
import com.senadso.englishday.dto.RoomResponse;
import com.senadso.englishday.dto.RouletteResultResponse;
import com.senadso.englishday.service.RoomService;
import com.senadso.englishday.service.RouletteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    /**
     * Endpoint para crear una sala y generar el PIN de 6 dígitos.
     * Ruta: POST /api/rooms (Contrato §3.1 / RF-01 / CU-01).
     */
    @PostMapping
    public ResponseEntity<CreateRoomResponse> createRoom() {
        CreateRoomResponse response = roomService.createRoom();
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
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
     * Endpoint para que el moderador inicie la partida.
     * Ruta: POST /api/rooms/{roomId}/start (Contrato §3 / CU-03 / RF-08).
     */
    @PostMapping("/{roomId}/start")
    public ResponseEntity<RoomResponse> startGame(@PathVariable String roomId) {
        RoomResponse response = roomService.startGame(roomId);
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
}
