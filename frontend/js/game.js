/**
 * game.js - Controlador Principal del Flujo de Gamificación (SENA ADSO)
 * Orquesta vistas, temporizador, puntajes, mecánicas y la ruleta activa.
 */

class EnglishDayGame {
    constructor() {
        this.currentView = 'join';
        this.currentQuestionIdx = 0;
        this.questions = window.QUESTION_BANK || [];
        this.timerInterval = null;
        this.timeLeft = 0;
        this.totalQuestionTime = 20;
        this.hasAnswered = false;
        this.selectedAvatar = '🚀';
        this.voiceTranscript = '';

        // Estado del jugador local
        this.player = {
            nickname: '',
            avatar: '🚀',
            pin: '',
            score: 0,
            streak: 0,
            history: [] // { questionId, answer, isCorrect, points }
        };

        // Jugadores de la sala (simulados para lobby y ruleta)
        this.roomPlayers = [
            { name: 'Carlos ADSO', avatar: '💻', score: 3820, streak: 3, answer: 'git checkout -b', isCorrect: true },
            { name: 'Laura Dev', avatar: '⚡', score: 3450, streak: 2, answer: 'git checkout -b', isCorrect: true },
            { name: 'Andrés Code', avatar: '☕', score: 3100, streak: 1, answer: 'git branch -d', isCorrect: false },
            { name: 'Valentina Tech', avatar: '🎯', score: 2890, streak: 2, answer: 'git checkout -b', isCorrect: true },
            { name: 'Mateo Frontend', avatar: '🔥', score: 2640, streak: 0, answer: 'git merge origin', isCorrect: false }
        ];

        this.wordBankSelected = [];
        this.roulette = null;

        this.init();
    }

    init() {
        this.bindEvents();
        this.setupAvatars();
        this.roulette = new window.ActiveFeedbackRoulette('rouletteCanvas');
        this.switchView('view-join');
    }

