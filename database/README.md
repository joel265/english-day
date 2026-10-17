# Base de Datos — English Day (MySQL 8.0+)

Estructura de los recursos de persistencia y analítica del sistema:

```text
database/
├── schema.sql                        # Esquema DDL relacional (5 tablas: Room, Player, Question, Answer, Score)
├── questions_seed.sql                # Semilla oficial (23 preguntas niveles A2-B1 + datos de prueba)
├── queries/
│   ├── operaciones_principales.sql   # Consultas operativas del flujo de juego en tiempo real
│   └── reporte_post_evento.sql       # Consultas analíticas y métricas pedagógicas post-evento
└── schemas/
    └── question-payload.schema.json  # JSON Schema de validación del banco de preguntas
```

## Motor y Ejecución

El motor relacional oficial del proyecto es **MySQL 8.0+** (con codificación `utf8mb4`). Para inicializar la base de datos desde la raíz del repositorio:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p english_day < database/questions_seed.sql
```

> **Nota:** Si el backend arranca contra una base de datos vacía, el componente `QuestionDataInitializer` sembrará automáticamente las preguntas base para garantizar disponibilidad inmediata.

## Verificación de Integridad

```sql
USE english_day;

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
