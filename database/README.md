# Scripts finales de despliegue - Base de Datos

Los archivos canónicos que corresponden a los nombres del Paso 1 del Manual son:

- `schema.sql`: crea las cinco tablas del modelo acordado.
- `questions_seed.sql`: carga 23 preguntas y los datos relacionados de dos salas de prueba, cuatro jugadores, respuestas y puntajes.

## Motor y ejecución

La Bitácora de Decisiones Técnicas y la configuración de Backend establecen **MySQL 8.0+** como motor del proyecto. Desde la raíz del repositorio, crear la base si aún no existe y ejecutar:

```bash
mysql -u admin -p -e "CREATE DATABASE IF NOT EXISTS english_day_db CHARACTER SET utf8mb4"
mysql -u admin -p english_day_db < database/schema.sql
mysql -u admin -p english_day_db < database/questions_seed.sql
```

Son scripts de carga inicial, no migraciones idempotentes: ejecutarlos una sola vez en una base vacía. No volver a ejecutar el esquema sobre tablas ya creadas ni el seed sobre datos ya cargados. Las inserciones del seed están dentro de una transacción.

## Verificación

```sql
SELECT COUNT(*) AS questionCount FROM Question;

SELECT roomId, pin, status, currentQuestionIndex
FROM Room
ORDER BY createdAt, roomId;

SELECT r.roomId, COUNT(DISTINCT p.playerId) AS players, COUNT(a.answerId) AS answers
FROM Room r
LEFT JOIN Player p ON p.roomId = r.roomId
LEFT JOIN Answer a ON a.playerId = p.playerId
GROUP BY r.roomId
ORDER BY r.roomId;
```

Se esperan 23 preguntas, dos salas, cuatro jugadores, tres respuestas y cuatro registros `Score`. La consulta de verificación de respuestas cuenta respuestas por sala a partir de los jugadores.

## Compatibilidad con el Manual

El Paso 1 del Manual muestra comandos `psql`, pero el motor oficial y `questions_seed.sql` usan sintaxis MySQL (`JSON_ARRAY`, `ENGINE=InnoDB` y backticks). Por tanto, los comandos `psql` del Manual no ejecutan estos archivos sin una migración a PostgreSQL. Para la configuración actualmente aprobada, usar los comandos `mysql` anteriores y corregir el Manual en una actualización documental.

Se conservan las versiones de trabajo anteriores en `TAREA2/` y `TAREA5/`; para el despliegue, usar los archivos canónicos de esta carpeta.
