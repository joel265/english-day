# Matriz de Casos de Prueba y Ejecución de QA (Tareas 2, 3, 4 y 5)
**Plataforma Web Interactiva de Gamificación — English Up (SENA ADSO)**  
**Subequipo:** QA & Contenido Pedagógico (Inglés)  
**Referencias:** `PLAN_DE_PRUEBAS_Y_CONTROL_DE_CALIDAD.docx`, `CONTRATO_DE_INTEGRACION_API_WEBSOCKETS.docx` (Anexos A y B), `BITACORA_DE_DECISIONES_TECNICAS.md`

---

## 1. Reglas de Tiempo Límite y Puntuación por Velocidad (QA Tarea 2)

En coordinación con el equipo de Backend (Tarea 9 / RF-08 / RF-09 / Contrato §5 y Bitácora Decisión #2), se establecieron las siguientes reglas pedagógicas y matemáticas de calificación:

### 1.1 Tiempos Límite por Mecánica Pedagógica (`timeLimitSeconds`)
| Tipo de Pregunta (`QuestionType`) | Tiempo Límite Estándar | Justificación Pedagógica |
|---|:---:|---|
| `MULTIPLE_CHOICE` (RF-04) | **15 s** | Lectura rápida de enunciado y selección entre 4 opciones en pantalla móvil. |
| `TEXT_INPUT` (RF-06) | **20 s** | Escritura en teclado móvil sin autocorrector (`autocorrect="off"`, `spellcheck="false"`). |
| `WORD_BLOCKS` (RF-05) | **20 s** | Ordenamiento sintáctico tocando bloques del banco de palabras y confirmando envío. |
| `VOICE` (RF-07) | **25 s** | Captura de voz mediante Web Speech API (`en-US`), visualización de transcripción y confirmación con botones **Enviar / Repetir** (Contrato Anexo B.3). |

### 1.2 Fórmula Oficial de Puntuación por Velocidad (RF-09)
$$\text{pointsAwarded} = \text{round}\left(1000 \times (\text{isCorrect} ? 1 : 0) \times \max\left(0.5,\; 1 - \frac{\text{responseTimeMs}}{\text{timeLimitSeconds} \times 1000}\right)\right)$$

* **`BASE_POINTS` = 1000 puntos** (Bitácora Decisión #2).
* **Piso mínimo por acierto:** **500 puntos** (`0.5 * BASE_POINTS`) si el aprendiz responde correctamente justo antes de expirar el temporizador.
* **Respuesta incorrecta o tiempo agotado (`00:00`):** **0 puntos**.
* **Criterio de normalización (`TEXT_INPUT` y `VOICE` — Bitácora #1 y Anexo B.6):**
  1. Recorte de espacios extremos (`trim`) y colapso de espacios múltiples a uno solo.
  2. Conversión a minúsculas (`toLowerCase`).
  3. Eliminación de signos diacríticos y tildes (`Normalizer.Form.NFD`).
  4. Eliminación de signos de puntuación `. , ; : ! ? ¿ ¡ "` conservando el apóstrofo (`'`) para contracciones (`don't`) y el guion (`-`) para palabras compuestas (`well-known`).

---

## 2. Módulo 1: Gestión de Salas y Registro de Jugadores (QA Tarea 3 — CP-01 a CP-03)

| ID | Caso de Prueba | RF / CU | Precondición | Pasos de Ejecución (Rutas y Campos del Contrato) | Resultado Esperado | Automatización / Evidencia | Estado |
|---|---|---|---|---|---|---|:---:|
| **CP-01** | Crear Sala de Juego y Generar PIN de 6 Dígitos | RF-01 / CU-01 | Servidor Spring Boot activo en `:8080` y BD conectada. | 1. Abrir `/moderator.html`.<br>2. Presionar botón **Crear Sala** (`POST /api/rooms`). | Respuesta HTTP `201 Created` con JSON `{ "roomId": "<UUID>", "pin": "<6 dígitos>", "status": "WAITING_LOBBY", "createdAt": "<ISO-8601>" }`. El PIN conserva ceros a la izquierda. | `RoomControllerTest#testCreateRoom` | ✅ APROBADO |
| **CP-02** | Registro de Jugador Válido y Difusión en Lobby | RF-02, RF-03 / CU-02 | Sala en estado `WAITING_LOBBY`. | 1. Abrir `/index.html` en móvil.<br>2. Ingresar el `pin` de 6 dígitos y `nickname: "camilo_dev"`.<br>3. Enviar (`POST /api/rooms/{pin}/join`).<br>4. Suscribirse a `/topic/room/{roomId}/lobby`. | HTTP `200 OK` con `{ "playerId", "roomId", "nickname", "joinedAt" }`. El servidor emite en `/topic/room/{roomId}/lobby` la lista actualizada de jugadores conectados en tiempo real. | `RoomControllerTest#testJoinRoomSuccess`, `LobbyWebSocketIntegrationTest` | ✅ APROBADO |
| **CP-03** | Ingreso con PIN Inválido o Inexistente | RF-02 / Anexo A.3 | Servidor activo. | 1. En `/index.html`, ingresar PIN inexistente `000000` y `nickname: "aprendiz_test"`.<br>2. Ejecutar `POST /api/rooms/000000/join`. | HTTP `404 Not Found` con cuerpo `{ "code": "ROOM_NOT_FOUND", "error": "PIN no encontrado" }`. La vista móvil muestra `"PIN no encontrado"` y permanece en el formulario. | `RoomControllerTest#testJoinRoomInvalidPin` | ✅ APROBADO |
| **CP-03B** | Consulta de Estado de Sala para Reconexión | RF-03 / Anexo A.4 | Sala creada con 1 jugador unido. | 1. Ejecutar `GET /api/rooms/{pin}`. | HTTP `200 OK` con `{ "roomId", "pin", "status": "WAITING_LOBBY", "playerCount": 1 }`. | `RoomControllerTest#testGetRoomByPinSuccess` | ✅ APROBADO |

---

## 3. Módulo 2: Mecánicas de Juego e Interacción (QA Tarea 4 — CP-04 a CP-07)

| ID | Caso de Prueba | RF / CU | Precondición | Pasos de Ejecución (Rutas y Campos del Contrato) | Resultado Esperado | Automatización / Evidencia | Estado |
|---|---|---|---|---|---|---|:---:|
| **CP-04** | Respuesta Selección Múltiple (`MULTIPLE_CHOICE`) | RF-04 / CU-04 | Partida en `QUESTION_IN_PROGRESS`; pregunta recibida en `/topic/room/{roomId}/question` con `type: "MULTIPLE_CHOICE"` y 4 `options`. | 1. Tocar una de las 4 tarjetas de color en `#questionOptions`. | El botón seleccionado cambia a `aria-pressed="true"` (`.is-selected`), se bloquean las 4 opciones y se envía trama STOMP `SEND` a `/app/room/{roomId}/answer` con `{ playerId, questionId, value: "<opción>", clientTimestamp }`. | `AnswerValidationTest#testMultipleChoiceValidation`, `AnswerWebSocketIntegrationTest`, E2E Frontend | ✅ APROBADO |
| **CP-05** | Construcción con Bloques (`WORD_BLOCKS`) | RF-05 / CU-04 | Pregunta activa con `type: "WORD_BLOCKS"` y `options: ["happy", "I", "am"]`. | 1. Tocar los bloques en orden `"I"`, `"am"`, `"happy"` desde `#wordBlocksBank`.<br>2. Presionar `#wordBlocksSubmit` (**Enviar respuesta**). | Los bloques pasan a `#wordBlocksSelected` numerados. Al enviar, se emite a `/app/room/{roomId}/answer` el arreglo `value: ["I", "am", "happy"]`. Backend concatena `"I am happy"` y valida `isCorrect = true`. | `AnswerValidationTest#testWordBlocksValidation`, `AnswerWebSocketIntegrationTest`, E2E Frontend | ✅ APROBADO |
| **CP-06** | Entrada de Texto / Spelling (`TEXT_INPUT`) | RF-06 / CU-04 | Pregunta activa con `type: "TEXT_INPUT"` y `options: null`. | 1. Verificar atributos del input `#textAnswer` (`autocomplete="off"`, `autocorrect="off"`, `autocapitalize="none"`, `spellcheck="false"`).<br>2. Escribir `"  ATE. "` y presionar `#textAnswerSubmit`. | Se envía `value: "ATE."` a `/app/room/{roomId}/answer`. Backend normaliza mayúsculas, espacios, tildes y puntuación periférica (Anexo B.6) y califica `isCorrect = true` frente a `"ate"`. | `AnswerValidationTest#testTextInputValidation`, E2E Frontend | ✅ APROBADO |
| **CP-07** | Reconocimiento de Voz (`VOICE`) y Contingencia Texto | RF-07 / Anexo B | Pregunta activa con `type: "VOICE"` y `options: null`. | 1. Presionar `#voiceMicButton` (`recognition.lang = "en-US"`, `interimResults = true`).<br>2. Pronunciar `"I am ready to learn"`.<br>3. Verificar aparición de botones `#voiceRepeatButton` (**Repetir**) y `#voiceSubmitButton` (**Enviar**).<br>4. Tocar **Enviar**.<br>5. Si el micrófono falla o no está soportado, verificar fallback automático a `#textInputUI`. | La transcripción final se muestra en `#voiceTranscriptText` y al confirmar se envía a `/app/room/{roomId}/answer`. Si no hay micrófono/permiso, se muestra el aviso del Anexo B.4 y se habilita la entrada por texto con igual puntuación. | `AnswerValidationTest#testVoiceValidation`, E2E Frontend | ✅ APROBADO |

---

## 4. Módulo 3: Tiempo Real, Ruleta y Resultados (QA Tarea 5 — CP-08 a CP-11)

| ID | Caso de Prueba | RF / CU | Precondición | Pasos de Ejecución (Rutas y Campos del Contrato) | Resultado Esperado | Automatización / Evidencia | Estado |
|---|---|---|---|---|---|---|:---:|
| **CP-08** | Expiración de Temporizador (`00:00`) | RF-08 | Pregunta en curso con `timeLimitSeconds` activo. | 1. Dejar transcurrir el conteo regresivo hasta `00:00` sin enviar respuesta. | Al llegar a `0`, `#questionTimer` muestra `00:00` (`.is-expired`), todos los controles de respuesta quedan `disabled = true`, `#questionStatus` muestra `"Tiempo agotado (0 puntos). Espera los resultados."` y el aprendiz recibe 0 puntos. | E2E Frontend (`join.js#expireQuestion`) | ✅ APROBADO |
| **CP-09** | Ejecución de la Ruleta Aleatoria de Retroalimentación | RF-11 / CU-05 | Pregunta respondida por los aprendices en la sala. | 1. El moderador presiona **Activar Ruleta** (`POST /api/rooms/{roomId}/roulette` o STOMP `/app/room/{roomId}/moderator/roulette`). | El estado de la sala pasa a `ROULETTE_TIME`. Se publica en `/topic/room/{roomId}/roulette` el objeto `{ roomId, playerId, nickname, questionId, value, isCorrect, timestamp }`. Tanto el proyector (`#stageRouletteView`) como los móviles (`#rouletteCard`) muestran el aprendiz elegido y su respuesta. | `RouletteServiceTest`, `RouletteWebSocketIntegrationTest`, E2E Frontend | ✅ APROBADO |
| **CP-10** | Cálculo de Puntaje Dinámico por Velocidad y Leaderboard Top 5 | RF-09, RF-10 | Dos jugadores responden correctamente a una pregunta de `15s`: Jugador A en `2000 ms`, Jugador B en `10000 ms`. | 1. Ambos envían respuesta a `/app/room/{roomId}/answer`.<br>2. El moderador cierra la pregunta (`POST /api/rooms/{roomId}/close-question` o STOMP `/app/room/{roomId}/results`). | Jugador A obtiene `round(1000 * (1 - 2/15)) = 867 pts`; Jugador B obtiene `round(1000 * (1 - 10/15)) = 500 pts` (piso 0.5). Se difunde en `/topic/room/{roomId}/results` `{ correctAnswer, top5 }` con Jugador A en `#1`. | `ScoreServiceTest`, `ResultsWebSocketIntegrationTest` | ✅ APROBADO |
| **CP-11** | Cierre de Partida y Podio Final Top 3 | RF-10 / CU-06 | Última ronda completada. | 1. El moderador presiona **Finalizar Juego** (`POST /api/rooms/{roomId}/finish` o STOMP `/app/room/{roomId}/moderator/finish`).<br>2. Opcionalmente se consulta `GET /api/rooms/{roomId}/results`. | La sala cambia a estado `FINISHED`. Se emite en `/topic/room/{roomId}/podium` `{ roomId, status: "FINISHED", top3, totalPlayers, timestamp }`. El proyector lanza confeti y los móviles despliegan `#podiumCard` con 🥇, 🥈 y 🥉. | `PodiumWebSocketIntegrationTest`, `RoomControllerTest#testFinishGameSuccess`, E2E Frontend | ✅ APROBADO |

---

## 5. Plantilla Estandarizada de Reporte de Defectos (Plan de Pruebas §5)

Durante la ejecución de las pruebas de integración entre Frontend y Backend se registraron y corrigieron los siguientes hallazgos antes del cierre del proyecto:

| ID Defecto | Caso Asociado | Severidad | Descripción del Hallazgo | Causa Raíz | Corrección Aplicada | Estado |
|---|---|:---:|---|---|---|:---:|
| **BUG-01** | CP-04 a CP-07 | Alta | Las pantallas de pregunta renderizaban las mecánicas pero no enviaban la trama STOMP `SEND` a `/app/room/{roomId}/answer`. | Faltaba integrar la Tarea 9 en `join.js` y agregar los botones de confirmación para `WORD_BLOCKS`, `TEXT_INPUT` y `VOICE`. | Se implementó `sendAnswerToServer(value)` en `join.js` enviando `{ playerId, questionId, value, clientTimestamp }` y bloqueando reenvíos. | ✅ CERRADO |
| **BUG-02** | CP-09, CP-10, CP-11 | Alta | El cliente móvil solo se suscribía a `/lobby` y `/question`, arrojando error al recibir mensajes de `/results`, `/roulette` o `/podium`. | Las Tareas 10, 11 y 12 de Frontend estaban pendientes de implementación. | Se suscribió el cliente STOMP a los 6 canales del Contrato §4.1 y se maquetaron `#resultsCard`, `#rouletteCard` y `#podiumCard`. | ✅ CERRADO |
| **BUG-03** | CP-01, CU-03 | Alta | No existía interfaz web para que el moderador creara la sala, iniciara la partida, avanzara de pregunta o activara la ruleta en el proyector. | La Tarea 14 del Backlog de Frontend (Bitácora #6) estaba pendiente. | Se construyó `/moderator.html` + `frontend/js/moderator.js` y se completaron `GET /api/rooms/{pin}`, `POST /api/rooms/{roomId}/next` y `/app/room/{roomId}/moderator/next`. | ✅ CERRADO |
