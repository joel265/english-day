/**
 * moderator.js - Panel de Moderador y Pantalla Gigante de Proyección (Tarea 14 Frontend)
 * Cumple con el Contrato de Integración API REST y WebSockets (§3 y §4) y Bitácora #6:
 * - Crear Sala (POST /api/rooms)
 * - Iniciar Partida (POST /api/rooms/{roomId}/start)
 * - Cerrar Pregunta y Emitir Top 5 (POST /api/rooms/{roomId}/close-question o STOMP /app/room/{roomId}/results)
 * - Siguiente Pregunta (POST /api/rooms/{roomId}/next o STOMP /app/room/{roomId}/moderator/next)
 * - Activar Ruleta (POST /api/rooms/{roomId}/roulette o STOMP /app/room/{roomId}/moderator/roulette)
 * - Finalizar Juego y Podio Top 3 (POST /api/rooms/{roomId}/finish)
 */

const btnCreateRoom = document.querySelector("#btnCreateRoom");
const btnStartGame = document.querySelector("#btnStartGame");
const btnCloseQuestion = document.querySelector("#btnCloseQuestion");
const btnActivateRoulette = document.querySelector("#btnActivateRoulette");
const btnNextQuestion = document.querySelector("#btnNextQuestion");
const btnFinishGame = document.querySelector("#btnFinishGame");
const btnReconnectPin = document.querySelector("#btnReconnectPin");
const reconnectPinInput = document.querySelector("#reconnectPinInput");

const modRoomStatus = document.querySelector("#modRoomStatus");
const modPinValue = document.querySelector("#modPinValue");
const modJoinUrl = document.querySelector("#modJoinUrl");
const modFeedback = document.querySelector("#modFeedback");

const stagePhaseBadge = document.querySelector("#stagePhaseBadge");
const stageTimerBox = document.querySelector("#stageTimerBox");
const stageTimerValue = document.querySelector("#stageTimerValue");
const stageWelcomeView = document.querySelector("#stageWelcomeView");
const stageMainHeading = document.querySelector("#stageMainHeading");
const stageQuestionView = document.querySelector("#stageQuestionView");
const stageQuestionPrompt = document.querySelector("#stageQuestionPrompt");
const stageQuestionOptions = document.querySelector("#stageQuestionOptions");
const stageRouletteView = document.querySelector("#stageRouletteView");
const modRouletteWinner = document.querySelector("#modRouletteWinner");
const modRouletteAnswer = document.querySelector("#modRouletteAnswer");
const modRouletteVerdict = document.querySelector("#modRouletteVerdict");

const modLobbyCount = document.querySelector("#modLobbyCount");
const modLobbyList = document.querySelector("#modLobbyList");
const modRankingTitle = document.querySelector("#modRankingTitle");
const modCorrectAnswerBanner = document.querySelector("#modCorrectAnswerBanner");
const modCorrectAnswerText = document.querySelector("#modCorrectAnswerText");
const modRankingList = document.querySelector("#modRankingList");

let currentRoom = null;
let modSocket = null;
let modTimerInterval = null;
let connectedPlayers = [];
let rouletteWheel = null;

document.addEventListener("DOMContentLoaded", () => {
  if (window.ActiveFeedbackRoulette) {
    rouletteWheel = new window.ActiveFeedbackRoulette("rouletteCanvas");
  }
});

function setFeedback(message, state = "ok") {
  modFeedback.textContent = message;
  modFeedback.dataset.state = state;
}

