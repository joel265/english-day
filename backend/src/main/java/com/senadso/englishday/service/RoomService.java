package com.senadso.englishday.service;

import com.senadso.englishday.dto.RoomResponse;
import com.senadso.englishday.model.Room;
import com.senadso.englishday.model.enums.RoomStatus;
import com.senadso.englishday.repository.RoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Servicio de lógica de negocio para la gestión de salas (CU-01 / RF-01).
 */
@Service
public class RoomService {

    private final RoomRepository roomRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public RoomService(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    /**
     * Endpoint Tarea 3: Crear sala + PIN de 6 dígitos único.
     * Genera un UUID v4, un PIN aleatorio de 6 dígitos que no colisione en BD,
     * inicializa el estado en WAITING_LOBBY y currentQuestionIndex en 0.
     */
    @Transactional
    public RoomResponse createRoom() {
        String pin = generateUniquePin();

        Room room = Room.builder()
                .roomId(UUID.randomUUID().toString())
                .pin(pin)
                .status(RoomStatus.WAITING_LOBBY)
                .currentQuestionIndex(0)
                .createdAt(LocalDateTime.now())
                .build();

        Room savedRoom = roomRepository.save(room);
        return RoomResponse.fromEntity(savedRoom);
    }

    /**
     * Genera un PIN aleatorio de 6 dígitos con formato "%06d"
     * para preservar ceros a la izquierda (Contrato §1) y verifica unicidad.
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
