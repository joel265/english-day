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
const btnVoiceSwitchToText = document.querySelector("#btnVoiceSwitchToText");
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

const lobbyProfileCard = document.querySelector("#lobbyProfileCard");
const lobbyProfileAvatar = document.querySelector("#lobbyProfileAvatar");
const lobbyProfileName = document.querySelector("#lobbyProfileName");
const rouletteWinnerAvatarWrap = document.querySelector("#rouletteWinnerAvatarWrap");
const rouletteWinnerAvatar = document.querySelector("#rouletteWinnerAvatar");
const podiumPedestalsStage = document.querySelector("#podiumPedestalsStage");

const PLAYER_STORAGE_KEY = "englishUpPlayerSession";
const AVATAR_LOCAL_STORAGE_KEY = "englishUpPlayerAvatar";

let avatarStudio = null;
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
let latestInterimText = "";
let knownRoomPlayers = [];
let playerRouletteWheel = null;
let isLeavingIntentionally = false;
let lastPodiumPayload = null;

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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
    window.localStorage.removeItem("englishDayPlayerSession");
    window.sessionStorage.removeItem("englishDayPlayerSession");
  } catch {
    // Ignorar
  }
}

function readSavedPlayerSession() {
  try {
    const raw =
      window.localStorage.getItem(PLAYER_STORAGE_KEY) ||
      window.sessionStorage.getItem(PLAYER_STORAGE_KEY) ||
      window.localStorage.getItem("englishDayPlayerSession") ||
      window.sessionStorage.getItem("englishDayPlayerSession");
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

function updateJoinAvatarPreview(avatarData) {
  const preview = document.querySelector("#joinAvatarPreview");
  const avatars = window.EnglishUpAvatars || window.EnglishDayAvatars;
  if (!preview || !avatars) return;
  avatars.mountAvatar(preview, avatarData, "sm");
}

// Soporte universal para Confeti en English Up
if (typeof window.EnglishUpConfetti === "undefined") {
  const confettiHelper = {
    fire: (x, y, count = 75) => {
      if (window.confetti && typeof window.confetti.burst === "function") {
        window.confetti.burst(x ?? window.innerWidth / 2, y ?? window.innerHeight * 0.45, count);
      }
    }
  };
  window.EnglishUpConfetti = confettiHelper;
  window.EnglishDayConfetti = confettiHelper;
}

// Helper para emitir reacción interactiva por WebSocket hacia toda la sala
function sendReactionOverSocket(type) {
  if (lobbySocket && lobbySocket.readyState === WebSocket.OPEN && currentRoomId) {
    const payload = JSON.stringify({
      type: type,
      playerId: currentPlayer?.playerId || null,
      nickname: currentPlayer?.nickname || "Aprendiz"
    });
    lobbySocket.send(
      `SEND\ndestination:/app/room/${currentRoomId}/reaction\ncontent-type:application/json\n\n${payload}\0`
    );
  }
}

// Notificación flotante estilo Toast para reacciones globales en pantalla
function showFloatingReactionToast(message) {
  let toastContainer = document.querySelector("#reactionToastContainer");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "reactionToastContainer";
    toastContainer.className = "fixed top-5 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none";
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement("div");
  toast.className = "bg-surface-container-lowest/95 backdrop-blur-md text-on-surface px-4 py-2 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.18)] border-2 border-primary font-label-md text-label-md font-extrabold flex items-center gap-2 animate-bounce transition-all duration-300";
  toast.innerHTML = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("opacity-0", "-translate-y-3");
    setTimeout(() => toast.remove(), 400);
  }, 2400);
}

// Controlador de reacciones remotas recibidas por WebSocket
function handleRemoteReaction(reaction) {
  if (!reaction || typeof reaction !== "object") return;
  const type = reaction.type || "GREETING";
  const senderNick = reaction.nickname || "Un aprendiz";
  const isMe = currentPlayer && reaction.playerId && reaction.playerId === currentPlayer.playerId;

  if (type === "GREETING") {
    // 1. Lluvia global de emojis 👋 en canvas
    if (window.confetti && typeof window.confetti.emojiRain === "function") {
      window.confetti.emojiRain("👋", 26);
    }
    // 2. Audio para los compañeros
    if (window.soundFx && !isMe) {
      if (typeof window.soundFx.playPop === "function") {
        window.soundFx.playPop();
      } else if (typeof window.soundFx.playClick === "function") {
        window.soundFx.playClick();
      }
    }
    // 3. Notificación flotante visible para todos
    showFloatingReactionToast(`👋 <strong>${escapeHtml(senderNick)}</strong> saludó a toda la sala`);

    // 4. Iluminar tarjeta del aprendiz en la lista de jugadores
    if (lobbyPlayers) {
      const userItems = lobbyPlayers.querySelectorAll("li");
      userItems.forEach((li) => {
        if (li.textContent.includes(senderNick)) {
          li.classList.add("ring-4", "ring-primary", "scale-105");
          setTimeout(() => li.classList.remove("ring-4", "ring-primary", "scale-105"), 1500);
        }
      });
    }
  } else if (type === "CONFETTI") {
    // 1. Estallido global de confeti multicolor
    if (window.confetti) {
      window.confetti.burst(
        Math.random() * window.innerWidth * 0.6 + window.innerWidth * 0.2,
        window.innerHeight * 0.35,
        75
      );
    }
    // 2. Audio de celebración
    if (window.soundFx && !isMe) {
      if (typeof window.soundFx.playPowerUp === "function") {
        window.soundFx.playPowerUp();
      } else if (typeof window.soundFx.playCorrect === "function") {
        window.soundFx.playCorrect();
      }
    }
    // 3. Notificación flotante
    showFloatingReactionToast(`🎉 ¡<strong>${escapeHtml(senderNick)}</strong> lanzó confeti a la sala!`);
  }
}
window.handleRemoteReaction = handleRemoteReaction;

// Cooldown de botones interactivos (evita spam múltiple)
let reactionBtnCooldown = false;
let quickReactionCooldown = false;

