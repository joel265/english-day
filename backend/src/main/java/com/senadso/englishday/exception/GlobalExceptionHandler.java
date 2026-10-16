package com.senadso.englishday.exception;

import com.senadso.englishday.dto.ErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Manejador global de excepciones para el API REST.
 * Centraliza las respuestas de error cumpliendo estrictamente el formato { "error": "..." } de Contrato §3.2.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Intercepta la ausencia de sala por PIN y responde HTTP 404 (CP-03).
     */
    @ExceptionHandler(PinNotFoundException.class)
    public ResponseEntity<ErrorResponse> handlePinNotFound(PinNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse(ex.getMessage()));
    }

    /**
     * Intercepta la ausencia de sala por roomId y responde HTTP 404.
     */
    @ExceptionHandler(RoomNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleRoomNotFound(RoomNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse(ex.getMessage()));
    }

    /**
     * Intercepta violaciones de estado de sala (ej. sala ya iniciada o finalizada).
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalState(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(ex.getMessage()));
    }

    /**
     * Intercepta errores de validación de Bean Validation (@NotBlank, @Size).
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationErrors(MethodArgumentNotValidException ex) {
        String errorMessage = ex.getBindingResult().getFieldErrors().isEmpty()
                ? "Petición inválida"
                : ex.getBindingResult().getFieldErrors().get(0).getDefaultMessage();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(errorMessage));
    }
}
