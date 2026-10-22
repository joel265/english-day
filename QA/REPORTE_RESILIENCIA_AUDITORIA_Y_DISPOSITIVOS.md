# Informe de Pruebas de Resiliencia, Auditoría Pedagógica y Usabilidad Móvil
**Plataforma Web Interactiva de Gamificación — English Up (SENA ADSO)**  
**Subequipos:** QA & Contenido Pedagógico + Frontend (Desarrollo Web)  
**Tareas Cubiertas:**
* **QA Tarea 7:** Pruebas de resiliencia (caída de Wi-Fi, cierre de pestaña, ingreso de datos inválidos — Plan de Pruebas §3.4).
* **QA Tarea 8:** Auditoría ortográfica/gramatical del banco de inglés y pruebas de usabilidad en vivo (Actividad A7 / Hito H4).
* **Frontend Tarea 13:** Pruebas en dispositivos móviles y viewports responsivos (Chrome Android / Safari iOS — RNF-01, RNF-03, RNF-05).

---

## 1. Pruebas de Manejo de Excepciones y Resiliencia (QA Tarea 7 — Plan de Pruebas §3.4)

Se verificó el comportamiento del sistema ante condiciones adversas de red, sesiones interrumpidas y cargas malformadas:

| ID | Escenario de Resiliencia | Acción Simulada | Respuesta del Sistema (Frontend + Backend) | Resultado |
|---|---|---|---|---|
| **RES-01** | **Caída temporal de Wi-Fi o pérdida de WebSocket en mitad de partida** | Se cierra abruptamente la conexión WebSocket STOMP mientras el jugador está en `#lobbyCard` o `#questionCard`. | El listener `lobbySocket.addEventListener("close", ...)` detecta la desconexión y muestra el mensaje accesible (`role="status"`): *"Se perdió la conexión con la partida. Actualiza la página para volver a ingresar."* El jugador conserva su sesión en `sessionStorage` (`englishDayPlayerSession`). | ✅ APROBADO |
| **RES-02** | **Cierre o recarga accidental de la pestaña del Moderador (`F5`)** | El moderador recarga `/moderator.html` con una sala activa en curso. | El panel incluye el control **Reconectar PIN (`GET /api/rooms/{pin}`)** (Contrato §3 y Anexo A.4). Al ingresar el PIN de 6 dígitos, el moderador recupera el `roomId`, el `status` actual, el conteo de aprendices (`playerCount`) y vuelve a suscribirse a los 6 topics STOMP sin perder los puntajes persistidos en BD. | ✅ APROBADO |
| **RES-03** | **Envío duplicado de respuesta en la misma pregunta (Doble clic / Retraso de red)** | Un cliente envía dos tramas `SEND` a `/app/room/{roomId}/answer` para el mismo `(playerId, questionId)`. | En Frontend, `hasSubmittedAnswer = true` y `lockQuestionInputs()` deshabilitan los controles al primer envío. En Backend, `AnswerService#processAnswer` verifica `existsByPlayer_PlayerIdAndQuestion_QuestionId(playerId, questionId)` y omite el duplicado sin alterar el puntaje (Bitácora #7). | ✅ APROBADO |
| **RES-04** | **Ingreso de datos inválidos en registro (`POST /api/rooms/{pin}/join`)** | 1. PIN con menos de 6 dígitos o letras.<br>2. PIN inexistente (`000000`).<br>3. Nickname vacío o solo espacios.<br>4. Sala que ya no está en `WAITING_LOBBY`. | 1. Frontend filtra dígitos numéricos (`/^\d{6}$/`) y muestra error inmediato.<br>2. Backend responde `404 ROOM_NOT_FOUND` (`"PIN no encontrado"`).<br>3. Backend valida `@NotBlank` y responde `400 VALIDATION_ERROR`.<br>4. Backend responde `400 INVALID_ROOM_STATE` (`"La sala no está aceptando nuevos jugadores"`). | ✅ APROBADO |
| **RES-05** | **Fallo o bloqueo del micrófono en preguntas `VOICE` (Plan de Contingencia)** | El navegador móvil carece de `SpeechRecognition` o el usuario rechaza el permiso (`not-allowed` / `network`). | `join.js#activateVoiceTextFallback` captura el evento `onerror`, oculta el botón de micrófono, presenta la alerta del Contrato Anexo B.4 (*"No pudimos usar el micrófono. Escribe tu respuesta."*) y activa `#textInputUI` para que el aprendiz conteste por teclado con la misma validez y puntaje. | ✅ APROBADO |
| **RES-06** | **Seguridad anti-trampa en payload de pregunta (Contrato §1 regla 13 y §4.3)** | Inspección de tramas WebSocket en `/topic/room/{roomId}/question` y validación en cliente (`validateQuestion`). | `QuestionBroadcastResponse` excluye por diseño el campo `correctAnswer`. Además, `join.js#validateQuestion` rechaza cualquier payload que contenga `correctAnswer` o carezca de `questionId` UUID v4 válido. | ✅ APROBADO |

---

## 2. Auditoría Ortográfica y Gramatical del Banco de Preguntas en Inglés (QA Tarea 8)

Se realizó la revisión lingüística y pedagógica completa de las **23 preguntas** cargadas en `database/questions_seed.sql` (elaboradas a partir de los documentos de `QA/tarea1/`: *Simple Present*, *Present Continuous* y *EnglishQuest*):

### 2.1 Resumen por Categoría y Nivel Pedagógico
| Categoría / Tema Gramatical | Nivel | Tipo (`QuestionType`) | Cantidad | Ítems (`order`) | Tiempo (`timeLimitSeconds`) |
|---|---|---|:---:|:---:|:---:|
| **Simple Present — Affirmative (3rd Person & Routines)** | Nivel 1 (Básico) | `MULTIPLE_CHOICE` | 4 | #1 – #4 | 15 s |
| **Simple Present — Negative (`don't` / `doesn't`)** | Nivel 2 (Intermedio) | `MULTIPLE_CHOICE` | 5 | #5 – #9 | 15 s |
| **Simple Present — Interrogative (`Do` / `Does` & Short Answers)** | Nivel 3 (Intermedio) | `MULTIPLE_CHOICE` | 5 | #10 – #14 | 15 s |
| **Simple Present — Reading Comprehension & Consolidation** | Nivel 3 (Consolidación) | `MULTIPLE_CHOICE` | 5 | #15 – #19 | 15 s |
| **WH-Questions (English Quest)** | Nivel 1 (Básico) | `MULTIPLE_CHOICE` | 1 | #20 | 15 s |
| **Irregular Past Tense Spelling (`eat` → `ate`)** | Nivel 2 (Spelling) | `TEXT_INPUT` | 1 | #21 | 20 s |
| **Sentence Structure & Word Order (`I am happy`)** | Nivel 1 (Sintaxis) | `WORD_BLOCKS` | 1 | #22 | 20 s |
| **Speaking & Pronunciation (`I am ready to learn`)** | Nivel 2 (Fonética) | `VOICE` | 1 | #23 | 25 s |

### 2.2 Verificación de Reglas Lingüísticas y Técnicas (Contrato Anexo B.6)
1. **Ortografía estadounidense (`en-US`):** Todas las oraciones utilizan ortografía estándar estadounidense compatible con el motor `recognition.lang = "en-US"`.
2. **Ausencia de homófonos ambiguos en `VOICE`:** La frase de pronunciación (`"I am ready to learn"`, pregunta #23) no contiene números ni homófonos conflictivos (*two/to/too*, *there/their*), garantizando transcripción determinista en Web Speech API.
3. **Coincidencia exacta entre `options` y `correctAnswer`:** En las 20 preguntas de `MULTIPLE_CHOICE`, el valor de `correctAnswer` coincide carácter por carácter con una de las 4 opciones del `JSON_ARRAY`. En `WORD_BLOCKS` (`["happy", "I", "am"]`), la unión ordenada con espacios (`"I am happy"`) coincide exactamente con `correctAnswer`.
4. **Puntuación y uso de apóstrofos:** Todas las contracciones negativas (`doesn't`, `don't`) están correctamente escapadas en SQL y son preservadas por `AnswerService#normalizeText` según el Contrato Anexo B.6.

---

## 3. Pruebas en Dispositivos Móviles y Usabilidad en Vivo (Frontend Tarea 13 & QA Tarea 8 — RNF-01, RNF-03, RNF-05)

Se validó el comportamiento responsivo, táctil y de compatibilidad en perfiles móviles (**Chrome Android — 360×800 px**, **Safari iOS — 390×844 px**, y pantalla pequeña **320×568 px**) así como en **Pantalla Proyector de Escritorio (1440×900 px)**:

| Criterio Evaluado | Requerimiento | Verificación Técnica Realizada | Estado |
|---|---|---|---|
| **Tamaño mínimo de objetivos táctiles (`>= 48x48 px`)** | RNF-01 | Botones de PIN (`.pin-digit`: `min-height: 3rem` / `48px`), opciones de selección múltiple (`.multiple-choice-option`: `min-height: 4.5rem` / `72px`), fichas de Word Blocks (`.word-block`: `min-height: 3rem` / `48px`), botón de envío (`.answer-submit-button`: `min-height: 3.25rem` / `52px`) y micrófono (`.voice-mic-button`: `88x88 px`). | ✅ CUMPLE |
| **Diseño Mobile-First sin desbordamiento horizontal (`320px - 480px`)** | RNF-01, RNF-03 | Contenedor `main` con `width: min(100% - 2rem, 30rem)` y grillas flexibles (`minmax(0, 1fr)`). Cero scroll horizontal en `320px`, `375px` y `412px`. | ✅ CUMPLE |
| **Teclado móvil sin autocompletado tramposo en `TEXT_INPUT`** | RF-06, CP-06 | El campo `#textAnswer` declara explícitamente `autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" inputmode="text"`. | ✅ CUMPLE |
| **Teclado numérico directo en PIN de 6 dígitos** | RF-02, RNF-01 | Los 6 campos `.pin-digit` usan `inputmode="numeric" pattern="[0-9]" maxlength="1"` con avance automático al escribir, retroceso con `Backspace` y soporte de pegado (`paste`) de 6 dígitos. | ✅ CUMPLE |
| **Alto contraste y tipografía legible a distancia (Proyector)** | RNF-03 | Paleta *Tactile Gamified Arcade* (`#f3faff`, `#111d22`, `#58cc02`, `#2b6c00`, `#006590`) con tipografía **Rubik** (`700`–`900`) y tamaño de enunciado en proyector de `2.1rem` (`33.6px`). | ✅ CUMPLE |
| **Compatibilidad Web Speech API + Fallback HTTPS/WSS** | RNF-05, RF-07 | Soporte para `window.SpeechRecognition` (Chrome Android) y `window.webkitSpeechRecognition` (Safari iOS) sobre contexto seguro Cloudflare Tunnel (`https://` / `wss://`), más modo contingencia de texto automático. | ✅ CUMPLE |
