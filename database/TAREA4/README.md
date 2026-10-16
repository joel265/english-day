# Tarea 4 - Estructura JSON de preguntas

## Objetivo

Definir el payload que Backend publica al enviar una pregunta por
`/topic/room/{roomId}/question`, de acuerdo con la seccion 4.3 del Contrato de
Integracion. El esquema formal esta en `question-payload.schema.json`.

## Estructura comun

| Campo | Tipo | Regla |
| --- | --- | --- |
| `questionId` | string | UUID de la pregunta. |
| `type` | string | Uno de `MULTIPLE_CHOICE`, `WORD_BLOCKS`, `TEXT_INPUT` o `VOICE`. |
| `prompt` | string | Enunciado que recibe el jugador. |
| `options` | array de strings o `null` | Lista de opciones o bloques; depende del tipo. |
| `timeLimitSeconds` | integer | Limite de tiempo, mayor que cero. |
| `order` | integer | Posicion de la pregunta, desde 1. |
| `serverTimestamp` | string | Fecha y hora ISO-8601 en UTC. |

El payload publico no incluye `correctAnswer`. Ese campo se conserva en el
registro interno de `Question` y solo se usa en el servidor para validar la
respuesta.

## Regla de `options` por tipo

- `MULTIPLE_CHOICE`: arreglo de dos o mas respuestas posibles.
- `WORD_BLOCKS`: arreglo de dos o mas palabras o bloques que se pueden ordenar.
- `TEXT_INPUT`: `null`; la respuesta se escribe como texto libre.
- `VOICE`: `null`; el cliente envia la transcripcion como respuesta.

Las reglas completas estan expresadas en el esquema JSON. Ejemplos validos:

### MULTIPLE_CHOICE

```json
{
  "questionId": "9a2b0000-0000-4000-8000-000000000001",
  "type": "MULTIPLE_CHOICE",
  "prompt": "Choose the correct past tense of \"go\".",
  "options": ["goed", "went", "gone", "going"],
  "timeLimitSeconds": 15,
  "order": 1,
  "serverTimestamp": "2026-09-21T14:10:00Z"
}
```

### WORD_BLOCKS

```json
{
  "questionId": "9a2b0000-0000-4000-8000-000000000002",
  "type": "WORD_BLOCKS",
  "prompt": "Put the words in the correct order.",
  "options": ["home", "went", "I"],
  "timeLimitSeconds": 20,
  "order": 2,
  "serverTimestamp": "2026-09-21T14:10:00Z"
}
```

### TEXT_INPUT

```json
{
  "questionId": "9a2b0000-0000-4000-8000-000000000003",
  "type": "TEXT_INPUT",
  "prompt": "Write the past tense of the verb \"eat\".",
  "options": null,
  "timeLimitSeconds": 20,
  "order": 3,
  "serverTimestamp": "2026-09-21T14:10:00Z"
}
```

### VOICE

```json
{
  "questionId": "9a2b0000-0000-4000-8000-000000000004",
  "type": "VOICE",
  "prompt": "Say the phrase: \"I am ready to learn\".",
  "options": null,
  "timeLimitSeconds": 25,
  "order": 4,
  "serverTimestamp": "2026-09-21T14:10:00Z"
}
```

## Relacion con la base de datos

La columna `Question.options` de `database/TAREA2/schema.sql` es de tipo JSON y
puede guardar los arreglos anteriores o `NULL`. `Question.correctAnswer` sigue
siendo un dato interno: no debe copiarse al payload enviado antes de que el
servidor valide la respuesta.

Este entregable formaliza el ejemplo existente del contrato y sus cuatro tipos
de pregunta. Antes de integrar el esquema en Backend, compartirlo con ese equipo
para confirmar que su serializacion respeta estas reglas.
