package com.senadso.englishday.repository;

import com.senadso.englishday.model.Score;
import com.senadso.englishday.model.ScoreId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio Spring Data JPA para la entidad Score.
 * Gestiona el puntaje acumulado y ranking de jugadores por sala (RF-09 / RF-10).
 */
@Repository
public interface ScoreRepository extends JpaRepository<Score, ScoreId> {

    /**
     * Obtiene los puntajes de una sala ordenados de mayor a menor puntuación.
     */
    List<Score> findByRoom_RoomIdOrderByTotalPointsDesc(String roomId);

    /**
     * Busca el registro de puntaje de un jugador en una sala específica.
     */
    Optional<Score> findById_PlayerIdAndId_RoomId(String playerId, String roomId);
}