document.addEventListener("DOMContentLoaded", () => {
  const avatarStudioRoot = document.querySelector("#avatarStudioRoot");
  let savedAvatar = window.localStorage.getItem(AVATAR_LOCAL_STORAGE_KEY) || null;

  // Asignar avatar aleatorio por defecto si el aprendiz ingresa por primera vez
  if (!savedAvatar && window.EnglishDayAvatars) {
    const initialRand = window.EnglishDayAvatars.getRandomAvatar();
    savedAvatar = window.EnglishDayAvatars.serializeAvatar(initialRand);
    try {
      window.localStorage.setItem(AVATAR_LOCAL_STORAGE_KEY, savedAvatar);
    } catch {}
  }

  if (avatarStudioRoot && window.EnglishDayAvatars) {
    avatarStudio = window.EnglishDayAvatars.createStudio(avatarStudioRoot, {
      initialAvatar: savedAvatar,
      onChange: (_obj, serialized) => {
        try {
          window.localStorage.setItem(AVATAR_LOCAL_STORAGE_KEY, serialized);
        } catch {
          // LocalStorage opcional
        }
        updateJoinAvatarPreview(serialized);
      },
    });
  }
  updateJoinAvatarPreview(savedAvatar || avatarStudio?.getSerialized());

  // Modal de personalización de avatar
  const avatarModal = document.querySelector("#avatarStudioModal");
  const btnOpenModal = document.querySelector("#btnOpenAvatarModal");
  const btnCloseModal = document.querySelector("#btnCloseAvatarModal");
  const btnSaveModal = document.querySelector("#btnSaveAvatarModal");
  const btnModalRandom = document.querySelector("#btnModalRandomAvatar");

  if (btnOpenModal && avatarModal) {
    btnOpenModal.addEventListener("click", () => {
      avatarModal.hidden = false;
    });
  }
  if (btnCloseModal && avatarModal) {
    btnCloseModal.addEventListener("click", () => {
      avatarModal.hidden = true;
    });
  }
  if (btnSaveModal && avatarModal) {
    btnSaveModal.addEventListener("click", () => {
      avatarModal.hidden = true;
      if (avatarStudio) {
        updateJoinAvatarPreview(avatarStudio.getSerialized());
      }
    });
  }
  if (avatarModal) {
    avatarModal.addEventListener("click", (e) => {
      if (e.target === avatarModal) {
        avatarModal.hidden = true;
      }
    });
  }

  // Botón de avatar aleatorio (dentro del modal de personalizar)
  if (btnModalRandom && window.EnglishDayAvatars) {
    btnModalRandom.addEventListener("click", () => {
      const rand = window.EnglishDayAvatars.getRandomAvatar();
      if (avatarStudio) {
        avatarStudio.setAvatar(rand);
      }
      const serialized = window.EnglishDayAvatars.serializeAvatar(rand);
      try {
        window.localStorage.setItem(AVATAR_LOCAL_STORAGE_KEY, serialized);
      } catch {}
      updateJoinAvatarPreview(serialized);
      if (window.soundFx) window.soundFx.playClick();
    });
  }

  // Botón Pegar PIN
  const pastePinBtn = document.querySelector("#paste-pin-btn");
  if (pastePinBtn) {
    pastePinBtn.addEventListener("click", async () => {
      try {
        const text = await navigator.clipboard.readText();
        const digits = text.replace(/\D/g, "").slice(0, 6);
        if (digits.length > 0) {
          digits.split("").forEach((d, i) => {
            if (pinInputs[i]) pinInputs[i].value = d;
          });
          const focusIdx = Math.min(digits.length, pinInputs.length - 1);
          pinInputs[focusIdx]?.focus();
        }
      } catch {
        // Fallback si no hay permisos de portapapeles
      }
    });
  }

  // Autofoco inicial en primer dígito del PIN
  if (!urlPin && pinInputs.length > 0) {
    setTimeout(() => {
      pinInputs[0]?.focus();
    }, 150);
  }

  // Validación visual en tiempo real de Nickname (icono de check sutil)
  const nicknameCheckIcon = document.querySelector("#nicknameCheckIcon");
  const nicknameBadge = document.querySelector("#nicknameBadge");
  const nicknameBadgeText = document.querySelector("#nicknameBadgeText");
  if (nicknameInput) {
    nicknameInput.addEventListener("input", () => {
      const val = nicknameInput.value.trim();
      const isValid = val.length >= 2;
      if (nicknameCheckIcon) {
        nicknameCheckIcon.className = isValid
          ? "material-symbols-outlined text-primary text-xl transition-colors font-bold"
          : "material-symbols-outlined text-outline text-xl transition-colors";
      }
      if (nicknameBadge && nicknameBadgeText) {
        if (isValid) {
          nicknameBadge.className = "bg-primary-container/30 text-on-primary-container font-label-sm text-label-sm px-2.5 py-1 rounded-full flex items-center gap-1 font-bold";
          nicknameBadgeText.textContent = "Válido";
        } else {
          nicknameBadge.className = "bg-surface-container-high text-outline font-label-sm text-label-sm px-2.5 py-1 rounded-full flex items-center gap-1 font-bold";
          nicknameBadgeText.textContent = "Mín. 2 letras";
        }
      }
    });
  }

  // Alternador de audio en header
  const btnHeaderSound = document.querySelector("#btnHeaderSoundToggle");
  const headerSoundIcon = document.querySelector("#headerSoundIcon");
  if (btnHeaderSound && headerSoundIcon) {
    btnHeaderSound.addEventListener("click", () => {
      if (window.soundFx) {
        const isMuted = window.soundFx.toggleMute();
        headerSoundIcon.textContent = isMuted ? "volume_off" : "volume_up";
        btnHeaderSound.title = isMuted ? "Activar sonido" : "Silenciar";
      }
    });
  }

  // Botón Copiar PIN en Lobby
  const copyPinBtn = document.querySelector("#copyPinBtn");
  if (copyPinBtn) {
    copyPinBtn.addEventListener("click", () => {
      const pinText = lobbyPin?.textContent?.replace(/\D/g, "") || "";
      if (pinText && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(pinText).then(() => {
          copyPinBtn.classList.add("bg-primary", "text-on-primary");
          setTimeout(() => {
            copyPinBtn.classList.remove("bg-primary", "text-on-primary");
          }, 1200);
        }).catch(() => {});
      }
    });
  }

  // Reacciones en Lobby: Saludar al aula con Cooldown
  const reactionBtn = document.querySelector("#reactionBtn");
  const lobbyGreetingStatus = document.querySelector("#lobbyGreetingStatus");
  if (reactionBtn) {
    const originalReactionHtml = reactionBtn.innerHTML;
    reactionBtn.addEventListener("click", () => {
      if (reactionBtnCooldown) return;

      reactionBtnCooldown = true;
      if (window.soundFx) window.soundFx.playClick();

      // Enviar evento global por WebSocket a toda la sala
      sendReactionOverSocket("GREETING");

      // Si aún no está conectado al socket, disparar lluvia local
      if (!lobbySocket || lobbySocket.readyState !== WebSocket.OPEN) {
        if (window.confetti && typeof window.confetti.emojiRain === "function") {
          window.confetti.emojiRain("👋", 26);
        }
      }

      // Estado activo inmediato del botón
      reactionBtn.innerHTML = `<span>¡Saludaste!</span> <span class="text-base">👋</span>`;
      reactionBtn.classList.add("bg-primary", "text-on-primary", "scale-105");

      if (lobbyGreetingStatus) {
        lobbyGreetingStatus.textContent = "👋 ¡Has enviado un saludo a la sala!";
        lobbyGreetingStatus.classList.add("text-primary", "font-bold");
      }

      // Iniciar cuenta regresiva de Cooldown (3 segundos)
      let secondsLeft = 3;
      setTimeout(() => {
        reactionBtn.classList.remove("bg-primary", "text-on-primary", "scale-105");
        reactionBtn.classList.add("opacity-60", "cursor-not-allowed");
        reactionBtn.disabled = true;

        const timerInterval = setInterval(() => {
          if (secondsLeft > 0) {
            reactionBtn.innerHTML = `<span>⏳ Espera (${secondsLeft}s)</span>`;
            secondsLeft--;
          } else {
            clearInterval(timerInterval);
            reactionBtn.disabled = false;
            reactionBtn.classList.remove("opacity-60", "cursor-not-allowed");
            reactionBtn.innerHTML = originalReactionHtml;
            reactionBtnCooldown = false;

            if (lobbyGreetingStatus) {
              lobbyGreetingStatus.textContent = "¡Saluda a tus compañeros en la sala!";
              lobbyGreetingStatus.classList.remove("text-primary", "font-bold");
            }
          }
        }, 750);
      }, 700);
    });
  }

  // Reacción rápida: Confeti Virtual con Cooldown
  const quickReaction = document.querySelector("#quickReaction");
  if (quickReaction) {
    quickReaction.addEventListener("click", () => {
      if (quickReactionCooldown) return;

      quickReactionCooldown = true;
      quickReaction.classList.add("scale-125", "rotate-12");
      setTimeout(() => {
        quickReaction.classList.remove("scale-125", "rotate-12");
      }, 300);

      // Enviar evento global por WebSocket a toda la sala
      sendReactionOverSocket("CONFETTI");

      // Si aún no está conectado al socket, disparar estallido local
      if (!lobbySocket || lobbySocket.readyState !== WebSocket.OPEN) {
        if (window.confetti) {
          const rect = quickReaction.getBoundingClientRect();
          window.confetti.burst(rect.left + rect.width / 2, Math.max(30, rect.top - 30), 65);
        }
      }

      if (window.soundFx) window.soundFx.playPowerUp();

      // Bloquear botón durante cooldown (3s)
      quickReaction.disabled = true;
      quickReaction.classList.add("opacity-50", "cursor-not-allowed", "grayscale");
      quickReaction.title = "Espera unos segundos...";

      setTimeout(() => {
        quickReaction.disabled = false;
        quickReaction.classList.remove("opacity-50", "cursor-not-allowed", "grayscale");
        quickReaction.title = "Lanzar confeti virtual";
        quickReactionCooldown = false;
      }, 3000);
    });
  }

  // Acciones en Podio y Acreditación de Certificado
  const btnClaimPrizes = document.querySelector("#btnClaimPrizes");
  if (btnClaimPrizes) {
    btnClaimPrizes.addEventListener("click", () => {
      try {
        if (window.EnglishDayConfetti && typeof window.EnglishDayConfetti.fire === "function") {
          window.EnglishDayConfetti.fire();
        } else if (window.confetti && typeof window.confetti.burst === "function") {
          window.confetti.burst(window.innerWidth / 2, window.innerHeight * 0.35, 60);
        }
        if (window.soundFx) {
          if (typeof window.soundFx.playVictory === "function") {
            window.soundFx.playVictory();
          } else if (typeof window.soundFx.playFanfare === "function") {
            window.soundFx.playFanfare();
          }
        }
      } catch (err) {
        console.warn("Audio/confetti podio claim no bloqueante:", err);
      }
      btnClaimPrizes.innerHTML = '<span class="material-symbols-outlined text-[20px]">verified</span> ¡PREMIOS DESBLOQUEADOS!';
      btnClaimPrizes.classList.add("bg-primary", "text-on-primary");
      openCertificateModal();
      downloadCertificatePng();
    });
  }

  const btnSharePodium = document.querySelector("#btnSharePodium");
  if (btnSharePodium) {
    btnSharePodium.addEventListener("click", () => {
      sharePodiumAction(btnSharePodium);
    });
  }

  const btnCloseCertModal = document.querySelector("#btnCloseCertModal");
  if (btnCloseCertModal) {
    btnCloseCertModal.addEventListener("click", closeCertificateModal);
  }

  const btnDownloadCertPng = document.querySelector("#btnDownloadCertPng");
  if (btnDownloadCertPng) {
    btnDownloadCertPng.addEventListener("click", () => downloadCertificatePng(btnDownloadCertPng));
  }

  const btnOpenCertNewTab = document.querySelector("#btnOpenCertNewTab");
  if (btnOpenCertNewTab) {
    btnOpenCertNewTab.addEventListener("click", openCertificateInNewTab);
  }

  const btnCertShareWhatsApp = document.querySelector("#btnCertShareWhatsApp");
  if (btnCertShareWhatsApp) {
    btnCertShareWhatsApp.addEventListener("click", shareCertificateViaWhatsApp);
  }

  const btnCertCopyProof = document.querySelector("#btnCertCopyProof");
  if (btnCertCopyProof) {
    btnCertCopyProof.addEventListener("click", () => copyCertificateProof(btnCertCopyProof));
  }

  const btnPedagogicalFeedback = document.querySelector("#btnPedagogicalFeedback");
  if (btnPedagogicalFeedback) {
    btnPedagogicalFeedback.addEventListener("click", (e) => {
      e.preventDefault();
      openPedagogicalModal();
    });
  }

  const btnClosePedagogicalModal = document.querySelector("#btnClosePedagogicalModal");
  if (btnClosePedagogicalModal) {
    btnClosePedagogicalModal.addEventListener("click", closePedagogicalModal);
  }

  const btnDismissPedagogicalModal = document.querySelector("#btnDismissPedagogicalModal");
  if (btnDismissPedagogicalModal) {
    btnDismissPedagogicalModal.addEventListener("click", closePedagogicalModal);
  }

  const certificateModal = document.querySelector("#certificateModal");
  if (certificateModal) {
    certificateModal.addEventListener("click", (e) => {
      if (e.target === certificateModal) closeCertificateModal();
    });
  }

  const pedagogicalModal = document.querySelector("#pedagogicalModal");
  if (pedagogicalModal) {
    pedagogicalModal.addEventListener("click", (e) => {
      if (e.target === pedagogicalModal) closePedagogicalModal();
    });
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeCertificateModal();
      closePedagogicalModal();
    }
  });

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
  if (speechRecognition) {
    try {
      speechRecognition.onstart = null;
      speechRecognition.onresult = null;
      speechRecognition.onerror = null;
      speechRecognition.onend = null;
      speechRecognition.abort();
    } catch {
      // Ignorar si ya estaba detenido
    }
    speechRecognition = null;
  }
  isRecordingVoice = false;
  if (voiceMicButton) {
    voiceMicButton.setAttribute("aria-pressed", "false");
    voiceMicButton.classList.remove("is-recording");
  }
  if (voiceMicLabel) {
    voiceMicLabel.textContent = "Toca el micrófono para hablar";
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
  if (btnVoiceSwitchToText) btnVoiceSwitchToText.disabled = true;
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
      waitingQuestionOrder.textContent = `English Up · Pregunta ${currentQuestion.order}`;
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
  latestInterimText = "";
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
  if (btnVoiceSwitchToText) {
    btnVoiceSwitchToText.disabled = false;
  }

  const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognitionCtor) {
    activateVoiceTextFallback("No pudimos usar el micrófono. Escribe tu respuesta.");
  }
}

