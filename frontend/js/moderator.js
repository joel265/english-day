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
let lastQuestionReached = false;
const btnFinishGame = document.querySelector("#btnFinishGame");
const btnReconnectPin = document.querySelector("#btnReconnectPin");
const reconnectPinInput = document.querySelector("#reconnectPinInput");

const cfgTimeMultipleChoice = document.querySelector("#cfgTimeMultipleChoice");
const cfgTimeTextInput = document.querySelector("#cfgTimeTextInput");
const cfgTimeWordBlocks = document.querySelector("#cfgTimeWordBlocks");
const cfgTimeVoice = document.querySelector("#cfgTimeVoice");
const cfgTimeIntro = document.querySelector("#cfgTimeIntro");
const cfgRandomOrder = document.querySelector("#cfgRandomOrder");
const cfgQuestionCount = document.querySelector("#cfgQuestionCount");
const btnSaveRoomSettings = document.querySelector("#btnSaveRoomSettings");

const modRoomStatus = document.querySelector("#modRoomStatus");
const navPlayerViewLink = document.querySelector("#navPlayerViewLink");
const modPinValue = document.querySelector("#modPinValue");
const modJoinUrl = document.querySelector("#modJoinUrl");
const modQrBox = document.querySelector("#modQrBox");
const modQrCanvas = document.querySelector("#modQrCanvas");
const btnCopyJoinUrl = document.querySelector("#btnCopyJoinUrl");
const modFeedback = document.querySelector("#modFeedback");

const stagePhaseBadge = document.querySelector("#stagePhaseBadge");
const stageTimerBox = document.querySelector("#stageTimerBox");
const stageTimerValue = document.querySelector("#stageTimerValue");
const stageWelcomeView = document.querySelector("#stageWelcomeView");
const stageMainHeading = document.querySelector("#stageMainHeading");
const stageWelcomeSubtext = document.querySelector("#stageWelcomeSubtext");
const stageQrBox = document.querySelector("#stageQrBox");
const stageQrCanvas = document.querySelector("#stageQrCanvas");
const stageQrUrl = document.querySelector("#stageQrUrl");
const stageQrPinPill = document.querySelector("#stageQrPinPill");

const stageTransitionView = document.querySelector("#stageTransitionView");
const stageTransitionBadge = document.querySelector("#stageTransitionBadge");
const stageTransitionCountdown = document.querySelector("#stageTransitionCountdown");
const stageTransitionProgress = document.querySelector("#stageTransitionProgress");
const stageTransitionNumber = document.querySelector("#stageTransitionNumber");
const stageTransitionHeading = document.querySelector("#stageTransitionHeading");
const stageTransitionSubtext = document.querySelector("#stageTransitionSubtext");
const stageTransitionThemePill = document.querySelector("#stageTransitionThemePill");
const stageTransitionTimePill = document.querySelector("#stageTransitionTimePill");
const stageTransitionMechanicTitle = document.querySelector("#stageTransitionMechanicTitle");
const stageTransitionMechanicDesc = document.querySelector("#stageTransitionMechanicDesc");

const stageQuestionView = document.querySelector("#stageQuestionView");
const stageQuestionProgress = document.querySelector("#stageQuestionProgress");
const stageQuestionThemeTag = document.querySelector("#stageQuestionThemeTag");
const stageQuestionPointsTag = document.querySelector("#stageQuestionPointsTag");
const stageQuestionMechanicGuide = document.querySelector("#stageQuestionMechanicGuide");
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

const MODERATOR_STORAGE_KEY = "englishDayModeratorSession";

let currentRoom = null;
let modSocket = null;
let modTimerInterval = null;
let modIntroTimeout = null;
let connectedPlayers = [];
let rouletteWheel = null;

if (navPlayerViewLink) {
  navPlayerViewLink.addEventListener("click", (event) => {
    if (navPlayerViewLink.getAttribute("aria-disabled") === "true") {
      event.preventDefault();
    }
  });
}

