package com.senadso.englishday.repository;

import com.senadso.englishday.model.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repositorio Spring Data JPA para la entidad Room.
 * Gestiona consultas y persistencia de salas de juego.
 */
@Repository
public interface RoomRepository extends JpaRepository<Room, String> {

    /**
     * Busca una sala activa a partir de su PIN de 6 dígitos.
     * Esencial para el flujo de Join (Contrato §3.2 / RF-02).
     */
    Optional<Room> findByPin(String pin);

    /**
     * Verifica si ya existe una sala registrada con el PIN especificado.
     * Utilizado para evitar colisiones al generar nuevos códigos PIN.
     */
    boolean existsByPin(String pin);
}
