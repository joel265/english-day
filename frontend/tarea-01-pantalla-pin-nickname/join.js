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
const questionMeta = document.querySelector("#questionMeta");
const questionTitle = document.querySelector("#questionTitle");
const questionPrompt = document.querySelector("#questionPrompt");
const questionTimer = document.querySelector("#questionTimer");
const answerForm = document.querySelector("#answerForm");
const answerControls = document.querySelector("#answerControls");
const answerStatus = document.querySelector("#answerStatus");
const sendAnswerButton = document.querySelector("#sendAnswerButton");
const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const questionTypes = new Set(["MULTIPLE_CHOICE", "WORD_BLOCKS", "TEXT_INPUT", "VOICE"]);
let lobbySocket;
let activeRoomId;
let activePlayerId;
let activeQuestion;
let selectedWordBlocks = [];
let voiceTranscript = "";
let voiceCaptureToken = 0;
let answerSent = false;
let questionExpired = false;
let questionTimerInterval;

function setLobbyStatus(message, state) {
  lobbyStatus.textContent = message;
  lobbyStatus.dataset.state = state;
}

function setAnswerStatus(message, state) {
  answerStatus.textContent = message;
  if (state) {
    answerStatus.dataset.state = state;
  } else {
    delete answerStatus.dataset.state;
  }
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

function parseQuestion(body) {
  let question;
  try {
    question = JSON.parse(body);
  } catch {
    throw new Error("El servidor envió una pregunta con JSON inválido.");
  }

  if (!question || typeof question !== "object" || Array.isArray(question)) {
    throw new Error("El servidor envió una pregunta inválida.");
  }

  if (Object.prototype.hasOwnProperty.call(question, "correctAnswer")) {
    throw new Error("La pregunta incluyó correctAnswer, que no debe mostrarse al jugador.");
  }

  if (typeof question.questionId !== "string" || !uuidV4Pattern.test(question.questionId)) {
    throw new Error("La pregunta no contiene un questionId UUID v4 válido.");
  }

  if (!questionTypes.has(question.type) || typeof question.prompt !== "string" || !question.prompt.trim()) {
    throw new Error("La pregunta no contiene el type o prompt definidos en el Contrato.");
  }

  if (!Number.isInteger(question.timeLimitSeconds) || question.timeLimitSeconds <= 0 ||
      !Number.isInteger(question.order) || question.order <= 0) {
    throw new Error("La pregunta contiene timeLimitSeconds u order inválidos.");
  }

  const utcTimestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
  if (typeof question.serverTimestamp !== "string" ||
      !utcTimestampPattern.test(question.serverTimestamp) ||
      !Number.isFinite(Date.parse(question.serverTimestamp))) {
    throw new Error("La pregunta no contiene un serverTimestamp ISO-8601 UTC válido.");
  }

  if (question.options !== null &&
      (!Array.isArray(question.options) || question.options.some((option) => typeof option !== "string"))) {
    throw new Error("La pregunta contiene options con una estructura inválida.");
  }

  if ((question.type === "MULTIPLE_CHOICE" || question.type === "WORD_BLOCKS") &&
      (!Array.isArray(question.options) || question.options.length === 0)) {
    throw new Error(`La pregunta ${question.type} debe contener opciones.`);
  }

  return question;
}

function createWordBlockControls(question) {
  selectedWordBlocks = [];
  const instructions = document.createElement("p");
  instructions.className = "field-help";
  instructions.textContent = "Selecciona los bloques en el orden de tu respuesta.";

  const selection = document.createElement("p");
  selection.className = "word-block-selection";
  selection.setAttribute("aria-live", "polite");
  selection.textContent = "Tu respuesta ordenada aparecerá aquí.";

  const options = document.createElement("div");
  options.className = "word-block-options";

  // Supuesto pendiente de validar con Backend/QA: options contiene los bloques como strings para WORD_BLOCKS.
  question.options.forEach((word, index) => {
    const button = document.createElement("button");
    button.className = "word-block-option";
    button.type = "button";
    button.textContent = word;
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => {
      const selectedIndex = selectedWordBlocks.indexOf(index);
      if (selectedIndex === -1) {
        selectedWordBlocks.push(index);
      } else {
        selectedWordBlocks.splice(selectedIndex, 1);
      }

      button.setAttribute("aria-pressed", String(selectedWordBlocks.includes(index)));
      selection.textContent = selectedWordBlocks.length
        ? selectedWordBlocks.map((blockIndex) => question.options[blockIndex]).join(" ")
        : "Tu respuesta ordenada aparecerá aquí.";
      sendAnswerButton.disabled = answerSent || questionExpired || selectedWordBlocks.length === 0;
    });
    options.append(button);
  });

  answerControls.append(instructions, selection, options);
}

