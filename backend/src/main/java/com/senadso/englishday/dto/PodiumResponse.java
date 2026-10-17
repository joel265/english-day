package com.senadso.englishday.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.senadso.englishday.model.enums.RoomStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO que representa el podio final (Top 3) al culminar la partida.
 * Implementa el contrato para GET /api/rooms/{roomId}/results y la difusión en /topic/room/{roomId}/podium
 * según Contrato de Integración §3, §4.1 y requerimientos RF-10 / CU-06 / CP-11.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PodiumResponse {

    /**
     * Identificador UUID de la sala de juego.
     */
    private String roomId;

    /**
     * Estado final de la sala (típicamente FINISHED).
     */
    private RoomStatus status;

    /**
     * Lista de los 3 aprendices con mayor puntaje acumulado en la sala.
     */
    private List<LeaderboardEntryDto> top3;

    /**
     * Cantidad total de aprendices que participaron en la partida.
     */
    private Integer totalPlayers;

    /**
     * Marca de tiempo UTC en que se emitió el podio final.
     */
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    private LocalDateTime timestamp;

    /**
     * Alias de conveniencia para clientes frontend que consuman la propiedad 'podium'.
     * Se marca como READ_ONLY para que la deserialización de Jackson no duplique la lista top3.
     */
    @JsonProperty(value = "podium", access = JsonProperty.Access.READ_ONLY)
    public List<LeaderboardEntryDto> getPodium() {
        return top3;
    }
}
