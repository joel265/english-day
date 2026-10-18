const joinForm = document.querySelector("#joinForm");
const pinInputs = [...document.querySelectorAll(".pin-digit")];
const nicknameInput = document.querySelector("#nickname");
const formMessage = document.querySelector("#formMessage");
const submitButton = joinForm.querySelector(".join-button");
const joinCard = document.querySelector(".join-card");
const lobbyCard = document.querySelector("#lobbyCard");
const lobbyPin = document.querySelector("#lobbyPin");
const lobbyStatus = document.querySelector("#lobbyStatus");
const lobbyPlayers = document.querySelector("#lobbyPlayers");
const playerCount = document.querySelector("#playerCount");
const btnLeaveLobby = document.querySelector("#btnLeaveLobby");
const questionCard = document.querySelector("#questionCard");
const questionType = document.querySelector("#questionType");
const questionOrder = document.querySelector("#questionOrder");
const questionTimer = document.querySelector("#questionTimer");
const questionProgress = document.querySelector("#questionProgress");
const questionPrompt = document.querySelector("#questionPrompt");
const questionOptions = document.querySelector("#questionOptions");
const wordBlocksUI = document.querySelector("#wordBlocksUI");
const wordBlocksSelected = document.querySelector("#wordBlocksSelected");
const wordBlocksBank = document.querySelector("#wordBlocksBank");
const wordBlocksCount = document.querySelector("#wordBlocksCount");
const wordBlocksReset = document.querySelector("#wordBlocksReset");
const wordBlocksSubmit = document.querySelector("#wordBlocksSubmit");
const textInputUI = document.querySelector("#textInputUI");
const textAnswer = document.querySelector("#textAnswer");
const textAnswerClear = document.querySelector("#textAnswerClear");
const textAnswerSubmit = document.querySelector("#textAnswerSubmit");
const voiceUI = document.querySelector("#voiceUI");
const voiceMicButton = document.querySelector("#voiceMicButton");
const voiceMicLabel = document.querySelector("#voiceMicLabel");
const voiceMicHint = document.querySelector("#voiceMicHint");
const voiceTranscriptText = document.querySelector("#voiceTranscriptText");
const voiceConfirmActions = document.querySelector("#voiceConfirmActions");
const voiceRepeatButton = document.querySelector("#voiceRepeatButton");
const voiceSubmitButton = document.querySelector("#voiceSubmitButton");
const voiceFallbackNotice = document.querySelector("#voiceFallbackNotice");
const questionAnswerHint = document.querySelector("#questionAnswerHint");
const questionStatus = document.querySelector("#questionStatus");
const waitingAnswerCard = document.querySelector("#waitingAnswerCard");
const waitingQuestionOrder = document.querySelector("#waitingQuestionOrder");
const waitingAnswerTitle = document.querySelector("#waitingAnswerTitle");
const waitingSubmittedValue = document.querySelector("#waitingSubmittedValue");
const waitingTimerValue = document.querySelector("#waitingTimerValue");
const resultsCard = document.querySelector("#resultsCard");
const playerVerdictBanner = document.querySelector("#playerVerdictBanner");
const playerVerdictIcon = document.querySelector("#playerVerdictIcon");
const playerVerdictDetail = document.querySelector("#playerVerdictDetail");
const resultsTitle = document.querySelector("#resultsTitle");
const resultsCorrectAnswer = document.querySelector("#resultsCorrectAnswer");
const resultsTop5List = document.querySelector("#resultsTop5List");
const questionTopicBanner = document.querySelector("#questionTopicBanner");
const questionThemeTag = document.querySelector("#questionThemeTag");
const questionPointsTag = document.querySelector("#questionPointsTag");
const questionMechanicGuide = document.querySelector("#questionMechanicGuide");
const questionTransitionCard = document.querySelector("#questionTransitionCard");
const transitionMechanicBadge = document.querySelector("#transitionMechanicBadge");
const transitionCountdownTimer = document.querySelector("#transitionCountdownTimer");
const transitionProgressBar = document.querySelector("#transitionProgressBar");
const transitionQuestionNumber = document.querySelector("#transitionQuestionNumber");
const transitionHeading = document.querySelector("#transitionHeading");
const transitionThemePill = document.querySelector("#transitionThemePill");
const transitionTimePill = document.querySelector("#transitionTimePill");
const transitionMechanicTitle = document.querySelector("#transitionMechanicTitle");
const transitionMechanicDesc = document.querySelector("#transitionMechanicDesc");
const transitionSubtext = document.querySelector("#transitionSubtext");
const rouletteCard = document.querySelector("#rouletteCard");
const rouletteTitle = document.querySelector("#rouletteTitle");
const rouletteBanner = document.querySelector("#rouletteBanner");
const rouletteAnswerBox = document.querySelector("#rouletteAnswerBox");
const rouletteBadge = document.querySelector("#rouletteBadge");
const rouletteWinnerName = document.querySelector("#rouletteWinnerName");
const rouletteAnswerValue = document.querySelector("#rouletteAnswerValue");
const rouletteAnswerVerdict = document.querySelector("#rouletteAnswerVerdict");
const podiumCard = document.querySelector("#podiumCard");
const podiumTitle = document.querySelector("#podiumTitle");
const podiumTop3List = document.querySelector("#podiumTop3List");
const podiumTotalPlayers = document.querySelector("#podiumTotalPlayers");
const btnBackToStart = document.querySelector("#btnBackToStart");
const navModeratorLink = document.querySelector("#navModeratorLink");

const PLAYER_STORAGE_KEY = "englishDayPlayerSession";

let lobbySocket;
let timerInterval;
let autoCloseTimeout;
let transitionTimeout;
let transitionInterval;
let selectedAnswer = null;
let selectedWordBlocks = [];
let questionDeadline = 0;
let currentRoomId = null;
let currentPlayer = null;
let currentQuestion = null;
let hasSubmittedAnswer = false;
let resultsReceivedForCurrentQuestion = false;
let speechRecognition = null;
let isRecordingVoice = false;
let finalVoiceTranscript = "";
let knownRoomPlayers = [];
let playerRouletteWheel = null;
let isLeavingIntentionally = false;

if (navModeratorLink) {
  navModeratorLink.addEventListener("click", (event) => {
    if (navModeratorLink.getAttribute("aria-disabled") === "true") {
      event.preventDefault();
    }
  });
}

function setTopNavigationLocked(locked) {
  if (!navModeratorLink) return;
  if (locked) {
    navModeratorLink.setAttribute("aria-disabled", "true");
    navModeratorLink.classList.add("is-disabled");
    navModeratorLink.tabIndex = -1;
    navModeratorLink.title = "Deshabilitado mientras estás dentro de una sala o partida en curso";
  } else {
    navModeratorLink.removeAttribute("aria-disabled");
    navModeratorLink.classList.remove("is-disabled");
    navModeratorLink.tabIndex = 0;
    navModeratorLink.title = "";
  }
}

function savePlayerSession(sessionData) {
  if (!sessionData?.pin || !sessionData?.roomId || !sessionData?.playerId) return;
  const serialized = JSON.stringify(sessionData);
  try {
    window.localStorage.setItem(PLAYER_STORAGE_KEY, serialized);
    window.sessionStorage.setItem(PLAYER_STORAGE_KEY, serialized);
  } catch {
    // Almacenamiento opcional
  }
}

function clearPlayerSession() {
  try {
    window.localStorage.removeItem(PLAYER_STORAGE_KEY);
    window.sessionStorage.removeItem(PLAYER_STORAGE_KEY);
  } catch {
    // Ignorar
  }
}

