package com.senadso.englishday.exception;

/**
 * Excepción lanzada cuando una sala no existe para el roomId suministrado.
 * Produce una respuesta HTTP 404 Not Found con formato { "error": "..." }.
 */
public class RoomNotFoundException extends RuntimeException {

    public RoomNotFoundException(String message) {
        super(message);
    }
}