function stopVoiceRecordingByUser() {
  isRecordingVoice = false;
  if (voiceMicButton) {
    voiceMicButton.setAttribute("aria-pressed", "false");
    voiceMicButton.classList.remove("is-recording");
  }
  if (voiceMicLabel) {
    voiceMicLabel.textContent = "Toca el micrófono para hablar";
  }

  if (speechRecognition) {
    try {
      speechRecognition.stop();
    } catch {
      // Ignorar si ya estaba detenido
    }
  }

  const candidate = (finalVoiceTranscript || latestInterimText || "").trim();
  if (candidate) {
    finalVoiceTranscript = candidate;
    if (voiceTranscriptText) {
      voiceTranscriptText.textContent = finalVoiceTranscript;
      voiceTranscriptText.classList.remove("is-interim");
    }
    if (voiceConfirmActions) voiceConfirmActions.hidden = false;
    if (voiceRepeatButton) voiceRepeatButton.disabled = false;
    if (voiceSubmitButton) voiceSubmitButton.disabled = false;
  } else {
    if (voiceTranscriptText && (voiceTranscriptText.textContent === "Escuchando tu voz en inglés..." || !voiceTranscriptText.textContent)) {
      voiceTranscriptText.textContent = "No te escuché. Toca el micrófono para hablar.";
      voiceTranscriptText.classList.remove("is-interim");
    }
  }
}

function toggleVoiceRecording() {
  if (hasSubmittedAnswer || Date.now() >= questionDeadline) return;

  const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognitionCtor) {
    activateVoiceTextFallback("No pudimos usar el micrófono. Escribe tu respuesta.");
    return;
  }

  if (isRecordingVoice) {
    stopVoiceRecordingByUser();
    return;
  }

  stopVoiceRecognition();
  latestInterimText = "";

  try {
    speechRecognition = new SpeechRecognitionCtor();
  } catch {
    activateVoiceTextFallback("No pudimos usar el micrófono. Escribe tu respuesta.");
    return;
  }

  speechRecognition.lang = "en-US";
  speechRecognition.continuous = false;
  speechRecognition.interimResults = true;
  speechRecognition.maxAlternatives = 1;

  speechRecognition.onstart = () => {
    isRecordingVoice = true;
    if (voiceMicButton) {
      voiceMicButton.setAttribute("aria-pressed", "true");
      voiceMicButton.classList.add("is-recording");
    }
    if (voiceMicLabel) {
      voiceMicLabel.textContent = "Escuchando... Toca de nuevo para detener";
    }
    if (voiceTranscriptText) {
      voiceTranscriptText.textContent = "Escuchando tu voz en inglés...";
      voiceTranscriptText.classList.add("is-interim");
    }
    if (questionStatus) {
      questionStatus.textContent = "";
      questionStatus.dataset.state = "";
    }
  };

  speechRecognition.onresult = (event) => {
    if (Date.now() >= questionDeadline) {
      stopVoiceRecognition();
      return;
    }
    let interimText = "";
    let finalText = "";
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const transcript = event.results[i][0]?.transcript || "";
      if (event.results[i].isFinal) {
        finalText += transcript;
      } else {
        interimText += transcript;
      }
    }
    if (finalText.trim()) {
      finalVoiceTranscript = finalText.trim();
    }
    latestInterimText = interimText.trim();

    const currentText = finalVoiceTranscript || latestInterimText;
    if (voiceTranscriptText && currentText) {
      voiceTranscriptText.textContent = currentText;
      if (finalVoiceTranscript) {
        voiceTranscriptText.classList.remove("is-interim");
      } else {
        voiceTranscriptText.classList.add("is-interim");
      }
    }

    if (currentText) {
      if (voiceConfirmActions) voiceConfirmActions.hidden = false;
      if (voiceRepeatButton) voiceRepeatButton.disabled = false;
      if (voiceSubmitButton) voiceSubmitButton.disabled = false;
    }
  };

  speechRecognition.onerror = (event) => {
    isRecordingVoice = false;
    if (voiceMicButton) {
      voiceMicButton.setAttribute("aria-pressed", "false");
      voiceMicButton.classList.remove("is-recording");
    }
    if (voiceMicLabel) {
      voiceMicLabel.textContent = "Toca el micrófono para hablar";
    }

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
      if (finalVoiceTranscript) {
        if (voiceTranscriptText) {
          voiceTranscriptText.textContent = finalVoiceTranscript;
          voiceTranscriptText.classList.remove("is-interim");
        }
        if (voiceConfirmActions) voiceConfirmActions.hidden = false;
        if (voiceRepeatButton) voiceRepeatButton.disabled = false;
        if (voiceSubmitButton) voiceSubmitButton.disabled = false;
      } else {
        if (voiceTranscriptText) {
          voiceTranscriptText.textContent = "No te escuché. Toca el micrófono e inténtalo de nuevo.";
          voiceTranscriptText.classList.remove("is-interim");
        }
      }
    }
  };

  speechRecognition.onend = () => {
    isRecordingVoice = false;
    if (voiceMicButton) {
      voiceMicButton.setAttribute("aria-pressed", "false");
      voiceMicButton.classList.remove("is-recording");
    }
    if (voiceMicLabel) {
      voiceMicLabel.textContent = "Toca el micrófono para hablar";
    }

    if (Date.now() >= questionDeadline) {
      return;
    }

    const candidate = (finalVoiceTranscript || latestInterimText || "").trim();
    if (candidate) {
      finalVoiceTranscript = candidate;
      if (voiceTranscriptText) {
        voiceTranscriptText.textContent = finalVoiceTranscript;
        voiceTranscriptText.classList.remove("is-interim");
      }
      if (voiceConfirmActions) voiceConfirmActions.hidden = false;
      if (voiceRepeatButton) voiceRepeatButton.disabled = false;
      if (voiceSubmitButton) voiceSubmitButton.disabled = false;
    } else if (!voiceFallbackNotice || voiceFallbackNotice.hidden) {
      if (!voiceTranscriptText.textContent || voiceTranscriptText.textContent === "Escuchando tu voz en inglés...") {
        if (voiceTranscriptText) {
          voiceTranscriptText.textContent = "No te escuché. Toca el micrófono o 'Repetir' para intentar de nuevo.";
          voiceTranscriptText.classList.remove("is-interim");
        }
      }
    }

    speechRecognition = null;
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
    stopVoiceRecognition();
    latestInterimText = "";
    if (voiceTranscriptText) {
      voiceTranscriptText.textContent = "Escuchando de nuevo... Pronuncia en inglés";
      voiceTranscriptText.classList.add("is-interim");
    }
    toggleVoiceRecording();
  });
}

