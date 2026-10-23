# English Up — Plataforma Web Interactiva de Gamificación en Inglés (SENA ADSO)

Plataforma web multijugador en tiempo real desarrollada para el evento institucional **English Up** del **SENA (Análisis y Desarrollo de Software — ADSO)**. Permite a los aprendices conectarse desde sus dispositivos móviles mediante un código PIN de 6 dígitos para competir en rondas sincrónicas de inglés (niveles MCER A2–B1) proyectadas en auditorio, integrando cuatro mecánicas interactivas, retroalimentación pedagógica por ruleta y clasificación en vivo.

---

<p align="center">
  <img src="docs/assets/sena-adso-team.jpg" alt="Equipo SENA ADSO - English Up" width="100%">
</p>

## 🤖 Creación del Proyecto & Uso Responsable de la Inteligencia Artificial

> *"La inteligencia artificial no reemplaza la creatividad ni el criterio humano: los potencia. English Up fue desarrollado utilizando la IA responsablemente como tutor pedagógico, mentor técnico y guía paso a paso en la construcción de la aplicación web."*

En el marco de la formación profesional integral del **SENA**, los aprendices de **Análisis y Desarrollo de Software (ADSO)** adoptaron un enfoque vanguardista y ético: la **co-creación responsable asistida por Inteligencia Artificial**. La IA fungió como un catalizador del aprendizaje activo, guiando la construcción paso a paso de la aplicación web:

- **Tutoría Socrática y Guía Metodológica:** La IA actuó como un mentor permanente que explicó fundamentos de ingeniería de software, patrones arquitectónicos cliente-servidor, concurrencia en WebSockets y normalización de datos, fomentando en los aprendices la comprensión profunda del *porqué* detrás de cada decisión técnica.
- **Construcción Paso a Paso:**
  - **Arquitectura Backend:** Modelado asistido de entidades relacionales, configuración de Spring Boot 3 con STOMP WebSockets, y algoritmos deterministas de puntuación por velocidad de respuesta.
  - **Mecánicas Pedagógicas y Gamificación:** Diseño e implementación de las cuatro modalidades interactivas (selección múltiple, ordenamiento sintáctico por bloques, entrada de texto y reconocimiento de voz mediante la Web Speech API).
  - **Frontend Táctil y Accesible:** Creación del sistema de diseño *Tactile Gamified Arcade*, renderizado de avatares interactivos, animación de ruleta de retroalimentación en Canvas 2D y adaptabilidad para dispositivos móviles y proyector.
- **Supervisión, Criterio y Verificación Humana:** Cada recomendación de la IA fue rigurosamente revisada, adaptada y validada por los aprendices a través de matrices de calidad, pruebas unitarias, suites End-to-End y simulaciones de carga concurrente. El liderazgo conceptual, las decisiones de arquitectura y la autoría intelectual residen enteramente en el equipo humano de aprendices.

---

## Características Principales

- **Salas en Vivo mediante PIN de 6 dígitos:** Creación instantánea de sesiones de juego y lobby en tiempo real con actualización automática de participantes conectados.
- **Sincronización Bidireccional de Baja Latencia (< 200 ms):** Comunicación basada en **WebSockets (STOMP)** capaz de soportar 30+ aprendices concurrentes por sala sin condiciones de carrera.
- **Cuatro Mecánicas de Evaluación:**
  - `MULTIPLE_CHOICE`: Selección múltiple de 4 opciones con retroalimentación táctil.
  - `WORD_BLOCKS`: Construcción sintáctica de oraciones mediante bloques interactivos (*Tap & Arrange*).
  - `TEXT_INPUT`: Escritura directa con normalización tolerante a mayúsculas, espacios y signos de puntuación.
  - `VOICE`: Reconocimiento de pronunciación en inglés (`en-US`) mediante **Web Speech API**, con transcripción en vivo y degradación elegante (*fallback* automático a texto) cuando el navegador o los permisos del dispositivo restringen el micrófono.
- **Algoritmo de Puntuación por Velocidad:** Cálculo determinista en servidor según el tiempo restante de respuesta:
  $$\text{Puntos} = \text{round}\left(1000 \times \left(0.5 + 0.5 \times \frac{t_{\text{restante}}}{t_{\text{total}}}\right)\right)$$
- **Ruleta de Retroalimentación Pedagógica:** Sorteo aleatorio en servidor entre los participantes de la ronda (con animación en Canvas en la vista del proyector) para fomentar la justificación oral en inglés.
- **Panel de Moderador / Proyector Integrado:** Interfaz dedicada para el docente con controles de inicio, cierre de pregunta (Top 5 parcial), giro de ruleta, avance de ronda, reconexión por PIN y podio final (Top 3) con animación de confeti.

---

## Arquitectura y Stack Tecnológico

