# Tarea 2 - Base de Datos

## Objetivo
Diseñar el modelo entidad-relación de las tablas Room, Player, Question, Answer y Score, y dejar el script SQL inicial de creación siguiendo el Contrato de Integración §2.

## Estado actual
Se ha validado la relación principal:
- Room 1:N Player
- Player 1:N Answer
- Question 1:N Answer
- Score como entidad de consolidación por jugador y sala

Se avanzó a la segunda parte del bloque de la Tarea 2:
- 02_question_answer_score.sql: creación de Question, Answer y Score

## Ambigüedades por confirmar con Backend
- Definición exacta de la clave primaria de Score: PK compuesta (playerId, roomId) o clave artificial.
- Tipo exacto para Question.type y Room.status: ENUM de BD o VARCHAR + CHECK.
- Tipo exacto para Question.options: array, JSON o texto estructurado.

## Carpeta actual
- 01_room_player.sql: primer bloque de creación de tablas, con Room y Player.
- 02_question_answer_score.sql: segundo bloque con Question, Answer y Score.
- schema.sql: versión final consolidada del diseño de la Tarea 2.
- questions_seed.sql: seed inicial de preguntas y datos de prueba.
