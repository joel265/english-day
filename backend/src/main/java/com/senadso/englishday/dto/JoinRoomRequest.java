package com.senadso.englishday.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * Payload JSON que el cliente envía a POST /api/rooms/{pin}/join.
 * Definido en Contrato de Integración §3.2.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JoinRoomRequest {

    /**
     * Nombre visible o alias que el aprendiz utilizará en la partida.
     */
    @NotBlank(message = "El nickname es obligatorio")
    @Size(min = 2, max = 50, message = "El nickname debe tener entre 2 y 50 caracteres")
    private String nickname;

    /**
     * Identificador o configuración JSON del avatar seleccionado por el aprendiz.
     */
    private String avatar;

    public JoinRoomRequest(String nickname) {
        this.nickname = nickname;
    }
}
