# Tarea 5 - Script questions_seed.sql con datos de prueba (Base de Datos & QA)

## 1. Objetivo

Construir el script `questions_seed.sql` oficial para poblar la base de datos relacional del proyecto **English Day** (**MySQL 8.0+**, según Decisión Técnica #4), articulando el banco pedagógico provisto por el equipo de **QA (Tarea 1)** con los requerimientos técnicos y esquemas del **Contrato de Integración §2 y §4.3** y el **Manual de Despliegue (Paso 1)**.

---

## 2. Contenido del entregable

El archivo `questions_seed.sql` contiene las inserciones relacionales completas organizadas en 5 bloques dependientes:

### Bloque 1: Banco de Preguntas (`Question`)
* **Total de preguntas**: 23 preguntas.
* **Preguntas pedagógicas de QA (20)**:
  * 4 preguntas de *Simple Present* Nivel 1 (Afirmativo).
  * 5 preguntas de *Simple Present* Nivel 2 (Negativo: `don't` / `doesn't`).
  * 5 preguntas de *Simple Present* Nivel 3 (Interrogativo: `Do` / `Does`).
  * 5 preguntas de *Simple Present* de consolidación y diálogos.
  * 1 pregunta de *WH Questions* (`EnglishQuest.docx`).
* **Mecánicas interactivas especiales (3)**:
  * `TEXT_INPUT`: Campo de entrada de texto libre (`options: NULL`).
  * `WORD_BLOCKS`: Bloques ordenables (`options: JSON_ARRAY(...)`).
  * `VOICE`: Transcripción por voz mediante Web Speech API (`options: NULL`).
* **Ajustes y normalización**:
  * Se corrigieron erratas tipográficas presentes en el documento fuente de QA (ej. `toe` por `the`, `geta` por `gets`, `ranges` por `Oranges`).
  * `correctAnswer` se conserva únicamente en la tabla interna de la BD y **nunca** se expone en el payload público enviado por WebSockets.
  * Para MySQL 8.0+, el campo reservado `` `order` `` se encuentra debidamente escapado con comillas invertidas (*backticks*).

### Bloque 2: Salas de Prueba (`Room`)
* **Sala 1 (`aaaaaaaa-...`)**: PIN `123456`, estado `WAITING_LOBBY`, `currentQuestionIndex = 0`. Diseñada para pruebas del Lobby y del endpoint `POST /api/rooms/{pin}/join`.
* **Sala 2 (`bbbbbbbb-...`)**: PIN `654321`, estado `QUESTION_IN_PROGRESS`, `currentQuestionIndex = 1`. Diseñada para pruebas de flujo de juego en vivo, temporizadores y recepción de respuestas.

### Bloque 3: Jugadores (`Player`)
* Representa la relación `Room (1) -> Player (N)`.
* Registra 4 aprendices de prueba:
  * `Ana` y `Luis` en la Sala 1.
  * `Sofia` y `Carlos` en la Sala 2.

### Bloque 4: Respuestas (`Answer`)
* Representa las relaciones `Player (1) -> Answer (N)` y `Question (1) -> Answer (N)`.
* Registra respuestas con métricas reales de tiempo (`responseTimeMs`) y puntuación calculada según la Decisión Técnica #2 (`BASE_POINTS = 1000`):
  * Respuestas correctas rápidas (1000 puntos).
  * Respuestas incorrectas (0 puntos).

### Bloque 5: Puntuaciones y Leaderboard (`Score`)
* Clave primaria compuesta `(playerId, roomId)`.
* Columna reservada `` `rank` `` escapada con backticks para MySQL 8.0+.
* Provee el consolidado de puntajes para que Backend y Frontend validen las pantallas de resultados parciales (`Top 5`) y Podio final (`Top 3`).

---

## 3. Instrucciones de ejecución

1. **Asegurar la estructura de tablas**:
   Ejecutar primero el script DDL de creación de tablas:
   ```bash
   mysql -u admin -p english_day_db < database/TAREA2/schema.sql
   ```

2. **Cargar los datos semilla (Seed Data)**:
   Ejecutar este script para insertar las preguntas y datos de prueba:
   ```bash
   mysql -u admin -p english_day_db < database/TAREA5/questions_seed.sql
   ```

3. **Verificación**:
   Confirmar que las 23 preguntas fueron creadas exitosamente:
   ```sql
   SELECT questionId, type, prompt, `order` FROM Question ORDER BY `order` ASC;
   ```