function updateRoomStatusBadge(status) {
  modRoomStatus.dataset.status = status || "NONE";
  const labels = {
    WAITING_LOBBY: "WAITING_LOBBY · En espera",
    QUESTION_IN_PROGRESS: "QUESTION_IN_PROGRESS · Pregunta activa",
    ROULETTE_TIME: "ROULETTE_TIME · Ruleta activa",
    FINISHED: "FINISHED · Partida finalizada",
  };
  modRoomStatus.textContent = labels[status] || status || "Sin sala activa";

  const hasRoom = Boolean(currentRoom?.roomId);
  btnStartGame.disabled = !hasRoom || status !== "WAITING_LOBBY";
  btnCloseQuestion.disabled = !hasRoom || status === "WAITING_LOBBY" || status === "FINISHED";
  btnActivateRoulette.disabled = !hasRoom || status === "WAITING_LOBBY" || status === "FINISHED";
  btnNextQuestion.disabled = !hasRoom || status === "WAITING_LOBBY" || status === "FINISHED";
  btnFinishGame.disabled = !hasRoom || status === "FINISHED";
}

function showStageSection(activeSection) {
  [stageWelcomeView, stageQuestionView, stageRouletteView].forEach((sec) => {
    if (sec) sec.hidden = sec !== activeSection;
  });
}

function renderLobbyPlayers(players) {
  connectedPlayers = Array.isArray(players) ? players : [];
  modLobbyCount.textContent = String(connectedPlayers.length);
  modLobbyList.replaceChildren();

  if (connectedPlayers.length === 0) {
    const empty = document.createElement("li");
    empty.className = "player-chip";
    empty.textContent = "Esperando a que los aprendices ingresen con el PIN...";
    modLobbyList.append(empty);
    return;
  }

  connectedPlayers.forEach((p) => {
    const chip = document.createElement("li");
    chip.className = "player-chip";
    chip.textContent = p.nickname;
    modLobbyList.append(chip);
  });

  if (rouletteWheel) {
    rouletteWheel.setPlayers(connectedPlayers.map((p) => ({ name: p.nickname })));
  }
}

function renderProjectorQuestion(question) {
  window.clearInterval(modTimerInterval);
  updateRoomStatusBadge("QUESTION_IN_PROGRESS");

  const typeLabels = {
    MULTIPLE_CHOICE: "Selección Múltiple (RF-04)",
    WORD_BLOCKS: "Word Blocks · Ordenar Oración (RF-05)",
    TEXT_INPUT: "Text Input · Escritura (RF-06)",
    VOICE: "Voice Challenge · Pronunciación (RF-07)",
  };

  stagePhaseBadge.textContent = `Pregunta ${question.order} · ${typeLabels[question.type] || question.type}`;
  stageQuestionPrompt.textContent = question.prompt;
  stageQuestionOptions.replaceChildren();

  if (Array.isArray(question.options) && question.options.length > 0) {
    question.options.forEach((opt, idx) => {
      const li = document.createElement("li");
      li.className = `projector-option opt-${idx % 4}`;
      const prefix = question.type === "MULTIPLE_CHOICE"
        ? `${String.fromCharCode(65 + idx)}. `
        : `Bloque ${idx + 1}: `;
      li.textContent = `${prefix}${opt}`;
      stageQuestionOptions.append(li);
    });
  } else {
    const li = document.createElement("li");
    li.className = "projector-option opt-1";
    li.style.gridColumn = "1 / -1";
    li.textContent = question.type === "VOICE"
      ? "🎤 Los aprendices están pronunciando la frase desde el micrófono de su móvil."
      : "⌨️ Los aprendices están escribiendo la respuesta en su móvil.";
    stageQuestionOptions.append(li);
  }

  showStageSection(stageQuestionView);

  const deadline = Date.now() + (question.timeLimitSeconds || 15) * 1000;
  stageTimerBox.classList.remove("is-expired");

  const tick = () => {
    const secondsLeft = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    const mins = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    stageTimerValue.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    if (secondsLeft === 0) {
      window.clearInterval(modTimerInterval);
      stageTimerBox.classList.add("is-expired");
      setFeedback("Tiempo agotado. Publicando respuesta correcta y Top 5 automáticamente...", "ok");
      if (currentRoom?.roomId && question?.questionId) {
        fetch(`/api/rooms/${encodeURIComponent(currentRoom.roomId)}/close-question`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId: question.questionId }),
        }).catch(() => {});
      }
    }
  };
  tick();
  modTimerInterval = window.setInterval(tick, 1000);
}

