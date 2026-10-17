package com.senadso.englishday.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.senadso.englishday.model.Room;
import com.senadso.englishday.model.enums.RoomStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * DTO que modela la respuesta de consulta y estado de una sala (POST /api/rooms, GET /api/rooms/{pin}, etc.)
 * según el Contrato de Integración §3.1 y Anexo A.4.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RoomResponse {

    private String roomId;
    private String pin;
    private RoomStatus status;
    private Integer playerCount;
    private Integer currentQuestionIndex;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    private LocalDateTime createdAt;

    public static RoomResponse fromEntity(Room room) {
        return RoomResponse.builder()
                .roomId(room.getRoomId())
                .pin(room.getPin())
                .status(room.getStatus())
                .currentQuestionIndex(room.getCurrentQuestionIndex())
                .createdAt(room.getCreatedAt())
                .build();
    }

    public static RoomResponse fromEntityWithCount(Room room, int playerCount) {
        return RoomResponse.builder()
                .roomId(room.getRoomId())
                .pin(room.getPin())
                .status(room.getStatus())
                .playerCount(playerCount)
                .currentQuestionIndex(room.getCurrentQuestionIndex())
                .createdAt(room.getCreatedAt())
                .build();
    }
}
