package com.senadso.englishday.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.senadso.englishday.model.enums.RoomStatus;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Payload JSON que el servidor responde con status 201 Created a POST /api/rooms.
 * Definido en Contrato de Integración §3.1.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateRoomResponse {

    private String roomId;
    private String pin;
    private RoomStatus status;
    private String lanIp;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
    private LocalDateTime createdAt;
}
