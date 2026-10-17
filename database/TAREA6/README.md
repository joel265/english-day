# Tarea 6 - Consulta SQL de reporte post-evento

## Entregable

`reporte_post_evento.sql` contiene dos consultas:

1. Un resumen por sala con jugadores registrados, jugadores que respondieron, participacion porcentual, total de respuestas y porcentaje de aciertos.
2. Un detalle por jugador que incluye a quienes no enviaron respuestas, su estado de participacion, respuestas correctas/incorrectas, porcentaje de aciertos y tiempo promedio.

## Definiciones de las metricas

- **Participacion**: jugadores con al menos una fila en `Answer` divididos entre jugadores registrados en `Player` para esa sala.
- **Porcentaje de aciertos**: filas de `Answer` con `isCorrect = TRUE` divididas entre el total de filas de respuesta de la sala o del jugador.
- Si no existen jugadores o respuestas para el denominador, el porcentaje se muestra como `0`.
- Los conteos consideran registros de `Answer`. Si Backend guarda mas de un intento por jugador y pregunta, cada intento se cuenta; acordar con Backend/QA si el reporte debe contar intentos o solo la respuesta final.

## Dependencias y uso

La consulta respeta las tablas y campos de `database/TAREA2/schema.sql` y puede ejecutarse con los datos de prueba de `database/TAREA5/questions_seed.sql`. La Tarea 5 esta presente en el repositorio.

El SQL usa agregaciones compatibles con MySQL 8.0+ y PostgreSQL. El proyecto y el seed de la Tarea 5 apuntan a MySQL 8.0+; el ejemplo de despliegue de la seccion 2 del Manual usa `psql`, lo cual no coincide con esa configuracion y debe aclararse antes del despliegue.

Para un solo evento/sala, se puede agregar `WHERE r.roomId = ?` antes de `GROUP BY` en el resumen, y antes de `GROUP BY` en el detalle. Se recomienda exportar el reporte despues de terminar las salas; no se excluyen salas por estado para que tambien queden visibles salas de prueba o eventos no finalizados.

## Estado

Consulta preparada conforme a la Tarea 6 del Backlog. Validar los resultados contra la base cargada con `schema.sql` y `questions_seed.sql`, y confirmar con Backend/QA la politica de intentos repetidos antes de dar el reporte por definitivo.
