package com.senadso.englishday.repository;

import com.senadso.englishday.model.Player;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio Spring Data JPA para la entidad Player.
 * Gestiona el registro y consulta de aprendices en salas.
 */
@Repository
public interface PlayerRepository extends JpaRepository<Player, String> {

    /**
     * Lista todos los jugadores conectados a una sala dada.
     * Útil para emitir la lista en vivo hacia /topic/room/{roomId}/lobby (RF-03).
     */
    List<Player> findByRoom_RoomId(String roomId);

    /**
     * Busca si ya existe un jugador con un nickname específico en la misma sala.
     */
    Optional<Player> findByRoom_RoomIdAndNickname(String roomId, String nickname);

    /**
     * Verifica rápidamente si un nickname ya está ocupado en la sala.
     */
    boolean existsByRoom_RoomIdAndNickname(String roomId, String nickname);
}
