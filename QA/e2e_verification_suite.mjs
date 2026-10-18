/**
 * e2e_verification_suite.mjs - Suite Automatizada End-to-End de QA y Frontend
 * Plataforma Web Interactiva de Gamificación — English Day (SENA ADSO)
 *
 * Verifica de principio a fin (sin dependencias externas, usando fetch y WebSocket nativos de Node 22+):
 *  - Servido estático de vistas Frontend (/index.html, /moderator.html, /tarea-01-pantalla-pin-nickname/index.html)
 *  - CP-01: POST /api/rooms (creación de sala con PIN de 6 dígitos)
 *  - CP-03: POST /api/rooms/000000/join (rechazo 404 con { code: "ROOM_NOT_FOUND", error: "PIN no encontrado" })
 *  - CP-02 & RF-03: POST /api/rooms/{pin}/join y recepción en vivo en /topic/room/{roomId}/lobby
 *  - Anexo A.4: GET /api/rooms/{pin} (consulta de reconexión con playerCount)
 *  - CU-03 & RF-08: POST /api/rooms/{roomId}/start y recepción de pregunta #1 en /topic/room/{roomId}/question (sin correctAnswer)
 *  - CP-04 (RF-04): Envío de respuesta MULTIPLE_CHOICE a /app/room/{roomId}/answer
 *  - CP-10 (RF-09/RF-10): Cálculo de puntaje por velocidad y emisión de Top 5 en /topic/room/{roomId}/results
 *  - CP-09 (RF-11): POST /api/rooms/{roomId}/roulette y recepción en /topic/room/{roomId}/roulette
 *  - CU-03 (Tarea 14): POST /api/rooms/{roomId}/next para avanzar a TEXT_INPUT (CP-06), WORD_BLOCKS (CP-05) y VOICE (CP-07)
 *  - CP-11 (RF-10/CU-06): POST /api/rooms/{roomId}/finish y recepción del Podio Top 3 en /topic/room/{roomId}/podium
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:8080";
const WS_URL = BASE_URL.replace(/^http/, "ws") + "/ws-englishday";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    failed += 1;
    console.error(`❌ FAIL: ${message}`);
    throw new Error(message);
  }
  passed += 1;
  console.log(`✅ PASS: ${message}`);
}

class StompTestClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.messagesByTopic = new Map();
    this.waiters = [];
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);
      let buffer = "";

      this.ws.addEventListener("open", () => {
        this.ws.send("CONNECT\naccept-version:1.2,1.1,1.0\nhost:localhost\nheart-beat:0,0\n\n\0");
      });

      this.ws.addEventListener("message", (event) => {
        buffer += String(event.data);
        let end = buffer.indexOf("\0");
        while (end !== -1) {
          const raw = buffer.slice(0, end).replace(/^\n+/, "");
          buffer = buffer.slice(end + 1);
          if (raw) {
            const sep = raw.indexOf("\n\n");
            if (sep !== -1) {
              const headerLines = raw.slice(0, sep).split("\n");
              const command = headerLines[0].trim();
              const headers = {};
              headerLines.slice(1).forEach((l) => {
                const c = l.indexOf(":");
                if (c !== -1) headers[l.slice(0, c)] = l.slice(c + 1);
              });
              const body = raw.slice(sep + 2);

              if (command === "CONNECTED") {
                resolve();
              } else if (command === "MESSAGE") {
                const dest = headers.destination;
                const parsed = JSON.parse(body);
                if (!this.messagesByTopic.has(dest)) {
                  this.messagesByTopic.set(dest, []);
                }
                this.messagesByTopic.get(dest).push(parsed);
                this.waiters = this.waiters.filter((w) => {
                  if (w.destination === dest) {
                    w.resolve(parsed);
                    return false;
                  }
                  return true;
                });
              }
            }
          }
          end = buffer.indexOf("\0");
        }
      });

      this.ws.addEventListener("error", (err) => reject(err));
    });
  }

  subscribe(id, destination) {
    this.ws.send(`SUBSCRIBE\nid:${id}\ndestination:${destination}\nack:auto\n\n\0`);
  }

  send(destination, payloadObj) {
    const json = JSON.stringify(payloadObj);
    this.ws.send(`SEND\ndestination:${destination}\ncontent-type:application/json\n\n${json}\0`);
  }

  waitForMessage(destination, timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
      const existing = this.messagesByTopic.get(destination);
      if (existing && existing.length > 0) {
        resolve(existing.shift());
        return;
      }
      const timer = setTimeout(() => {
        reject(new Error(`Timeout esperando mensaje en ${destination}`));
      }, timeoutMs);
      this.waiters.push({
        destination,
        resolve: (msg) => {
          clearTimeout(timer);
          const q = this.messagesByTopic.get(destination);
          if (q && q.length > 0) q.shift();
          resolve(msg);
        },
      });
    });
  }

  close() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
  }
}

async function runSuite() {
  console.log(`\n🚀 Iniciando Suite E2E de QA y Frontend contra ${BASE_URL}...\n`);

  // 0. Verificar vistas HTML servidas por el servidor
  const indexRes = await fetch(`${BASE_URL}/index.html`);
  const indexHtml = await indexRes.text();
  assert(
    indexRes.status === 200 &&
      indexHtml.includes("voiceUI") &&
      indexHtml.includes("podiumCard") &&
      indexHtml.includes("btnLeaveLobby") &&
      indexHtml.includes("navModeratorLink"),
    "Frontend Tarea 8-12: /index.html sirve las pantallas de PIN, Lobby (con botón Salir de la sala), Pregunta (4 mecánicas), Resultados, Ruleta, Podio y bloqueo de botón superior"
  );

  const modRes = await fetch(`${BASE_URL}/moderator.html`);
  const modHtml = await modRes.text();
  assert(
    modRes.status === 200 &&
      modHtml.includes("btnCreateRoom") &&
      modHtml.includes("btnActivateRoulette") &&
      modHtml.includes("modQrCanvas") &&
      modHtml.includes("stageQrCanvas") &&
      modHtml.includes("navPlayerViewLink") &&
      modHtml.includes("stageTransitionView") &&
      modHtml.includes("stageQuestionProgress") &&
      modHtml.includes("stageQuestionTopicBanner"),
    "Frontend Tarea 14: /moderator.html sirve el Panel de Moderador con animaciones de transición, barra de progreso, temática, generador QR y bloqueo superior"
  );

  const qrScriptRes = await fetch(`${BASE_URL}/js/qrcode.js`);
  const qrScriptText = await qrScriptRes.text();
  new Function(qrScriptText)();
  const testQrMatrix = globalThis.EnglishDayQR?.generateMatrix("http://192.168.1.10:8080/index.html?pin=123456");
  // Extraer los 15 bits de información de formato (copia 1: col 8 filas 0..5,7,8 y fila 8 cols 7,5..0) y verificar BCH(15,5)
  let formatCopy1 = 0;
  for (let i = 0; i <= 5; i++) if (testQrMatrix.modules[i][8]) formatCopy1 |= 1 << i;
  if (testQrMatrix.modules[7][8]) formatCopy1 |= 1 << 6;
  if (testQrMatrix.modules[8][8]) formatCopy1 |= 1 << 7;
  if (testQrMatrix.modules[8][7]) formatCopy1 |= 1 << 8;
  for (let i = 9; i < 15; i++) if (testQrMatrix.modules[8][14 - i]) formatCopy1 |= 1 << i;
  let unmaskedFmt = formatCopy1 ^ 0x5412;
  let bchCheck = unmaskedFmt;
  for (let b = 14; b >= 10; b--) {
    if ((bchCheck >>> b) & 1) bchCheck ^= 0x537 << (b - 10);
  }
  assert(
    qrScriptRes.status === 200 &&
      testQrMatrix &&
      bchCheck === 0 &&
      ((unmaskedFmt >>> 13) & 0b11) === 0b01,
    "Generador QR ISO/IEC 18004: /js/qrcode.js genera matriz con bits de formato BCH(15,5) válidos para cámaras móviles"
  );

  // 1. CP-01: Crear sala
  const createRes = await fetch(`${BASE_URL}/api/rooms`, { method: "POST" });
  const room = await createRes.json();
  assert(createRes.status === 201 && /^\d{6}$/.test(room.pin) && room.status === "WAITING_LOBBY",
    `CP-01: Sala creada exitosamente con PIN ${room.pin} y roomId ${room.roomId}`);

  // 1b. Validar que el moderador NO puede iniciar la partida sin jugadores en la sala
  const emptyStartRes = await fetch(`${BASE_URL}/api/rooms/${room.roomId}/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  const emptyStartBody = await emptyStartRes.json();
  assert(
    emptyStartRes.status === 400 && emptyStartBody.code === "INVALID_ROOM_STATE",
    "Validación Inicio de Partida: POST /api/rooms/{roomId}/start sin aprendices conectados es rechazado con 400 INVALID_ROOM_STATE"
  );

  // 2. CP-03: PIN inválido / inexistente
  const badJoinRes = await fetch(`${BASE_URL}/api/rooms/000000/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname: "aprendiz_qa" }),
  });
  const badJoinBody = await badJoinRes.json();
  assert(badJoinRes.status === 404 && badJoinBody.error === "PIN no encontrado" && badJoinBody.code === "ROOM_NOT_FOUND",
    "CP-03: Ingreso con PIN inexistente retorna 404 ROOM_NOT_FOUND ('PIN no encontrado')");

  // 3. Conectar cliente STOMP y suscribir todos los canales de la sala
  const stomp = new StompTestClient(WS_URL);
  await stomp.connect();
  ["lobby", "status", "question", "results", "roulette", "podium"].forEach((t) => {
    stomp.subscribe(`sub-${t}`, `/topic/room/${room.roomId}/${t}`);
  });
  await new Promise((r) => setTimeout(r, 150));

  // 4. CP-02: Unir dos jugadores y verificar difusión en /topic/room/{roomId}/lobby
  const lobbyPromise1 = stomp.waitForMessage(`/topic/room/${room.roomId}/lobby`);
  const join1Res = await fetch(`${BASE_URL}/api/rooms/${room.pin}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname: "camilo_dev" }),
  });
  const player1 = await join1Res.json();
  const lobbyUpdate1 = await lobbyPromise1;
  assert(join1Res.status === 200 && Array.isArray(lobbyUpdate1) && lobbyUpdate1.length === 1,
    "CP-02 & RF-03: Jugador 1 (camilo_dev) unido y transmitido en vivo por /topic/room/{roomId}/lobby");

  const lobbyPromise2 = stomp.waitForMessage(`/topic/room/${room.roomId}/lobby`);
  const join2Res = await fetch(`${BASE_URL}/api/rooms/${room.pin}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname: "laura_eng" }),
  });
  const player2 = await join2Res.json();
  const lobbyUpdate2 = await lobbyPromise2;
  assert(join2Res.status === 200 && lobbyUpdate2.length === 2,
    "CP-02: Jugador 2 (laura_eng) unido; lobby contiene 2 aprendices conectados");

  // 4b. Verificar ingreso y salida voluntaria de un 3er jugador en el lobby (DELETE /api/rooms/{roomId}/players/{playerId})
  const lobbyPromise3 = stomp.waitForMessage(`/topic/room/${room.roomId}/lobby`);
  const join3Res = await fetch(`${BASE_URL}/api/rooms/${room.pin}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname: "temp_aprendiz" }),
  });
  const player3 = await join3Res.json();
  const lobbyUpdate3 = await lobbyPromise3;
  assert(join3Res.status === 200 && lobbyUpdate3.length === 3,
    "Lobby: Jugador temporal (temp_aprendiz) se une a la sala de espera (3 aprendices)");

  const lobbyLeavePromise = stomp.waitForMessage(`/topic/room/${room.roomId}/lobby`);
  const leaveRes = await fetch(`${BASE_URL}/api/rooms/${room.roomId}/players/${player3.playerId}`, {
    method: "DELETE",
  });
  const leaveBody = await leaveRes.json();
  const lobbyAfterLeave = await lobbyLeavePromise;
  assert(
    leaveRes.status === 200 &&
      leaveBody.status === "LEFT" &&
      Array.isArray(lobbyAfterLeave) &&
      lobbyAfterLeave.length === 2,
    "Botón Salir del Lobby: DELETE /api/rooms/{roomId}/players/{playerId} retira al jugador y actualiza el lobby en vivo a 2 aprendices"
  );

  // 5. Anexo A.4: Reconexión GET /api/rooms/{pin}
  const getRoomRes = await fetch(`${BASE_URL}/api/rooms/${room.pin}`);
  const getRoomBody = await getRoomRes.json();
  assert(getRoomRes.status === 200 && getRoomBody.playerCount === 2 && getRoomBody.pin === room.pin,
    "Anexo A.4: GET /api/rooms/{pin} devuelve estado actual y playerCount = 2");

  // 6. CU-03 & RF-08: Iniciar partida y recibir Pregunta #1 (MULTIPLE_CHOICE)
  const q1Promise = stomp.waitForMessage(`/topic/room/${room.roomId}/question`);
  const startRes = await fetch(`${BASE_URL}/api/rooms/${room.roomId}/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shuffleQuestions: false }),
  });
  const q1 = await q1Promise;
  assert(
    startRes.status === 200 &&
      q1.order === 1 &&
      q1.type === "MULTIPLE_CHOICE" &&
      !Object.prototype.hasOwnProperty.call(q1, "correctAnswer"),
    "CU-03 & RF-08: Partida iniciada; Pregunta #1 (MULTIPLE_CHOICE) emitida sin exponer correctAnswer"
  );

  // 7. CP-04 & CP-10: Enviar respuesta de Jugador 1 (rápida) y Jugador 2 (más lenta)
  const nowIso = new Date(Date.now() - 1500).toISOString().replace(/\.\d{3}Z$/, "Z");
  const slowIso = new Date(Date.now() - 9000).toISOString().replace(/\.\d{3}Z$/, "Z");
  stomp.send(`/app/room/${room.roomId}/answer`, {
    playerId: player1.playerId,
    questionId: q1.questionId,
    value: "She studies English.",
    clientTimestamp: nowIso,
  });
  stomp.send(`/app/room/${room.roomId}/answer`, {
    playerId: player2.playerId,
    questionId: q1.questionId,
    value: "She studies English.",
    clientTimestamp: slowIso,
  });
  await new Promise((r) => setTimeout(r, 250));

  // 7b. Verificar persistencia de estado en vivo (GET /api/rooms/{pin}/state?playerId=...) y reconexión de jugador en juego
  const syncStateRes = await fetch(`${BASE_URL}/api/rooms/${room.pin}/state?playerId=${player1.playerId}`);
  const syncStateBody = await syncStateRes.json();
  assert(
    syncStateRes.status === 200 &&
      syncStateBody.status === "QUESTION_IN_PROGRESS" &&
      syncStateBody.currentQuestion?.questionId === q1.questionId &&
      syncStateBody.player?.playerId === player1.playerId &&
      syncStateBody.playerSubmittedAnswer === "She studies English.",
    "Persistencia Moderador/Aprendiz: GET /api/rooms/{pin}/state sincroniza estado en vivo, pregunta actual y respuesta ya enviada tras recargar el navegador"
  );

  const rejoinActiveRes = await fetch(`${BASE_URL}/api/rooms/${room.pin}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname: "camilo_dev" }),
  });
  const rejoinActivePlayer = await rejoinActiveRes.json();
  assert(
    rejoinActiveRes.status === 200 && rejoinActivePlayer.playerId === player1.playerId,
    "Persistencia Aprendiz: Reingreso con mismo PIN y nickname durante partida en curso recupera el mismo playerId sin duplicar ni rechazar"
  );

  // 8. Cerrar pregunta y verificar Top 5 + playerVerdicts en /topic/room/{roomId}/results (Tarea 10 Frontend / CP-10)
  const resultsPromise = stomp.waitForMessage(`/topic/room/${room.roomId}/results`);
  const closeQ1Res = await fetch(`${BASE_URL}/api/rooms/${room.roomId}/close-question`, { method: "POST" });
  const results1 = await resultsPromise;
  assert(
    closeQ1Res.status === 200 &&
      results1.correctAnswer === "She studies English." &&
      results1.playerVerdicts?.[player1.playerId]?.isCorrect === true &&
      results1.top5.length === 2 &&
      results1.top5[0].nickname === "camilo_dev" &&
      results1.top5[0].score > results1.top5[1].score,
    `CP-10 & RF-10: Leaderboard Top 5 y playerVerdicts recibidos (${results1.top5[0].nickname}: ${results1.top5[0].score} pts > ${results1.top5[1].nickname}: ${results1.top5[1].score} pts)`
  );

  // 9. CP-09: Activar Ruleta de Retroalimentación (Tarea 11 Frontend / RF-11)
  const roulettePromise = stomp.waitForMessage(`/topic/room/${room.roomId}/roulette`);
  const rouletteRes = await fetch(`${BASE_URL}/api/rooms/${room.roomId}/roulette`, { method: "POST" });
  const rouletteEvent = await roulettePromise;
  assert(
    rouletteRes.status === 200 &&
      ["camilo_dev", "laura_eng"].includes(rouletteEvent.nickname) &&
      rouletteEvent.isCorrect === true,
    `CP-09 & RF-11: Ruleta seleccionó a ${rouletteEvent.nickname} con respuesta '${rouletteEvent.value}'`
  );

  // 10. Avanzar a Pregunta #2 (MULTIPLE_CHOICE) y luego a Pregunta #3 (TEXT_INPUT - CP-06)
  const q2Promise = stomp.waitForMessage(`/topic/room/${room.roomId}/question`);
  await fetch(`${BASE_URL}/api/rooms/${room.roomId}/next`, { method: "POST" });
  const q2 = await q2Promise;
  assert(q2.order === 2, "CU-03: Moderador avanza a Pregunta #2");

  const q3Promise = stomp.waitForMessage(`/topic/room/${room.roomId}/question`);
  await fetch(`${BASE_URL}/api/rooms/${room.roomId}/next`, { method: "POST" });
  const q3 = await q3Promise;
  assert(q3.order === 3 && q3.type === "TEXT_INPUT", "CP-06: Moderador avanza a Pregunta #3 (TEXT_INPUT)");

  stomp.send(`/app/room/${room.roomId}/answer`, {
    playerId: player1.playerId,
    questionId: q3.questionId,
    value: "  STUDYS! ",
    clientTimestamp: new Date(Date.now() - 2000).toISOString().replace(/\.\d{3}Z$/, "Z"),
  });
  await new Promise((r) => setTimeout(r, 200));

  // 11. Avanzar a Pregunta #4 (WORD_BLOCKS - CP-05)
  const q4Promise = stomp.waitForMessage(`/topic/room/${room.roomId}/question`);
  await fetch(`${BASE_URL}/api/rooms/${room.roomId}/next`, { method: "POST" });
  const q4 = await q4Promise;
  assert(q4.order === 4 && q4.type === "WORD_BLOCKS", "CP-05: Moderador avanza a Pregunta #4 (WORD_BLOCKS)");

  stomp.send(`/app/room/${room.roomId}/answer`, {
    playerId: player1.playerId,
    questionId: q4.questionId,
    value: ["I", "am", "happy"],
    clientTimestamp: new Date(Date.now() - 2500).toISOString().replace(/\.\d{3}Z$/, "Z"),
  });
  await new Promise((r) => setTimeout(r, 200));

  // 12. Avanzar a Pregunta #5 (VOICE - CP-07) y validar equivalencia de contracción/apóstrofo curvo ("I’m ready to learn.")
  const q5Promise = stomp.waitForMessage(`/topic/room/${room.roomId}/question`);
  await fetch(`${BASE_URL}/api/rooms/${room.roomId}/next`, { method: "POST" });
  const q5 = await q5Promise;
  assert(q5.order === 5 && q5.type === "VOICE", "CP-07: Moderador avanza a Pregunta #5 (VOICE)");

  stomp.send(`/app/room/${room.roomId}/answer`, {
    playerId: player1.playerId,
    questionId: q5.questionId,
    value: "I’m ready to learn.",
    clientTimestamp: new Date(Date.now() - 3000).toISOString().replace(/\.\d{3}Z$/, "Z"),
  });
  await new Promise((r) => setTimeout(r, 250));

  // 13. CP-11: Finalizar partida y verificar Podio Top 3 en /topic/room/{roomId}/podium (Tarea 12 Frontend)
  const podiumPromise = stomp.waitForMessage(`/topic/room/${room.roomId}/podium`);
  const finishRes = await fetch(`${BASE_URL}/api/rooms/${room.roomId}/finish`, { method: "POST" });
  const podiumEvent = await podiumPromise;
  assert(
    finishRes.status === 200 &&
      podiumEvent.status === "FINISHED" &&
      Array.isArray(podiumEvent.top3) &&
      podiumEvent.top3[0].nickname === "camilo_dev" &&
      podiumEvent.top3[0].score > 3000,
    `CP-11 & CU-06: Podio Final Top 3 emitido en /topic/room/{roomId}/podium (1.° lugar: ${podiumEvent.top3[0].nickname} con ${podiumEvent.top3[0].score} pts)`
  );

  // 14. CP-12: Verificar ajuste de tiempos del moderador y rotación aleatoria de mecánicas entre salas
  const roomARes = await fetch(`${BASE_URL}/api/rooms`, { method: "POST" });
  const roomA = await roomARes.json();
  await fetch(`${BASE_URL}/api/rooms/${roomA.pin}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname: "player_room_a" }),
  });
  await fetch(`${BASE_URL}/api/rooms/${roomA.roomId}/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      multipleChoiceTimeSeconds: 32,
      textInputTimeSeconds: 36,
      wordBlocksTimeSeconds: 38,
      voiceTimeSeconds: 42,
      introDurationSeconds: 4,
      shuffleQuestions: true,
    }),
  });
  stomp.subscribe("sub-q-roomA", `/topic/room/${roomA.roomId}/question`);
  await new Promise((r) => setTimeout(r, 100));
  const roomAQ1Promise = stomp.waitForMessage(`/topic/room/${roomA.roomId}/question`);
  await fetch(`${BASE_URL}/api/rooms/${roomA.roomId}/start`, { method: "POST" });
  const roomAQ1 = await roomAQ1Promise;

  const roomBRes = await fetch(`${BASE_URL}/api/rooms`, { method: "POST" });
  const roomB = await roomBRes.json();
  await fetch(`${BASE_URL}/api/rooms/${roomB.pin}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname: "player_room_b" }),
  });
  stomp.subscribe("sub-q-roomB", `/topic/room/${roomB.roomId}/question`);
  await new Promise((r) => setTimeout(r, 100));
  const roomBQ1Promise = stomp.waitForMessage(`/topic/room/${roomB.roomId}/question`);
  await fetch(`${BASE_URL}/api/rooms/${roomB.roomId}/start`, { method: "POST" });
  const roomBQ1 = await roomBQ1Promise;

  assert(
    roomAQ1.introDurationSeconds === 4 &&
      [32, 36, 38, 42].includes(roomAQ1.timeLimitSeconds) &&
      roomAQ1.type !== roomBQ1.type,
    `CP-12: Parámetros de tiempo personalizados aplicados (${roomAQ1.timeLimitSeconds}s, intro ${roomAQ1.introDurationSeconds}s) y mecánicas iniciales aleatorias distintas entre salas (${roomAQ1.type} vs ${roomBQ1.type})`
  );

  stomp.close();
  console.log(`\n🎉 Suite E2E completada con éxito: ${passed} pruebas aprobadas, ${failed} fallidas.\n`);
}

runSuite().catch((err) => {
  console.error("\n💥 Error ejecutando la suite E2E:", err.message);
  process.exit(1);
});