| Capa | Tecnología | Propósito |
|---|---|---|
| **Backend** | Java 17 / Spring Boot 3.2.5 | API REST síncrona, Broker STOMP WebSocket, lógica de negocio y puntuación |
| **Persistencia** | Spring Data JPA + Hibernate / MySQL 8.0+ | Almacenamiento relacional transaccional (con soporte H2 en memoria para pruebas) |
| **Tiempo Real** | Spring WebSocket + STOMP Protocol | Difusión de eventos de sala (`lobby`, `status`, `question`, `results`, `roulette`, `podium`) |
| **Frontend** | HTML5 Semántico, CSS3 (*Tactile Gamified Arcade*), JavaScript ES6+ | Clientes ligeros sin dependencias pesadas, *Mobile-First* (`>= 48x48px` touch targets), Web Speech API y Canvas 2D |
| **Infraestructura** | Cloudflare Tunnel (`cloudflared`) | Exposición segura mediante HTTPS / WSS para habilitar el micrófono móvil en redes locales |

---

## Estructura del Proyecto

```text
english-up/
├── backend/                                  # Servidor Spring Boot (API REST + STOMP WebSocket)
│   ├── src/main/java/com/senadso/englishday/
│   │   ├── config/                           # Configuración CORS, recursos estáticos, WebSocket y semilla automática
│   │   ├── controller/                       # Controladores REST (RoomController) y STOMP (GameWebSocketController)
│   │   ├── dto/                              # Objetos de transferencia de datos según Contrato de Integración
│   │   ├── exception/                        # Manejo global de excepciones y códigos de error semánticos
│   │   ├── model/                            # Entidades JPA (Room, Player, Question, Answer, Score)
│   │   ├── repository/                       # Repositorios Spring Data JPA
│   │   └── service/                          # Lógica de salas, validación de respuestas, puntajes y ruleta
│   ├── src/main/resources/                   # Perfiles de configuración (default, h2, prod)
│   └── src/test/java/                        # Suite de 52 pruebas unitarias, de integración y concurrencia
├── frontend/                                 # Aplicación Web Cliente (servida estáticamente por el Backend)
│   ├── index.html                            # Vista del Aprendiz (Mobile-First)
│   ├── moderator.html                        # Panel de Control del Moderador y Vista de Proyector
│   ├── css/                                  # Hojas de estilo del sistema de diseño Tactile Gamified Arcade
│   └── js/                                   # Clientes STOMP/REST (join.js, moderator.js), ruleta y efectos
├── database/                                 # Persistencia y Analítica SQL
│   ├── schema.sql                            # Esquema DDL oficial para MySQL 8.0+
│   ├── questions_seed.sql                    # Semilla oficial de 24 preguntas (6 temáticas, niveles A2-B1)
│   ├── queries/                              # Consultas operativas y reportería analítica post-evento
│   └── schemas/                              # JSON Schema de validación del banco de preguntas
├── QA/                                       # Aseguramiento de Calidad y Pruebas Automatizadas
│   ├── MATRIZ_CASOS_DE_PRUEBA_Y_EJECUCION.md # Matriz y resultados de ejecución (CP-01 a CP-11)
│   ├── REPORTE_RESILIENCIA_AUDITORIA_Y_DISPOSITIVOS.md
│   ├── e2e_verification_suite.mjs            # Suite automatizada End-to-End (25 verificaciones REST + STOMP)
│   ├── load-test/                            # Scripts e informe de pruebas de carga y estrés (Grafana k6)
│   └── banco-preguntas/                      # Insumos pedagógicos del área de bilingüismo
├── UIUX/                                     # Sistema de Diseño y Prototipos de Interfaz
│   ├── design-system/                        # Especificación visual (DESIGN.md)
│   ├── wireframes/                           # Estructura base de pantallas
│   ├── mobile-views/                         # Vistas móviles de alta fidelidad
│   ├── components/                           # Componentes interactivos por mecánica
│   └── projector-views/                      # Vistas de pantalla gigante / auditorio
└── docs/                                     # Documentación de Arquitectura, Contrato API/WS y Despliegue
```

---

## Contrato de Comunicación (Resumen)

