package com.senadso.englishday.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.senadso.englishday.model.enums.RoomStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * DTO de sincronización integral del estado en vivo de una sala para persistencia y reconexión
 * automática del Moderador y del Aprendiz tras reiniciar o recargar el navegador.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RoomSyncStateResponse {

    private String roomId;
    private String pin;
    private RoomStatus status;
    private Integer currentQuestionIndex;
    private Integer playerCount;
    private List<LobbyPlayerResponse> players;
    private RoomSettingsDto settings;
    private Boolean questionClosed;
    private Integer remainingSeconds;
    private QuestionBroadcastResponse currentQuestion;
    private QuestionResultsResponse lastResults;
    private RouletteResultResponse lastRoulette;
    private PodiumResponse podium;
    private LobbyPlayerResponse player;
    private String playerSubmittedAnswer;
}