function createVoiceControls() {
  const captureToken = ++voiceCaptureToken;
  voiceTranscript = "";
  const status = document.createElement("p");
  status.className = "answer-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.textContent = "Inicia el micrófono y habla en inglés.";

  const transcriptLabel = document.createElement("p");
  transcriptLabel.className = "field-help";
  transcriptLabel.textContent = "Transcripción detectada:";

  const transcript = document.createElement("p");
  transcript.className = "word-block-selection";
  transcript.setAttribute("aria-live", "polite");
  transcript.textContent = "Tu transcripción aparecerá aquí.";

  const buttons = document.createElement("div");
  buttons.className = "voice-controls";

  const startButton = document.createElement("button");
  startButton.className = "voice-button";
  startButton.type = "button";
  startButton.textContent = "Iniciar micrófono";

  const stopButton = document.createElement("button");
  stopButton.className = "voice-button secondary";
  stopButton.type = "button";
  stopButton.textContent = "Detener micrófono";
  stopButton.disabled = true;

  const setListening = (isListening) => {
    startButton.disabled = isListening || answerSent;
    stopButton.disabled = !isListening || answerSent;
    startButton.setAttribute("aria-pressed", String(isListening));
  };

  if (!window.isSecureContext) {
    startButton.disabled = true;
    status.textContent = "Para usar el micrófono, abre esta página en HTTPS o localhost.";
    status.dataset.state = "error";
  } else if (!window.speechService?.isSupported) {
    startButton.disabled = true;
    status.textContent = "Este navegador no ofrece reconocimiento de voz compatible.";
    status.dataset.state = "error";
  } else {
    startButton.addEventListener("click", () => {
      transcript.textContent = "Aún no se ha detectado voz.";
      status.textContent = "Solicitando acceso al micrófono…";
      delete status.dataset.state;
      startButton.disabled = true;

      window.speechService.startListening({
        onStart: () => {
          if (captureToken !== voiceCaptureToken) return;
          setListening(true);
          status.textContent = "Escuchando. Habla ahora en inglés.";
        },
        onInterim: (text) => {
          if (captureToken !== voiceCaptureToken) return;
          transcript.textContent = text;
        },
        onTranscript: (text) => {
          if (captureToken !== voiceCaptureToken) return;
          voiceTranscript = text;
          transcript.textContent = text;
          sendAnswerButton.disabled = answerSent || questionExpired || !voiceTranscript;
          status.textContent = "Transcripción lista. Aún no se ha enviado.";
        },
        onEnd: () => {
          if (captureToken !== voiceCaptureToken) return;
          setListening(false);
          if (!status.dataset.state) {
            status.textContent = voiceTranscript
              ? "Transcripción lista. Puedes enviarla."
              : "No se reconoció voz. Puedes intentarlo de nuevo.";
          }
        },
        onError: (message) => {
          if (captureToken !== voiceCaptureToken) return;
          setListening(false);
          status.textContent = message;
          status.dataset.state = "error";
        }
      });
    });

    stopButton.addEventListener("click", () => {
      window.speechService.stopListening();
    });
  }

  buttons.append(startButton, stopButton);
  answerControls.append(status, transcriptLabel, transcript, buttons);
}

