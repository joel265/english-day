package com.senadso.englishday.repository;

import com.senadso.englishday.model.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repositorio Spring Data JPA para la entidad Room.
 */
@Repository
public interface RoomRepository extends JpaRepository<Room, String> {

    /**
     * Verifica si ya existe una sala registrada con el PIN dado.
     * Requerido para garantizar la unicidad del PIN de 6 dígitos en la Tarea 3.
     */
    boolean existsByPin(String pin);

    /**
     * Busca una sala a partir de su PIN de 6 dígitos.
     * Prerrequisito para la Tarea 4 (POST /api/rooms/{pin}/join) y reconexión.
     */
    Optional<Room> findByPin(String pin);
}