function readSavedPlayerSession() {
  try {
    const raw =
      window.localStorage.getItem(PLAYER_STORAGE_KEY) ||
      window.sessionStorage.getItem(PLAYER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Navegación cómoda entre los 6 dígitos del PIN
pinInputs.forEach((input, index) => {
  input.addEventListener("input", (event) => {
    const clean = event.target.value.replace(/\D/g, "").slice(-1);
    event.target.value = clean;
    if (clean && index < pinInputs.length - 1) {
      pinInputs[index + 1].focus();
    }
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Backspace" && !input.value && index > 0) {
      pinInputs[index - 1].focus();
    }
  });
  input.addEventListener("paste", (event) => {
    const pasted = (event.clipboardData?.getData("text") || "").replace(/\D/g, "").slice(0, 6);
    if (pasted.length > 0) {
      event.preventDefault();
      pasted.split("").forEach((digit, idx) => {
        if (pinInputs[idx]) pinInputs[idx].value = digit;
      });
      const focusIdx = Math.min(pasted.length, pinInputs.length - 1);
      pinInputs[focusIdx].focus();
    }
  });
});

// Pre-llenar PIN si viene por parámetro ?pin=XXXXXX (ej. desde QR del proyector)
const urlPin = new URLSearchParams(window.location.search).get("pin");
if (urlPin && /^\d{6}$/.test(urlPin)) {
  urlPin.split("").forEach((digit, idx) => {
    if (pinInputs[idx]) pinInputs[idx].value = digit;
  });
  formMessage.dataset.state = "success";
  formMessage.textContent = `PIN ${urlPin} cargado desde el código QR. ¡Escribe tu nombre para entrar!`;
  nicknameInput?.focus();
}

document.addEventListener("DOMContentLoaded", () => {
  if (window.ActiveFeedbackRoulette) {
    playerRouletteWheel = new window.ActiveFeedbackRoulette("playerRouletteCanvas");
  }
  const savedSession = readSavedPlayerSession();
  if (
    savedSession?.pin &&
    savedSession?.roomId &&
    savedSession?.playerId &&
    (!urlPin || urlPin === savedSession.pin)
  ) {
    restorePlayerSessionFromServer(savedSession, true).catch(() => {});
  }
});

function showOnlyCard(activeCard) {
  if (activeCard !== questionTransitionCard && activeCard !== questionCard) {
    window.clearTimeout(transitionTimeout);
    window.clearInterval(transitionInterval);
  }
  setTopNavigationLocked(activeCard !== joinCard && activeCard !== podiumCard);
  [
    joinCard,
    lobbyCard,
    questionTransitionCard,
    questionCard,
    waitingAnswerCard,
    resultsCard,
    rouletteCard,
    podiumCard,
  ].forEach((card) => {
    if (!card) return;
    const isTarget = card === activeCard;
    card.hidden = !isTarget;
    card.classList.remove("card-enter");
    if (isTarget) {
      void card.offsetWidth;
      card.classList.add("card-enter");
    }
  });
}

function formatAnswerDisplay(value) {
  if (Array.isArray(value)) {
    return value.join(" ");
  }
  return typeof value === "string" ? value : "";
}

function normalizeAnswerForComparison(value) {
  const raw = formatAnswerDisplay(value);
  return raw
    .replace(/[\u2018\u2019\u02BC`´]/g, "'")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[.,;:!?¿¡"()]/g, "")
    .replace(/\bi'm\b|\bim\b/g, "i am")
    .replace(/\byou're\b|\byoure\b/g, "you are")
    .replace(/\bhe's\b/g, "he is")
    .replace(/\bshe's\b/g, "she is")
    .replace(/\bit's\b/g, "it is")
    .replace(/\bwe're\b/g, "we are")
    .replace(/\bthey're\b/g, "they are")
    .replace(/\bdon't\b|\bdont\b/g, "do not")
    .replace(/\bdoesn't\b|\bdoesnt\b/g, "does not")
    .replace(/\bdidn't\b|\bdidnt\b/g, "did not")
    .replace(/\bisn't\b|\bisnt\b/g, "is not")
    .replace(/\baren't\b|\barent\b/g, "are not")
    .replace(/\bwasn't\b|\bwasnt\b/g, "was not")
    .replace(/\bweren't\b|\bwerent\b/g, "were not")
    .replace(/\bcan't\b|\bcant\b|\bcan not\b/g, "cannot")
    .replace(/\bwon't\b|\bwont\b/g, "will not")
    .replace(/\b6\b/g, "six")
    .replace(/\b7\b/g, "seven")
    .replace(/\b8\b/g, "eight")
    .replace(/\b9\b/g, "nine")
    .replace(/\b10\b/g, "ten")
    .replace(/\s+/g, " ")
    .trim();
}

function stopVoiceRecognition() {
  if (speechRecognition && isRecordingVoice) {
    try {
      speechRecognition.abort();
    } catch {
      // Ignorar si ya estaba detenido
    }
  }
  isRecordingVoice = false;
  if (voiceMicButton) {
    voiceMicButton.setAttribute("aria-pressed", "false");
    voiceMicButton.classList.remove("is-recording");
  }
}

function lockQuestionInputs() {
  questionOptions.querySelectorAll("button").forEach((option) => {
    option.disabled = true;
  });
  wordBlocksUI.querySelectorAll("button").forEach((option) => {
    option.disabled = true;
  });
  textAnswer.disabled = true;
  textAnswerClear.disabled = true;
  if (textAnswerSubmit) textAnswerSubmit.disabled = true;
  if (wordBlocksSubmit) wordBlocksSubmit.disabled = true;
  if (voiceMicButton) voiceMicButton.disabled = true;
  if (voiceRepeatButton) voiceRepeatButton.disabled = true;
  if (voiceSubmitButton) voiceSubmitButton.disabled = true;
}

function requestQuestionCloseIfNeeded() {
  if (resultsReceivedForCurrentQuestion || !currentRoomId || !currentQuestion?.questionId) {
    return;
  }
  fetch(`/api/rooms/${encodeURIComponent(currentRoomId)}/close-question`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ questionId: currentQuestion.questionId }),
  }).catch(() => {
    // El moderador o servidor cerrará la pregunta
  });
}

function expireQuestion() {
  window.clearInterval(timerInterval);
  stopVoiceRecognition();
  questionTimer.textContent = "00:00";
  questionTimer.setAttribute("aria-label", "0 segundos restantes");
  if (waitingTimerValue) {
    waitingTimerValue.textContent = "00:00 · Revelando resultados...";
  }
  questionProgress.value = 0;
  questionTimer.classList.add("is-expired");
  lockQuestionInputs();
  if (!hasSubmittedAnswer) {
    questionStatus.textContent = "Tiempo agotado (0 puntos). Revelando respuesta correcta...";
    questionStatus.dataset.state = "expired";
  }
  window.clearTimeout(autoCloseTimeout);
  autoCloseTimeout = window.setTimeout(requestQuestionCloseIfNeeded, 400);
}

function clearTextAnswer() {
  if (Date.now() >= questionDeadline || textAnswer.disabled || hasSubmittedAnswer) return;
  textAnswer.value = "";
  textAnswerClear.hidden = true;
  if (textAnswerSubmit) textAnswerSubmit.disabled = true;
  textAnswer.focus();
}

textAnswer.addEventListener("input", () => {
  if (Date.now() >= questionDeadline) {
    expireQuestion();
    return;
  }

  textAnswerClear.hidden = textAnswer.value.length === 0;
  if (textAnswerSubmit) {
    textAnswerSubmit.disabled = hasSubmittedAnswer || textAnswer.value.trim().length === 0;
  }
});

textAnswer.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    submitTextInputAnswer();
  }
});

textAnswerClear.addEventListener("click", clearTextAnswer);

/**
 * Tarea 9: Envía la respuesta del aprendiz al servidor vía STOMP (/app/room/{roomId}/answer)
 * según Contrato §4.2 y §4.4:
 * { playerId, questionId, value, clientTimestamp }
 */
function sendAnswerToServer(answerValue) {
  if (hasSubmittedAnswer || Date.now() >= questionDeadline) {
    return false;
  }
  if (!currentRoomId || !currentPlayer?.playerId || !currentQuestion?.questionId) {
    questionStatus.textContent = "Error: sesión de jugador o pregunta no inicializada.";
    questionStatus.dataset.state = "error";
    return false;
  }
  if (!lobbySocket || lobbySocket.readyState !== WebSocket.OPEN) {
    questionStatus.textContent = "No hay conexión en tiempo real para enviar la respuesta.";
    questionStatus.dataset.state = "error";
    return false;
  }

  const clientTimestamp = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const payload = JSON.stringify({
    playerId: currentPlayer.playerId,
    questionId: currentQuestion.questionId,
    value: answerValue,
    clientTimestamp,
  });

  lobbySocket.send(
    `SEND\ndestination:/app/room/${currentRoomId}/answer\ncontent-type:application/json\n\n${payload}\0`
  );

  hasSubmittedAnswer = true;
  selectedAnswer = answerValue;
  lockQuestionInputs();
  questionStatus.textContent = "¡Respuesta enviada! Espera el cierre de la pregunta.";
  questionStatus.dataset.state = "selected";

  if (waitingAnswerCard) {
    if (waitingQuestionOrder && currentQuestion) {
      waitingQuestionOrder.textContent = `English Day · Pregunta ${currentQuestion.order}`;
    }
    if (waitingSubmittedValue) {
      waitingSubmittedValue.textContent = `"${formatAnswerDisplay(answerValue)}"`;
    }
    showOnlyCard(waitingAnswerCard);
    waitingAnswerTitle?.focus();
  }
  return true;
}

function submitTextInputAnswer() {
  if (hasSubmittedAnswer || Date.now() >= questionDeadline) return;
  const trimmed = textAnswer.value.trim();
  if (!trimmed) {
    questionStatus.textContent = "Escribe una respuesta antes de enviar.";
    questionStatus.dataset.state = "error";
    textAnswer.focus();
    return;
  }
  sendAnswerToServer(trimmed);
}

if (textAnswerSubmit) {
  textAnswerSubmit.addEventListener("click", submitTextInputAnswer);
}

function submitWordBlocksAnswer() {
  if (hasSubmittedAnswer || Date.now() >= questionDeadline || !currentQuestion) return;
  const tokens = selectedWordBlocks.map((index) => currentQuestion.options[index]);
  if (tokens.length === 0) {
    questionStatus.textContent = "Selecciona al menos un bloque para enviar tu oración.";
    questionStatus.dataset.state = "error";
    return;
  }
  sendAnswerToServer(tokens);
}

if (wordBlocksSubmit) {
  wordBlocksSubmit.addEventListener("click", submitWordBlocksAnswer);
}

/**
 * Tarea 8: Mecánica Voice (Web Speech API) según Contrato Anexo B y RF-07.
 * - Idioma único: en-US (Anexo B.1)
 * - No continuo, interimResults = true (Anexo B.2, B.3)
 * - Botones "Enviar" y "Repetir" al terminar la captura (Anexo B.3)
 * - Fallback a TEXT_INPUT si el micrófono no está disponible o falla (Anexo B.4)
 */
function activateVoiceTextFallback(reasonMessage) {
  stopVoiceRecognition();
  if (voiceFallbackNotice) {
    voiceFallbackNotice.textContent = reasonMessage;
    voiceFallbackNotice.hidden = false;
  }
  const stage = document.querySelector("#voiceStage");
  const transcriptBox = document.querySelector("#voiceTranscriptBox");
  if (stage) stage.hidden = true;
  if (transcriptBox) transcriptBox.hidden = true;
  if (voiceConfirmActions) voiceConfirmActions.hidden = true;

  textInputUI.hidden = false;
  textAnswer.disabled = hasSubmittedAnswer;
  textAnswer.focus();
}

function initVoiceUI() {
  stopVoiceRecognition();
  finalVoiceTranscript = "";
  if (voiceFallbackNotice) {
    voiceFallbackNotice.hidden = true;
    voiceFallbackNotice.textContent = "";
  }
  const stage = document.querySelector("#voiceStage");
  const transcriptBox = document.querySelector("#voiceTranscriptBox");
  if (stage) stage.hidden = false;
  if (transcriptBox) transcriptBox.hidden = false;
  if (voiceConfirmActions) voiceConfirmActions.hidden = true;
  if (voiceMicButton) {
    voiceMicButton.disabled = false;
    voiceMicButton.setAttribute("aria-pressed", "false");
    voiceMicButton.classList.remove("is-recording");
  }
  if (voiceMicLabel) voiceMicLabel.textContent = "Toca el micrófono para hablar";
  if (voiceTranscriptText) {
    voiceTranscriptText.textContent = "Aún no has grabado tu respuesta.";
    voiceTranscriptText.classList.remove("is-interim");
  }

  const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognitionCtor) {
    activateVoiceTextFallback("No pudimos usar el micrófono. Escribe tu respuesta.");
  }
}

function toggleVoiceRecording() {
  if (hasSubmittedAnswer || Date.now() >= questionDeadline) return;

  const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognitionCtor) {
    activateVoiceTextFallback("No pudimos usar el micrófono. Escribe tu respuesta.");
    return;
  }

  if (isRecordingVoice && speechRecognition) {
    speechRecognition.stop();
    return;
  }

  finalVoiceTranscript = "";
  if (voiceConfirmActions) voiceConfirmActions.hidden = true;

  speechRecognition = new SpeechRecognitionCtor();
  speechRecognition.lang = "en-US";
  speechRecognition.continuous = false;
  speechRecognition.interimResults = true;
  speechRecognition.maxAlternatives = 1;

  let latestInterim = "";

  speechRecognition.onstart = () => {
    isRecordingVoice = true;
    voiceMicButton.setAttribute("aria-pressed", "true");
    voiceMicButton.classList.add("is-recording");
    voiceMicLabel.textContent = "Escuchando... Toca de nuevo para detener";
    voiceTranscriptText.textContent = "Escuchando tu voz en inglés...";
    voiceTranscriptText.classList.add("is-interim");
    questionStatus.textContent = "";
    questionStatus.dataset.state = "";
  };

  speechRecognition.onresult = (event) => {
    if (Date.now() >= questionDeadline) {
      stopVoiceRecognition();
      return;
    }
    let interimText = "";
    let finalText = "";
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalText += transcript;
      } else {
        interimText += transcript;
      }
    }
    if (finalText.trim()) {
      finalVoiceTranscript = finalText.trim();
    }
    latestInterim = interimText.trim();

    if (finalVoiceTranscript) {
      voiceTranscriptText.textContent = finalVoiceTranscript;
      voiceTranscriptText.classList.remove("is-interim");
    } else if (latestInterim) {
      voiceTranscriptText.textContent = latestInterim;
      voiceTranscriptText.classList.add("is-interim");
    }
  };

  speechRecognition.onerror = (event) => {
    isRecordingVoice = false;
    voiceMicButton.setAttribute("aria-pressed", "false");
    voiceMicButton.classList.remove("is-recording");

    if (event.error === "not-allowed" || event.error === "service-not-allowed") {
      activateVoiceTextFallback(
        "No pudimos usar el micrófono. Escribe tu respuesta. Si lo bloqueaste, actívalo en los ajustes del navegador."
      );
      return;
    }
    if (event.error === "network" || event.error === "audio-capture") {
      activateVoiceTextFallback("No pudimos usar el micrófono. Escribe tu respuesta.");
      return;
    }
    if (event.error === "no-speech") {
      voiceMicLabel.textContent = "Toca el micrófono para hablar";
      voiceTranscriptText.textContent = "No te escuché. Toca el micrófono e inténtalo de nuevo.";
      voiceTranscriptText.classList.remove("is-interim");
    }
  };

  speechRecognition.onend = () => {
    isRecordingVoice = false;
    voiceMicButton.setAttribute("aria-pressed", "false");
    voiceMicButton.classList.remove("is-recording");
    voiceMicLabel.textContent = "Toca el micrófono para hablar";

    if (Date.now() >= questionDeadline) {
      return;
    }

    if (!finalVoiceTranscript && latestInterim) {
      finalVoiceTranscript = latestInterim;
    }

    if (finalVoiceTranscript) {
      voiceTranscriptText.textContent = finalVoiceTranscript;
      voiceTranscriptText.classList.remove("is-interim");
      if (voiceConfirmActions) voiceConfirmActions.hidden = false;
      if (voiceRepeatButton) voiceRepeatButton.disabled = false;
      if (voiceSubmitButton) voiceSubmitButton.disabled = false;
    } else if (!voiceFallbackNotice || voiceFallbackNotice.hidden) {
      voiceTranscriptText.textContent = "No te escuché. Toca el micrófono e inténtalo de nuevo.";
      voiceTranscriptText.classList.remove("is-interim");
    }
  };

  try {
    speechRecognition.start();
  } catch {
    activateVoiceTextFallback("No pudimos usar el micrófono. Escribe tu respuesta.");
  }
}

if (voiceMicButton) {
  voiceMicButton.addEventListener("click", toggleVoiceRecording);
}

if (voiceRepeatButton) {
  voiceRepeatButton.addEventListener("click", () => {
    if (hasSubmittedAnswer || Date.now() >= questionDeadline) return;
    finalVoiceTranscript = "";
    if (voiceConfirmActions) voiceConfirmActions.hidden = true;
    voiceTranscriptText.textContent = "Grabación descartada. Toca el micrófono para repetir.";
    voiceTranscriptText.classList.remove("is-interim");
  });
}

if (voiceSubmitButton) {
  voiceSubmitButton.addEventListener("click", () => {
    if (hasSubmittedAnswer || Date.now() >= questionDeadline) return;
    if (!finalVoiceTranscript.trim()) {
      questionStatus.textContent = "No te escuché. Toca el micrófono e inténtalo de nuevo.";
      questionStatus.dataset.state = "error";
      return;
    }
    sendAnswerToServer(finalVoiceTranscript.trim());
  });
}

function setLobbyStatus(message, state) {
  lobbyStatus.textContent = message;
  lobbyStatus.dataset.state = state;
}

function renderLobbyPlayers(players, currentPlayerId) {
  lobbyPlayers.replaceChildren();
  knownRoomPlayers = players.map((p) => ({ name: p.nickname }));

  players.forEach((player, index) => {
    const item = document.createElement("li");
    item.className = "lobby-player stagger-item";
    item.style.animationDelay = `${index * 55}ms`;
    item.textContent = player.nickname;

    if (player.playerId === currentPlayerId) {
      const youLabel = document.createElement("span");
      youLabel.className = "you-label";
      youLabel.textContent = "Tú";
      item.append(youLabel);
    }

    lobbyPlayers.append(item);
  });

  playerCount.textContent = String(players.length);
  if (playerRouletteWheel && knownRoomPlayers.length > 0) {
    playerRouletteWheel.setPlayers(knownRoomPlayers);
  }
}

function validateQuestion(question) {
  const supportedTypes = ["MULTIPLE_CHOICE", "WORD_BLOCKS", "TEXT_INPUT", "VOICE"];
  const hasOptions = question?.type === "MULTIPLE_CHOICE" || question?.type === "WORD_BLOCKS";

  if (!question || typeof question !== "object" || Array.isArray(question)
    || Object.prototype.hasOwnProperty.call(question, "correctAnswer")
    || typeof question.questionId !== "string"
    || !/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(question.questionId)
    || !supportedTypes.includes(question.type)
    || typeof question.prompt !== "string" || !question.prompt.trim()
    || !Number.isSafeInteger(question.timeLimitSeconds) || question.timeLimitSeconds < 1
    || !Number.isSafeInteger(question.order) || question.order < 1
    || typeof question.serverTimestamp !== "string"
    || !Number.isFinite(Date.parse(question.serverTimestamp))) {
    throw new Error("El servidor envió una pregunta inválida.");
  }

  if (hasOptions) {
    if (!Array.isArray(question.options) || question.options.length < 2
      || question.options.some((option) => typeof option !== "string" || !option.trim())) {
      throw new Error("El servidor envió opciones de pregunta inválidas.");
    }
  } else if (question.options !== null && (!Array.isArray(question.options) || question.options.length > 0)) {
    throw new Error("El servidor envió opciones incompatibles con el tipo de pregunta.");
  }

  return question;
}

function selectMultipleChoiceAnswer(button) {
  if (hasSubmittedAnswer || selectedAnswer !== null || Date.now() >= questionDeadline || button.disabled) {
    return;
  }

  const answer = button.dataset.answer;
  questionOptions.querySelectorAll("button[data-answer]").forEach((option) => {
    const isSelected = option === button;
    option.disabled = true;
    option.setAttribute("aria-pressed", String(isSelected));
    option.classList.toggle("is-selected", isSelected);
  });

  sendAnswerToServer(answer);
}

function renderWordBlocks(question) {
  const selectedIndices = new Set(selectedWordBlocks);
  wordBlocksSelected.replaceChildren();
  wordBlocksBank.replaceChildren();
  wordBlocksCount.textContent = `${selectedWordBlocks.length} ${selectedWordBlocks.length === 1 ? "bloque" : "bloques"}`;
  selectedAnswer = selectedWordBlocks.map((index) => question.options[index]);
  if (wordBlocksSubmit) {
    wordBlocksSubmit.disabled = hasSubmittedAnswer || selectedWordBlocks.length === 0;
  }

  selectedWordBlocks.forEach((wordIndex, position) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "word-block word-block--selected";
    button.disabled = hasSubmittedAnswer;
    button.setAttribute("aria-label", `Quitar ${question.options[wordIndex]}, posición ${position + 1}`);

    const positionLabel = document.createElement("span");
    positionLabel.className = "word-block-position";
    positionLabel.setAttribute("aria-hidden", "true");
    positionLabel.textContent = String(position + 1);

    const word = document.createElement("span");
    word.textContent = question.options[wordIndex];
    button.append(positionLabel, word);
    button.addEventListener("click", () => {
      if (hasSubmittedAnswer || Date.now() >= questionDeadline) return;
      selectedWordBlocks = selectedWordBlocks.filter((index) => index !== wordIndex);
      renderWordBlocks(question);
    });
    item.append(button);
    wordBlocksSelected.append(item);
  });

  question.options.forEach((option, index) => {
    if (selectedIndices.has(index)) return;

    const item = document.createElement("li");
    item.className = "stagger-item";
    item.style.animationDelay = `${index * 45}ms`;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "word-block";
    button.disabled = hasSubmittedAnswer;
    button.setAttribute("aria-label", `Agregar bloque: ${option}`);
    button.textContent = option;
    button.addEventListener("click", () => {
      if (hasSubmittedAnswer || Date.now() >= questionDeadline) return;
      selectedWordBlocks.push(index);
      renderWordBlocks(question);
    });
    item.append(button);
    wordBlocksBank.append(item);
  });
}

function resetWordBlocks(question) {
  if (hasSubmittedAnswer || Date.now() >= questionDeadline) return;
  selectedWordBlocks = [];
  selectedAnswer = [];
  questionStatus.textContent = "";
  questionStatus.dataset.state = "";
  renderWordBlocks(question);
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
      badge: "Selección múltiple",
      title: "🎯 Mecánica: Selección Múltiple (4 Opciones)",
      desc: "Lee el enunciado y toca una de las 4 tarjetas (A, B, C o D). Tu respuesta se enviará inmediatamente al tocar la opción elegida.",
      shortGuide: "💡 Cómo responder: Analiza la temática gramatical y toca una sola tarjeta (A, B, C o D). ¡Entre más rápido aciertes, más puntos ganas!",
    },
    WORD_BLOCKS: {
      badge: "Ordena los bloques",
      title: "🧩 Mecánica: Construcción con Bloques (Word Blocks)",
      desc: "Toca las palabras del banco inferior en orden gramatical para armar la oración y pulsa «Enviar respuesta». Se aceptan cláusulas parciales que tengan sentido gramatical completo.",
      shortGuide: "💡 Cómo responder: Ordena los bloques (Sujeto + Verbo + Complemento). Se valida la oración completa o una cláusula parcial con sentido gramatical.",
    },
    TEXT_INPUT: {
      badge: "Respuesta escrita",
      title: "✍️ Mecánica: Completar Texto en Inglés (Text Input)",
      desc: "Escribe la palabra o forma verbal en el campo de texto y presiona «Enviar respuesta». Cuenta con margen de tolerancia ante errores leves de escritura.",
      shortGuide: "💡 Cómo responder: Escribe la palabra o verbo faltante en inglés y pulsa «Enviar respuesta» (incluye margen de tolerancia ortográfica).",
    },
    VOICE: {
      badge: "Respuesta por voz",
      title: "🎙️ Mecánica: Pronunciación por Voz (Speaking en-US)",
      desc: "Toca el botón del micrófono, pronuncia la frase en inglés y confirma con «Enviar». Cuenta con margen de tolerancia fonética y de transcripción.",
      shortGuide: "💡 Cómo responder: Toca el micrófono 🎙️, pronuncia la frase en inglés y pulsa «Enviar» (con tolerancia ante variaciones leves de pronunciación).",
    },
  };

  const mechanic = mechanicsByType[question.type] || mechanicsByType.MULTIPLE_CHOICE;

  return {
    themeLabel,
    cleanPrompt,
    ...mechanic,
  };
}

function renderQuestion(question, options = {}) {
  validateQuestion(question);
  window.clearInterval(timerInterval);
  window.clearTimeout(autoCloseTimeout);
  window.clearTimeout(transitionTimeout);
  window.clearInterval(transitionInterval);
  stopVoiceRecognition();
  currentQuestion = question;
  hasSubmittedAnswer = false;
  resultsReceivedForCurrentQuestion = false;
  selectedAnswer = null;
  selectedWordBlocks = [];

  const thematicMeta = getQuestionThematicMetadata(question);

  questionType.textContent = thematicMeta.badge;
  questionOrder.textContent = `Pregunta ${question.order}`;
  questionPrompt.textContent = thematicMeta.cleanPrompt;
  if (questionThemeTag) {
    questionThemeTag.textContent = `📚 Temática: ${thematicMeta.themeLabel}`;
  }
  if (questionPointsTag) {
    questionPointsTag.textContent = `⚡ Hasta 1000 pts · ${question.timeLimitSeconds}s`;
  }
  if (questionMechanicGuide) {
    questionMechanicGuide.textContent = thematicMeta.shortGuide;
  }
  questionStatus.textContent = "";
  questionStatus.dataset.state = "";
  questionOptions.replaceChildren();
  questionOptions.hidden = question.type !== "MULTIPLE_CHOICE";
  wordBlocksUI.hidden = question.type !== "WORD_BLOCKS";
  textInputUI.hidden = question.type !== "TEXT_INPUT";
  if (voiceUI) voiceUI.hidden = question.type !== "VOICE";
  textAnswer.value = "";
  textAnswer.disabled = false;
  textAnswerClear.hidden = true;
  textAnswerClear.disabled = false;
  if (textAnswerSubmit) textAnswerSubmit.disabled = true;
  if (wordBlocksReset) wordBlocksReset.disabled = false;
  if (wordBlocksSubmit) wordBlocksSubmit.disabled = true;
  questionAnswerHint.hidden = true;

  if (question.type === "MULTIPLE_CHOICE") {
    question.options.forEach((option, index) => {
      const item = document.createElement("li");
      item.className = "question-option question-option--multiple stagger-item";
      item.style.animationDelay = `${index * 70}ms`;

      const button = document.createElement("button");
      button.type = "button";
      button.className = `multiple-choice-option option-color-${index % 4}`;
      button.dataset.answer = option;
      button.setAttribute("aria-pressed", "false");

      const marker = document.createElement("span");
      marker.className = "multiple-choice-marker";
      marker.setAttribute("aria-hidden", "true");
      marker.textContent = index < 26 ? String.fromCharCode(65 + index) : String(index + 1);

      const answer = document.createElement("span");
      answer.textContent = option;

      button.append(marker, answer);
      button.addEventListener("click", () => selectMultipleChoiceAnswer(button));
      item.append(button);
      questionOptions.append(item);
    });
  } else if (question.type === "WORD_BLOCKS") {
    renderWordBlocks(question);
    wordBlocksReset.onclick = () => resetWordBlocks(question);
  } else if (question.type === "VOICE") {
    initVoiceUI();
  }

  const serverTimeMs = Date.parse(question.serverTimestamp);
  const clockSkewAdjustedStart = Number.isFinite(serverTimeMs) ? serverTimeMs : Date.now();
  const remainingFromServer = Math.round((clockSkewAdjustedStart + question.timeLimitSeconds * 1000 - Date.now()) / 1000);
  const effectiveSeconds = typeof options.remainingSeconds === "number"
    ? Math.max(0, options.remainingSeconds)
    : remainingFromServer > 1 && remainingFromServer <= question.timeLimitSeconds + 5
      ? remainingFromServer
      : question.timeLimitSeconds;

  const startQuestionMainTimer = (secondsForQuestion) => {
    window.clearInterval(timerInterval);
    questionDeadline = Date.now() + secondsForQuestion * 1000;
    questionProgress.max = question.timeLimitSeconds;
    questionProgress.value = Math.min(question.timeLimitSeconds, secondsForQuestion);
    questionTimer.classList.remove("is-expired");

    const updateTimer = () => {
      const secondsLeft = Math.max(0, Math.ceil((questionDeadline - Date.now()) / 1000));
      const minutes = Math.floor(secondsLeft / 60);
      const seconds = secondsLeft % 60;
      const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
      questionTimer.textContent = formattedTime;
      questionTimer.setAttribute("aria-label", `${secondsLeft} segundos restantes`);
      questionProgress.value = secondsLeft;
      if (waitingTimerValue) {
        waitingTimerValue.textContent = formattedTime;
      }

      if (secondsLeft === 0) {
        expireQuestion();
      }
    };

    updateTimer();
    if (questionProgress.value > 0) {
      timerInterval = window.setInterval(updateTimer, 1000);
    }
  };

  document.title = `Pregunta ${question.order} | English Day`;

  if (options.alreadySubmittedAnswer != null) {
    hasSubmittedAnswer = true;
    selectedAnswer = options.alreadySubmittedAnswer;
    lockQuestionInputs();
    startQuestionMainTimer(effectiveSeconds);
    showWaitingForOthersScreen(options.alreadySubmittedAnswer);
    return;
  }

  const configuredIntroSeconds = options.skipIntro
    ? 0
    : Number.isInteger(question.introDurationSeconds)
      ? Math.max(0, Math.min(15, question.introDurationSeconds))
      : 3;

  if (questionTransitionCard && configuredIntroSeconds > 0 && effectiveSeconds >= 4) {
    const introDurationSeconds = configuredIntroSeconds;
    let introStep = introDurationSeconds;

    if (transitionMechanicBadge) {
      transitionMechanicBadge.textContent = `English Day · ${thematicMeta.badge}`;
    }
    if (transitionQuestionNumber) {
      transitionQuestionNumber.textContent = `#${question.order}`;
    }
    if (transitionHeading) {
      transitionHeading.textContent = `¡Pregunta ${question.order}!`;
    }
    if (transitionThemePill) {
      transitionThemePill.textContent = `📚 ${thematicMeta.themeLabel}`;
    }
    if (transitionTimePill) {
      transitionTimePill.textContent = `⏱ ${question.timeLimitSeconds}s para responder · 1000 pts máx.`;
    }
    if (transitionMechanicTitle) {
      transitionMechanicTitle.textContent = thematicMeta.title;
    }
    if (transitionMechanicDesc) {
      transitionMechanicDesc.textContent = thematicMeta.desc;
    }
    if (transitionSubtext) {
      transitionSubtext.textContent = `Comenzando en ${introStep} ${introStep === 1 ? "segundo" : "segundos"}...`;
    }
    if (transitionCountdownTimer) {
      transitionCountdownTimer.textContent = `00:${String(introStep).padStart(2, "0")}`;
    }
    if (transitionProgressBar) {
      transitionProgressBar.max = introDurationSeconds;
      transitionProgressBar.value = introStep;
    }

    startQuestionMainTimer(effectiveSeconds + introDurationSeconds);
    showOnlyCard(questionTransitionCard);

    transitionInterval = window.setInterval(() => {
      introStep = Math.max(1, introStep - 1);
      if (transitionCountdownTimer) {
        transitionCountdownTimer.textContent = `00:${String(introStep).padStart(2, "0")}`;
      }
      if (transitionProgressBar) {
        transitionProgressBar.value = introStep;
      }
      if (transitionSubtext) {
        transitionSubtext.textContent = `Comenzando en ${introStep} ${introStep === 1 ? "segundo" : "segundos"}...`;
      }
    }, 950);

    transitionTimeout = window.setTimeout(() => {
      window.clearInterval(transitionInterval);
      if (!resultsReceivedForCurrentQuestion && !hasSubmittedAnswer) {
        startQuestionMainTimer(question.timeLimitSeconds);
        showOnlyCard(questionCard);
        questionPrompt.focus();
      }
    }, introDurationSeconds * 950);
  } else {
    startQuestionMainTimer(effectiveSeconds);
    showOnlyCard(questionCard);
    questionPrompt.focus();
  }
}

/**
 * Corrector: pinta la respuesta del aprendiz palabra por palabra (subrayado ondulado rojo = incorrecta,
 * amarillo = error ortográfico leve, recuadro punteado = palabra faltante) y muestra la explicación
 * pedagógica de por qué la respuesta correcta es la que es.
 */
function renderCorrectorAndExplanation(serverVerdict, payload) {
  const corrector = document.querySelector("#answerCorrector");
  const correctorText = document.querySelector("#answerCorrectorText");
  const correctorHints = document.querySelector("#answerCorrectorHints");
  const explanationBox = document.querySelector("#answerExplanation");
  const explanationText = document.querySelector("#answerExplanationText");

  if (corrector && correctorText && correctorHints) {
    correctorText.replaceChildren();
    correctorHints.replaceChildren();
    const segments = Array.isArray(serverVerdict?.segments) ? serverVerdict.segments : [];
    const hasMarks = segments.some((seg) => seg.status && seg.status !== "OK");
    // Se muestra el corrector cuando hay algo que revisar (errores o descuidos ortográficos)
    if (segments.length > 0 && hasMarks) {
      segments.forEach((seg) => {
        const word = document.createElement("span");
        const status = String(seg.status || "OK").toLowerCase();
        word.className = `corr-word corr-${status}`;
        word.textContent = seg.text;
        if ((status === "wrong" || status === "typo") && seg.expected) {
          const hint = document.createElement("small");
          hint.textContent = `→ ${seg.expected}`;
          word.append(hint);
          word.title = `Debería ser: ${seg.expected}`;
        } else if (status === "missing") {
          word.title = "Palabra que faltaba";
        }
        correctorText.append(word);
      });
      (serverVerdict.hints || []).forEach((hintText) => {
        const li = document.createElement("li");
        li.textContent = hintText;
        correctorHints.append(li);
      });
      corrector.hidden = false;
    } else {
      corrector.hidden = true;
    }
  }

  if (explanationBox && explanationText) {
    const explanation = typeof payload?.explanation === "string" ? payload.explanation.trim() : "";
    explanationText.textContent = explanation;
    explanationBox.hidden = explanation.length === 0;
  }
}

/**
 * Tarea 10: Pantalla de resultados al cerrar cada pregunta (/topic/room/{roomId}/results).
 * Payload según Contrato §4.5 + veredictos autoritativos del servidor:
 * { "correctAnswer": "went", "top5": [...], "playerVerdicts": { [playerId]: { isCorrect, pointsAwarded, submittedValue } } }
 */
function renderResultsScreen(payload) {
  if (!payload || typeof payload !== "object" || typeof payload.correctAnswer !== "string" || !Array.isArray(payload.top5)) {
    throw new Error("El servidor envió resultados de ronda inválidos.");
  }

  resultsReceivedForCurrentQuestion = true;
  window.clearInterval(timerInterval);
  window.clearTimeout(autoCloseTimeout);
  window.clearTimeout(transitionTimeout);
  window.clearInterval(transitionInterval);
  stopVoiceRecognition();

  const serverVerdict = currentPlayer?.playerId && payload.playerVerdicts
    ? payload.playerVerdicts[currentPlayer.playerId]
    : null;

  if (playerVerdictBanner) {
    if (!hasSubmittedAnswer && !serverVerdict) {
      playerVerdictBanner.dataset.verdict = "expired";
      if (playerVerdictIcon) playerVerdictIcon.textContent = "⏰";
      if (resultsTitle) resultsTitle.textContent = "¡Tiempo agotado!";
      if (playerVerdictDetail) {
        playerVerdictDetail.textContent = "No alcanzaste a enviar tu respuesta (0 puntos en esta ronda).";
      }
    } else {
      let isCorrect;
      let pointsEarned = 0;
      let displayedAnswer = formatAnswerDisplay(selectedAnswer);

      if (serverVerdict && typeof serverVerdict.isCorrect === "boolean") {
        isCorrect = serverVerdict.isCorrect;
        pointsEarned = serverVerdict.pointsAwarded ?? 0;
        if (serverVerdict.submittedValue) {
          displayedAnswer = serverVerdict.submittedValue;
        }
      } else {
        const normalizedSubmitted = normalizeAnswerForComparison(selectedAnswer);
        const normalizedExpected = normalizeAnswerForComparison(payload.correctAnswer);
        isCorrect = normalizedSubmitted.length > 0 && normalizedSubmitted === normalizedExpected;
      }

      playerVerdictBanner.dataset.verdict = isCorrect ? "correct" : "incorrect";
      if (playerVerdictIcon) playerVerdictIcon.textContent = isCorrect ? "✔" : "✖";
      if (resultsTitle) {
        resultsTitle.textContent = isCorrect
          ? pointsEarned > 0
            ? `¡Respuesta Correcta! (+${pointsEarned} pts)`
            : "¡Respuesta Correcta!"
          : "Respuesta Incorrecta";
      }
      if (playerVerdictDetail) {
        playerVerdictDetail.textContent = `Tu respuesta: "${displayedAnswer}"`;
      }
      if (isCorrect && window.confetti) {
        window.confetti.burst(window.innerWidth / 2, window.innerHeight / 3, 45);
      }
    }
  }

  renderCorrectorAndExplanation(serverVerdict, payload);
  resultsCorrectAnswer.textContent = payload.correctAnswer;
  resultsTop5List.replaceChildren();

  if (payload.top5.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "leaderboard-item";
    emptyItem.textContent = "Aún no hay puntajes registrados en esta ronda.";
    resultsTop5List.append(emptyItem);
  } else {
    payload.top5.forEach((entry, index) => {
      if (entry.nickname && !knownRoomPlayers.some((p) => p.name === entry.nickname)) {
        knownRoomPlayers.push({ name: entry.nickname });
      }
      const item = document.createElement("li");
      item.className = "leaderboard-item stagger-item";
      item.style.animationDelay = `${index * 65}ms`;
      if (currentPlayer && entry.nickname === currentPlayer.nickname) {
        item.classList.add("is-current-player");
      }

      const rankBadge = document.createElement("span");
      rankBadge.className = `leaderboard-rank rank-${index + 1}`;
      rankBadge.textContent = `#${index + 1}`;

      const nameSpan = document.createElement("span");
      nameSpan.className = "leaderboard-name";
      nameSpan.textContent = entry.nickname;

      const scoreSpan = document.createElement("strong");
      scoreSpan.className = "leaderboard-score";
      scoreSpan.textContent = `${entry.score ?? 0} pts`;

      item.append(rankBadge, nameSpan, scoreSpan);
      resultsTop5List.append(item);
    });
  }

  showOnlyCard(resultsCard);
  document.title = "Resultados Top 5 | English Day";
  resultsTitle?.focus();
}

/**
 * Tarea 11: Pantalla de Ruleta de Retroalimentación (/topic/room/{roomId}/roulette).
 * Payload: { roomId, playerId, nickname, questionId, value, isCorrect, timestamp }
 */
function renderRouletteScreen(payload) {
  if (!payload || typeof payload !== "object" || typeof payload.nickname !== "string") {
    throw new Error("El servidor envió un resultado de ruleta inválido.");
  }

  window.clearInterval(timerInterval);
  window.clearTimeout(autoCloseTimeout);
  window.clearTimeout(transitionTimeout);
  window.clearInterval(transitionInterval);
  stopVoiceRecognition();

  const isChosen = currentPlayer && (
    payload.playerId === currentPlayer.playerId || payload.nickname === currentPlayer.nickname
  );

  rouletteBadge.textContent = isChosen
    ? "¡Te tocó explicar tu respuesta!"
    : "Aprendiz seleccionado al azar";
  rouletteWinnerName.textContent = payload.nickname;
  rouletteAnswerValue.textContent = payload.value
    ? `"${payload.value}"`
    : "Sin respuesta registrada a tiempo";
  rouletteAnswerVerdict.textContent = payload.isCorrect
    ? "✔ Respuesta correcta"
    : "✖ Respuesta por reforzar en grupo";
  rouletteAnswerVerdict.dataset.correct = String(Boolean(payload.isCorrect));

  showOnlyCard(rouletteCard);
  document.title = "Ruleta de Retroalimentación | English Day";

  if (!playerRouletteWheel && window.ActiveFeedbackRoulette) {
    playerRouletteWheel = new window.ActiveFeedbackRoulette("playerRouletteCanvas");
  }

  if (playerRouletteWheel) {
    if (rouletteTitle) rouletteTitle.textContent = "🎡 Girando la ruleta...";
    if (rouletteBanner) rouletteBanner.hidden = true;
    if (rouletteAnswerBox) rouletteAnswerBox.hidden = true;

    const wheelList = knownRoomPlayers.length > 0 ? [...knownRoomPlayers] : [];
    if (!wheelList.some((p) => p.name.toLowerCase() === payload.nickname.toLowerCase())) {
      wheelList.push({ name: payload.nickname });
    }
    if (wheelList.length === 1 && currentPlayer?.nickname && currentPlayer.nickname !== payload.nickname) {
      wheelList.push({ name: currentPlayer.nickname });
    }

    playerRouletteWheel.resize(260);
    playerRouletteWheel.setPlayers(wheelList);
    playerRouletteWheel.spin(() => {
      if (rouletteTitle) {
        rouletteTitle.textContent = isChosen
          ? "🎯 ¡Fuiste seleccionado por la ruleta!"
          : "🎯 ¡Aprendiz seleccionado al azar!";
      }
      if (rouletteBanner) {
        rouletteBanner.hidden = false;
        rouletteBanner.classList.remove("card-enter");
        void rouletteBanner.offsetWidth;
        rouletteBanner.classList.add("card-enter");
      }
      if (rouletteAnswerBox) {
        rouletteAnswerBox.hidden = false;
        rouletteAnswerBox.classList.remove("card-enter");
        void rouletteAnswerBox.offsetWidth;
        rouletteAnswerBox.classList.add("card-enter");
      }
    }, payload.nickname);
  } else {
    if (rouletteTitle) rouletteTitle.textContent = "¡Aprendiz seleccionado al azar!";
    if (rouletteBanner) rouletteBanner.hidden = false;
    if (rouletteAnswerBox) rouletteAnswerBox.hidden = false;
  }

  rouletteTitle?.focus();
}

/**
 * Tarea 12: Pantalla de Podio Final Top 3 (/topic/room/{roomId}/podium).
 * Payload: { roomId, status: "FINISHED", top3: [{ nickname, score }], totalPlayers, timestamp }
 */
function renderPodiumScreen(payload) {
  const top3 = payload?.top3 || payload?.podium;
  if (!payload || typeof payload !== "object" || !Array.isArray(top3)) {
    throw new Error("El servidor envió un podio final inválido.");
  }

  window.clearInterval(timerInterval);
  window.clearTimeout(autoCloseTimeout);
  window.clearTimeout(transitionTimeout);
  window.clearInterval(transitionInterval);
  stopVoiceRecognition();

  podiumTop3List.replaceChildren();
  const medals = ["🥇 1.° Lugar", "🥈 2.° Lugar", "🥉 3.° Lugar"];

  if (top3.length === 0) {
    const empty = document.createElement("li");
    empty.className = "podium-item";
    empty.textContent = "Partida finalizada sin participantes registrados.";
    podiumTop3List.append(empty);
  } else {
    top3.forEach((entry, index) => {
      const item = document.createElement("li");
      item.className = `podium-item podium-place-${index + 1} stagger-item`;
      item.style.animationDelay = `${index * 110}ms`;
      if (currentPlayer && entry.nickname === currentPlayer.nickname) {
        item.classList.add("is-current-player");
      }

      const medal = document.createElement("span");
      medal.className = "podium-medal";
      medal.textContent = medals[index] || `#${index + 1}`;

      const name = document.createElement("strong");
      name.className = "podium-name";
      name.textContent = entry.nickname;

      const score = document.createElement("span");
      score.className = "podium-score";
      score.textContent = `${entry.score ?? 0} pts`;

      item.append(medal, name, score);
      podiumTop3List.append(item);
    });
  }

  if (typeof payload.totalPlayers === "number") {
    podiumTotalPlayers.textContent = `Total de aprendices participantes: ${payload.totalPlayers}`;
  } else {
    podiumTotalPlayers.textContent = "";
  }

  clearPlayerSession();
  showOnlyCard(podiumCard);
  document.title = "¡Podio Final! | English Day";
  podiumTitle?.focus();
}

function parseStompMessage(frame) {
  const separator = frame.indexOf("\n\n");
  if (separator === -1) {
    throw new Error("El servidor envió una trama STOMP inválida.");
  }

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

function handleStompFrame(frame, roomId, currentPlayerId) {
  const { command, headers, body } = parseStompMessage(frame);

  if (command === "CONNECTED") {
    const topics = ["lobby", "status", "question", "results", "roulette", "podium"];
    topics.forEach((topic) => {
      lobbySocket.send(`SUBSCRIBE\nid:${topic}-${roomId}\ndestination:/topic/room/${roomId}/${topic}\nack:auto\n\n\0`);
    });
    lobbySocket.send(`SEND\ndestination:/app/room/${roomId}/lobby/sync\n\n\0`);
    setLobbyStatus("Conectado. Actualizando aprendices en tiempo real.", "connected");
    return;
  }

  if (command === "MESSAGE") {
    let payload;
    try {
      payload = JSON.parse(body);
    } catch {
      throw new Error("El servidor envió un mensaje JSON inválido.");
    }

    const destination = headers.get("destination");
    if (destination === `/topic/room/${roomId}/lobby`) {
      const playersList = Array.isArray(payload) ? payload : payload?.players;
      if (!Array.isArray(playersList) || playersList.some((player) =>
        !player || typeof player.playerId !== "string" || typeof player.nickname !== "string"
      )) {
        throw new Error("El servidor envió una lista de aprendices inválida.");
      }

      renderLobbyPlayers(playersList, currentPlayerId);
    } else if (destination === `/topic/room/${roomId}/question`) {
      renderQuestion(payload);
    } else if (destination === `/topic/room/${roomId}/results`) {
      renderResultsScreen(payload);
    } else if (destination === `/topic/room/${roomId}/roulette`) {
      renderRouletteScreen(payload);
    } else if (destination === `/topic/room/${roomId}/podium`) {
      renderPodiumScreen(payload);
    } else if (destination === `/topic/room/${roomId}/status`) {
      // Estado sincronizado por topic /status
    } else {
      throw new Error("El servidor envió un mensaje desde un canal no esperado.");
    }
    return;
  }

  if (command === "ERROR") {
    throw new Error(body.trim() || "El servidor rechazó la conexión al lobby.");
  }
}

function showConnectionError(message) {
  if (!lobbyCard.hidden) {
    setLobbyStatus(message, "error");
  } else {
    questionStatus.textContent = message;
    questionStatus.dataset.state = "error";
  }
}

function subscribeToLobby(roomId, player) {
  if (lobbySocket && lobbySocket.readyState === WebSocket.OPEN) {
    isLeavingIntentionally = true;
    try {
      lobbySocket.close();
    } catch {
      // Ignorar
    }
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const url = `${protocol}//${window.location.host}/ws-englishday`;

  currentRoomId = roomId;
  currentPlayer = player;
  isLeavingIntentionally = false;
  if (btnLeaveLobby) {
    btnLeaveLobby.disabled = false;
    btnLeaveLobby.textContent = "🚪 Salir de la sala de espera";
  }

  renderLobbyPlayers([player], player.playerId);
  setLobbyStatus("Conectando al lobby en tiempo real...", "loading");
  lobbySocket = new WebSocket(url);

  let incoming = "";
  lobbySocket.addEventListener("open", () => {
    lobbySocket.send(`CONNECT\naccept-version:1.2,1.1,1.0\nhost:${window.location.host}\nheart-beat:0,0\n\n\0`);
  });
  lobbySocket.addEventListener("message", (event) => {
    incoming += event.data;
    let frameEnd = incoming.indexOf("\0");

    while (frameEnd !== -1) {
      const frame = incoming.slice(0, frameEnd).replace(/^\n+/, "");
      incoming = incoming.slice(frameEnd + 1);

      if (frame) {
        try {
          handleStompFrame(frame, roomId, player.playerId);
        } catch (error) {
          showConnectionError(error.message);
          lobbySocket.close();
          return;
        }
      }

      frameEnd = incoming.indexOf("\0");
    }
  });
  lobbySocket.addEventListener("error", () => {
    if (!isLeavingIntentionally) {
      showConnectionError("No se pudo conectar a la partida en tiempo real.");
    }
  });
  lobbySocket.addEventListener("close", () => {
    if (
      !isLeavingIntentionally &&
      lobbyStatus.dataset.state !== "error" &&
      questionStatus.dataset.state !== "error"
    ) {
      showConnectionError("Se perdió la conexión con la partida. Actualiza la página para volver a ingresar.");
    }
  });
}

async function restorePlayerSessionFromServer(session, isAutoRestore = false) {
  const response = await fetch(
    `/api/rooms/${encodeURIComponent(session.pin)}/state?playerId=${encodeURIComponent(session.playerId)}`
  );
  if (!response.ok) {
    if (isAutoRestore) {
      clearPlayerSession();
    }
    return false;
  }

  const state = await response.json();
  if (!state.player || state.status === "FINISHED") {
    clearPlayerSession();
    if (!isAutoRestore && state.status === "FINISHED" && state.podium) {
      renderPodiumScreen(state.podium);
      return true;
    }
    return false;
  }

  savePlayerSession({
    pin: state.pin,
    roomId: state.roomId,
    playerId: state.player.playerId,
    nickname: state.player.nickname,
  });

  lobbyPin.textContent = `PIN de la partida: ${state.pin}`;
  subscribeToLobby(state.roomId, {
    playerId: state.player.playerId,
    nickname: state.player.nickname,
  });

  if (Array.isArray(state.players)) {
    renderLobbyPlayers(state.players, state.player.playerId);
  }

  if (state.status === "WAITING_LOBBY") {
    showOnlyCard(lobbyCard);
    if (isAutoRestore) {
      setLobbyStatus(`Sesión restaurada como ${state.player.nickname}. Esperando inicio de la partida...`, "connected");
    }
  } else if (state.status === "QUESTION_IN_PROGRESS") {
    if (state.questionClosed && state.lastResults) {
      currentQuestion = state.currentQuestion || null;
      hasSubmittedAnswer = state.playerSubmittedAnswer != null;
      selectedAnswer = state.playerSubmittedAnswer;
      renderResultsScreen(state.lastResults);
    } else if (state.currentQuestion) {
      renderQuestion(state.currentQuestion, {
        skipIntro: true,
        remainingSeconds: state.remainingSeconds,
        alreadySubmittedAnswer: state.playerSubmittedAnswer,
      });
    } else {
      showOnlyCard(lobbyCard);
    }
  } else if (state.status === "ROULETTE_TIME") {
    currentQuestion = state.currentQuestion || null;
    if (state.lastRoulette) {
      renderRouletteScreen(state.lastRoulette);
    } else if (state.lastResults) {
      renderResultsScreen(state.lastResults);
    } else {
      showOnlyCard(lobbyCard);
    }
  }

  return true;
}

function resetLocalPlayerUIState() {
  isLeavingIntentionally = true;
  window.clearInterval(timerInterval);
  window.clearTimeout(autoCloseTimeout);
  window.clearTimeout(transitionTimeout);
  window.clearInterval(transitionInterval);
  stopVoiceRecognition();

  if (lobbySocket) {
    try {
      lobbySocket.close();
    } catch {
      // Ignorar
    }
    lobbySocket = null;
  }

  clearPlayerSession();

  currentRoomId = null;
  currentPlayer = null;
  currentQuestion = null;
  knownRoomPlayers = [];
  lobbyPlayers.replaceChildren();
  playerCount.textContent = "0";
  lobbyStatus.textContent = "";
  delete lobbyStatus.dataset.state;

  if (btnLeaveLobby) {
    btnLeaveLobby.disabled = false;
    btnLeaveLobby.textContent = "🚪 Salir de la sala de espera";
  }
}

async function leaveCurrentLobby() {
  if (!currentRoomId || !currentPlayer?.playerId) {
    resetLocalPlayerUIState();
    showOnlyCard(joinCard);
    return;
  }

  const roomIdToLeave = currentRoomId;
  const playerIdToLeave = currentPlayer.playerId;

  if (btnLeaveLobby) {
    btnLeaveLobby.disabled = true;
    btnLeaveLobby.textContent = "Saliendo de la sala...";
  }

  isLeavingIntentionally = true;

  try {
    await fetch(
      `/api/rooms/${encodeURIComponent(roomIdToLeave)}/players/${encodeURIComponent(playerIdToLeave)}`,
      { method: "DELETE" }
    );
  } catch {
    // Continuar desconexión local aunque el servidor no responda
  }

  resetLocalPlayerUIState();
  showOnlyCard(joinCard);
  document.title = "Unirse a la partida | English Day";
  formMessage.dataset.state = "loading";
  formMessage.textContent = "Saliste de la sala de espera. Puedes ingresar a otra partida cuando quieras.";
  nicknameInput?.focus();
}

if (btnLeaveLobby) {
  btnLeaveLobby.addEventListener("click", leaveCurrentLobby);
}

if (btnBackToStart) {
  btnBackToStart.addEventListener("click", () => {
    resetLocalPlayerUIState();
    showOnlyCard(joinCard);
    document.title = "Unirse a la partida | English Day";
    formMessage.textContent = "";
    nicknameInput?.focus();
  });
}

window.addEventListener("beforeunload", () => {
  window.clearInterval(timerInterval);
  stopVoiceRecognition();
  if (lobbySocket && lobbySocket.readyState === WebSocket.OPEN) {
    isLeavingIntentionally = true;
    lobbySocket.close();
  }
});

joinForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  formMessage.textContent = "";

  const pin = pinInputs.map((input) => input.value).join("");
  const nickname = nicknameInput.value.trim();

  if (!/^\d{6}$/.test(pin)) {
    formMessage.dataset.state = "error";
    formMessage.textContent = "El PIN debe tener 6 dígitos.";
    pinInputs[0]?.focus();
    return;
  }

  if (!nickname) {
    formMessage.dataset.state = "error";
    formMessage.textContent = "Escribe tu nombre o nickname.";
    nicknameInput.focus();
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Ingresando...";
  formMessage.dataset.state = "loading";
  formMessage.textContent = "Conectando con la partida...";

  try {
    const response = await fetch(`/api/rooms/${encodeURIComponent(pin)}/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nickname }),
    });
    let result;
    try {
      result = await response.json();
    } catch {
      if (!response.ok) {
        throw new Error(`No se pudo ingresar (HTTP ${response.status}).`);
      }
      throw new Error("El servidor respondió con un JSON inválido.");
    }

    if (!response.ok) {
      throw new Error(result.error || `No se pudo ingresar (HTTP ${response.status}).`);
    }

    formMessage.dataset.state = "success";
    formMessage.textContent = `Te uniste a la partida como ${result.nickname}.`;
    if (typeof result.roomId !== "string" || typeof result.playerId !== "string") {
      throw new Error("El servidor no devolvió los datos de la sala necesarios para abrir el lobby.");
    }

    const sessionPayload = {
      pin,
      roomId: result.roomId,
      playerId: result.playerId,
      nickname: result.nickname,
    };
    savePlayerSession(sessionPayload);

    const restored = await restorePlayerSessionFromServer(sessionPayload, false).catch(() => false);
    if (!restored) {
      showOnlyCard(lobbyCard);
      lobbyPin.textContent = `PIN de la partida: ${pin}`;
      subscribeToLobby(result.roomId, {
        playerId: result.playerId,
        nickname: result.nickname,
      });
    }
  } catch (error) {
    formMessage.dataset.state = "error";
    formMessage.textContent = error instanceof TypeError
      ? "No se pudo conectar. Revisa que el servidor esté activo y que la página use el mismo origen."
      : error.message;
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Ingresar a la partida";
  }
});