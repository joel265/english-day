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
const questionAnswerHint = document.querySelector("#questionAnswerHint");
const questionStatus = document.querySelector("#questionStatus");
let lobbySocket;
let timerInterval;
let selectedAnswer = null;
let selectedWordBlocks = [];
let questionDeadline = 0;

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
  } else if (question.options !== null) {
    throw new Error("El servidor envió opciones incompatibles con el tipo de pregunta.");
  }

  return question;
}

function selectMultipleChoiceAnswer(button) {
  if (selectedAnswer !== null || Date.now() >= questionDeadline || button.disabled) {
    return;
  }

  selectedAnswer = button.dataset.answer;
  questionOptions.querySelectorAll("button[data-answer]").forEach((option) => {
    const isSelected = option === button;
    option.disabled = true;
    option.setAttribute("aria-pressed", String(isSelected));
    option.classList.toggle("is-selected", isSelected);
  });
  questionStatus.textContent = "Respuesta seleccionada. Espera el resultado.";
  questionStatus.dataset.state = "selected";
}

function renderWordBlocks(question) {
  const selectedIndices = new Set(selectedWordBlocks);
  wordBlocksSelected.replaceChildren();
  wordBlocksBank.replaceChildren();
  wordBlocksCount.textContent = `${selectedWordBlocks.length} ${selectedWordBlocks.length === 1 ? "bloque" : "bloques"}`;
  selectedAnswer = selectedWordBlocks.map((index) => question.options[index]);

  selectedWordBlocks.forEach((wordIndex, position) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "word-block word-block--selected";
    button.setAttribute("aria-label", `Quitar ${question.options[wordIndex]}, posición ${position + 1}`);

    const positionLabel = document.createElement("span");
    positionLabel.className = "word-block-position";
    positionLabel.setAttribute("aria-hidden", "true");
    positionLabel.textContent = String(position + 1);

    const word = document.createElement("span");
    word.textContent = question.options[wordIndex];
    button.append(positionLabel, word);
    button.addEventListener("click", () => {
      if (Date.now() >= questionDeadline) return;
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
    button.setAttribute("aria-label", `Agregar bloque: ${option}`);
    button.textContent = option;
    button.addEventListener("click", () => {
      if (Date.now() >= questionDeadline) return;
      selectedWordBlocks.push(index);
      renderWordBlocks(question);
    });
    item.append(button);
    wordBlocksBank.append(item);
  });
}

function resetWordBlocks(question) {
  if (Date.now() >= questionDeadline) return;
  selectedWordBlocks = [];
  selectedAnswer = [];
  questionStatus.textContent = "";
  questionStatus.dataset.state = "";
  renderWordBlocks(question);
}

function renderQuestion(question) {
  validateQuestion(question);
  window.clearInterval(timerInterval);
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
  questionOptions.hidden = question.type !== "MULTIPLE_CHOICE" && question.type !== "WORD_BLOCKS";
  wordBlocksUI.hidden = question.type !== "WORD_BLOCKS";
  questionAnswerHint.hidden = question.options !== null;

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
  } else if (question.options !== null) {
    question.options.forEach((option) => {
      const item = document.createElement("li");
      item.className = "question-option";
      item.textContent = option;
      questionOptions.append(item);
    });
  } else {
    questionAnswerHint.textContent = question.type === "VOICE"
      ? "Prepara tu respuesta en voz alta."
      : "Prepara tu respuesta escrita.";
  }

  questionDeadline = Date.parse(question.serverTimestamp) + question.timeLimitSeconds * 1000;
  questionProgress.max = question.timeLimitSeconds;
  questionProgress.value = question.timeLimitSeconds;
  questionTimer.classList.remove("is-expired");

  const updateTimer = () => {
    const secondsLeft = Math.max(0, Math.ceil((questionDeadline - Date.now()) / 1000));
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    questionTimer.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    questionTimer.setAttribute("aria-label", `${secondsLeft} segundos restantes`);
    questionProgress.value = secondsLeft;

    if (secondsLeft === 0) {
      window.clearInterval(timerInterval);
      questionTimer.classList.add("is-expired");
      questionOptions.querySelectorAll("button[data-answer]").forEach((option) => {
        option.disabled = true;
      });
      wordBlocksUI.querySelectorAll("button").forEach((option) => {
        option.disabled = true;
      });
      questionStatus.textContent = "¡Se acabó el tiempo!";
      questionStatus.dataset.state = "expired";
    }
  };

  updateTimer();
  if (questionProgress.value > 0) {
    timerInterval = window.setInterval(updateTimer, 1000);
  }

  lobbyCard.hidden = true;
  questionCard.hidden = false;
  document.title = `Pregunta ${question.order} | English Day`;
  questionPrompt.focus();
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
    lobbySocket.send(`SUBSCRIBE\nid:lobby-${roomId}\ndestination:/topic/room/${roomId}/lobby\nack:auto\n\n\0`);
    lobbySocket.send(`SUBSCRIBE\nid:question-${roomId}\ndestination:/topic/room/${roomId}/question\nack:auto\n\n\0`);
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
      if (!Array.isArray(payload) || payload.some((player) =>
        !player || typeof player.playerId !== "string" || typeof player.nickname !== "string"
      )) {
        throw new Error("El servidor envió una lista de aprendices inválida.");
      }

      renderLobbyPlayers(payload, currentPlayerId);
    } else if (destination === `/topic/room/${roomId}/question`) {
      renderQuestion(payload);
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
  if (questionCard.hidden) {
    setLobbyStatus(message, "error");
  } else {
    questionStatus.textContent = message;
    questionStatus.dataset.state = "error";
  }
}

function subscribeToLobby(roomId, currentPlayer) {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const url = `${protocol}//${window.location.host}/ws-englishday`;

  renderLobbyPlayers([currentPlayer], currentPlayer.playerId);
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
          handleStompFrame(frame, roomId, currentPlayer.playerId);
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

    formMessage.dataset.state = "success";
    formMessage.textContent = `Te uniste a la partida como ${result.nickname}.`;
    if (typeof result.roomId !== "string" || typeof result.playerId !== "string") {
      throw new Error("El servidor no devolvió los datos de la sala necesarios para abrir el lobby.");
    }

    joinCard.hidden = true;
    lobbyCard.hidden = false;
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