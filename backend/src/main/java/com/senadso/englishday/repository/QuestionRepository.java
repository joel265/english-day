package com.senadso.englishday.repository;

import com.senadso.englishday.model.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio Spring Data JPA para la entidad Question.
 * Permite consultar el banco de preguntas pedagógicas ordenadas según la secuencia de juego.
 */
@Repository
public interface QuestionRepository extends JpaRepository<Question, String> {

    /**
     * Busca una pregunta por su posición u orden secuencial dentro de la partida.
     * Utilizado para cargar la pregunta actual (ej. order = 1 al iniciar el juego).
     *
     * @param order Número de orden de la pregunta.
     * @return Pregunta encontrada o Optional.empty() si no existe.
     */
    Optional<Question> findByOrder(Integer order);

    /**
     * Obtiene todas las preguntas ordenadas ascendentemente por su posición.
     */
    List<Question> findAllByOrderByOrderAsc();
}
