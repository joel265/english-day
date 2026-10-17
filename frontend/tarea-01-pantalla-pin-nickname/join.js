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
let lobbySocket;

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

function handleStompFrame(frame, roomId, currentPlayerId) {
  const separator = frame.indexOf("\n\n");
  if (separator === -1) {
    throw new Error("El servidor envió una trama STOMP inválida.");
  }

  const command = frame.slice(0, separator).split("\n", 1)[0].trim();
  const body = frame.slice(separator + 2);

  if (command === "CONNECTED") {
    const destination = `/topic/room/${roomId}/lobby`;
    lobbySocket.send(`SUBSCRIBE\nid:lobby-${roomId}\ndestination:${destination}\nack:auto\n\n\0`);
    setLobbyStatus("Conectado. Actualizando aprendices en tiempo real.", "connected");
    return;
  }

  if (command === "MESSAGE") {
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
    return;
  }

  if (command === "ERROR") {
    throw new Error(body.trim() || "El servidor rechazó la conexión al lobby.");
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
          setLobbyStatus(error.message, "error");
          lobbySocket.close();
          return;
        }
      }

      frameEnd = incoming.indexOf("\0");
    }
  });
  lobbySocket.addEventListener("error", () => {
    setLobbyStatus("No se pudo conectar al lobby en tiempo real.", "error");
  });
  lobbySocket.addEventListener("close", () => {
    if (lobbyStatus.dataset.state !== "error") {
      setLobbyStatus("Se perdió la conexión con el lobby. Actualiza la página para volver a ingresar.", "error");
    }
  });
}

window.addEventListener("beforeunload", () => {
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