function renderQuestion(question) {
  if (activeQuestion?.questionId === question.questionId) {
    return;
  }

  clearInterval(questionTimerInterval);
  voiceCaptureToken += 1;
  if (window.speechService?.isListening) {
    window.speechService.stopListening();
  }

  activeQuestion = question;
  selectedWordBlocks = [];
  voiceTranscript = "";
  answerSent = false;
  questionExpired = false;
  questionMeta.textContent = `Pregunta ${question.order} · ${question.type} · ${question.timeLimitSeconds} s`;
  questionTitle.textContent = "Responde";
  questionPrompt.textContent = question.prompt;
  answerControls.replaceChildren();
  sendAnswerButton.disabled = true;
  sendAnswerButton.textContent = "Enviar respuesta";
  setAnswerStatus("", "");

  if (question.type === "MULTIPLE_CHOICE") {
    question.options.forEach((option) => {
      const label = document.createElement("label");
      label.className = "answer-option";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = "answerOption";
      input.value = option;
      input.addEventListener("change", () => {
        sendAnswerButton.disabled = answerSent || questionExpired || !input.checked;
      });

      const text = document.createElement("span");
      text.textContent = option;
      label.append(input, text);
      answerControls.append(label);
    });
  } else if (question.type === "WORD_BLOCKS") {
    createWordBlockControls(question);
  } else if (question.type === "TEXT_INPUT") {
    const label = document.createElement("label");
    label.className = "text-answer-label";
    label.htmlFor = "textAnswerInput";
    label.textContent = "Escribe tu respuesta";

    const input = document.createElement("input");
    input.className = "text-answer-input";
    input.id = "textAnswerInput";
    input.name = "answer";
    input.type = "text";
    input.autocomplete = "off";
    input.autocapitalize = "off";
    input.autocorrect = "off";
    input.spellcheck = false;
    input.addEventListener("input", () => {
      sendAnswerButton.disabled = answerSent || questionExpired || !input.value.trim();
    });

    label.append(input);
    answerControls.append(label);
  } else if (question.type === "VOICE") {
    createVoiceControls();
  }

  questionCard.hidden = false;
  setLobbyStatus("Pregunta recibida. Envía una sola respuesta.", "connected");
  startQuestionTimer(question.timeLimitSeconds);
}

function startQuestionTimer(timeLimitSeconds) {
  const deadline = Date.now() + timeLimitSeconds * 1000;

  const updateTimer = () => {
    const remainingSeconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    questionTimer.textContent = `Tiempo restante: ${remainingSeconds} s`;
    questionTimer.dataset.state = remainingSeconds <= 5 ? "urgent" : "";

    if (remainingSeconds === 0) {
      clearInterval(questionTimerInterval);
      questionExpired = true;
      voiceCaptureToken += 1;
      if (window.speechService?.isListening) {
        window.speechService.stopListening();
      }
      answerControls.querySelectorAll("input, button").forEach((control) => {
        control.disabled = true;
      });
      sendAnswerButton.disabled = true;
      setAnswerStatus("Tiempo agotado. No se envió ninguna respuesta.", "error");
    }
  };

  updateTimer();
  questionTimerInterval = setInterval(updateTimer, 250);
}

function parseLobbyPlayers(body, currentPlayerId) {
  let players;
  try {
    players = JSON.parse(body);
  } catch {
    throw new Error("El servidor envió una lista de aprendices inválida.");
  }

  if (!Array.isArray(players) || players.some((player) =>
    !player || typeof player.playerId !== "string" || typeof player.nickname !== "string"
  )) {
    throw new Error("El servidor envió una lista de aprendices inválida.");
  }

  renderLobbyPlayers(players, currentPlayerId);
}

function handleStompFrame(frame) {
  const separator = frame.indexOf("\n\n");
  if (separator === -1) {
    throw new Error("El servidor envió una trama STOMP inválida.");
  }

  const lines = frame.slice(0, separator).split("\n");
  const command = lines.shift().trim();
  const headers = new Map();
  lines.forEach((line) => {
    const headerSeparator = line.indexOf(":");
    if (headerSeparator !== -1) {
      headers.set(line.slice(0, headerSeparator), line.slice(headerSeparator + 1));
    }
  });
  const body = frame.slice(separator + 2);

  if (command === "CONNECTED") {
    lobbySocket.send(`SUBSCRIBE\nid:lobby-${activeRoomId}\ndestination:/topic/room/${activeRoomId}/lobby\nack:auto\n\n\0`);
    lobbySocket.send(`SUBSCRIBE\nid:question-${activeRoomId}\ndestination:/topic/room/${activeRoomId}/question\nack:auto\n\n\0`);
    setLobbyStatus("Conectado. Esperando jugadores y preguntas en tiempo real.", "connected");
    return;
  }

  if (command === "MESSAGE") {
    const destination = headers.get("destination");
    if (destination === `/topic/room/${activeRoomId}/lobby`) {
      parseLobbyPlayers(body, activePlayerId);
    } else if (destination === `/topic/room/${activeRoomId}/question`) {
      renderQuestion(parseQuestion(body));
    }
    return;
  }

  if (command === "ERROR") {
    throw new Error(body.trim() || "El servidor rechazó la conexión STOMP.");
  }
}