function renderProjectorResults(payload) {
  window.clearInterval(modTimerInterval);
  modRankingTitle.textContent = "Clasificación Parcial Top 5 (RF-10)";
  if (payload.correctAnswer) {
    modCorrectAnswerBanner.hidden = false;
    modCorrectAnswerText.textContent = payload.correctAnswer;
  }

  modRankingList.replaceChildren();
  const top5 = Array.isArray(payload.top5) ? payload.top5 : [];
  if (top5.length === 0) {
    const empty = document.createElement("li");
    empty.className = "ranking-row";
    empty.textContent = "Sin respuestas registradas aún.";
    modRankingList.append(empty);
    return;
  }

  top5.forEach((entry, idx) => {
    const li = document.createElement("li");
    li.className = `ranking-row rank-${idx + 1}`;
    const left = document.createElement("span");
    left.textContent = `#${idx + 1} · ${entry.nickname}`;
    const right = document.createElement("strong");
    right.textContent = `${entry.score ?? 0} pts`;
    li.append(left, right);
    modRankingList.append(li);
  });
}

function renderProjectorRoulette(payload) {
  window.clearInterval(modTimerInterval);
  updateRoomStatusBadge("ROULETTE_TIME");
  stagePhaseBadge.textContent = "Ruleta de Retroalimentación en Vivo (RF-11)";
  showStageSection(stageRouletteView);

  if (rouletteWheel) {
    modRouletteWinner.textContent = "🎡 Girando la ruleta...";
    modRouletteAnswer.textContent = "Sorteando entre los participantes...";
    modRouletteVerdict.textContent = "";

    const wheelPlayers = connectedPlayers.length > 0
      ? connectedPlayers.map((p) => ({ name: p.nickname }))
      : [];
    if (!wheelPlayers.some((p) => p.name.toLowerCase() === payload.nickname.toLowerCase())) {
      wheelPlayers.push({ name: payload.nickname });
    }
    rouletteWheel.resize(340);
    rouletteWheel.setPlayers(wheelPlayers);
    rouletteWheel.spin(() => {
      modRouletteWinner.textContent = `🎯 ${payload.nickname}`;
      modRouletteAnswer.textContent = payload.value ? `"${payload.value}"` : "Sin respuesta enviada";
      modRouletteVerdict.textContent = payload.isCorrect
        ? "✔ Respuesta correcta"
        : "✖ Oportunidad de retroalimentación pedagógica";
    }, payload.nickname);
  } else {
    modRouletteWinner.textContent = payload.nickname;
    modRouletteAnswer.textContent = payload.value ? `"${payload.value}"` : "Sin respuesta enviada";
    modRouletteVerdict.textContent = payload.isCorrect
      ? "✔ Respuesta correcta"
      : "✖ Oportunidad de retroalimentación pedagógica";
  }
}

function renderProjectorPodium(payload) {
  window.clearInterval(modTimerInterval);
  updateRoomStatusBadge("FINISHED");
  stagePhaseBadge.textContent = "🏆 Podio Final Top 3 (CU-06 / RF-10)";

  const top3 = payload?.top3 || payload?.podium || [];
  modRankingTitle.textContent = `Podio Final Top 3 (${payload.totalPlayers ?? top3.length} participantes)`;
  modRankingList.replaceChildren();

  const medals = ["🥇 1.°", "🥈 2.°", "🥉 3.°"];
  if (top3.length === 0) {
    const empty = document.createElement("li");
    empty.className = "ranking-row";
    empty.textContent = "Partida finalizada sin puntajes.";
    modRankingList.append(empty);
  } else {
    top3.forEach((entry, idx) => {
      const li = document.createElement("li");
      li.className = `ranking-row rank-${idx + 1}`;
      const left = document.createElement("span");
      left.textContent = `${medals[idx] || `#${idx + 1}`} ${entry.nickname}`;
      const right = document.createElement("strong");
      right.textContent = `${entry.score ?? 0} pts`;
      li.append(left, right);
      modRankingList.append(li);
    });
  }

  showStageSection(stageWelcomeView);
  stageMainHeading.textContent = top3.length > 0
    ? `🏆 ¡Ganador: ${top3[0].nickname} (${top3[0].score} pts)!`
    : "🏆 ¡Partida Finalizada!";

  if (window.confetti) {
    window.confetti.continuousPodiumBurst(3500);
  }
}

