package com.senadso.englishday.model.enums;

/**
 * Estados posibles de una sala de juego durante su ciclo de vida.
 * Definido en Contrato de Integración §2.1 y DAS §3.
 */
public enum RoomStatus {
    /**
     * Sala recién creada, en espera de que los aprendices ingresen con el PIN.
     */
    WAITING_LOBBY,

    /**
     * Ronda activa: los aprendices están respondiendo una pregunta con temporizador.
     */
    QUESTION_IN_PROGRESS,

    /**
     * Pausa activa para girar la ruleta y retroalimentar a un aprendiz al azar (RF-11 / CU-05).
     */
    ROULETTE_TIME,

    /**
     * Fin de la partida, presentación del podio final (Top 3) y estadísticas (RF-10 / CU-06).
     */
    FINISHED
}