function connectToRoom(roomId, playerId, currentPlayer) {
  activeRoomId = roomId;
  activePlayerId = playerId;
  renderLobbyPlayers([currentPlayer], playerId);
  setLobbyStatus("Conectando a la sala en tiempo real...", "loading");

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const url = `${protocol}//${window.location.host}/ws-englishday`;
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
          handleStompFrame(frame);
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
    setLobbyStatus("No se pudo conectar a la sala en tiempo real.", "error");
  });
  lobbySocket.addEventListener("close", () => {
    if (lobbyStatus.dataset.state !== "error") {
      setLobbyStatus("Se perdió la conexión con la sala. No se pueden enviar respuestas.", "error");
    }
    sendAnswerButton.disabled = true;
  });
}

function readAnswerValue() {
  if (activeQuestion.type === "MULTIPLE_CHOICE") {
    return answerForm.querySelector('input[name="answerOption"]:checked')?.value || "";
  }

  if (activeQuestion.type === "WORD_BLOCKS") {
    return selectedWordBlocks.map((index) => activeQuestion.options[index]);
  }

  if (activeQuestion.type === "TEXT_INPUT") {
    return answerForm.querySelector("#textAnswerInput")?.value.trim() || "";
  }

  if (activeQuestion.type === "VOICE") {
    return voiceTranscript;
  }

  throw new Error("No se puede preparar una respuesta para este tipo de pregunta.");
}

answerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!activeQuestion || answerSent) {
    return;
  }

  if (questionExpired) {
    setAnswerStatus("El tiempo terminó. La respuesta no se envió.", "error");
    return;
  }

  if (!lobbySocket || lobbySocket.readyState !== WebSocket.OPEN) {
    setAnswerStatus("No hay conexión activa. La respuesta no se envió.", "error");
    return;
  }

  const value = readAnswerValue();
  if ((typeof value !== "string" && !Array.isArray(value)) ||
      (typeof value === "string" && !value.trim()) ||
      (Array.isArray(value) && (!value.length || value.some((item) => typeof item !== "string")))) {
    setAnswerStatus("Completa tu respuesta antes de enviarla.", "error");
    return;
  }

  const payload = {
    playerId: activePlayerId,
    questionId: activeQuestion.questionId,
    value,
    clientTimestamp: new Date().toISOString()
  };
  const destination = `/app/room/${activeRoomId}/answer`;

  try {
    lobbySocket.send(
      `SEND\ndestination:${destination}\ncontent-type:application/json\n\n${JSON.stringify(payload)}\0`
    );
    if (window.speechService?.isListening) {
      window.speechService.stopListening();
    }
    answerSent = true;
    clearInterval(questionTimerInterval);
    sendAnswerButton.disabled = true;
    sendAnswerButton.textContent = "Respuesta enviada";
    answerControls.querySelectorAll("input, button").forEach((control) => {
      control.disabled = true;
    });
    setAnswerStatus("Mensaje transmitido. La validación corresponde al servidor.", "success");
  } catch (error) {
    setAnswerStatus(`No se pudo transmitir la respuesta: ${error.message}`, "error");
  }
});

window.addEventListener("beforeunload", () => {
  clearInterval(questionTimerInterval);
  if (lobbySocket && lobbySocket.readyState === WebSocket.OPEN) {
    lobbySocket.close();
  }
});

joinForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  formMessage.textContent = "";

  const pin = pinInputs.map((input) => input.value).join("");
  const nickname = nicknameInput.value.trim();

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

    if (!result || typeof result.roomId !== "string" || !uuidV4Pattern.test(result.roomId) ||
        typeof result.playerId !== "string" || !uuidV4Pattern.test(result.playerId) ||
        typeof result.nickname !== "string") {
      throw new Error("El servidor no devolvió roomId, playerId UUID v4 y nickname válidos.");
    }

    formMessage.dataset.state = "success";
    formMessage.textContent = `Te uniste a la partida como ${result.nickname}.`;
    joinCard.hidden = true;
    lobbyCard.hidden = false;
    lobbyPin.textContent = `PIN de la partida: ${pin}`;
    connectToRoom(result.roomId, result.playerId, {
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
