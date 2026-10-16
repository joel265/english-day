# Tarea 3 - Consultas SELECT/INSERT

## Entregable

`operaciones_principales.sql` contiene consultas parametrizadas para crear y consultar salas, admitir jugadores, consultar el lobby y las preguntas, guardar respuestas validadas y leer los rankings.

## Alineacion revisada

- El contrato define las rutas de sala, union, consulta de estado y resultados, y los campos de las entidades.
- Las entidades JPA de Backend ya existen y confirman los nombres de columnas y la clave compuesta de `Score` (`playerId`, `roomId`).
- `application.properties` configura MySQL 8.0+. Por eso el script usa la sintaxis MySQL para el identificador reservado `order` y `rank`.
- La Tarea 4 fija `Question.order` desde 1 y `Room.currentQuestionIndex` inicia en 0; la consulta de pregunta actual aplica `currentQuestionIndex + 1`.

## Consideraciones de integracion

- Backend aun debe integrar y probar estas consultas en repositorios/servicios; la existencia de entidades JPA no confirma que la capa de operaciones este terminada.
- Crear sala requiere reintentar con otro PIN si se viola la restriccion `UNIQUE` de `Room.pin`.
- La insercion de `Player` y su `Score` inicial debe ejecutarse en una transaccion. Para responder, Backend debe validar sala, jugador y pregunta, calcular `isCorrect`, `responseTimeMs` y `pointsAwarded`, y guardar los valores resultantes; no debe confiar en valores del cliente.
- El ranking consulta `Score.totalPoints`, por lo que Backend debe mantenerlo sincronizado con los puntos otorgados. Tambien se conserva `Player.totalScore` en el modelo; Backend debe confirmar cual campo es la fuente de verdad.
- `value` es texto en `Answer`, mientras que el contrato permite que WORD_BLOCKS llegue como arreglo. Backend debe acordar la serializacion (por ejemplo JSON en texto) antes de guardar ese tipo de respuesta.
- El modelo no vincula preguntas con una sala. La consulta actual supone que todas las salas usan el mismo banco global, ordenado por `Question.order`; confirmar esta regla con Backend.
- El orden en caso de empate usa nickname y playerId para que la lista sea determinista; validar esta regla de desempate con Backend/QA.

## Estado

Entregable SQL preparado contra el esquema y configuracion actuales. La tarea 3 queda pendiente de validacion conjunta con Backend, tal como exige el Backlog.
