# Informe y Guía de Pruebas de Carga y Concurrencia
**Plataforma Web Interactiva de Gamificación — English Up (SENA ADSO)**  
**Subequipos:** Backend (Java/Spring Boot) & QA / Control de Calidad  
**Tareas Vinculadas:** Backend Tarea 13 & QA Tarea 6 (EDT 1.5, Hito H2, Actividad A6)  
**Criterio de Aceptación Clave:** RNF-02 (Latencia p95 < 200 ms bajo 30–50 conexiones simultáneas)

---

## 1. Objetivo y Alcance

El propósito de esta suite es validar la estabilidad, rendimiento y resiliencia del servidor Spring Boot y la base de datos cuando **30 a 50 aprendices interactúan de forma simultánea** durante el evento *English Up*:

1. **Ingreso masivo al Lobby (Join concurrente):** Ráfaga de 50 peticiones simultáneas con PIN de 6 dígitos.
2. **Envío de respuestas en tiempo real:** Disparo concurrente de respuestas evaluando integridad transaccional, ausencia de condiciones de carrera (*race conditions*) y actualización de la tabla `Score`.
3. **Consulta masiva del Podio Final:** Disparo simultáneo de solicitudes para visualizar el Top 3 sin degradación del servicio.

---

## 2. Herramientas y Componentes Implementados

La suite de pruebas de carga cuenta con 3 mecanismos de ejecución complementarios:

| Componente | Tipo | Ubicación | Uso |
|---|---|---|---|
| **`LoadAndConcurrencyIntegrationTest.java`** | Prueba Java Spring Boot | `backend/src/test/java/com/senadso/englishday/load/` | Pruebas automáticas integradas en el pipeline de desarrollo con `TestRestTemplate`, `ExecutorService` y `CountDownLatch`. |
| **`load_test_simulation.ps1`** | Script PowerShell nativo | `QA/load-test/load_test_simulation.ps1` | Ejecutable en cualquier máquina Windows sin instalar dependencias externas. Soporta servidores locales y remotos (Cloudflare Tunnel). |
| **`load_test_k6.js`** | Script de carga k6 | `QA/load-test/load_test_k6.js` | Para pipelines CI/CD y pruebas continuas con la herramienta estándar de la industria `k6`. |

---

## 3. Matriz de Casos de Prueba de Carga

| ID Caso | Escenario | Carga Concurrente | Métrica Objetivo (RNF-02) | Criterio de Éxito |
|---|---|:---:|:---:|:---:|
| **CP-CARGA-01** | Registro concurrente en sala (`POST /api/rooms/{pin}/join`) | 50 hilos simultáneos | Latencia p95 < 200 ms | 100% de peticiones HTTP 200 OK, 50 registros únicos en BD. |
| **CP-CARGA-02** | Procesamiento de respuestas simultáneas (`/app/room/{roomId}/answer`) | 50 envíos en paralelo | Latencia p95 < 200 ms | 50 registros de `Answer` y `Score` sin deadlocks en BD. |
| **CP-CARGA-03** | Consulta masiva de resultados y podio (`GET /api/rooms/{roomId}/results`) | 50 peticiones concurrentes | Latencia p95 < 200 ms | Top 3 consistente en todas las respuestas sin timeout. |

---

## 4. Guía de Ejecución

### Opción A: Ejecutar con PowerShell (Sin instalar nada extra)

1. Abre una terminal de PowerShell.
2. Navega a la carpeta de QA:
   ```powershell
   cd c:\Users\Aprendiz\Videos\REPOSITORIO\english-day\QA\load-test
   ```
3. Ejecuta la prueba apuntando al servidor local o al túnel de Cloudflare:
   ```powershell
   # Contra servidor local
   .\load_test_simulation.ps1 -BaseUrl "http://localhost:8080" -TotalUsers 50

   # Contra servidor en Cloudflare Tunnel
   .\load_test_simulation.ps1 -BaseUrl "https://english-day-demo.trycloudflare.com" -TotalUsers 50
   ```

El script imprimirá en pantalla las métricas de:
* Cantidad de peticiones exitosas vs. fallidas.
* Throughput (peticiones por segundo).
* Latencia Mínima, Media, Mediana (p50), Percentil 95 (p95) y Máxima.
* Dictamen final de aceptación (`PASS` / `FAIL`).

---

### Opción B: Ejecutar la Suite de Integración en Spring Boot

Desde la carpeta `backend/`:
```bash
./mvnw test -Dtest=LoadAndConcurrencyIntegrationTest
```

---

### Opción C: Ejecutar con k6

Si dispones de `k6` instalado en tu entorno:
```bash
k6 run QA/load-test/load_test_k6.js -e BASE_URL=http://localhost:8080
```

---

## 5. Criterios de Aceptación y Aprobación (Exit Criteria)

De acuerdo con el **Plan de Pruebas y Control de Calidad §6**:

1. **Efectividad Funcional:** 100% de las 50 peticiones deben completar sin errores HTTP 500, bloqueos de conexión ni caídas de servidor.
2. **Latencia RNF-02:** El percentil 95 ($p_{95}$) de tiempo de respuesta debe mantenerse estrictamente por debajo de **200 ms**.
3. **Consistencia Transaccional:** Todas las entidades hijas (`Player`, `Answer`, `Score`) deben quedar asociadas a la sala sin duplicados ni registros huérfanos.