if (voiceSubmitButton) {
  voiceSubmitButton.addEventListener("click", () => {
    if (hasSubmittedAnswer || Date.now() >= questionDeadline) return;
    const textToSend = (
      finalVoiceTranscript ||
      latestInterimText ||
      (voiceTranscriptText && !voiceTranscriptText.classList.contains("is-interim") ? voiceTranscriptText.textContent : "") ||
      voiceTranscriptText?.textContent ||
      ""
    ).trim();

    if (!textToSend ||
        textToSend === "Aún no has grabado tu respuesta." ||
        textToSend === "Escuchando tu voz en inglés..." ||
        textToSend === "Escuchando de nuevo... Pronuncia en inglés" ||
        textToSend === "Reiniciando micrófono..." ||
        textToSend.startsWith("No te escuché")) {
      questionStatus.textContent = "No te escuché. Toca el micrófono e inténtalo de nuevo.";
      questionStatus.dataset.state = "error";
      return;
    }

    stopVoiceRecognition();
    sendAnswerToServer(textToSend);
  });
}

if (btnVoiceSwitchToText) {
  btnVoiceSwitchToText.addEventListener("click", () => {
    if (hasSubmittedAnswer || Date.now() >= questionDeadline) return;
    const candidate = (
      finalVoiceTranscript ||
      latestInterimText ||
      (voiceTranscriptText && !voiceTranscriptText.classList.contains("is-interim") ? voiceTranscriptText.textContent : "") ||
      ""
    ).trim();
    stopVoiceRecognition();
    activateVoiceTextFallback("Modo edición con teclado. Corrige o escribe tu respuesta en inglés:");
    if (candidate && textAnswer) {
      textAnswer.value = candidate;
      if (textAnswerSubmit) textAnswerSubmit.disabled = false;
      if (textAnswerClear) textAnswerClear.hidden = false;
    }
  });
}

function setLobbyStatus(message, state) {
  lobbyStatus.textContent = message;
  lobbyStatus.dataset.state = state;
}

