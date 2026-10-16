package com.senadso.englishday.model;

import com.senadso.englishday.model.enums.QuestionType;
import com.senadso.englishday.model.enums.RoomStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Pruebas unitarias de integridad de modelo para las 5 entidades JPA (Tarea 2).
 * Valida constructores, valores por defecto, ciclo de vida (@PrePersist)
 * y relaciones conforme al Contrato de Integración §2 y DAS §3.
 */
class EntityMappingTest {

    @Test
    @DisplayName("Room: debe inicializar con valores por defecto y generar UUID en prePersist")
    void testRoomPrePersist() {
        Room room = Room.builder()
                .pin("123456")
                .build();

        assertNull(room.getRoomId());
        assertNull(room.getCreatedAt());

        room.prePersist();

        assertNotNull(room.getRoomId(), "El roomId debe generarse automáticamente");
        assertEquals(36, room.getRoomId().length(), "Debe tener formato UUID v4 de 36 caracteres");
        assertEquals("123456", room.getPin());
        assertEquals(RoomStatus.WAITING_LOBBY, room.getStatus());
        assertEquals(0, room.getCurrentQuestionIndex());
        assertNotNull(room.getCreatedAt(), "createdAt debe asignarse automáticamente");
    }

    @Test
    @DisplayName("Question: debe registrar correctamente tipos, opciones y tiempo límite")
    void testQuestionCreation() {
        List<String> options = List.of("goed", "went", "gone", "going");
        Question question = Question.builder()
                .type(QuestionType.MULTIPLE_CHOICE)
                .prompt("Choose the correct past tense of 'go'.")
                .options(options)
                .correctAnswer("went")
                .timeLimitSeconds(15)
                .order(1)
                .build();

        question.prePersist();

        assertNotNull(question.getQuestionId());
        assertEquals(QuestionType.MULTIPLE_CHOICE, question.getType());
        assertEquals("went", question.getCorrectAnswer());
        assertEquals(4, question.getOptions().size());
        assertEquals(15, question.getTimeLimitSeconds());
        assertEquals(1, question.getOrder());
    }

    @Test
    @DisplayName("Player: debe vincularse a Room y asignar joinedAt y totalScore inicial")
    void testPlayerCreation() {
        Room room = Room.builder().pin("654321").build();
        room.prePersist();

        Player player = Player.builder()
                .room(room)
                .nickname("camilo_dev")
                .build();

        player.prePersist();

        assertNotNull(player.getPlayerId());
        assertEquals(room, player.getRoom());
        assertEquals("camilo_dev", player.getNickname());
        assertEquals(0, player.getTotalScore());
        assertNotNull(player.getJoinedAt());
    }

    @Test
    @DisplayName("Answer: debe relacionar Player, Question y registrar respuesta con tiempo")
    void testAnswerCreation() {
        Room room = Room.builder().pin("112233").build();
        room.prePersist();

        Player player = Player.builder().room(room).nickname("laura_eng").build();
        player.prePersist();

        Question question = Question.builder()
                .type(QuestionType.MULTIPLE_CHOICE)
                .prompt("Question 1")
                .correctAnswer("went")
                .timeLimitSeconds(15)
                .order(1)
                .build();
        question.prePersist();

        Answer answer = Answer.builder()
                .player(player)
                .question(question)
                .value("went")
                .isCorrect(true)
                .responseTimeMs(2450)
                .pointsAwarded(950)
                .build();

        answer.prePersist();

        assertNotNull(answer.getAnswerId());
        assertEquals(player, answer.getPlayer());
        assertEquals(question, answer.getQuestion());
        assertTrue(answer.getIsCorrect());
        assertEquals(2450, answer.getResponseTimeMs());
        assertEquals(950, answer.getPointsAwarded());
    }

    @Test
    @DisplayName("Score: debe componer la clave primaria compuesta (playerId + roomId) y rank")
    void testScoreCreation() {
        Room room = Room.builder().pin("998877").build();
        room.prePersist();

        Player player = Player.builder().room(room).nickname("ana_tech").build();
        player.prePersist();

        Score score = Score.builder()
                .player(player)
                .room(room)
                .totalPoints(4200)
                .rank(1)
                .build();

        score.prePersist();

        assertNotNull(score.getId());
        assertEquals(player.getPlayerId(), score.getId().getPlayerId());
        assertEquals(room.getRoomId(), score.getId().getRoomId());
        assertEquals(4200, score.getTotalPoints());
        assertEquals(1, score.getRank());
    }
}
