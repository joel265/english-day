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
const rouletteCard = document.querySelector("#rouletteCard");
const rouletteTitle = document.querySelector("#rouletteTitle");
const rouletteBadge = document.querySelector("#rouletteBadge");
const rouletteWinnerName = document.querySelector("#rouletteWinnerName");
const rouletteAnswerValue = document.querySelector("#rouletteAnswerValue");
const rouletteAnswerVerdict = document.querySelector("#rouletteAnswerVerdict");
const podiumCard = document.querySelector("#podiumCard");
const podiumTitle = document.querySelector("#podiumTitle");
const podiumTop3List = document.querySelector("#podiumTop3List");
const podiumTotalPlayers = document.querySelector("#podiumTotalPlayers");

let lobbySocket;
let timerInterval;
let autoCloseTimeout;
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
}

function showOnlyCard(activeCard) {
  [joinCard, lobbyCard, questionCard, waitingAnswerCard, resultsCard, rouletteCard, podiumCard].forEach((card) => {
    if (card) card.hidden = card !== activeCard;
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
    .trim()
    .toLowerCase()
    .replace(/[.,;:!?¿¡"]/g, "")
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

  players.forEach((player) => {
    const item = document.createElement("li");
    item.className = "lobby-player";
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

function renderQuestion(question) {
  validateQuestion(question);
  window.clearInterval(timerInterval);
  window.clearTimeout(autoCloseTimeout);
  stopVoiceRecognition();
  currentQuestion = question;
  hasSubmittedAnswer = false;
  resultsReceivedForCurrentQuestion = false;
  selectedAnswer = null;
  selectedWordBlocks = [];

  const typeLabels = {
    MULTIPLE_CHOICE: "Selección múltiple",
    WORD_BLOCKS: "Ordena los bloques",
    TEXT_INPUT: "Respuesta escrita",
    VOICE: "Respuesta por voz",
  };

  questionType.textContent = typeLabels[question.type];
  questionOrder.textContent = `Pregunta ${question.order}`;
  questionPrompt.textContent = question.prompt;
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
      item.className = "question-option question-option--multiple";

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
  const effectiveSeconds = remainingFromServer > 1 && remainingFromServer <= question.timeLimitSeconds + 5
    ? remainingFromServer
    : question.timeLimitSeconds;

  questionDeadline = Date.now() + effectiveSeconds * 1000;
  questionProgress.max = question.timeLimitSeconds;
  questionProgress.value = Math.min(question.timeLimitSeconds, effectiveSeconds);
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

  showOnlyCard(questionCard);
  document.title = `Pregunta ${question.order} | English Day`;
  questionPrompt.focus();
}

/**
 * Tarea 10: Pantalla de resultados al cerrar cada pregunta (/topic/room/{roomId}/results).
 * Payload según Contrato §4.5:
 * { "correctAnswer": "went", "top5": [{ "nickname": "camilo_dev", "score": 4200 }] }
 */
function renderResultsScreen(payload) {
  if (!payload || typeof payload !== "object" || typeof payload.correctAnswer !== "string" || !Array.isArray(payload.top5)) {
    throw new Error("El servidor envió resultados de ronda inválidos.");
  }

  resultsReceivedForCurrentQuestion = true;
  window.clearInterval(timerInterval);
  window.clearTimeout(autoCloseTimeout);
  stopVoiceRecognition();

  if (playerVerdictBanner) {
    if (!hasSubmittedAnswer) {
      playerVerdictBanner.dataset.verdict = "expired";
      if (playerVerdictIcon) playerVerdictIcon.textContent = "⏰";
      if (resultsTitle) resultsTitle.textContent = "¡Tiempo agotado!";
      if (playerVerdictDetail) {
        playerVerdictDetail.textContent = "No alcanzaste a enviar tu respuesta (0 puntos en esta ronda).";
      }
    } else {
      const normalizedSubmitted = normalizeAnswerForComparison(selectedAnswer);
      const normalizedExpected = normalizeAnswerForComparison(payload.correctAnswer);
      const isCorrect = normalizedSubmitted.length > 0 && normalizedSubmitted === normalizedExpected;

      playerVerdictBanner.dataset.verdict = isCorrect ? "correct" : "incorrect";
      if (playerVerdictIcon) playerVerdictIcon.textContent = isCorrect ? "✔" : "✖";
      if (resultsTitle) {
        resultsTitle.textContent = isCorrect ? "¡Respuesta Correcta!" : "Respuesta Incorrecta";
      }
      if (playerVerdictDetail) {
        playerVerdictDetail.textContent = `Tu respuesta: "${formatAnswerDisplay(selectedAnswer)}"`;
      }
    }
  }

  resultsCorrectAnswer.textContent = payload.correctAnswer;
  resultsTop5List.replaceChildren();

  if (payload.top5.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "leaderboard-item";
    emptyItem.textContent = "Aún no hay puntajes registrados en esta ronda.";
    resultsTop5List.append(emptyItem);
  } else {
    payload.top5.forEach((entry, index) => {
      const item = document.createElement("li");
      item.className = "leaderboard-item";
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
      item.className = `podium-item podium-place-${index + 1}`;
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
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const url = `${protocol}//${window.location.host}/ws-englishday`;

  currentRoomId = roomId;
  currentPlayer = player;

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
    showConnectionError("No se pudo conectar a la partida en tiempo real.");
  });
  lobbySocket.addEventListener("close", () => {
    if (lobbyStatus.dataset.state !== "error" && questionStatus.dataset.state !== "error") {
      showConnectionError("Se perdió la conexión con la partida. Actualiza la página para volver a ingresar.");
    }
  });
}

window.addEventListener("beforeunload", () => {
  window.clearInterval(timerInterval);
  stopVoiceRecognition();
  if (lobbySocket && lobbySocket.readyState === WebSocket.OPEN) {
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

    try {
      window.sessionStorage.setItem(
        "englishDayPlayerSession",
        JSON.stringify({
          pin,
          roomId: result.roomId,
          playerId: result.playerId,
          nickname: result.nickname,
        })
      );
    } catch {
      // sessionStorage opcional
    }

    showOnlyCard(lobbyCard);
    lobbyPin.textContent = `PIN de la partida: ${pin}`;
    subscribeToLobby(result.roomId, {
      playerId: result.playerId,
      nickname: result.nickname,
    });
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