    bindEvents() {
        // Selector de Avatares
        document.querySelectorAll('.avatar-opt').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.avatar-opt').forEach(b => b.classList.remove('selected'));
                const target = e.currentTarget;
                target.classList.add('selected');
                this.selectedAvatar = target.getAttribute('data-avatar');
            });
        });

        // Inputs con validación en tiempo real (Tarea 1 Frontend)
        const inputPin = document.getElementById('inputPin');
        const inputNick = document.getElementById('inputNickname');
        const groupPin = document.getElementById('groupPin');
        const groupNick = document.getElementById('groupNickname');
        const pinErrorMsg = document.getElementById('pinErrorMsg');
        const nickErrorMsg = document.getElementById('nickErrorMsg');
        const charCounter = document.getElementById('nicknameCharCounter');

        if (inputPin) {
            inputPin.addEventListener('input', (e) => {
                // Forzar solo dígitos numéricos
                e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
                if (groupPin) groupPin.classList.remove('has-error');
                if (pinErrorMsg) pinErrorMsg.textContent = '';
            });
            inputPin.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && inputNick) inputNick.focus();
            });
        }

        if (inputNick) {
            inputNick.addEventListener('input', (e) => {
                const len = e.target.value.length;
                if (charCounter) charCounter.textContent = `${len}/15`;
                if (groupNick) groupNick.classList.remove('has-error');
                if (nickErrorMsg) nickErrorMsg.textContent = '';
            });
            inputNick.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.handleJoinGame();
            });
        }

        // Ingresar a la sala
        const btnJoin = document.getElementById('btnJoinGame');
        if (btnJoin) {
            btnJoin.addEventListener('click', () => this.handleJoinGame());
        }

        // Demo Rápido / Rellenar campos
        const btnQuickDemo = document.getElementById('btnQuickDemo');
        if (btnQuickDemo) {
            btnQuickDemo.addEventListener('click', () => {
                if (inputPin) inputPin.value = '502914';
                if (inputNick) {
                    inputNick.value = 'Carlos ADSO';
                    if (charCounter) charCounter.textContent = '11/15';
                }
                this.handleJoinGame();
            });
        }

        // Iniciar partida desde el Lobby
        const btnStartGame = document.getElementById('btnStartGame');
        if (btnStartGame) {
            btnStartGame.addEventListener('click', () => this.startGame());
        }

        // Alternar modo de pantalla (Móvil vs Proyector Host)
        const btnModeMobile = document.getElementById('btnModeMobile');
        const btnModeHost = document.getElementById('btnModeHost');
        if (btnModeMobile && btnModeHost) {
            btnModeMobile.addEventListener('click', () => {
                btnModeMobile.classList.add('active');
                btnModeHost.classList.remove('active');
                document.body.classList.remove('host-mode-active');
            });
            btnModeHost.addEventListener('click', () => {
                btnModeHost.classList.add('active');
                btnModeMobile.classList.remove('active');
                document.body.classList.add('host-mode-active');
            });
        }

        // Botón silenciar sonido
        const btnToggleSound = document.getElementById('btnToggleSound');
        if (btnToggleSound) {
            btnToggleSound.addEventListener('click', () => {
                const isMuted = window.soundFx.toggleMute();
                btnToggleSound.textContent = isMuted ? '🔇' : '🔊';
            });
        }

        // Botón girar ruleta
        const btnSpinRoulette = document.getElementById('btnSpinRoulette');
        if (btnSpinRoulette) {
            btnSpinRoulette.addEventListener('click', () => this.spinActiveRoulette());
        }

        // Acciones del modal de desafío oral
        const btnAwardSpeakingBonus = document.getElementById('btnAwardSpeakingBonus');
        if (btnAwardSpeakingBonus) {
            btnAwardSpeakingBonus.addEventListener('click', () => {
                if (window.soundFx) window.soundFx.playCorrect();
                if (window.confetti) window.confetti.burst(window.innerWidth / 2, window.innerHeight / 2, 40);
                this.closeSpeakingModal();
                this.showLeaderboard();
            });
        }

        const btnSkipSpeaking = document.getElementById('btnSkipSpeaking');
        if (btnSkipSpeaking) {
            btnSkipSpeaking.addEventListener('click', () => {
                this.closeSpeakingModal();
                this.showLeaderboard();
            });
        }

        // Botón continuar desde Leaderboard a la siguiente pregunta
        const btnNextFromLeaderboard = document.getElementById('btnNextFromLeaderboard');
        if (btnNextFromLeaderboard) {
            btnNextFromLeaderboard.addEventListener('click', () => this.nextQuestion());
        }

        // Botón reiniciar juego en el podio
        const btnRestartGame = document.getElementById('btnRestartGame');
        if (btnRestartGame) {
            btnRestartGame.addEventListener('click', () => this.restartGame());
        }
    }

    setupAvatars() {
        const avatars = ['🚀', '💻', '⚡', '☕', '🔥', '🎯', '🦄', '🤖', '👾', '🦊'];
        const container = document.getElementById('avatarSelector');
        if (!container) return;

        container.innerHTML = '';
        avatars.forEach((av, i) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `avatar-opt ${i === 0 ? 'selected' : ''}`;
            btn.setAttribute('data-avatar', av);
            btn.textContent = av;
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.avatar-opt').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.selectedAvatar = av;
                if (window.soundFx) window.soundFx.playClick();
            });
            container.appendChild(btn);
        });
    }

    switchView(viewId) {
        document.querySelectorAll('.view-screen').forEach(screen => {
            screen.classList.remove('active');
        });
        const target = document.getElementById(viewId);
        if (target) {
            target.classList.add('active');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    handleJoinGame() {
        const inputPin = document.getElementById('inputPin');
        const inputNick = document.getElementById('inputNickname');
        const groupPin = document.getElementById('groupPin');
        const groupNick = document.getElementById('groupNickname');
        const pinErrorMsg = document.getElementById('pinErrorMsg');
        const nickErrorMsg = document.getElementById('nickErrorMsg');
        const btnJoin = document.getElementById('btnJoinGame');
        const btnJoinText = document.getElementById('btnJoinText');

        const pinVal = inputPin ? inputPin.value.trim() : '';
        const nickVal = inputNick ? inputNick.value.trim() : '';
        let hasError = false;

        // Resetear errores previos
        if (groupPin) groupPin.classList.remove('has-error');
        if (groupNick) groupNick.classList.remove('has-error');
        if (pinErrorMsg) pinErrorMsg.textContent = '';
        if (nickErrorMsg) nickErrorMsg.textContent = '';

        // 1. Validar PIN de 6 dígitos numéricos
        if (!pinVal || pinVal.length !== 6 || !/^\d{6}$/.test(pinVal)) {
            if (groupPin) groupPin.classList.add('has-error');
            if (pinErrorMsg) pinErrorMsg.textContent = 'El PIN debe contener exactamente 6 dígitos numéricos.';
            if (inputPin) inputPin.focus();
            hasError = true;
        }

        // 2. Validar Nickname (2 a 15 caracteres)
        if (!nickVal || nickVal.length < 2) {
            if (groupNick) groupNick.classList.add('has-error');
            if (nickErrorMsg) nickErrorMsg.textContent = 'El Nickname debe tener al menos 2 caracteres.';
            if (!hasError && inputNick) inputNick.focus();
            hasError = true;
        }

        if (hasError) {
            if (window.soundFx) window.soundFx.playIncorrect();
            return;
        }

        // Estado de conexión táctil
        if (btnJoin && btnJoinText) {
            btnJoin.disabled = true;
            btnJoinText.textContent = 'Conectando a la sala...';
        }

        if (window.soundFx) window.soundFx.playClick();

        setTimeout(() => {
            if (btnJoin && btnJoinText) {
                btnJoin.disabled = false;
                btnJoinText.textContent = 'Ingresar a la Partida';
            }

            this.player.pin = pinVal;
            this.player.nickname = nickVal;
            this.player.avatar = this.selectedAvatar;
            this.player.score = 0;
            this.player.streak = 0;

            // Registrar al jugador en la lista local de la sala
            const exists = this.roomPlayers.some(p => p.name.toLowerCase() === nickVal.toLowerCase());
            if (!exists) {
                this.roomPlayers.unshift({
                    name: nickVal,
                    avatar: this.player.avatar,
                    score: 0,
                    streak: 0,
                    answer: '',
                    isCorrect: false
                });
            } else {
                const existing = this.roomPlayers.find(p => p.name.toLowerCase() === nickVal.toLowerCase());
                if (existing) existing.avatar = this.player.avatar;
            }

            this.updateLobby();
            this.switchView('view-lobby');
        }, 350);
    }

    updateLobby() {
        const lobbyPin = document.getElementById('lobbyPinDisplay');
        if (lobbyPin) lobbyPin.textContent = this.player.pin || '502914';

        const countBadge = document.getElementById('lobbyPlayerCount');
        if (countBadge) countBadge.textContent = `${this.roomPlayers.length} Aprendices`;

        const grid = document.getElementById('lobbyPlayersGrid');
        if (!grid) return;
        grid.innerHTML = '';

        this.roomPlayers.forEach(p => {
            const chip = document.createElement('div');
            chip.className = 'player-chip';
            chip.innerHTML = `
                <span style="font-size: 1.4rem;">${p.avatar || '💻'}</span>
                <span>${p.name}</span>
                <span class="pulse-dot" style="margin-left: auto;"></span>
            `;
            grid.appendChild(chip);
        });
    }

    startGame() {
        if (window.soundFx) window.soundFx.playClick();
        this.currentQuestionIdx = 0;
        this.loadQuestion(this.currentQuestionIdx);
        this.switchView('view-question');
    }

    loadQuestion(idx) {
        if (idx >= this.questions.length) {
            this.showPodium();
            return;
        }

        this.hasAnswered = false;
        const q = this.questions[idx];
        this.totalQuestionTime = q.timeLimit || 20;
        this.timeLeft = this.totalQuestionTime;

        // Metadatos en pantalla
        document.getElementById('questionCategoryBadge').textContent = q.category || 'English Day';
        document.getElementById('questionCounterBadge').textContent = `Question ${idx + 1} / ${this.questions.length}`;
        document.getElementById('questionMainText').textContent = q.prompt;

        // Ocultar todos los contenedores de mecánicas
        const containers = ['mechMultipleChoice', 'mechWordBank', 'mechTextInput', 'mechSpeech'];
        containers.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });

        // Configurar la mecánica correspondiente
        if (q.type === 'multiple_choice') {
            this.setupMultipleChoice(q);
        } else if (q.type === 'word_bank') {
            this.setupWordBank(q);
        } else if (q.type === 'text_input') {
            this.setupTextInput(q);
        } else if (q.type === 'VOICE') {
            this.setupSpeechRecognition();
        }

        // Iniciar temporizador
        this.startTimer();
    }

    startTimer() {
        clearInterval(this.timerInterval);
        const timerFill = document.getElementById('timerProgressBar');
        const timerText = document.getElementById('timerNumberText');

        const updateVisuals = () => {
            const percent = (this.timeLeft / this.totalQuestionTime) * 100;
            if (timerFill) {
                timerFill.style.width = `${percent}%`;
                timerFill.className = 'timer-fill';
                if (this.timeLeft <= 5) {
                    timerFill.classList.add('urgent');
                    if (window.soundFx) window.soundFx.playTickUrgent();
                } else if (this.timeLeft <= 10) {
                    timerFill.classList.add('warning');
                    if (window.soundFx) window.soundFx.playTick();
                }
            }
            if (timerText) {
                timerText.textContent = `${this.timeLeft}s`;
            }
        };

        updateVisuals();

        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            updateVisuals();

            if (this.timeLeft <= 0) {
                clearInterval(this.timerInterval);
                if (!this.hasAnswered) {
                    this.handleTimeout();
                }
            }
        }, 1000);
    }

    stopTimer() {
        clearInterval(this.timerInterval);
    }

    /* ----------------------------------------------------
       Mecánica 1: Kahoot Multiple Choice (RF-04)
    ---------------------------------------------------- */
    setupMultipleChoice(q) {
        const container = document.getElementById('mechMultipleChoice');
        if (!container) return;
        container.style.display = 'grid';
        container.innerHTML = '';

        q.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `kahoot-card-btn ${opt.color}`;
            btn.innerHTML = `
                <span class="shape-icon">${opt.symbol}</span>
                <span style="flex:1;">${opt.text}</span>
            `;
            btn.addEventListener('click', () => {
                if (this.hasAnswered) return;
                btn.classList.add('selected-answer');
                this.submitAnswer(opt.text, opt.isCorrect, q);
            });
            container.appendChild(btn);
        });
    }

    /* ----------------------------------------------------
       Mecánica 2: Duolingo Word Bank (RF-05)
    ---------------------------------------------------- */
    setupWordBank(q) {
        const container = document.getElementById('mechWordBank');
        if (!container) return;
        container.style.display = 'flex';

        const constructZone = document.getElementById('wordBankConstructZone');
        const reservoir = document.getElementById('wordBankReservoir');
        const btnCheck = document.getElementById('btnCheckWordBank');

        btnCheck.disabled = false;
        constructZone.innerHTML = '';
        reservoir.innerHTML = '';
        this.wordBankSelected = [];

        // Combinar palabras y distractores y desordenar
        const allWords = [...q.words, ...(q.distractors || [])].sort(() => Math.random() - 0.5);

        allWords.forEach((wordText, i) => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'word-block-chip';
            chip.textContent = wordText;
            chip.setAttribute('data-word', wordText);
            chip.setAttribute('data-id', `word-${i}`);

            chip.addEventListener('click', () => {
                if (this.hasAnswered) return;
                if (chip.classList.contains('in-construction')) {
                    // Regresar al reservorio
                    chip.classList.remove('in-construction');
                    reservoir.appendChild(chip);
                    const idx = this.wordBankSelected.indexOf(wordText);
                    if (idx > -1) this.wordBankSelected.splice(idx, 1);
                } else {
                    // Mover a zona de construcción
                    chip.classList.add('in-construction');
                    constructZone.appendChild(chip);
                    this.wordBankSelected.push(wordText);
                }
                if (window.soundFx) window.soundFx.playClick();
            });

            reservoir.appendChild(chip);
        });

        btnCheck.onclick = () => {
            if (this.hasAnswered) return;
            const builtSentence = this.wordBankSelected.join(' ');
            const isCorrect = builtSentence.trim().toLowerCase() === q.correctSentence.trim().toLowerCase();
            this.submitAnswer(builtSentence, isCorrect, q);
        };
    }

    /* ----------------------------------------------------
       Mecánica 3: Text Input / Spelling (RF-06)
    ---------------------------------------------------- */
    setupTextInput(q) {
        const container = document.getElementById('mechTextInput');
        if (!container) return;
        container.style.display = 'flex';

        const input = document.getElementById('textInputAnswer');
        const btnSubmit = document.getElementById('btnSubmitTextInput');

        input.value = '';
        input.placeholder = q.placeholder || 'Type your answer here...';
        input.focus();

        btnSubmit.onclick = () => {
            if (this.hasAnswered) return;
            const typedVal = input.value.trim();
            if (!typedVal) return;

            const isCorrect = q.correctAnswers.some(ans =>
                ans.trim().toLowerCase() === typedVal.toLowerCase()
            );

            this.submitAnswer(typedVal, isCorrect, q);
        };

        input.onkeydown = (e) => {
            if (e.key === 'Enter') {
                btnSubmit.click();
            }
        };
    }

    /* ----------------------------------------------------
       Mecánica 4: Reconocimiento de Voz (RF-07)
    ---------------------------------------------------- */
    setupSpeechRecognition() {
        const container = document.getElementById('mechSpeech');
        if (!container) {
            console.error('VOICE question is missing the #mechSpeech container.');
            return;
        }
        container.style.display = 'flex';

        const transcriptEl = document.getElementById('speechLiveTranscript');
        const btnMic = document.getElementById('btnMicRecord');
        if (!transcriptEl || !btnMic) {
            console.error('VOICE question is missing its microphone or transcript element.');
            return;
        }
        if (!window.speechService) {
            console.error('VOICE question requires the speech.js service.');
            return;
        }

        this.voiceTranscript = '';
        transcriptEl.textContent = 'Press the mic and speak in English...';
        btnMic.classList.remove('recording');
        btnMic.setAttribute('aria-pressed', 'false');
        btnMic.disabled = !window.isSecureContext || !window.speechService.isSupported;

        if (!window.isSecureContext) {
            transcriptEl.textContent = 'Open this page over HTTPS or localhost to use the microphone.';
            return;
        }

        if (!window.speechService.isSupported) {
            transcriptEl.textContent = 'This browser does not support speech recognition.';
            return;
        }

        btnMic.onclick = () => {
            if (this.hasAnswered) return;

            if (btnMic.classList.contains('recording')) {
                window.speechService.stopListening();
                return;
            }

            btnMic.classList.add('recording');
            btnMic.setAttribute('aria-pressed', 'true');
            transcriptEl.textContent = 'Listening... Speak clearly now!';
            if (window.soundFx) window.soundFx.playClick();

            window.speechService.startListening({
                onInterim: (text) => {
                    transcriptEl.textContent = text;
                },
                onTranscript: (transcript) => {
                    this.voiceTranscript = transcript;
                    transcriptEl.textContent = transcript;
                },
                onEnd: () => {
                    btnMic.classList.remove('recording');
                    btnMic.setAttribute('aria-pressed', 'false');
                },
                onError: (message) => {
                    btnMic.classList.remove('recording');
                    btnMic.setAttribute('aria-pressed', 'false');
                    transcriptEl.textContent = message;
                }
            });
        };
    }

    /* ----------------------------------------------------
       Envío y Evaluación de Respuesta (RF-09)
    ---------------------------------------------------- */
    submitAnswer(userAnswer, isCorrect, q) {
        if (this.hasAnswered) return;
        this.hasAnswered = true;
        if (window.speechService?.isListening) {
            window.speechService.stopListening();
        }
        this.stopTimer();

        // Calcular puntaje dinámico por velocidad
        let points = 0;
        if (isCorrect) {
            const timeFactor = this.timeLeft / this.totalQuestionTime; // entre 0.05 y 1.0
            points = Math.round(1000 * (0.5 + 0.5 * timeFactor));
            this.player.streak++;
            if (this.player.streak > 1) {
                points += this.player.streak * 50; // Bonus por racha 🔥
            }
            this.player.score += points;

            if (window.soundFx) window.soundFx.playCorrect();
            if (window.confetti) window.confetti.burst(window.innerWidth / 2, window.innerHeight * 0.4, 40);
        } else {
            this.player.streak = 0;
            if (window.soundFx) window.soundFx.playIncorrect();
        }

        // Guardar respuesta del jugador
        this.player.history.push({
            questionId: q.id,
            answer: userAnswer,
            isCorrect: isCorrect,
            points: points
        });

        // Actualizar respuesta en la lista de jugadores de la sala
        const meInRoom = this.roomPlayers.find(p => p.name === this.player.nickname);
        if (meInRoom) {
            meInRoom.score = this.player.score;
            meInRoom.streak = this.player.streak;
            meInRoom.answer = userAnswer;
            meInRoom.isCorrect = isCorrect;
        }

        // Mostrar overlay de retroalimentación
        this.showAnswerFeedback(isCorrect, points, q.explanation);

        // Deshabilitar botones de la pregunta
        document.querySelectorAll(
            '#view-question .kahoot-card-btn, #view-question .word-block-chip, #view-question .btn-primary-gamified'
        ).forEach(el => {
            el.setAttribute('disabled', 'true');
        });

        // Pasar a la ruleta activa de retroalimentación tras 3.2 segundos
        setTimeout(() => {
            this.hideAnswerFeedback();
            this.showRouletteStage(q);
        }, 3200);
    }

    handleTimeout() {
        const q = this.questions[this.currentQuestionIdx];
        this.submitAnswer('Time Expired / Sin responder', false, q);
    }

    showAnswerFeedback(isCorrect, points, explanation) {
        const overlay = document.getElementById('answerFeedbackOverlay');
        const icon = document.getElementById('feedbackIcon');
        const title = document.getElementById('feedbackTitle');
        const sub = document.getElementById('feedbackSubtitle');

        overlay.className = `answer-feedback-overlay show ${isCorrect ? 'correct' : 'incorrect'}`;
        icon.textContent = isCorrect ? '🎉' : '❌';
        title.textContent = isCorrect ? `Awesome! +${points} pts` : 'Incorrect Answer!';
        sub.textContent = explanation || '';
    }

    hideAnswerFeedback() {
        const overlay = document.getElementById('answerFeedbackOverlay');
        if (overlay) overlay.className = 'answer-feedback-overlay';
    }

    /* ----------------------------------------------------
       Ruleta Activa de Retroalimentación Oral (RF-11)
    ---------------------------------------------------- */
    showRouletteStage(currentQuestion) {
        this.switchView('view-roulette');

        // Configurar los jugadores en la ruleta
        if (this.roulette) {
            this.roulette.setPlayers(this.roomPlayers);
        }

        document.getElementById('rouletteQuestionContext').textContent =
            `Oral Feedback Round for: "${currentQuestion.prompt}"`;
    }

    spinActiveRoulette() {
        const btnSpin = document.getElementById('btnSpinRoulette');
        if (btnSpin) btnSpin.disabled = true;

        if (this.roulette) {
            this.roulette.spin((selectedPlayer) => {
                if (btnSpin) btnSpin.disabled = false;
                this.openSpeakingModal(selectedPlayer);
            });
        }
    }

    openSpeakingModal(selected) {
        const modal = document.getElementById('speakingChallengeModal');
        const avatarEl = document.getElementById('selectedStudentAvatar');
        const nameEl = document.getElementById('selectedStudentName');
        const answerSummary = document.getElementById('selectedStudentAnswerSummary');

        avatarEl.textContent = selected.avatar || '🎓';
        nameEl.textContent = selected.name;

        const answerStatus = selected.isCorrect ? '✅ Correct' : '❌ Incorrect';
        answerSummary.innerHTML = `
            <div><strong>Registered Answer:</strong> "${selected.answer || 'Option Selected'}"</div>
            <div style="margin-top: 4px;"><strong>Result:</strong> ${answerStatus}</div>
        `;

        modal.classList.add('active');
    }

    closeSpeakingModal() {
        const modal = document.getElementById('speakingChallengeModal');
        if (modal) modal.classList.remove('active');
    }

    /* ----------------------------------------------------
       Tabla de Posiciones (RF-10)
    ---------------------------------------------------- */
    showLeaderboard() {
        this.switchView('view-leaderboard');

        // Ordenar jugadores por puntaje descendente
        this.roomPlayers.sort((a, b) => b.score - a.score);

        const list = document.getElementById('leaderboardList');
        if (!list) return;
        list.innerHTML = '';

        this.roomPlayers.slice(0, 5).forEach((p, idx) => {
            const item = document.createElement('div');
            item.className = `leaderboard-item ${idx === 0 ? 'rank-1' : ''}`;
            const medal = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : `#${idx + 1}`));
            const flame = p.streak > 1 ? ` 🔥${p.streak}` : '';

            item.innerHTML = `
                <div class="leaderboard-rank">${medal}</div>
                <div class="leaderboard-user">
                    <span>${p.avatar || '👤'}</span>
                    <span>${p.name} ${flame}</span>
                </div>
                <div class="leaderboard-score">${p.score.toLocaleString()} pts</div>
            `;
            list.appendChild(item);
        });
    }

    nextQuestion() {
        this.currentQuestionIdx++;
        if (this.currentQuestionIdx < this.questions.length) {
            this.loadQuestion(this.currentQuestionIdx);
            this.switchView('view-question');
        } else {
            this.showPodium();
        }
    }

    /* ----------------------------------------------------
       Podio Final (RF-10)
    ---------------------------------------------------- */
    showPodium() {
        this.switchView('view-podium');

        if (window.soundFx) window.soundFx.playFanfare();
        if (window.confetti) window.confetti.continuousPodiumBurst(5000);

        this.roomPlayers.sort((a, b) => b.score - a.score);

        const p1 = this.roomPlayers[0] || { name: 'Player 1', avatar: '🥇', score: 0 };
        const p2 = this.roomPlayers[1] || { name: 'Player 2', avatar: '🥈', score: 0 };
        const p3 = this.roomPlayers[2] || { name: 'Player 3', avatar: '🥉', score: 0 };

        // 1er Lugar (Oro)
        document.getElementById('podiumGoldName').textContent = p1.name;
        document.getElementById('podiumGoldAvatar').textContent = p1.avatar || '👑';
        document.getElementById('podiumGoldPts').textContent = `${p1.score.toLocaleString()} pts`;

        // 2do Lugar (Plata)
        document.getElementById('podiumSilverName').textContent = p2.name;
        document.getElementById('podiumSilverAvatar').textContent = p2.avatar || '🥈';
        document.getElementById('podiumSilverPts').textContent = `${p2.score.toLocaleString()} pts`;

        // 3er Lugar (Bronce)
        document.getElementById('podiumBronzeName').textContent = p3.name;
        document.getElementById('podiumBronzeAvatar').textContent = p3.avatar || '🥉';
        document.getElementById('podiumBronzePts').textContent = `${p3.score.toLocaleString()} pts`;
    }

    restartGame() {
        this.currentQuestionIdx = 0;
        this.player.score = 0;
        this.player.streak = 0;
        this.player.history = [];
        this.switchView('view-join');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.gameApp = new EnglishDayGame();
});
