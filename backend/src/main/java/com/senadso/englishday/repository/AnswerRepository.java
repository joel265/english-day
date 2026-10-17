package com.senadso.englishday.repository;

import com.senadso.englishday.model.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio Spring Data JPA para la entidad Answer.
 * Gestiona el almacenamiento y consulta de las respuestas emitidas por los aprendices.
 */
@Repository
public interface AnswerRepository extends JpaRepository<Answer, String> {

    /**
     * Verifica si un aprendiz ya respondió a una pregunta específica en la partida.
     * Previene respuestas duplicadas para la misma pregunta (CU-04).
     *
     * @param playerId Identificador UUID del aprendiz.
     * @param questionId Identificador UUID de la pregunta.
     * @return true si ya existe una respuesta previa, false en caso contrario.
     */
    boolean existsByPlayer_PlayerIdAndQuestion_QuestionId(String playerId, String questionId);

    /**
     * Obtiene la respuesta de un jugador a una pregunta dada.
     */
    Optional<Answer> findByPlayer_PlayerIdAndQuestion_QuestionId(String playerId, String questionId);

    /**
     * Lista todas las respuestas recibidas para una pregunta específica.
     * Útil para el cálculo del leaderboard (Tarea 9) y la ruleta (Tarea 10).
     */
    List<Answer> findByQuestion_QuestionId(String questionId);

    /**
     * Lista todas las respuestas emitidas por un jugador en la sesión.
     */
    List<Answer> findByPlayer_PlayerId(String playerId);
}
