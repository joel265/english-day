package com.senadso.englishday.service;

import com.senadso.englishday.dto.CreateRoomResponse;
import com.senadso.englishday.dto.JoinRoomRequest;
import com.senadso.englishday.dto.JoinRoomResponse;
import com.senadso.englishday.exception.PinNotFoundException;
import com.senadso.englishday.model.Player;
import com.senadso.englishday.model.Room;
import com.senadso.englishday.model.enums.RoomStatus;
import com.senadso.englishday.repository.PlayerRepository;
import com.senadso.englishday.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;

/**
 * Servicio de lógica de negocio para la gestión de salas y registro de aprendices.
 * Implementa CU-01 (Crear sala) y CU-02 (Unirse a sala con PIN).
 */
@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final PlayerRepository playerRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Crea una nueva sala de juego con un PIN único de 6 dígitos (RF-01 / CU-01).
     */
    @Transactional
    public CreateRoomResponse createRoom() {
        String pin = generateUniquePin();

        Room room = Room.builder()
                .pin(pin)
                .status(RoomStatus.WAITING_LOBBY)
                .currentQuestionIndex(0)
                .build();

        Room savedRoom = roomRepository.save(room);

        return CreateRoomResponse.builder()
                .roomId(savedRoom.getRoomId())
                .pin(savedRoom.getPin())
                .status(savedRoom.getStatus())
                .createdAt(savedRoom.getCreatedAt())
                .build();
    }

    /**
     * Registra a un aprendiz en una sala activa mediante su PIN y nickname (RF-02 / CU-02).
     *
     * @param pin Código PIN de 6 dígitos ingresado en el móvil.
     * @param request Datos del aprendiz ({ "nickname": "..." }).
     * @return Datos del jugador registrado y la sala asignada (HTTP 200 OK).
     * @throws PinNotFoundException si el PIN no existe (HTTP 404 / CP-03).
     * @throws IllegalStateException si la sala ya no está en estado WAITING_LOBBY.
     */
    @Transactional
    public JoinRoomResponse joinRoom(String pin, JoinRoomRequest request) {
        // 1. Buscar la sala por PIN exacto
        Room room = roomRepository.findByPin(pin)
                .orElseThrow(() -> new PinNotFoundException("PIN no encontrado"));

        // 2. Validar que la sala esté disponible para recibir jugadores
        if (room.getStatus() != RoomStatus.WAITING_LOBBY) {
            throw new IllegalStateException("La sala no está aceptando nuevos jugadores");
        }

        // 3. Crear y persistir la entidad Player vinculada a la Room
        Player player = Player.builder()
                .room(room)
                .nickname(request.getNickname().trim())
                .totalScore(0)
                .build();

        Player savedPlayer = playerRepository.save(player);

        // 4. Mapear y retornar la respuesta según Contrato §3.2
        return JoinRoomResponse.builder()
                .playerId(savedPlayer.getPlayerId())
                .roomId(room.getRoomId())
                .nickname(savedPlayer.getNickname())
                .joinedAt(savedPlayer.getJoinedAt())
                .build();
    }

    /**
     * Genera un PIN numérico aleatorio de 6 dígitos ("000000" a "999999")
     * garantizando que no esté colisionando con una sala existente.
     */
    private String generateUniquePin() {
        String pin;
        do {
            int number = secureRandom.nextInt(1_000_000);
            pin = String.format("%06d", number);
        } while (roomRepository.existsByPin(pin));
        return pin;
    }
}
