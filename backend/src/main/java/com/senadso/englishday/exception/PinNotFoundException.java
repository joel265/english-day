package com.senadso.englishday.exception;

/**
 * Excepción de negocio lanzada cuando un aprendiz intenta unirse a una sala con un PIN inexistente.
 * Mapeada al caso de prueba CP-03 / Contrato §3.2 (HTTP 404 Not Found).
 */
public class PinNotFoundException extends RuntimeException {

    public PinNotFoundException(String message) {
        super(message);
    }
}