function parseStompFrame(frame) {
  const separator = frame.indexOf("\n\n");
  if (separator === -1) return null;
  const lines = frame.slice(0, separator).split("\n");
  const headers = new Map();
  lines.slice(1).forEach((line) => {
    const colon = line.indexOf(":");
    if (colon !== -1) headers.set(line.slice(0, colon), line.slice(colon + 1));
  });
  return {
    command: lines[0].trim(),
    headers,
    body: frame.slice(separator + 2),
  };
}

function connectModeratorWebSocket(roomId) {
  if (modSocket && modSocket.readyState === WebSocket.OPEN) {
    modSocket.close();
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws-englishday`;
  modSocket = new WebSocket(wsUrl);

  let buffer = "";
  modSocket.addEventListener("open", () => {
    modSocket.send(`CONNECT\naccept-version:1.2,1.1,1.0\nhost:${window.location.host}\nheart-beat:0,0\n\n\0`);
  });

  modSocket.addEventListener("message", (event) => {
    buffer += event.data;
    let idx = buffer.indexOf("\0");
    while (idx !== -1) {
      const rawFrame = buffer.slice(0, idx).replace(/^\n+/, "");
      buffer = buffer.slice(idx + 1);
      if (rawFrame) {
        const parsed = parseStompFrame(rawFrame);
        if (parsed?.command === "CONNECTED") {
          ["lobby", "status", "question", "results", "roulette", "podium"].forEach((topic) => {
            modSocket.send(
              `SUBSCRIBE\nid:mod-${topic}-${roomId}\ndestination:/topic/room/${roomId}/${topic}\nack:auto\n\n\0`
            );
          });
          setFeedback("Canal WebSocket STOMP del moderador conectado en tiempo real.", "ok");
        } else if (parsed?.command === "MESSAGE") {
          try {
            const payload = JSON.parse(parsed.body);
            const dest = parsed.headers.get("destination");
            if (dest === `/topic/room/${roomId}/lobby`) {
              const list = Array.isArray(payload) ? payload : payload?.players || [];
              renderLobbyPlayers(list);
            } else if (dest === `/topic/room/${roomId}/status`) {
              if (payload?.status) updateRoomStatusBadge(payload.status);
            } else if (dest === `/topic/room/${roomId}/question`) {
              renderProjectorQuestion(payload);
            } else if (dest === `/topic/room/${roomId}/results`) {
              renderProjectorResults(payload);
            } else if (dest === `/topic/room/${roomId}/roulette`) {
              renderProjectorRoulette(payload);
            } else if (dest === `/topic/room/${roomId}/podium`) {
              renderProjectorPodium(payload);
            }
          } catch (err) {
            setFeedback(`Error procesando evento en vivo: ${err.message}`, "error");
          }
        }
      }
      idx = buffer.indexOf("\0");
    }
  });
}

function attachRoomSession(roomData) {
  currentRoom = roomData;
  modPinValue.textContent = roomData.pin;
  const playerJoinLink = `${window.location.origin}/index.html?pin=${roomData.pin}`;
  modJoinUrl.textContent = `Enlace aprendices: ${playerJoinLink}`;
  updateRoomStatusBadge(roomData.status);
  stagePhaseBadge.textContent = `Sala activa · PIN ${roomData.pin}`;
  stageMainHeading.textContent = `Únete en tu móvil con el PIN ${roomData.pin}`;
  showStageSection(stageWelcomeView);
  connectModeratorWebSocket(roomData.roomId);
}

btnCreateRoom.addEventListener("click", async () => {
  btnCreateRoom.disabled = true;
  setFeedback("Creando nueva sala...", "ok");
  try {
    const response = await fetch("/api/rooms", { method: "POST" });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `Error HTTP ${response.status}`);
    }
    renderLobbyPlayers([]);
    attachRoomSession(data);
    setFeedback(`Sala creada con éxito. PIN: ${data.pin}`, "ok");
  } catch (error) {
    setFeedback(error.message, "error");
  } finally {
    btnCreateRoom.disabled = false;
  }
});

btnReconnectPin.addEventListener("click", async () => {
  const pin = reconnectPinInput.value.trim();
  if (!/^\d{6}$/.test(pin)) {
    setFeedback("Ingresa un PIN válido de 6 dígitos para reconectar.", "error");
    return;
  }
  try {
    const response = await fetch(`/api/rooms/${encodeURIComponent(pin)}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `No se encontró la sala (${response.status})`);
    }
    attachRoomSession(data);
    setFeedback(`Reconectado a la sala ${data.pin} (${data.playerCount ?? 0} aprendices).`, "ok");
  } catch (error) {
    setFeedback(error.message, "error");
  }
});

