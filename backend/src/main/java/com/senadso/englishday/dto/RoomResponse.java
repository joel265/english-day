package com.senadso.englishday.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.senadso.englishday.model.Room;
import com.senadso.englishday.model.enums.RoomStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * DTO que modela la respuesta del endpoint POST /api/rooms
 * según el Contrato de Integración §3.1:
 * {
 *   "roomId": "8f14e45f-...-b41b",
 *   "pin": "048213",
 *   "status": "WAITING_LOBBY",
 *   "createdAt": "2026-09-21T14:00:00Z"
 * }
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomResponse {

    private String roomId;
    private String pin;
    private RoomStatus status;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    private LocalDateTime createdAt;

    public static RoomResponse fromEntity(Room room) {
        return RoomResponse.builder()
                .roomId(room.getRoomId())
                .pin(room.getPin())
                .status(room.getStatus())
                .createdAt(room.getCreatedAt())
                .build();
    }
}