function saveModeratorSession(roomData) {
  if (!roomData?.pin || !roomData?.roomId) return;
  const payload = JSON.stringify({
    roomId: roomData.roomId,
    pin: roomData.pin,
  });
  try {
    window.localStorage.setItem(MODERATOR_STORAGE_KEY, payload);
    window.sessionStorage.setItem(MODERATOR_STORAGE_KEY, payload);
  } catch {
    // Ignorar errores de almacenamiento privado
  }
}

function clearModeratorSession() {
  try {
    window.localStorage.removeItem(MODERATOR_STORAGE_KEY);
    window.sessionStorage.removeItem(MODERATOR_STORAGE_KEY);
  } catch {
    // Ignorar
  }
}

function readSavedModeratorSession() {
  try {
    const raw =
      window.localStorage.getItem(MODERATOR_STORAGE_KEY) ||
      window.sessionStorage.getItem(MODERATOR_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (window.ActiveFeedbackRoulette) {
    rouletteWheel = new window.ActiveFeedbackRoulette("rouletteCanvas");
  }
  const saved = readSavedModeratorSession();
  if (saved?.pin && /^\d{6}$/.test(saved.pin)) {
    if (reconnectPinInput) reconnectPinInput.value = saved.pin;
    restoreModeratorStateFromServer(saved.pin, true).catch(() => {});
  }
});

function clampInt(val, min, max, fallback) {
  const parsed = Number.parseInt(val, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function readModeratorSettingsFromForm() {
  return {
    multipleChoiceTimeSeconds: clampInt(cfgTimeMultipleChoice?.value, 5, 180, 15),
    textInputTimeSeconds: clampInt(cfgTimeTextInput?.value, 5, 180, 20),
    wordBlocksTimeSeconds: clampInt(cfgTimeWordBlocks?.value, 5, 180, 20),
    voiceTimeSeconds: clampInt(cfgTimeVoice?.value, 5, 180, 25),
    introDurationSeconds: clampInt(cfgTimeIntro?.value, 0, 15, 3),
    shuffleQuestions: cfgRandomOrder ? cfgRandomOrder.value !== "false" : true,
    questionCount: clampInt(cfgQuestionCount?.value, 1, 100, 10),
  };
}

function applySettingsToForm(settings) {
  if (!settings) return;
  if (cfgTimeMultipleChoice && settings.multipleChoiceTimeSeconds != null) {
    cfgTimeMultipleChoice.value = String(settings.multipleChoiceTimeSeconds);
  }
  if (cfgTimeTextInput && settings.textInputTimeSeconds != null) {
    cfgTimeTextInput.value = String(settings.textInputTimeSeconds);
  }
  if (cfgTimeWordBlocks && settings.wordBlocksTimeSeconds != null) {
    cfgTimeWordBlocks.value = String(settings.wordBlocksTimeSeconds);
  }
  if (cfgTimeVoice && settings.voiceTimeSeconds != null) {
    cfgTimeVoice.value = String(settings.voiceTimeSeconds);
  }
  if (cfgTimeIntro && settings.introDurationSeconds != null) {
    cfgTimeIntro.value = String(settings.introDurationSeconds);
  }
  if (cfgQuestionCount && settings.questionCount != null) {
    cfgQuestionCount.value = String(settings.questionCount);
  }
  if (cfgRandomOrder && settings.shuffleQuestions != null) {
    cfgRandomOrder.value = String(Boolean(settings.shuffleQuestions));
  }
}

function setFeedback(message, state = "ok") {
  modFeedback.textContent = message;
  modFeedback.dataset.state = state;
}

function updateRoomStatusBadge(status) {
  const effectiveStatus = status || currentRoom?.status || "NONE";
  if (currentRoom && status) {
    currentRoom.status = status;
  }
  modRoomStatus.dataset.status = effectiveStatus;
  const labels = {
    WAITING_LOBBY: "WAITING_LOBBY · En espera",
    QUESTION_IN_PROGRESS: "QUESTION_IN_PROGRESS · Pregunta activa",
    ROULETTE_TIME: "ROULETTE_TIME · Ruleta activa",
    FINISHED: "FINISHED · Partida finalizada",
  };
  modRoomStatus.textContent = labels[effectiveStatus] || effectiveStatus || "Sin sala activa";

  const hasRoom = Boolean(currentRoom?.roomId);
  const hasPlayers = connectedPlayers.length > 0;
  const isRoomActive = hasRoom && effectiveStatus !== "FINISHED";
  btnCreateRoom.disabled = isRoomActive;
  btnStartGame.disabled = !hasRoom || effectiveStatus !== "WAITING_LOBBY" || !hasPlayers;
  btnStartGame.title =
    hasRoom && effectiveStatus === "WAITING_LOBBY" && !hasPlayers
      ? "Se requiere al menos 1 aprendiz conectado en el lobby para iniciar la partida"
      : "";
  btnCloseQuestion.disabled = !hasRoom || effectiveStatus === "WAITING_LOBBY" || effectiveStatus === "FINISHED";
  btnActivateRoulette.disabled = !hasRoom || effectiveStatus === "WAITING_LOBBY" || effectiveStatus === "FINISHED";
  btnNextQuestion.disabled = !hasRoom || effectiveStatus === "WAITING_LOBBY" || effectiveStatus === "FINISHED" || lastQuestionReached;
  btnFinishGame.disabled = !hasRoom || effectiveStatus === "FINISHED";

  if (navPlayerViewLink) {
    if (isRoomActive) {
      navPlayerViewLink.setAttribute("aria-disabled", "true");
      navPlayerViewLink.classList.add("is-disabled");
      navPlayerViewLink.tabIndex = -1;
      navPlayerViewLink.title = "Deshabilitado mientras hay una partida o sala activa";
    } else {
      navPlayerViewLink.removeAttribute("aria-disabled");
      navPlayerViewLink.classList.remove("is-disabled");
      navPlayerViewLink.tabIndex = 0;
      navPlayerViewLink.title = "";
    }
  }
}

function showStageSection(activeSection) {
  [stageWelcomeView, stageTransitionView, stageQuestionView, stageRouletteView].forEach((sec) => {
    if (!sec) return;
    if (sec === activeSection) {
      sec.hidden = false;
      sec.classList.remove("card-enter");
      void sec.offsetWidth;
      sec.classList.add("card-enter");
    } else {
      sec.hidden = true;
      sec.classList.remove("card-enter");
    }
  });
}

function getQuestionThematicMetadata(question) {
  const rawPrompt = String(question.prompt || "").trim();
  const bracketMatch = rawPrompt.match(/^\[([^\]]+)\]\s*(.*)$/);
  const cleanPrompt = bracketMatch && bracketMatch[2] ? bracketMatch[2].trim() : rawPrompt;
  const promptLower = rawPrompt.toLowerCase();
  let themeLabel = bracketMatch ? bracketMatch[1].trim() : "Simple Present · Affirmative";

  if (!bracketMatch) {
    if (promptLower.includes("pronoun")) {
      themeLabel = "Pronouns";
    } else if (promptLower.includes("possessive")) {
      themeLabel = "Possessive Adjectives";
    } else if (promptLower.includes("verb to be") || /\b(am|is|are)\b/.test(promptLower)) {
      themeLabel = "Verb To Be";
    } else if (promptLower.includes("right now") || promptLower.includes("present continuous") || promptLower.includes("-ing")) {
      themeLabel = "Present Continuous (Affirmative, Negative, Interrogative)";
    } else if (/^\s*(what|where|when|who|why|how)\b/i.test(cleanPrompt) || promptLower.includes("wh question")) {
      themeLabel = "WH Question";
    } else {
      themeLabel = "Simple Present (Affirmative, Negative, Interrogative)";
    }
  }

  const mechanicsByType = {
    MULTIPLE_CHOICE: {
      badge: "Selección múltiple (RF-04)",
      title: "🎯 Mecánica: Selección Múltiple (4 Opciones)",
      desc: "Los aprendices leen el enunciado y tocan una de las 4 tarjetas (A, B, C o D) en su móvil.",
      shortGuide: "💡 Dinámica en curso: Analiza la temática gramatical y selecciona la tarjeta correcta (A, B, C o D).",
    },
    WORD_BLOCKS: {
      badge: "Word Blocks · Ordenar Oración (RF-05)",
      title: "🧩 Mecánica: Construcción con Bloques (Word Blocks)",
      desc: "Los aprendices ordenan las palabras del banco para armar la oración (se aceptan cláusulas parciales con sentido gramatical).",
      shortGuide: "💡 Dinámica en curso: Ordena los bloques (Sujeto + Verbo + Complemento); se valida la oración completa o parcial con sentido.",
    },
    TEXT_INPUT: {
      badge: "Text Input · Escritura (RF-06)",
      title: "✍️ Mecánica: Completar Texto en Inglés (Text Input)",
      desc: "Los aprendices escriben la palabra o forma verbal que completa la oración (con margen de tolerancia ortográfica).",
      shortGuide: "💡 Dinámica en curso: Escribe la palabra o verbo faltante en inglés (incluye tolerancia ante errores leves de escritura).",
    },
    VOICE: {
      badge: "Voice Challenge · Pronunciación (RF-07)",
      title: "🎙️ Mecánica: Pronunciación por Voz (Speaking en-US)",
      desc: "Los aprendices activan el micrófono de su móvil y pronuncian la frase en inglés (con tolerancia fonética).",
      shortGuide: "💡 Dinámica en curso: Toca el micrófono 🎙️ en tu móvil, pronuncia la oración en inglés y envíala.",
    },
  };

  return {
    themeLabel,
    cleanPrompt,
    ...(mechanicsByType[question.type] || mechanicsByType.MULTIPLE_CHOICE),
  };
}

function renderLobbyPlayers(players) {
  connectedPlayers = Array.isArray(players) ? players : [];
  modLobbyCount.textContent = String(connectedPlayers.length);
  modLobbyList.replaceChildren();

  if (currentRoom?.status) {
    updateRoomStatusBadge(currentRoom.status);
  }

  if (connectedPlayers.length === 0) {
    const empty = document.createElement("li");
    empty.className = "player-chip";
    empty.textContent = "Esperando a que los aprendices ingresen con el PIN...";
    modLobbyList.append(empty);
    return;
  }

  connectedPlayers.forEach((p, idx) => {
    const chip = document.createElement("li");
    chip.className = "player-chip stagger-item";
    chip.style.animationDelay = `${idx * 45}ms`;
    chip.textContent = p.nickname;
    modLobbyList.append(chip);
  });

  if (rouletteWheel) {
    rouletteWheel.setPlayers(connectedPlayers.map((p) => ({ name: p.nickname })));
  }
}

function renderProjectorQuestion(question, customRemainingSeconds = null) {
  window.clearInterval(modTimerInterval);
  window.clearTimeout(modIntroTimeout);
  updateRoomStatusBadge("QUESTION_IN_PROGRESS");

  const thematicMeta = getQuestionThematicMetadata(question);
  const questionSecondsTotal = question.timeLimitSeconds || 15;

  const totalLabel = Number.isInteger(question.totalQuestions) ? ` de ${question.totalQuestions}` : "";
  stagePhaseBadge.textContent = `Pregunta ${question.order}${totalLabel} · ${thematicMeta.badge} (${questionSecondsTotal}s)`;
  lastQuestionReached = Number.isInteger(question.totalQuestions) && question.order >= question.totalQuestions;
  if (lastQuestionReached) {
    btnNextQuestion.disabled = true;
    btnNextQuestion.title = "Es la última pregunta: finaliza el juego para ver el podio.";
  } else {
    btnNextQuestion.title = "";
  }
  stageQuestionPrompt.textContent = thematicMeta.cleanPrompt;
  if (stageQuestionThemeTag) {
    stageQuestionThemeTag.textContent = `📚 Temática: ${thematicMeta.themeLabel}`;
  }
  if (stageQuestionPointsTag) {
    stageQuestionPointsTag.textContent = `⚡ Hasta 1,000 pts · ${questionSecondsTotal}s`;
  }
  if (stageQuestionMechanicGuide) {
    stageQuestionMechanicGuide.textContent = thematicMeta.shortGuide;
  }
  stageQuestionOptions.replaceChildren();

  if (Array.isArray(question.options) && question.options.length > 0) {
    question.options.forEach((opt, idx) => {
      const li = document.createElement("li");
      li.className = `projector-option opt-${idx % 4} stagger-item`;
      li.style.animationDelay = `${idx * 70}ms`;
      const prefix = question.type === "MULTIPLE_CHOICE"
        ? `${String.fromCharCode(65 + idx)}. `
        : `Bloque ${idx + 1}: `;
      li.textContent = `${prefix}${opt}`;
      stageQuestionOptions.append(li);
    });
  } else {
    const li = document.createElement("li");
    li.className = "projector-option opt-1 stagger-item";
    li.style.gridColumn = "1 / -1";
    li.textContent = question.type === "VOICE"
      ? "🎤 Los aprendices están pronunciando la frase desde el micrófono de su móvil."
      : "⌨️ Los aprendices están escribiendo la respuesta en su móvil.";
    stageQuestionOptions.append(li);
  }

  const isRestored = typeof customRemainingSeconds === "number";
  const introSeconds = isRestored
    ? 0
    : typeof question.introDurationSeconds === "number"
      ? Math.max(0, Math.min(15, question.introDurationSeconds))
      : 3;
  const questionSeconds = isRestored
    ? Math.max(0, customRemainingSeconds)
    : questionSecondsTotal;

  if (stageQuestionProgress) {
    stageQuestionProgress.max = questionSecondsTotal;
    stageQuestionProgress.value = Math.min(questionSecondsTotal, questionSeconds);
  }

  if (stageTransitionView && introSeconds > 0) {
    if (stageTransitionBadge) {
      stageTransitionBadge.textContent = `English Day · ${thematicMeta.badge}`;
    }
    if (stageTransitionNumber) {
      stageTransitionNumber.textContent = `#${question.order}`;
    }
    if (stageTransitionHeading) {
      stageTransitionHeading.textContent = `¡Pregunta ${question.order}!`;
    }
    if (stageTransitionThemePill) {
      stageTransitionThemePill.textContent = `📚 ${thematicMeta.themeLabel}`;
    }
    if (stageTransitionTimePill) {
      stageTransitionTimePill.textContent = `⏱ ${questionSecondsTotal}s para responder · 1,000 pts máx.`;
    }
    if (stageTransitionMechanicTitle) {
      stageTransitionMechanicTitle.textContent = thematicMeta.title;
    }
    if (stageTransitionMechanicDesc) {
      stageTransitionMechanicDesc.textContent = thematicMeta.desc;
    }
    if (stageTransitionProgress) {
      stageTransitionProgress.max = introSeconds;
      stageTransitionProgress.value = introSeconds;
    }
    if (stageTransitionCountdown) {
      stageTransitionCountdown.textContent = `00:${String(introSeconds).padStart(2, "0")}`;
    }
    if (stageTransitionSubtext) {
      stageTransitionSubtext.textContent = `Comenzando en ${introSeconds} ${introSeconds === 1 ? "segundo" : "segundos"}...`;
    }
    showStageSection(stageTransitionView);
    modIntroTimeout = window.setTimeout(() => {
      showStageSection(stageQuestionView);
    }, introSeconds * 1000);
  } else {
    showStageSection(stageQuestionView);
  }

  const introEndMs = Date.now() + introSeconds * 1000;
  const deadline = introEndMs + questionSeconds * 1000;
  stageTimerBox.classList.remove("is-expired");

  const tick = () => {
    const now = Date.now();
    if (now < introEndMs) {
      const introLeft = Math.max(1, Math.ceil((introEndMs - now) / 1000));
      const formattedIntro = `00:${String(introLeft).padStart(2, "0")}`;
      stageTimerValue.textContent = `Intro ${formattedIntro}`;
      if (stageTransitionCountdown) {
        stageTransitionCountdown.textContent = formattedIntro;
      }
      if (stageTransitionProgress) {
        stageTransitionProgress.value = introLeft;
      }
      if (stageTransitionSubtext) {
        stageTransitionSubtext.textContent = `Comenzando en ${introLeft} ${introLeft === 1 ? "segundo" : "segundos"}...`;
      }
      return;
    }

    if (stageQuestionView && stageQuestionView.hidden && stageTransitionView && !stageTransitionView.hidden) {
      showStageSection(stageQuestionView);
    }

    const secondsLeft = Math.max(0, Math.ceil((deadline - now) / 1000));
    const mins = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    stageTimerValue.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    if (stageQuestionProgress) {
      stageQuestionProgress.value = Math.min(questionSecondsTotal, secondsLeft);
    }
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
  modTimerInterval = window.setInterval(tick, 500);
}

function renderProjectorResults(payload) {
  window.clearInterval(modTimerInterval);
  window.clearTimeout(modIntroTimeout);
  modRankingTitle.textContent = "Clasificación Parcial Top 5 (RF-10)";
  if (payload.correctAnswer) {
    modCorrectAnswerBanner.hidden = false;
    modCorrectAnswerText.textContent = payload.correctAnswer;
  }
  const modExplanationBanner = document.querySelector("#modExplanationBanner");
  const modExplanationText = document.querySelector("#modExplanationText");
  if (modExplanationBanner && modExplanationText) {
    const explanation = typeof payload.explanation === "string" ? payload.explanation.trim() : "";
    modExplanationText.textContent = explanation;
    modExplanationBanner.hidden = explanation.length === 0;
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
    li.className = `ranking-row rank-${idx + 1} stagger-item`;
    li.style.animationDelay = `${idx * 65}ms`;
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
  clearModeratorSession();
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
  if (stageQrBox) stageQrBox.hidden = true;
  if (stageWelcomeSubtext) {
    stageWelcomeSubtext.textContent = "La partida ha finalizado. Puedes crear una nueva sala cuando lo desees.";
  }
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
          modSocket.send(`SEND\ndestination:/app/room/${roomId}/lobby/sync\n\n\0`);
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

function buildPlayerJoinUrl(pin, lanIp) {
  const loc = window.location;
  const isLoopback = loc.hostname === "localhost" || loc.hostname === "127.0.0.1";
  const host = isLoopback && lanIp ? (loc.port ? `${lanIp}:${loc.port}` : lanIp) : loc.host;
  return `${loc.protocol}//${host}/index.html?pin=${pin}`;
}

function renderRoomQrCodes(joinUrl, pin) {
  if (window.EnglishDayQR && typeof window.EnglishDayQR.renderToCanvas === "function") {
    if (modQrCanvas) {
      window.EnglishDayQR.renderToCanvas(modQrCanvas, joinUrl, {
        size: 176,
        quietZone: 4,
        darkColor: "#000000",
        lightColor: "#ffffff",
      });
    }
    if (stageQrCanvas) {
      window.EnglishDayQR.renderToCanvas(stageQrCanvas, joinUrl, {
        size: 260,
        quietZone: 4,
        darkColor: "#000000",
        lightColor: "#ffffff",
      });
    }
  }
  if (modQrBox) modQrBox.hidden = false;
  if (stageQrBox) stageQrBox.hidden = false;
  if (stageQrUrl) stageQrUrl.textContent = joinUrl;
  if (stageQrPinPill) stageQrPinPill.textContent = `PIN: ${pin}`;
}

if (btnCopyJoinUrl) {
  btnCopyJoinUrl.addEventListener("click", async () => {
    if (!currentRoom?.pin) return;
    const joinUrl = buildPlayerJoinUrl(currentRoom.pin, currentRoom.lanIp);
    try {
      await navigator.clipboard.writeText(joinUrl);
      const prev = btnCopyJoinUrl.textContent;
      btnCopyJoinUrl.textContent = "✔ ¡Enlace copiado!";
      setFeedback(`Enlace copiado al portapapeles: ${joinUrl}`, "ok");
      window.setTimeout(() => {
        btnCopyJoinUrl.textContent = prev;
      }, 2200);
    } catch {
      setFeedback(`Enlace directo: ${joinUrl}`, "ok");
    }
  });
}

function attachRoomSession(roomData) {
  currentRoom = roomData;
  if (roomData.status !== "FINISHED") {
    saveModeratorSession(roomData);
  } else {
    clearModeratorSession();
  }
  modPinValue.textContent = roomData.pin;
  const playerJoinLink = buildPlayerJoinUrl(roomData.pin, roomData.lanIp);
  modJoinUrl.textContent = `Enlace aprendices: ${playerJoinLink}`;
  renderRoomQrCodes(playerJoinLink, roomData.pin);
  modRankingTitle.textContent = "Clasificación en Vivo";
  lastQuestionReached = false;
  modCorrectAnswerBanner.hidden = true;
  modCorrectAnswerText.textContent = "";
  const modExplanationReset = document.querySelector("#modExplanationBanner");
  if (modExplanationReset) modExplanationReset.hidden = true;
  modRankingList.replaceChildren();
  const emptyRank = document.createElement("li");
  emptyRank.className = "ranking-row";
  emptyRank.textContent = "Los puntajes aparecerán al finalizar la primera pregunta.";
  modRankingList.append(emptyRank);
  updateRoomStatusBadge(roomData.status);
  stagePhaseBadge.textContent = `Sala activa · PIN ${roomData.pin}`;
  stageMainHeading.textContent = `Únete en tu móvil con el PIN ${roomData.pin}`;
  if (stageWelcomeSubtext) {
    stageWelcomeSubtext.textContent =
      "Escanea el código QR desde la pantalla o escribe el PIN de 6 dígitos en tu navegador para entrar a la sala.";
  }
  showStageSection(stageWelcomeView);
  connectModeratorWebSocket(roomData.roomId);
}

async function restoreModeratorStateFromServer(pin, isAutoRestore = false) {
  const response = await fetch(`/api/rooms/${encodeURIComponent(pin)}/state`);
  const state = await response.json();
  if (!response.ok) {
    if (isAutoRestore) {
      clearModeratorSession();
    }
    throw new Error(state.error || `No se encontró la sala (${response.status})`);
  }

  if (isAutoRestore && state.status === "FINISHED") {
    clearModeratorSession();
    return;
  }

  attachRoomSession(state);
  if (state.settings) {
    applySettingsToForm(state.settings);
  }
  if (Array.isArray(state.players)) {
    renderLobbyPlayers(state.players);
  }

  if (state.status === "QUESTION_IN_PROGRESS" && state.currentQuestion) {
    if (state.questionClosed && state.lastResults) {
      renderProjectorQuestion(state.currentQuestion, 0);
      window.clearInterval(modTimerInterval);
      stageTimerValue.textContent = "00:00";
      stageTimerBox.classList.add("is-expired");
      renderProjectorResults(state.lastResults);
    } else {
      renderProjectorQuestion(state.currentQuestion, state.remainingSeconds);
    }
  } else if (state.status === "ROULETTE_TIME") {
    if (state.lastResults) {
      renderProjectorResults(state.lastResults);
    }
    if (state.lastRoulette) {
      renderProjectorRoulette(state.lastRoulette);
    }
  } else if (state.status === "FINISHED" && state.podium) {
    renderProjectorPodium(state.podium);
  }

  setFeedback(
    isAutoRestore
      ? `Sesión restaurada automáticamente · Sala ${state.pin} (${state.playerCount ?? 0} aprendices).`
      : `Reconectado a la sala ${state.pin} (${state.playerCount ?? 0} aprendices).`,
    "ok"
  );
}

async function syncSettingsToActiveRoom(showNotification = false) {
  const settings = readModeratorSettingsFromForm();
  applySettingsToForm(settings);
  if (!currentRoom?.roomId) {
    if (showNotification) {
      setFeedback(
        `Parámetros listos (MC: ${settings.multipleChoiceTimeSeconds}s, Texto: ${settings.textInputTimeSeconds}s, Bloques: ${settings.wordBlocksTimeSeconds}s, Voz: ${settings.voiceTimeSeconds}s, Intro: ${settings.introDurationSeconds}s, Preguntas: ${settings.questionCount}). Se aplicarán al crear la sala.`,
        "ok"
      );
    }
    return settings;
  }

  const response = await fetch(`/api/rooms/${encodeURIComponent(currentRoom.roomId)}/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (response.ok) {
    const saved = await response.json();
    applySettingsToForm(saved);
    if (Number.isInteger(currentRoom?.currentQuestionIndex) && currentRoom.currentQuestionIndex > 0 && Number.isInteger(saved.questionCount)) {
      lastQuestionReached = currentRoom.currentQuestionIndex >= saved.questionCount;
      updateRoomStatusBadge();
    }
    if (showNotification) {
      setFeedback(
        `Tiempos actualizados en la sala ${currentRoom.pin} (MC: ${saved.multipleChoiceTimeSeconds}s, Texto: ${saved.textInputTimeSeconds}s, Bloques: ${saved.wordBlocksTimeSeconds}s, Voz: ${saved.voiceTimeSeconds}s, Intro: ${saved.introDurationSeconds}s, Preguntas: ${saved.questionCount}).`,
        "ok"
      );
    }
    return saved;
  }
  return settings;
}

if (btnSaveRoomSettings) {
  btnSaveRoomSettings.addEventListener("click", () => {
    syncSettingsToActiveRoom(true).catch((err) => {
      setFeedback(`No se pudieron guardar los parámetros: ${err.message}`, "error");
    });
  });
}

btnCreateRoom.addEventListener("click", async () => {
  btnCreateRoom.disabled = true;
  setFeedback("Creando nueva sala con parámetros configurados...", "ok");
  try {
    const settings = readModeratorSettingsFromForm();
    applySettingsToForm(settings);
    const response = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `Error HTTP ${response.status}`);
    }
    renderLobbyPlayers([]);
    attachRoomSession(data);
    setFeedback(
      `Sala creada con éxito (PIN: ${data.pin}). Esperando al menos 1 aprendiz para iniciar la partida.`,
      "ok"
    );
  } catch (error) {
    setFeedback(error.message, "error");
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
    await restoreModeratorStateFromServer(pin, false);
  } catch (error) {
    setFeedback(error.message, "error");
  }
});

btnStartGame.addEventListener("click", async () => {
  if (!currentRoom?.roomId) return;
  if (connectedPlayers.length === 0) {
    setFeedback("Debe haber al menos 1 aprendiz conectado en la sala para iniciar la partida.", "error");
    btnStartGame.disabled = true;
    return;
  }
  btnStartGame.disabled = true;
  try {
    const settings = readModeratorSettingsFromForm();
    const response = await fetch(`/api/rooms/${encodeURIComponent(currentRoom.roomId)}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `No se pudo iniciar (${response.status})`);
    }
    currentRoom = { ...currentRoom, ...data };
    updateRoomStatusBadge(data.status);
    setFeedback("Partida iniciada y primera pregunta difundida.", "ok");
  } catch (error) {
    setFeedback(error.message, "error");
    updateRoomStatusBadge(currentRoom?.status);
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
    const settings = readModeratorSettingsFromForm();
    const response = await fetch(`/api/rooms/${encodeURIComponent(currentRoom.roomId)}/next`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
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
