# English Day — Plataforma Web de Gamificación (SENA ADSO)

Plataforma tipo Kahoot para el evento English Day: API REST + WebSockets en tiempo real, backend en Java/Spring Boot, frontend web mobile-first, base de datos relacional. Desarrollada por 5 subequipos (Backend, Frontend, UI/UX, Base de Datos, QA) con apoyo de IA.

Si es tu primera vez aquí, ve directo a **[Paso a paso a prueba de bobos](#paso-a-paso-a-prueba-de-bobos)**.

## Estructura del repositorio

```
english-day/
├── backend/     (Spring Boot)
├── frontend/    (HTML/CSS/JS)
├── database/    (scripts SQL)
├── docs/        (todos los documentos del proyecto, ver tabla abajo)
└── README.md    (este archivo)
```

## Documentos del proyecto

Todos viven en `docs/`. Hay dos grupos: los que definen **qué** se va a construir, hechos en la etapa de planificación, y los que definen **cómo** se construye con ayuda de la IA, pensados para que nadie se pierda durante el desarrollo.

### 1. Planificación del proyecto (documentos base)

| Documento | Para qué sirve | Quién lo usa |
|---|---|---|
| `PROYECTO_DE_DESARROLLO_DE_SOFTWARE...docx` | Visión general, requerimientos funcionales y no funcionales (RF/RNF), casos de uso, los 5 subequipos. **Léelo primero, sin excepción.** | Todos |
| `DOCUMENTO_DE_ARQUITECTURA_DE_SOFTWARE (DAS).docx` | Arquitectura técnica, stack tecnológico, modelo de clases del sistema. | Backend, Frontend, Base de Datos |
| `CRONOGRAMA_DE_TRABAJO_Y_EDT...docx` | Fechas, hitos (H1-H5), y la Matriz RACI: quién es responsable de qué. | PM y líderes de cada equipo |
| `Estrategia_de_Trabajo_Colaborativo_y_Hojas_de_Ruta_Tecnicas.docx` | El roadmap de aprendizaje de tu subequipo, por fases. | Cada subequipo, en su propia sección |
| `PLAN_DE_PRUEBAS_Y_CONTROL_DE_CALIDAD.docx` | Casos de prueba y criterios de aceptación, atados a cada RF. | QA, y cualquiera antes de dar una tarea por terminada |
| `MANUAL_DE_DESPLIEGUE.docx` | Cómo poner el sistema en línea el día del evento (Cloudflare Tunnel, variables de entorno, etc.). | Backend, PM, el día del English Day |

### 2. Cómo se desarrolla con la IA (documentos operativos)

| Documento | Para qué sirve | Quién lo usa |
|---|---|---|
| `CONTRATO_DE_INTEGRACION_API_WEBSOCKETS.docx` | Fija los nombres EXACTOS de rutas, campos JSON y eventos WebSocket que todos deben respetar, para que lo que hace cada equipo encaje sin fricción. | Todos, en cada conversación con la IA |
| `BACKLOG_DE_TAREAS_POR_EQUIPO.docx` | La lista numerada y ordenada de tareas de tu equipo — responde "¿y ahora qué sigue?". | Todos, antes de crear una rama nueva |
| `PROMPTS_MAESTROS_POR_EQUIPO.docx` | El mensaje inicial que cada equipo le pega a la IA para que entienda el proyecto, su rol y las reglas del juego. | Todos, al iniciar cada conversación con la IA |
| `GUIA_DE_GIT.docx` | Comandos exactos, nombres de rama/commit, protección de `main`, checklist de Pull Request y qué hacer si hay un conflicto. | Todos, en cada tarea |
| `GUIA_DE_KICKOFF_Y_COMUNICACION.docx` | Agenda de la reunión de lanzamiento del proyecto, y la cadencia de standups/checkpoints entre el PM y los líderes de área. | PM y líderes de área |
| `BITACORA_DE_DECISIONES_TECNICAS.docx` | Registro vivo de las decisiones que no estaban en el Contrato de Integración (ej. cómo comparar una respuesta de voz, una constante de puntuación) — se actualiza todo el tiempo, a diferencia del Contrato. | Todos, cada vez que surge un "supuesto pendiente de validar" |
| `CHECKLIST_PRE_EVENTO.docx` | Los últimos 5 días antes del English Day: ensayo en condiciones reales, code freeze, y el plan de contingencia si algo falla en vivo. | PM y todos, la última semana |
| `GUIA_DE_SUSTENTACION.docx` | Quién defiende cada parte ante el jurado, la estructura de la presentación, y cómo responder con transparencia sobre el uso de la IA. | Todos, antes de la sustentación |
| `CONFIGURACION_DEL_REPOSITORIO_Y_TABLERO.docx` | Paso a paso para crear el repositorio real en GitHub y el tablero Kanban a partir del Backlog, usando `setup_repo.sh` y `create_backlog_issues.sh`. | PM, una sola vez, al inicio |
| `LIDERAZGO_DE_EQUIPO_Y_DESARROLLO_PARALELO.docx` | Labores del líder de cada equipo, y cómo repartir las tareas del Backlog en "oleadas" paralelas para que todos programen con la IA, no solo el líder. | Los 5 líderes y sus equipos |

> Regla de oro: **Contrato + Backlog + tu documento propio** se adjuntan SIEMPRE a la IA. Sin eso, la IA improvisa y el trabajo de un equipo deja de encajar con el de otro. Si tu IA te dice que algo es un "supuesto pendiente de validar", ese es el momento de abrir la Bitácora, no de seguir adelante como si ya existiera.

## Paso a paso a prueba de bobos

### Antes de tocar código (una sola vez por persona)

- [ ] Crear una cuenta en [GitHub](https://github.com) si no tienes una.
- [ ] Instalar [Git](https://git-scm.com/downloads).
- [ ] Instalar tu editor de código (ver tabla de recomendados más abajo).
- [ ] Configurar Git una sola vez:
  ```
  git config --global user.name "Tu Nombre"
  git config --global user.email "tu_correo@ejemplo.com"
  ```
- [ ] Clonar el repositorio:
  ```
  git clone https://github.com/[usuario-o-equipo]/english-day.git
  cd english-day
  ```
- [ ] Leer los documentos de `docs/` **en este orden**: (1) Proyecto general → (2) DAS → (3) tu sección en Estrategia de Trabajo Colaborativo → (4) tu fila en el Cronograma/RACI → (5) Contrato de Integración → (6) tu sección en el Backlog → (7) Guía de Git.
- [ ] Abrir `PROMPTS_MAESTROS_POR_EQUIPO.docx` y copiar el prompt de tu equipo — lo vas a necesitar en cada conversación con la IA.
- [ ] Si eres **líder de área**: revisa también `GUIA_DE_KICKOFF_Y_COMUNICACION.docx` §3 para conocer la cadencia de standups y checkpoints.
- [ ] Si eres **PM**: sigue la checklist y la agenda completas de `GUIA_DE_KICKOFF_Y_COMUNICACION.docx` para preparar y dirigir el kickoff.

### Cada vez que vayas a hacer una tarea nueva

1. Abre el **Backlog** y busca la sección de tu equipo: identifica la primera tarea que aún no está marcada como hecha.
2. Actualiza tu copia local y crea la rama de esa tarea:
   ```
   git checkout main
   git pull
   git checkout -b equipo/tarea-N-descripcion-corta
   ```
3. Abre tu editor con IA, pega el **Prompt Maestro** de tu equipo (actualiza la línea "VAMOS EN LA TAREA" con el número correcto), y adjunta el Contrato de Integración + el Backlog + tu documento propio.
4. Trabaja con la IA paso a paso, guardando avances en commits pequeños (ver convención en la Guía de Git).
5. Prueba tu trabajo localmente antes de subir nada.
6. Sube la rama y abre un Pull Request hacia `main`:
   ```
   git push origin equipo/tarea-N-descripcion-corta
   ```
7. Espera la revisión y aprobación del responsable según la Matriz RACI.
8. Cuando se apruebe y se haga merge, vuelve al paso 1 con la siguiente tarea.

### Si te pierdes

| Duda | Dónde buscar |
|---|---|
| "¿Qué tarea sigue?" | `BACKLOG_DE_TAREAS_POR_EQUIPO.docx`, sección de tu equipo |
| "¿Cómo se llama este campo/endpoint/evento?" | `CONTRATO_DE_INTEGRACION_API_WEBSOCKETS.docx` |
| "¿Qué comando de Git uso?" | `GUIA_DE_GIT.docx`, secciones 5 y 9 (glosario) |
| "¿Cómo empiezo a hablar con la IA?" | `PROMPTS_MAESTROS_POR_EQUIPO.docx` |
| "¿Quién aprueba mi Pull Request?" | `GUIA_DE_GIT.docx`, sección 7, o la Matriz RACI del Cronograma |
| "Tomé una decisión que no estaba en el Contrato, ¿dónde la dejo?" | `BITACORA_DE_DECISIONES_TECNICAS.docx` |
| "Soy PM, ¿cómo presento el proyecto o me comunico con los líderes?" | `GUIA_DE_KICKOFF_Y_COMUNICACION.docx` |
| "¿Qué falta antes del día del evento?" | `CHECKLIST_PRE_EVENTO.docx` |
| "¿Cómo me preparo para defender el proyecto ante el jurado?" | `GUIA_DE_SUSTENTACION.docx` |

## Editores de código recomendados (con IA integrada)

No es obligatorio usar uno en particular, pero estos hacen que trabajar con la IA sea mucho más fluido porque leen tu proyecto completo en vez de que copies y pegues código a mano.

| Editor | Recomendado para | Por qué |
|---|---|---|
| **Visual Studio Code** + extensión de IA (Copilot, Claude Code, Cline) | Todos, especialmente Frontend | El más usado, gratis, con miles de tutoriales; la extensión de IA se agrega en minutos |
| **Google Antigravity** | Backend y tareas grandes/multi-archivo | Gratis (en preview), basado en VS Code, agente autónomo que planea, escribe, prueba y verifica código en el editor, la terminal y el navegador a la vez — útil para tareas que tocan varios archivos como un endpoint completo con su prueba |
| **Cursor** | Quien ya conoce VS Code y quiere IA muy integrada al escribir | Fork de VS Code con "modo agente" para tareas grandes y autocompletado con contexto de todo el proyecto |
| **IntelliJ IDEA (Community, gratis)** | Backend en Java/Spring Boot | El estándar para proyectos Java; se le puede agregar un plugin de IA (ej. GitHub Copilot) |

> Cualquiera que elijan, la clave sigue siendo la misma: adjuntar el Contrato de Integración, el Backlog y el prompt maestro de su equipo antes de pedirle nada a la IA.