### Endpoints REST Principales

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/rooms` | Crea una nueva sala en estado `WAITING` y genera un PIN único de 6 dígitos. |
| `GET` | `/api/rooms/{pin}` | Obtiene el estado actual y metadatos de una sala activa a partir de su PIN. |
| `POST` | `/api/rooms/{pin}/join` | Registra un aprendiz en la sala y notifica al tópico de lobby. |
| `POST` | `/api/rooms/{roomId}/start` | Inicia la partida (`IN_PROGRESS`) y emite la primera pregunta. |
| `POST` | `/api/rooms/{roomId}/close-question` | Cierra la pregunta activa y publica la respuesta correcta junto al Top 5. |
| `POST` | `/api/rooms/{roomId}/roulette` | Selecciona aleatoriamente a un aprendiz para la retroalimentación oral. |
| `POST` | `/api/rooms/{roomId}/next` | Avanza a la siguiente pregunta del banco o finaliza la partida. |
| `POST` | `/api/rooms/{roomId}/finish` | Cierra la partida (`FINISHED`) y publica el podio final (Top 3). |

### Canales STOMP WebSocket (`/ws-englishup` / `/ws-englishday`)

| Dirección | Destino | Propósito |
|---|---|---|
| `SUBSCRIBE` | `/topic/room/{roomId}/lobby` | Lista actualizada de jugadores y avatares conectados en sala de espera. |
| `SUBSCRIBE` | `/topic/room/{roomId}/status` | Cambios de estado de la sala (`WAITING`, `IN_PROGRESS`, `FINISHED`). |
| `SUBSCRIBE` | `/topic/room/{roomId}/question` | Difusión de la pregunta activa y su temporizador (sin exponer `correctAnswer`). |
| `SEND` | `/app/room/{roomId}/answer` | Envío de respuesta del aprendiz (`{ playerId, questionId, value }`). |
| `SUBSCRIBE` | `/topic/room/{roomId}/results` | Respuesta correcta revelada y clasificación parcial Top 5. |
| `SUBSCRIBE` | `/topic/room/{roomId}/roulette` | Aprendiz seleccionado por la ruleta y su respuesta registrada. |
| `SUBSCRIBE` | `/topic/room/{roomId}/podium` | Podio final Top 3 al cierre de la sesión. |
| `SUBSCRIBE` | `/topic/room/{roomId}/reactions` | Efectos interactivos globales en tiempo real (lluvia de emojis, confeti). |
| `SEND` | `/app/room/{roomId}/reaction` | Emisión de reacción interactiva con control de cooldown. |

---

## Requisitos Previos

- **Java JDK 17+**
- **MySQL 8.0+** *(opcional si se ejecuta con el perfil en memoria `h2`)*
- **Cloudflare Tunnel (`cloudflared`)** *(requerido únicamente en el evento en vivo para proveer HTTPS/WSS a dispositivos móviles)*

---

## Instalación y Puesta en Marcha

### 1. Inicializar la Base de Datos (Producción con MySQL)

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p english_day < database/questions_seed.sql
```

### 2. Compilar y Ejecutar el Servidor

#### Modo Producción (MySQL)
```bash
cd backend
./mvnw clean package -DskipTests
java -jar -Dspring.profiles.active=prod -Dserver.port=8080 target/english-day-0.0.1-SNAPSHOT.jar
```
*(Variables de entorno soportadas: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `PORT`).*

#### Modo Rápido / Autónomo (Base de datos H2 en memoria)
Si deseas ejecutar la plataforma de inmediato sin configurar MySQL externo:
```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=h2"
```

### 3. Acceso a las Interfaces

Una vez iniciado el servidor en el puerto `8080`:
- **Vista del Aprendiz (Móvil / Navegador):** `http://localhost:8080/`
- **Panel del Moderador / Proyector:** `http://localhost:8080/moderator`

### 4. Exposición Segura HTTPS para el Evento (Cloudflare Tunnel)

Para permitir que los aprendices se conecten desde sus teléfonos móviles y utilicen el reconocimiento de voz por micrófono (que exige contexto seguro HTTPS):

**Opción A: Túnel administrado con Token (Recomendado para dominio propio, ej: englishup.jmj.agency)**
```bash
cloudflared tunnel run --token <TU_TOKEN_CLOUDFLARE>
```

**Opción B: Quick Tunnel temporal**
```bash
cloudflared tunnel --url http://localhost:8080
```

Comparte la URL HTTPS generada (o el código QR renderizado en pantalla) con los aprendices en el auditorio.

---

## Ejecución de Pruebas Automatizadas

### Pruebas Unitarias, de Integración y Concurrencia (Backend)
```bash
cd backend
./mvnw test
```

### Suite End-to-End (Flujo Completo REST + STOMP WebSockets)
Con el servidor en ejecución en `http://localhost:8080`:
```bash
node QA/e2e_verification_suite.mjs
```

---

## Créditos y Reconocimientos

- **Equipo de Desarrollo:** Aprendices de la tecnología en **Análisis y Desarrollo de Software (ADSO)** del **Servicio Nacional de Aprendizaje (SENA)**.
- **Tutoría Metodológica & Asistencia Técnica:** Inteligencia Artificial (utilizada responsable y éticamente como tutor pedagógico, mentor técnico y guía paso a paso en la arquitectura, implementación y calidad del proyecto).
- **Iniciativa Institucional:** Jornada y evento de bilingüismo **English Up 2026** — Regional Distrito Capital.
