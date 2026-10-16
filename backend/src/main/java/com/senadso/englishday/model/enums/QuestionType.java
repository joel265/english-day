package com.senadso.englishday.model.enums;

/**
 * Tipos de interacciones pedagógicas soportadas en el juego.
 * Definido en Contrato de Integración §2.1 y DAS §3.
 */
public enum QuestionType {
    /**
     * Selección múltiple con 4 opciones de colores estilo Kahoot (RF-04 / CP-04).
     */
    MULTIPLE_CHOICE,

    /**
     * Construcción de oraciones ordenando bloques de palabras estilo Duolingo (RF-05 / CP-05).
     */
    WORD_BLOCKS,

    /**
     * Entrada de texto libre / spelling con normalización en servidor (RF-06 / CP-06).
     */
    TEXT_INPUT,

    /**
     * Reconocimiento de voz mediante Web Speech API / Cloudflare Tunnel (RF-07 / CP-07).
     */
    VOICE
}
