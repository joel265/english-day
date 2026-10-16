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
| **5** | 2026-10-16 | Frontend tarea 2 invoca `POST /api/rooms/{pin}/join` mediante una ruta relativa, sin fijar host ni puerto. Queda pendiente acordar cómo se servirá el Frontend respecto al Backend en desarrollo y despliegue (mismo origen/proxy o CORS); no se asumirá una URL base hasta validarlo entre ambos equipos. | Frontend + Backend | Frontend, Backend, QA | ☐ Abierta |
| **6** | | | | | ☐ Abierta |
| **7** | | | | | ☐ Abierta |
| **8** | | | | | ☐ Abierta |
| **9** | | | | | ☐ Abierta |