btnStartGame.addEventListener("click", async () => {
  if (!currentRoom?.roomId) return;
  btnStartGame.disabled = true;
  try {
    const response = await fetch(`/api/rooms/${encodeURIComponent(currentRoom.roomId)}/start`, {
      method: "POST",
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `No se pudo iniciar (${response.status})`);
    }
    currentRoom = data;
    updateRoomStatusBadge(data.status);
    setFeedback("Partida iniciada y primera pregunta difundida.", "ok");
  } catch (error) {
    setFeedback(error.message, "error");
    btnStartGame.disabled = false;
  }
});

btnCloseQuestion.addEventListener("click", async () => {
  if (!currentRoom?.roomId) return;
  try {
    const response = await fetch(`/api/rooms/${encodeURIComponent(currentRoom.roomId)}/close-question`, {
      method: "POST",
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `Error al cerrar pregunta (${response.status})`);
    }
    renderProjectorResults(data);
    setFeedback("Leaderboard Top 5 difundido a todos los aprendices.", "ok");
  } catch (error) {
    setFeedback(error.message, "error");
  }
});

btnActivateRoulette.addEventListener("click", async () => {
  if (!currentRoom?.roomId) return;
  try {
    const response = await fetch(`/api/rooms/${encodeURIComponent(currentRoom.roomId)}/roulette`, {
      method: "POST",
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `Error al activar la ruleta (${response.status})`);
    }
    renderProjectorRoulette(data);
    setFeedback(`Ruleta ejecutada: seleccionado ${data.nickname}.`, "ok");
  } catch (error) {
    setFeedback(error.message, "error");
  }
});

btnNextQuestion.addEventListener("click", async () => {
  if (!currentRoom?.roomId) return;
  try {
    const response = await fetch(`/api/rooms/${encodeURIComponent(currentRoom.roomId)}/next`, {
      method: "POST",
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `No se pudo avanzar (${response.status})`);
    }
    currentRoom = data;
    updateRoomStatusBadge(data.status);
    setFeedback(`Avanzando a la pregunta #${data.currentQuestionIndex}.`, "ok");
  } catch (error) {
    setFeedback(error.message, "error");
  }
});

btnFinishGame.addEventListener("click", async () => {
  if (!currentRoom?.roomId) return;
  try {
    const response = await fetch(`/api/rooms/${encodeURIComponent(currentRoom.roomId)}/finish`, {
      method: "POST",
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `Error al finalizar la partida (${response.status})`);
    }
    renderProjectorPodium(data);
    setFeedback("Partida finalizada. Podio Top 3 emitido.", "ok");
  } catch (error) {
    setFeedback(error.message, "error");
  }
});
