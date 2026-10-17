# Bitácora de Decisiones Técnicas
Complemento vivo del Contrato de Integración — English Day (SENA ADSO)

## 0. Propósito
El Contrato de Integración fija lo que ya se decidió (rutas, campos, eventos). Pero durante el desarrollo van a aparecer preguntas que ese documento no responde. Esta Bitácora es donde se registra cada una de esas decisiones nuevas, en el momento en que se toman, para que ningún equipo tenga que adivinar ni repetir la pregunta.

---

## 3. Registro de Decisiones

| # | Fecha | Decisión | Equipo que decide | Equipos afectados | Estado |
|---|---|---|---|---|---|
| **1** | 2026-09-25 | Para `TEXT_INPUT` y `VOICE`, la comparación con `correctAnswer` ignora mayúsculas, tildes y espacios extra al inicio/final. | Backend + QA | Backend, QA | ✅ Cerrada |
| **2** | 2026-09-27 | `BASE_POINTS` de la fórmula de puntuación queda en 1000 (no se ajusta por dificultad de la pregunta). | Backend | Backend, Frontend, QA | ✅ Cerrada |
| **3** | 2026-09-29 | El HTTPS del evento se resuelve únicamente con Cloudflare Tunnel (Manual de Despliegue). El certificado autofirmado mencionado en el DAS §5 queda solo como referencia para pruebas locales, no se usa el día del evento. | Backend | Backend, PM | ✅ Cerrada |
| **4** | 2026-10-11 | Se define formalmente **MySQL (versión 8.0+)** como el motor de base de datos relacional oficial del proyecto. Backend usará el driver `mysql-connector-j` con Spring Data JPA y se mantiene total compatibilidad con los scripts SQL e InnoDB definidos en la carpeta `database/`. | Backend + Base de Datos | Backend, Base de Datos, QA | ✅ Cerrada |
| **5** | 2026-10-16 | Para `/topic/room/{roomId}/lobby`, el payload es un arreglo JSON `[ { "playerId": "...", "nickname": "...", "joinedAt": "..." } ]` emitido en tiempo real al unirse un jugador. | Backend | Backend, Frontend, UI/UX, QA | ✅ Cerrada |
| **6** | 2026-10-16 | `POST /api/rooms/{roomId}/start` retorna `RoomResponse` (HTTP 200 OK); asíncronamente emite el estado a `/topic/room/{roomId}/status` y la pregunta a `/topic/room/{roomId}/question` (sin `correctAnswer`). | Backend | Backend, Frontend, UI/UX, QA | ✅ Cerrada |
| **7** | 2026-10-16 | En `/app/room/{roomId}/answer`, `value` acepta texto plano o arreglo de tokens (para `WORD_BLOCKS`). Se previene el duplicado: solo se procesa y persiste la primera respuesta recibida por jugador y pregunta. | Backend | Backend, Frontend, QA | ✅ Cerrada |
| **8** | 2026-10-16 | Para Tarea 9 (RF-09/RF-10), el algoritmo de puntuación acumula puntos en `Player.totalScore` y sincroniza la tabla `Score` (`totalPoints` y `rank`). El cierre de pregunta y emisión del Top 5 (`QuestionResultsResponse` con `correctAnswer` y `top5`) se difunde a `/topic/room/{roomId}/results` y puede ser disparado vía STOMP en `/app/room/{roomId}/results` o vía REST en `POST /api/rooms/{roomId}/close-question`. | Backend | Backend, Frontend, UI/UX, QA | ✅ Cerrada |
| **9** | 2026-10-16 | Para Tarea 10 (RF-11/CU-05), la ruleta de retroalimentación selecciona de forma pseudoaleatoria a un aprendiz de la sala, cambia el estado a `ROULETTE_TIME`, y emite el payload `RouletteResultResponse` (`roomId`, `playerId`, `nickname`, `questionId`, `value`, `isCorrect`, `timestamp`) a `/topic/room/{roomId}/roulette`. Puede activarse vía REST (`POST /api/rooms/{roomId}/roulette`) o STOMP (`/app/room/{roomId}/moderator/roulette`). | Backend | Backend, Frontend, UI/UX, QA | ✅ Cerrada |
| **10** | 2026-10-17 | Para la mecánica `VOICE` (Tarea 8 Frontend / Anexo B), se fija `recognition.lang = "en-US"`, confirmación manual (`Enviar` / `Repetir`) antes de emitir a `/app/room/{roomId}/answer`, y fallback automático a campo de texto (`TEXT_INPUT`) cuando el micrófono no esté soportado o se niegue el permiso. En servidor (`AnswerService#normalizeText`), se eliminan `. , ; : ! ? ¿ ¡ "` conservando apóstrofo (`'`) y guion (`-`). | Frontend + Backend + QA | Frontend, Backend, QA | ✅ Cerrada |
| **11** | 2026-10-17 | El Panel de Moderador (Tarea 14 Frontend) se sirve desde `/moderator.html` y la vista móvil del aprendiz desde `/index.html` (y `/tarea-01-pantalla-pin-nickname/index.html`) en el mismo origen del servidor Spring Boot (`:8080`), habilitando reconexión con `GET /api/rooms/{pin}` y avance de pregunta con `POST /api/rooms/{roomId}/next` o STOMP `/app/room/{roomId}/moderator/next`. | Frontend + Backend | Todos los equipos | ✅ Cerrada |