function renderLobbyPlayers(players, currentPlayerId) {
  lobbyPlayers.replaceChildren();
  knownRoomPlayers = players.map((p) => ({ name: p.nickname, avatar: p.avatar }));

  if (lobbyProfileCard && currentPlayer) {
    lobbyProfileCard.hidden = false;
    if (lobbyProfileName) lobbyProfileName.textContent = currentPlayer.nickname;
    if (lobbyProfileAvatar && window.EnglishDayAvatars) {
      window.EnglishDayAvatars.mountAvatar(lobbyProfileAvatar, currentPlayer.avatar, "md");
    }
  }

  const capacityBar = document.querySelector("#lobbyCapacityBar");
  if (capacityBar) {
    const pct = Math.min(100, Math.max(10, Math.round((players.length / 30) * 100)));
    capacityBar.style.width = `${pct}%`;
  }

  players.forEach((player, index) => {
    const item = document.createElement("li");
    item.className = "bg-surface-container-low rounded-DEFAULT p-space-sm flex flex-col items-center text-center shadow-[0_4px_0_#ddeaf1] hover:-translate-y-1 hover:shadow-[0_6px_0_#ddeaf1] transition-all relative stagger-item border border-surface-container-high";
    item.style.animationDelay = `${index * 45}ms`;

    const isCurrent = player.playerId === currentPlayerId || (currentPlayer && player.nickname === currentPlayer.nickname);
    const avatarHtml = window.EnglishDayAvatars
      ? window.EnglishDayAvatars.renderAvatarHtml(player.avatar, "sm")
      : "";

    item.innerHTML = `
      <div class="relative w-16 h-16 rounded-full bg-surface-container-lowest p-1 shadow-[0_3px_0_#d7e5eb] mb-1 flex items-center justify-center overflow-hidden border border-surface-container-high">
        ${avatarHtml}
        <span class="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-primary-container border-2 border-surface-container-lowest"></span>
      </div>
      <span class="font-label-md text-label-md text-on-surface truncate w-full font-bold">${escapeHtml(player.nickname)}</span>
      <span class="font-label-sm text-label-sm text-primary font-extrabold flex items-center gap-0.5 mt-0.5">
        <span class="w-1.5 h-1.5 rounded-full bg-primary-container"></span> Online
      </span>
      ${isCurrent ? '<span class="absolute -top-1.5 -right-1.5 bg-primary-container text-on-primary-container text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">¡TÚ!</span>' : ''}
    `;

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

  const totalLabel = Number.isInteger(question.totalQuestions) ? ` de ${question.totalQuestions}` : "";
  questionType.textContent = thematicMeta.badge;
  questionOrder.textContent = `Pregunta ${question.order}${totalLabel}`;
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

  document.title = `Pregunta ${question.order} | English Up`;

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
      transitionMechanicBadge.textContent = `English Up · ${thematicMeta.badge}`;
    }
    if (transitionQuestionNumber) {
      transitionQuestionNumber.textContent = `#${question.order}`;
    }
    if (transitionHeading) {
      transitionHeading.textContent = `Pregunta ${question.order}`;
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

      if (window.EnglishDayAvatars) {
        const avatarSpan = document.createElement("span");
        avatarSpan.className = "ranking-avatar";
        avatarSpan.innerHTML = window.EnglishDayAvatars.renderAvatarHtml(entry.avatar, "xs");
        item.append(rankBadge, avatarSpan, nameSpan, scoreSpan);
      } else {
        item.append(rankBadge, nameSpan, scoreSpan);
      }

      resultsTop5List.append(item);
    });
  }

  showOnlyCard(resultsCard);
  document.title = "Resultados Top 5 | English Up";
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
  document.title = "Ruleta de Retroalimentación | English Up";

  if (!playerRouletteWheel && window.ActiveFeedbackRoulette) {
    playerRouletteWheel = new window.ActiveFeedbackRoulette("playerRouletteCanvas");
  }

  if (playerRouletteWheel) {
    if (rouletteTitle) rouletteTitle.textContent = "🎡 Girando la ruleta...";
    if (rouletteBanner) rouletteBanner.hidden = true;
    if (rouletteAnswerBox) rouletteAnswerBox.hidden = true;
    if (rouletteWinnerAvatarWrap) rouletteWinnerAvatarWrap.hidden = true;

    const wheelList = knownRoomPlayers.length > 0 ? [...knownRoomPlayers] : [];
    if (!wheelList.some((p) => p.name.toLowerCase() === payload.nickname.toLowerCase())) {
      wheelList.push({ name: payload.nickname, avatar: payload.avatar });
    }
    if (wheelList.length === 1 && currentPlayer?.nickname && currentPlayer.nickname !== payload.nickname) {
      wheelList.push({ name: currentPlayer.nickname, avatar: currentPlayer.avatar });
    }

    playerRouletteWheel.resize(260);
    playerRouletteWheel.setPlayers(wheelList);
    playerRouletteWheel.spin(() => {
      if (rouletteTitle) {
        rouletteTitle.textContent = isChosen
          ? "🎯 ¡Fuiste seleccionado por la ruleta!"
          : "🎯 ¡Aprendiz seleccionado al azar!";
      }
      if (rouletteWinnerAvatarWrap && rouletteWinnerAvatar && window.EnglishDayAvatars) {
        rouletteWinnerAvatarWrap.hidden = false;
        window.EnglishDayAvatars.mountAvatar(rouletteWinnerAvatar, payload.avatar, "lg");
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
    if (rouletteWinnerAvatarWrap && rouletteWinnerAvatar && window.EnglishDayAvatars) {
      rouletteWinnerAvatarWrap.hidden = false;
      window.EnglishDayAvatars.mountAvatar(rouletteWinnerAvatar, payload.avatar, "lg");
    }
    if (rouletteBanner) rouletteBanner.hidden = false;
    if (rouletteAnswerBox) rouletteAnswerBox.hidden = false;
  }

  rouletteTitle?.focus();
}

/**
 * Tarea 12: Pantalla de Podio Final Top 3 (/topic/room/{roomId}/podium).
 * Payload: { roomId, status: "FINISHED", top3: [{ nickname, score, avatar }], totalPlayers, timestamp }
 */
function renderPodiumScreen(payload) {
  const top3 = payload?.top3 || payload?.podium;
  if (!payload || typeof payload !== "object" || !Array.isArray(top3)) {
    throw new Error("El servidor envió un podio final inválido.");
  }

  lastPodiumPayload = payload;
  try {
    sessionStorage.setItem("englishUpLastPodium", JSON.stringify(payload));
  } catch {}

  window.clearInterval(timerInterval);
  window.clearTimeout(autoCloseTimeout);
  window.clearTimeout(transitionTimeout);
  window.clearInterval(transitionInterval);
  stopVoiceRecognition();

  // 1. Escenario de 3 pedestales olímpicos (2: Plata izquierda, 1: Oro centro, 3: Bronce derecha)
  if (podiumPedestalsStage) {
    if (top3.length === 0) {
      podiumPedestalsStage.innerHTML = `
        <div class="col-span-3 text-center py-8 font-body-lg text-on-surface-variant font-bold bg-surface-container-low rounded-lg p-6 border-2 border-surface-container-high">
          Partida finalizada sin participantes registrados.
        </div>
      `;
    } else {
      const p1 = top3[0];
      const p2 = top3[1];
      const p3 = top3[2];

      const renderPedestal2 = p2 ? `
        <div class="order-2 md:order-1 flex flex-col items-center group transition-all duration-300 w-full max-w-sm md:max-w-none mx-auto">
          <div class="relative -mb-6 z-20 flex flex-col items-center">
            <div class="relative">
              <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-surface-container-lowest p-1 shadow-[0_4px_0_#becbb1] flex items-center justify-center overflow-hidden border-2 border-surface-container-high">
                ${window.EnglishDayAvatars ? window.EnglishDayAvatars.renderAvatarHtml(p2.avatar, "sm") : '<span class="text-xl font-bold text-secondary">2</span>'}
              </div>
              ${currentPlayer && p2.nickname === currentPlayer.nickname ? `
                <div class="absolute -top-2.5 -right-2 bg-primary-container text-on-primary-container px-2 py-0.5 rounded-full text-xs font-black shadow-[0_2px_0_#46a302] animate-bounce z-30">
                  ¡TÚ!
                </div>
              ` : ''}
            </div>
            <span class="text-base sm:text-lg text-on-surface mt-2 font-black">${escapeHtml(p2.nickname)}</span>
            <span class="text-xs text-on-surface-variant font-medium">Subcampeón</span>
          </div>
          <div class="w-full bg-surface-container-high rounded-t-2xl rounded-b-xl pt-10 sm:pt-12 pb-5 sm:pb-6 px-4 flex flex-col items-center shadow-[0_6px_0_#becbb1] relative border-2 border-surface-container-highest">
            <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-surface-container-lowest shadow-[0_3px_0_#becbb1] flex items-center justify-center mb-1.5 sm:mb-2 text-2xl sm:text-3xl text-outline leading-none font-black">
              2
            </div>
            <span class="text-xs sm:text-sm uppercase tracking-wider text-outline mb-1 font-extrabold">Plata • Silver Medal</span>
            <div class="flex items-center gap-1.5 px-3 sm:px-4 py-1 rounded-full bg-primary-container text-on-primary-container text-sm sm:text-base shadow-[0_3px_0_#46a302] font-black">
              <span class="material-symbols-outlined text-[18px] sm:text-[20px]" style="font-variation-settings: 'FILL' 1;">bolt</span>
              ${p2.score ?? 0} XP
            </div>
            <div class="mt-3 sm:mt-4 pt-2.5 sm:pt-3 w-full flex justify-center items-center text-on-surface-variant text-xs border-t border-surface-container-highest font-bold">
              <span>Puntaje Oficial SENA</span>
            </div>
          </div>
        </div>
      ` : `<div class="order-2 md:order-1"></div>`;

      const renderPedestal1 = p1 ? `
        <div class="order-1 md:order-2 flex flex-col items-center group mt-0 md:-mt-8 z-10 transition-all duration-300 w-full max-w-sm md:max-w-none mx-auto">
          <div class="relative -mb-6 z-20 flex flex-col items-center">
            <div class="relative">
              <span class="material-symbols-outlined text-tertiary-container text-[36px] sm:text-[42px] absolute -top-7 sm:-top-8 left-1/2 -translate-x-1/2 filter drop-shadow-md z-30" style="font-variation-settings: 'FILL' 1;">crown</span>
              <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-surface-container-lowest p-1.5 shadow-[0_5px_0_#ddad00] flex items-center justify-center overflow-hidden border-2 border-tertiary-container">
                ${window.EnglishDayAvatars ? window.EnglishDayAvatars.renderAvatarHtml(p1.avatar, "md") : '<span class="text-2xl font-bold text-tertiary">1</span>'}
              </div>
              <div class="absolute -bottom-1 -left-1 bg-tertiary-container text-on-tertiary-container p-1 rounded-full shadow-[0_2px_0_#b89000] z-20">
                <span class="material-symbols-outlined text-[16px] sm:text-[18px]" style="font-variation-settings: 'FILL' 1;">workspace_premium</span>
              </div>
              ${currentPlayer && p1.nickname === currentPlayer.nickname ? `
                <div class="absolute -top-2.5 -right-2 bg-primary-container text-on-primary-container px-2 py-0.5 rounded-full text-xs font-black shadow-[0_2px_0_#46a302] animate-bounce z-30">
                  ¡TÚ!
                </div>
              ` : ''}
            </div>
            <span class="text-lg sm:text-xl text-on-surface mt-2 flex items-center gap-1 font-black">
              ${escapeHtml(p1.nickname)}
              <span class="material-symbols-outlined text-tertiary-container text-[18px]" style="font-variation-settings: 'FILL' 1;">verified</span>
            </span>
            <span class="text-xs text-on-surface-variant font-medium">Gran Campeón Bilingüe</span>
          </div>
          <div class="w-full bg-gradient-to-b from-tertiary-fixed/40 via-surface-container-low to-surface-container-lowest rounded-t-2xl rounded-b-xl pt-10 sm:pt-12 pb-5 sm:pb-8 px-4 flex flex-col items-center shadow-[0_8px_0_#ddad00] md:shadow-[0_12px_0_#ddad00] relative border-2 border-tertiary-container/50">
            <div class="w-13 h-13 sm:w-16 sm:h-16 rounded-full bg-tertiary-container shadow-[0_3px_0_#b89000] sm:shadow-[0_4px_0_#b89000] flex items-center justify-center mb-1.5 sm:mb-2 text-2xl sm:text-3xl text-on-tertiary-container leading-none font-black">
              1
            </div>
            <span class="text-xs sm:text-sm uppercase tracking-wider text-tertiary mb-1 font-extrabold">Campeón • Gold Champion</span>
            <div class="flex items-center gap-1.5 px-4 sm:px-6 py-1 sm:py-1.5 rounded-full bg-tertiary-container text-on-tertiary-container text-base sm:text-lg shadow-[0_3px_0_#b89000] font-black">
              <span class="material-symbols-outlined text-[20px] sm:text-[24px]" style="font-variation-settings: 'FILL' 1;">bolt</span>
              ${p1.score ?? 0} XP
            </div>
            <div class="mt-3 sm:mt-5 pt-2.5 sm:pt-3 w-full flex justify-center items-center text-on-surface text-xs border-t border-tertiary-container/30 font-bold">
              <span>Puntaje Oficial SENA</span>
            </div>
          </div>
        </div>
      ` : `<div class="order-1 md:order-2"></div>`;

      const renderPedestal3 = p3 ? `
        <div class="order-3 flex flex-col items-center group transition-all duration-300 w-full max-w-sm md:max-w-none mx-auto">
          <div class="relative -mb-6 z-20 flex flex-col items-center">
            <div class="relative">
              <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-surface-container-lowest p-1 shadow-[0_4px_0_#becbb1] flex items-center justify-center overflow-hidden border-2 border-surface-container-high">
                ${window.EnglishDayAvatars ? window.EnglishDayAvatars.renderAvatarHtml(p3.avatar, "sm") : '<span class="text-xl font-bold text-outline">3</span>'}
              </div>
              ${currentPlayer && p3.nickname === currentPlayer.nickname ? `
                <div class="absolute -top-2.5 -right-2 bg-primary-container text-on-primary-container px-2 py-0.5 rounded-full text-xs font-black shadow-[0_2px_0_#46a302] animate-bounce z-30">
                  ¡TÚ!
                </div>
              ` : ''}
            </div>
            <span class="text-base sm:text-lg text-on-surface mt-2 font-black">${escapeHtml(p3.nickname)}</span>
            <span class="text-xs text-on-surface-variant font-medium">Tercer Lugar</span>
          </div>
          <div class="w-full bg-surface-container rounded-t-2xl rounded-b-xl pt-10 sm:pt-12 pb-5 sm:pb-6 px-4 flex flex-col items-center shadow-[0_6px_0_rgba(190,203,177,0.9)] relative border-2 border-surface-container-high">
            <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-surface-container-lowest shadow-[0_3px_0_#becbb1] flex items-center justify-center mb-1.5 sm:mb-2 text-2xl sm:text-3xl text-tertiary leading-none font-black">
              3
            </div>
            <span class="text-xs sm:text-sm uppercase tracking-wider text-on-surface-variant mb-1 font-extrabold">Bronce • Bronze Medal</span>
            <div class="flex items-center gap-1.5 px-3 sm:px-4 py-1 rounded-full bg-surface-container-highest text-on-surface text-sm sm:text-base shadow-[0_3px_0_#becbb1] font-black">
              <span class="material-symbols-outlined text-tertiary text-[18px] sm:text-[20px]" style="font-variation-settings: 'FILL' 1;">bolt</span>
              ${p3.score ?? 0} XP
            </div>
            <div class="mt-3 sm:mt-4 pt-2.5 sm:pt-3 w-full flex justify-center items-center text-on-surface-variant text-xs border-t border-surface-container-high font-bold">
              <span>Puntaje Oficial SENA</span>
            </div>
          </div>
        </div>
      ` : `<div class="order-3"></div>`;

      podiumPedestalsStage.innerHTML = `${renderPedestal2}${renderPedestal1}${renderPedestal3}`;
    }
  }

  // 2. Tarjeta de felicitaciones personal
  const userNick = currentPlayer?.nickname || "APRENDIZ";
  const userRankIndex = top3.findIndex((p) => p.nickname === userNick);
  const userRank = userRankIndex !== -1 ? userRankIndex + 1 : null;

  if (podiumTitle) {
    podiumTitle.textContent = `¡INCREÍBLE, ${userNick.toUpperCase()}!`;
  }
  const podiumRankBadge = document.querySelector("#podiumRankBadge");
  const podiumMedalText = document.querySelector("#podiumMedalText");
  if (podiumRankBadge) {
    podiumRankBadge.textContent = userRank ? `PUESTO #${userRank}` : "TOP FINISHER";
  }
  if (podiumMedalText) {
    podiumMedalText.textContent = userRank === 1
      ? "Medalla de Oro SENA"
      : userRank === 2
      ? "Medalla de Plata SENA"
      : userRank === 3
      ? "Medalla de Bronce SENA"
      : "Certificado Bilingüe SENA";
  }
  const heroAvatar = document.querySelector("#podiumHeroAvatar");
  if (heroAvatar && window.EnglishDayAvatars) {
    const avatarToRender = currentPlayer?.avatar || top3[0]?.avatar;
    window.EnglishDayAvatars.mountAvatar(heroAvatar, avatarToRender, "md");
  }
  const podiumValidationCode = document.querySelector("#podiumValidationCode");
  if (podiumValidationCode) {
    const codeId = (payload.roomId || "08492").slice(0, 6).toUpperCase();
    podiumValidationCode.textContent = `SENA-B1-ENGUP-2026-${codeId}`;
  }
  const podiumUserXP = document.querySelector("#podiumUserXP");
  if (podiumUserXP) {
    const xpVal = userRankIndex !== -1 ? top3[userRankIndex].score : (top3[0]?.score || 2850);
    podiumUserXP.textContent = Number(xpVal).toLocaleString("en-US");
  }

  // 3. Celebración audio + confeti (bloque seguro no bloqueante)
  try {
    if (window.EnglishDayConfetti && typeof window.EnglishDayConfetti.fire === "function") {
      window.EnglishDayConfetti.fire();
    } else if (window.confetti && typeof window.confetti.burst === "function") {
      window.confetti.burst(window.innerWidth / 2, window.innerHeight * 0.35, 75);
    }
    if (window.soundFx) {
      if (typeof window.soundFx.playVictory === "function") {
        window.soundFx.playVictory();
      } else if (typeof window.soundFx.playFanfare === "function") {
        window.soundFx.playFanfare();
      }
    }
  } catch (err) {
    console.warn("Celebración podio no bloqueante:", err);
  }

  // 4. Lista accesible para lectores de pantalla
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

      if (window.EnglishDayAvatars) {
        const avatarSpan = document.createElement("span");
        avatarSpan.className = "ranking-avatar";
        avatarSpan.innerHTML = window.EnglishDayAvatars.renderAvatarHtml(entry.avatar, "xs");
        item.append(medal, avatarSpan, name, score);
      } else {
        item.append(medal, name, score);
      }

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
  document.title = "¡Podio Final! | English Up";
  podiumTitle?.focus();
}

// =============================================================================
// GESTIÓN DE DIPLOMA, CERTIFICACIÓN Y RECLAMO DE PUNTO POSITIVO (BILINGÜISMO)
// =============================================================================

function getPodiumCertificateDetails() {
  if (!lastPodiumPayload) {
    try {
      lastPodiumPayload = JSON.parse(sessionStorage.getItem("englishUpLastPodium") || "null");
    } catch {}
  }

  const userNick = (currentPlayer?.nickname || "APRENDIZ").trim();
  const top3 = lastPodiumPayload?.top3 || lastPodiumPayload?.podium || [];
  const userRankIndex = top3.findIndex((p) => p && p.nickname === userNick);
  const userRank = userRankIndex !== -1 ? userRankIndex + 1 : null;
  const rankText = userRank === 1
    ? "1.° Lugar (Medalla de Oro)"
    : userRank === 2
    ? "2.° Lugar (Medalla de Plata)"
    : userRank === 3
    ? "3.° Lugar (Medalla de Bronce)"
    : "Top Finisher Bilingüe";

  const rawScore = userRankIndex !== -1 ? top3[userRankIndex]?.score : (top3[0]?.score || 2850);
  const xpVal = Number(rawScore) || 2850;
  const codeEl = document.querySelector("#podiumValidationCode");
  const fallbackCode = `SENA-B1-ENGUP-2026-${String(lastPodiumPayload?.roomId || "08492").slice(0, 6).toUpperCase()}`;
  const validationCode = codeEl?.textContent?.trim() || fallbackCode;

  let formattedDate = "";
  try {
    formattedDate = new Intl.DateTimeFormat("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(new Date());
  } catch {
    try {
      formattedDate = new Date().toLocaleDateString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    } catch {
      const today = new Date();
      formattedDate = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
    }
  }

  return {
    nickname: userNick || "APRENDIZ ADSO",
    rank: userRank,
    rankText,
    xp: xpVal.toLocaleString("en-US"),
    validationCode,
    date: formattedDate
  };
}

function openCertificateModal() {
  const details = getPodiumCertificateDetails();
  const certModal = document.querySelector("#certificateModal");
  if (!certModal) return;

  const certModalName = document.querySelector("#certModalName");
  const certModalRank = document.querySelector("#certModalRank");
  const certModalXP = document.querySelector("#certModalXP");
  const certModalCode = document.querySelector("#certModalCode");
  const certModalDate = document.querySelector("#certModalDate");

  if (certModalName) certModalName.textContent = details.nickname;
  if (certModalRank) certModalRank.textContent = details.rankText;
  if (certModalXP) certModalXP.textContent = `${details.xp} XP`;
  if (certModalCode) certModalCode.textContent = details.validationCode;
  if (certModalDate) certModalDate.textContent = `Fecha de Expedición: ${details.date}`;

  certModal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeCertificateModal() {
  const certModal = document.querySelector("#certificateModal");
  if (certModal) {
    certModal.hidden = true;
    document.body.style.overflow = "";
  }
}

function drawSafeRoundRect(ctx, x, y, width, height, radius) {
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }
}

function generateCertificateCanvas(details) {
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 1100;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Fondo pergamino limpio
  ctx.fillStyle = "#fdfbf7";
  ctx.fillRect(0, 0, 1600, 1100);

  // Marco exterior SENA Verde
  ctx.lineWidth = 14;
  ctx.strokeStyle = "#2b6c00";
  ctx.strokeRect(32, 32, 1536, 1036);

  // Marco interior Dorado
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#d97706";
  ctx.strokeRect(50, 50, 1500, 1000);

  // Esquineros decorativos dorados
  const cSize = 42;
  ctx.fillStyle = "#d97706";
  [[54, 54], [1546 - cSize, 54], [54, 1046 - cSize], [1546 - cSize, 1046 - cSize]].forEach(([x, y]) => {
    ctx.fillRect(x, y, cSize, 6);
    ctx.fillRect(x, y, 6, cSize);
  });

  // Cabecera institucional
  ctx.textAlign = "center";
  ctx.fillStyle = "#2b6c00";
  ctx.font = "bold 26px Rubik, sans-serif";
  ctx.fillText("SERVICIO NACIONAL DE APRENDIZAJE · SENA", 800, 110);

  ctx.fillStyle = "#6f7b64";
  ctx.font = "600 17px Rubik, sans-serif";
  ctx.fillText("DIRECCIÓN DE FORMACIÓN PROFESIONAL · ÁREA DE BILINGÜISMO", 800, 142);
  ctx.fillText("PROGRAMA ADSO (ANÁLISIS Y DESARROLLO DE SOFTWARE)", 800, 168);

  // Título del Certificado
  ctx.fillStyle = "#d97706";
  ctx.font = "bold 18px Rubik, sans-serif";
  ctx.fillText("✦ ENGLISH UP 2026 · GAMIFIED CHALLENGE ✦", 800, 222);

  ctx.fillStyle = "#111d22";
  ctx.font = "900 42px Rubik, sans-serif";
  ctx.fillText("CERTIFICADO DE ACREDITACIÓN BILINGÜE", 800, 276);

  ctx.fillStyle = "#3f4a36";
  ctx.font = "500 20px Rubik, sans-serif";
  ctx.fillText("Otorga el presente reconocimiento y constancia académica a:", 800, 335);

  // Nombre del Aprendiz
  ctx.fillStyle = "#1e5000";
  const nameToRender = (details.nickname || "APRENDIZ ADSO").toUpperCase();
  if (nameToRender.length > 24) {
    ctx.font = "900 36px Rubik, sans-serif";
  } else if (nameToRender.length > 18) {
    ctx.font = "900 42px Rubik, sans-serif";
  } else {
    ctx.font = "900 48px Rubik, sans-serif";
  }
  ctx.fillText(nameToRender, 800, 405);

  // Línea decorativa bajo el nombre
  ctx.strokeStyle = "#2b6c00";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(350, 425);
  ctx.lineTo(1250, 425);
  ctx.stroke();

  // Descripción del mérito
  ctx.fillStyle = "#3f4a36";
  ctx.font = "500 19px Rubik, sans-serif";
  ctx.fillText("Por su destacada participación en el reto interactivo de gamificación en idioma inglés,", 800, 465);
  ctx.fillText("demostrando competencias comunicativas en gramática, vocabulario técnico y pronunciación (Nivel B1).", 800, 495);

  // Caja Destacada: Reconocimiento Académico / Punto Positivo
  ctx.fillStyle = "#f4fbf0";
  ctx.fillRect(250, 535, 1100, 150);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#58cc02";
  ctx.strokeRect(250, 535, 1100, 150);

  // Píldora de acreditación
  ctx.fillStyle = "#2b6c00";
  drawSafeRoundRect(ctx, 610, 550, 380, 34, 17);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 15px Rubik, sans-serif";
  ctx.fillText("⭐ ACREDITACIÓN ACADÉMICA OFICIAL ⭐", 800, 573);

  ctx.fillStyle = "#1e5000";
  ctx.font = "900 30px Rubik, sans-serif";
  ctx.fillText("+1 PUNTO POSITIVO EN EL ÁREA DE INGLÉS TÉCNICO", 800, 625);

  ctx.fillStyle = "#3f4a36";
  ctx.font = "600 16px Rubik, sans-serif";
  ctx.fillText("Válido ante el instructor(a) de bilingüismo para la ponderación del trimestre académico.", 800, 660);

  // Rejilla de Verificación
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(160, 715, 1280, 110);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#cfdce3";
  ctx.strokeRect(160, 715, 1280, 110);

  ctx.textAlign = "left";
  // Col 1: Posición
  ctx.fillStyle = "#6f7b64";
  ctx.font = "bold 14px Rubik, sans-serif";
  ctx.fillText("POSICIÓN OFICIAL", 200, 750);
  ctx.fillStyle = "#111d22";
  ctx.font = "900 22px Rubik, sans-serif";
  ctx.fillText(details.rankText || "Top Finisher", 200, 790);

  // Col 2: Puntaje
  ctx.fillStyle = "#6f7b64";
  ctx.font = "bold 14px Rubik, sans-serif";
  ctx.fillText("PUNTAJE OBTENIDO", 520, 750);
  ctx.fillStyle = "#2b6c00";
  ctx.font = "900 22px Rubik, sans-serif";
  ctx.fillText(`${details.xp} XP`, 520, 790);

  // Col 3: Código de Validación
  ctx.fillStyle = "#6f7b64";
  ctx.font = "bold 14px Rubik, sans-serif";
  ctx.fillText("CÓDIGO ÚNICO DE VALIDACIÓN", 830, 750);
  ctx.fillStyle = "#006590";
  ctx.font = "bold 20px monospace";
  ctx.fillText(details.validationCode || "SENA-B1-ENGUP-2026", 830, 790);

  // Firmas y Sellos
  ctx.textAlign = "center";
  // Firma Izquierda: Bilingüismo
  ctx.strokeStyle = "#3f4a36";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(250, 960);
  ctx.lineTo(600, 960);
  ctx.stroke();

  ctx.fillStyle = "#111d22";
  ctx.font = "bold 17px Rubik, sans-serif";
  ctx.fillText("Coordinación de Bilingüismo", 425, 985);
  ctx.fillStyle = "#6f7b64";
  ctx.font = "14px Rubik, sans-serif";
  ctx.fillText("Formación Profesional Integral SENA", 425, 1007);

  // Sello Central: Sello Digital
  ctx.fillStyle = "#2b6c00";
  ctx.beginPath();
  ctx.arc(800, 940, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 18px Rubik, sans-serif";
  ctx.fillText("SENA", 800, 938);
  ctx.font = "9px Rubik, sans-serif";
  ctx.fillText("VERIFICADO", 800, 952);

  // Firma Derecha: Instructor
  ctx.beginPath();
  ctx.moveTo(1000, 960);
  ctx.lineTo(1350, 960);
  ctx.stroke();

  ctx.fillStyle = "#111d22";
  ctx.font = "bold 17px Rubik, sans-serif";
  ctx.fillText("Instructor(a) de Inglés Técnico", 1175, 985);
  ctx.fillStyle = "#6f7b64";
  ctx.font = "14px Rubik, sans-serif";
  ctx.fillText(`Expedido: ${details.date}`, 1175, 1007);

  return canvas;
}

function dataUrlToBlob(dataUrl, customMime) {
  try {
    const parts = dataUrl.split(",");
    const mime = customMime || parts[0].match(/:(.*?);/)?.[1] || "image/png";
    const byteString = atob(parts[1]);
    const u8arr = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      u8arr[i] = byteString.charCodeAt(i);
    }
    return new Blob([u8arr], { type: mime });
  } catch (err) {
    console.warn("dataUrlToBlob error:", err);
    return null;
  }
}

function dataUrlToFile(dataUrl, fileName) {
  try {
    const arr = dataUrl.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/png";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], fileName, { type: mime });
  } catch {
    return null;
  }
}

function downloadCertificatePng(triggerBtn) {
  try {
    const details = getPodiumCertificateDetails();
    const canvas = generateCertificateCanvas(details);
    if (!canvas) {
      showFloatingReactionToast("⚠️ No se pudo generar el diploma.");
      return;
    }

    const safeNick = (details.nickname || "Aprendiz").replace(/[^a-zA-Z0-9_\-]/g, "_");
    const fileName = `Diploma_EnglishUp_${safeNick}_PuntoPositivo.png`;

    const btn = triggerBtn || document.querySelector("#btnDownloadCertPng");
    const prevHtml = btn ? btn.innerHTML : "";
    if (btn) {
      btn.innerHTML = '<span class="material-symbols-outlined text-[20px] animate-spin">sync</span> GENERANDO DESCARGA...';
    }

    const setBtnSuccess = () => {
      if (btn && prevHtml) {
        btn.innerHTML = '<span class="material-symbols-outlined text-[20px]">check_circle</span> ¡DESCARGA INICIADA!';
        btn.classList.remove("bg-primary-container", "text-on-primary-container");
        btn.classList.add("bg-primary", "text-on-primary");
        setTimeout(() => {
          btn.innerHTML = prevHtml;
          btn.classList.add("bg-primary-container", "text-on-primary-container");
          btn.classList.remove("bg-primary", "text-on-primary");
        }, 2200);
      }
    };

    // 1. Obtener Data URL de alta resolución
    let dataUrl = "";
    try {
      dataUrl = canvas.toDataURL("image/png");
    } catch (err) {
      console.warn("toDataURL error:", err);
    }

    if (!dataUrl) {
      showFloatingReactionToast("⚠️ Error al generar imagen del diploma.");
      return;
    }

    // 2. Método principal: Convertir a Blob síncrono (application/octet-stream fuerza descarga en WebKit/iOS/Android)
    const blob = dataUrlToBlob(dataUrl, "application/octet-stream");
    if (blob && typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.position = "fixed";
      a.style.left = "-9999px";
      a.style.top = "-9999px";
      a.style.opacity = "0";
      a.href = blobUrl;
      a.download = fileName;
      a.setAttribute("download", fileName);
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        try {
          if (a.parentNode) document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
        } catch {}
      }, 3500);
      setBtnSuccess();
      showFloatingReactionToast("📥 ¡Descarga iniciada! Revisa tus descargas.");
      return;
    }

    // 3. Fallback: canvas.toBlob nativo
    if (typeof canvas.toBlob === "function") {
      canvas.toBlob((blob) => {
        if (!blob) {
          openCertificateInNewTab();
          return;
        }
        try {
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.style.position = "fixed";
          a.style.left = "-9999px";
          a.style.top = "-9999px";
          a.style.opacity = "0";
          a.href = blobUrl;
          a.download = fileName;
          a.setAttribute("download", fileName);
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            try {
              if (a.parentNode) document.body.removeChild(a);
              URL.revokeObjectURL(blobUrl);
            } catch {}
          }, 3500);
          setBtnSuccess();
          showFloatingReactionToast("📥 ¡Descarga iniciada! Revisa tus descargas.");
        } catch (e) {
          console.warn("toBlob URL download error:", e);
          openCertificateInNewTab();
        }
      }, "application/octet-stream");
      return;
    }

    // 4. Último recurso: abrir en visor directo
    openCertificateInNewTab();
  } catch (err) {
    console.error("downloadCertificatePng error:", err);
    showFloatingReactionToast("⚠️ Error en descarga. Pulsa 'VER IMAGEN'.");
  }
}

function openCertificateInNewTab() {
  try {
    const details = getPodiumCertificateDetails();
    const canvas = generateCertificateCanvas(details);
    if (!canvas) {
      showFloatingReactionToast("⚠️ No se pudo generar el diploma.");
      return;
    }

    const safeNick = (details.nickname || "Aprendiz").replace(/[^a-zA-Z0-9_\-]/g, "_");
    const fileName = `Diploma_EnglishUp_${safeNick}_PuntoPositivo.png`;

    let dataUrl = "";
    try {
      dataUrl = canvas.toDataURL("image/png");
    } catch (err) {
      console.warn("toDataURL error:", err);
    }

    if (!dataUrl) {
      showFloatingReactionToast("⚠️ No se pudo generar la imagen del diploma.");
      return;
    }

    const blob = dataUrlToBlob(dataUrl);
    const blobUrl = (blob && typeof URL !== "undefined" && typeof URL.createObjectURL === "function")
      ? URL.createObjectURL(blob)
      : dataUrl;

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fileName}</title>
  <style>
    body {
      margin: 0;
      background: #0f172a;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 1.25rem;
      box-sizing: border-box;
      color: #f8fafc;
      font-family: system-ui, -apple-system, sans-serif;
      text-align: center;
    }
    img {
      max-width: 100%;
      height: auto;
      border-radius: 12px;
      box-shadow: 0 16px 40px rgba(0,0,0,0.6);
      border: 2px solid #334155;
    }
    .box {
      margin-top: 1.25rem;
      background: rgba(30, 41, 59, 0.85);
      border: 1px solid #475569;
      border-radius: 12px;
      padding: 1rem 1.25rem;
      max-width: 600px;
    }
    .box p {
      margin: 0 0 0.35rem;
      font-size: 15px;
      font-weight: 700;
      color: #4ade80;
    }
    .box span {
      display: block;
      font-size: 13px;
      color: #94a3b8;
    }
    .btn-save {
      display: inline-block;
      margin-top: 0.85rem;
      padding: 0.75rem 1.5rem;
      background: #16a34a;
      color: white;
      text-decoration: none;
      font-weight: 800;
      font-size: 14px;
      border-radius: 9999px;
      box-shadow: 0 4px 0 #15803d;
    }
  </style>
</head>
<body>
  <img src="${blobUrl}" alt="Diploma English Up SENA">
  <div class="box">
    <p>👆 Mantén presionada la imagen para "Guardar en Fotos" o haz clic derecho para guardar</p>
    <span>Diploma oficial válido para reclamar tu punto positivo en el área de inglés.</span>
    <div>
      <a class="btn-save" href="${blobUrl}" download="${fileName}">Descargar Archivo</a>
    </div>
  </div>
</body>
</html>`);
      win.document.close();
      showFloatingReactionToast("👁️ Diploma abierto en pantalla completa.");
    } else {
      const fallbackA = document.createElement("a");
      fallbackA.href = blobUrl;
      fallbackA.target = "_blank";
      fallbackA.download = fileName;
      document.body.appendChild(fallbackA);
      fallbackA.click();
      document.body.removeChild(fallbackA);
    }
  } catch (err) {
    console.error("openCertificateInNewTab error:", err);
  }
}

function shareCertificateViaWhatsApp() {
  const details = getPodiumCertificateDetails();
  const shareText = `🏆 *CERTIFICADO DE ACREDITACIÓN BILINGÜE - ENGLISH UP SENA 2026* 🇨🇴🦉

Hola Instructor(a), comparto mi comprobante oficial de participación en el English Day:

👤 *Aprendiz:* ${details.nickname}
🏅 *Posición:* ${details.rankText}
⚡ *Puntaje Oficial:* ${details.xp} XP
🔑 *Código de Verificación:* ${details.validationCode}
⭐ *Acreditación Académica:* +1 Punto Positivo en el Área de Inglés Técnico

_Constancia digital verificada por la plataforma interactiva English Up SENA ADSO._`;

  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
  window.open(url, "_blank");
}

function copyCertificateProof(btnEl) {
  const details = getPodiumCertificateDetails();
  const proofText = `🏆 CERTIFICADO DE ACREDITACIÓN BILINGÜE - ENGLISH UP SENA 2026 🇨🇴🦉
Aprendiz: ${details.nickname}
Posición: ${details.rankText}
Puntaje: ${details.xp} XP
Código de Verificación: ${details.validationCode}
⭐ Acreditación: +1 Punto Positivo en el Componente de Inglés Técnico (SENA ADSO)
Fecha: ${details.date}`;

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(proofText).then(() => {
      if (btnEl) {
        const prev = btnEl.innerHTML;
        btnEl.innerHTML = '<span class="material-symbols-outlined text-[18px]">check</span> ¡COPIADO!';
        setTimeout(() => { btnEl.innerHTML = prev; }, 2200);
      }
      showFloatingReactionToast("📋 Comprobante copiado al portapapeles");
    }).catch(() => {});
  }
}

function sharePodiumAction(btnSharePodium) {
  const details = getPodiumCertificateDetails();
  const text = `🏆 *CERTIFICADO DE ACREDITACIÓN BILINGÜE - ENGLISH UP SENA 2026* 🇨🇴🦉

👤 *Aprendiz:* ${details.nickname}
🏅 *Posición:* ${details.rankText} · ${details.xp} XP
🔑 *Código de Validación:* ${details.validationCode}
⭐ *Acreditación:* +1 Punto Positivo para el área de Inglés Técnico

_Plataforma de Gamificación Bilingüe SENA ADSO._`;

  if (navigator.share) {
    try {
      const canvas = generateCertificateCanvas(details);
      const dataUrl = canvas ? canvas.toDataURL("image/png") : "";
      const safeNick = (details.nickname || "Aprendiz").replace(/[^a-zA-Z0-9_\-]/g, "_");
      const fileName = `Diploma_EnglishUp_${safeNick}_PuntoPositivo.png`;
      const file = dataUrl ? dataUrlToFile(dataUrl, fileName) : null;
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({
          files: [file],
          title: "Diploma English Up SENA 2026",
          text: text
        }).then(() => {
          showFloatingReactionToast("✔ ¡Diploma compartido con éxito!");
        }).catch((err) => {
          if (err.name !== "AbortError") {
            navigator.share({ title: "Diploma English Up SENA 2026", text: text }).catch(() => {});
          }
        });
        openCertificateModal();
        return;
      }
    } catch (e) {
      console.warn("navigator.share with files error:", e);
    }

    navigator.share({
      title: "Certificado English Up 2026",
      text: text,
      url: window.location.href
    }).catch(() => {});
  } else {
    copyCertificateProof(btnSharePodium);
  }
  openCertificateModal();
}

function openPedagogicalModal() {
  const pedModal = document.querySelector("#pedagogicalModal");
  if (!pedModal) return;
  const details = getPodiumCertificateDetails();
  const codeSnippet = document.querySelector("#pedagogicalCodeSnippet");
  if (codeSnippet) codeSnippet.textContent = details.validationCode;
  pedModal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closePedagogicalModal() {
  const pedModal = document.querySelector("#pedagogicalModal");
  if (pedModal) {
    pedModal.hidden = true;
    document.body.style.overflow = "";
  }
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
    const topics = ["lobby", "status", "question", "results", "roulette", "podium", "reactions"];
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
    } else if (destination === `/topic/room/${roomId}/reactions`) {
      handleRemoteReaction(payload);
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
  const url = `${protocol}//${window.location.host}/ws-englishup`;

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

  const formattedPin = (state.pin && state.pin.length === 6)
    ? `${state.pin.slice(0, 3)} ${state.pin.slice(3)}`
    : (state.pin || "");
  lobbyPin.textContent = formattedPin;
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
  document.title = "Unirse a la partida | English Up";
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
    document.title = "Unirse a la partida | English Up";
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
  const avatar = avatarStudio
    ? avatarStudio.getSerialized()
    : (window.localStorage.getItem(AVATAR_LOCAL_STORAGE_KEY) || "");

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
  submitButton.innerHTML = `<span class="material-symbols-outlined text-2xl animate-spin">progress_activity</span><span>CONECTANDO...</span>`;
  formMessage.dataset.state = "loading";
  formMessage.textContent = "Conectando con la partida...";

  try {
    const response = await fetch(`/api/rooms/${encodeURIComponent(pin)}/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nickname, avatar }),
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
      avatar: result.avatar || avatar,
    };
    savePlayerSession(sessionPayload);

    const restored = await restorePlayerSessionFromServer(sessionPayload, false).catch(() => false);
    if (!restored) {
      showOnlyCard(lobbyCard);
      const formattedPin = (pin && pin.length === 6)
        ? `${pin.slice(0, 3)} ${pin.slice(3)}`
        : (pin || "");
      lobbyPin.textContent = formattedPin;
      subscribeToLobby(result.roomId, {
        playerId: result.playerId,
        nickname: result.nickname,
        avatar: result.avatar || avatar,
      });
    }
  } catch (error) {
    formMessage.dataset.state = "error";
    formMessage.textContent = error instanceof TypeError
      ? "No se pudo conectar. Revisa que el servidor esté activo y que la página use el mismo origen."
      : error.message;
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = `<span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1;">play_arrow</span><span>INGRESAR A LA PARTIDA</span>`;
  }
});