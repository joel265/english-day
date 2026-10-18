/**
 * roulette.js - Ruleta de Retroalimentación Activa (RF-11)
 * Renderizada en Canvas con física de desaceleración suave, retroalimentación auditiva
 * en cada división y modal teatral de intervención oral en inglés.
 */

class ActiveFeedbackRoulette {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.players = [];
        this.currentAngle = 0;
        this.isSpinning = false;
        this.spinVelocity = 0;
        this.deceleration = 0.985;
        this.lastTickSegment = -1;
        this.selectedPlayer = null;
        this.onFinishCallback = null;

        // Paleta vibrante y moderna para los sectores
        this.palette = [
            '#39A900', // SENA Green
            '#0284C7', // Sky Blue
            '#D97706', // Amber
            '#DC2626', // Crimson Red
            '#7C3AED', // Violet
            '#059669', // Emerald
            '#DB2777', // Fuchsia
            '#4F46E5', // Indigo
            '#EA580C', // Orange
            '#0D9488'  // Teal
        ];

        this.init();
    }

    init() {
        if (!this.canvas) return;
        this.resize();
        window.addEventListener('resize', () => {
            this.resize();
            this.draw();
        });
    }

    resize(defaultSize = 320) {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const cssSize = rect.width > 40 ? Math.min(rect.width, 400) : defaultSize;
        this.logicalSize = cssSize;
        this.canvas.width = cssSize * dpr;
        this.canvas.height = cssSize * dpr;
        if (this.ctx) {
            this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
    }

    setPlayers(players) {
        this.players = players && players.length > 0 ? players : [
            { name: 'Aprendiz 1' },
            { name: 'Aprendiz 2' },
            { name: 'Aprendiz 3' }
        ];
        this.draw();
    }

    draw() {
        if (!this.canvas || !this.ctx) return;
        const width = this.logicalSize || (this.canvas.width / (window.devicePixelRatio || 1));
        const height = this.logicalSize || (this.canvas.height / (window.devicePixelRatio || 1));
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.max(40, Math.min(centerX, centerY) - 18);

        this.ctx.clearRect(0, 0, width, height);

        if (this.players.length === 0) return;

        const numSegments = this.players.length;
        const arc = (Math.PI * 2) / numSegments;

        // 1. Sombra exterior y borde metálico/neón
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius + 8, 0, Math.PI * 2);
        this.ctx.fillStyle = '#0f172a';
        this.ctx.shadowColor = '#39A900';
        this.ctx.shadowBlur = 18;
        this.ctx.fill();
        this.ctx.lineWidth = 4;
        this.ctx.strokeStyle = '#39A900';
        this.ctx.stroke();
        this.ctx.restore();

        // 2. Dibujar sectores
        for (let i = 0; i < numSegments; i++) {
            const startAngle = this.currentAngle + (i * arc);
            const endAngle = startAngle + arc;
            const color = this.palette[i % this.palette.length];

            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            this.ctx.closePath();
            this.ctx.fillStyle = color;
            this.ctx.fill();

            this.ctx.lineWidth = 1.5;
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
            this.ctx.stroke();

            // Texto del nombre del aprendiz
            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(startAngle + arc / 2);
            this.ctx.textAlign = 'right';
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 13px "Rubik", sans-serif';
            this.ctx.shadowColor = 'rgba(0,0,0,0.8)';
            this.ctx.shadowBlur = 4;

            const name = this.players[i].name || `Player ${i + 1}`;
            const displayName = name.length > 13 ? name.substring(0, 11) + '..' : name;
            this.ctx.fillText(displayName, radius - 20, 5);
            this.ctx.restore();
        }

        // 3. Clavijas perimetrales
        for (let i = 0; i < numSegments; i++) {
            const angle = this.currentAngle + (i * arc);
            const pegX = centerX + Math.cos(angle) * (radius - 2);
            const pegY = centerY + Math.sin(angle) * (radius - 2);

            this.ctx.beginPath();
            this.ctx.arc(pegX, pegY, 3.5, 0, Math.PI * 2);
            this.ctx.fillStyle = '#F8FAFC';
            this.ctx.fill();
        }

        // 4. Centro metálico
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 26, 0, Math.PI * 2);
        this.ctx.fillStyle = '#1e293b';
        this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
        this.ctx.shadowBlur = 8;
        this.ctx.fill();
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = '#38BDF8';
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 9, 0, Math.PI * 2);
        this.ctx.fillStyle = '#39A900';
        this.ctx.fill();
        this.ctx.restore();

        // 5. Aguja / Puntero fijo en la parte superior
        this.drawPointer(centerX, centerY - radius);
    }

    drawPointer(topX, topY) {
        this.ctx.save();
        this.ctx.translate(topX, topY + 4);

        this.ctx.beginPath();
        this.ctx.moveTo(0, 18);
        this.ctx.lineTo(-12, -8);
        this.ctx.lineTo(12, -8);
        this.ctx.closePath();

        this.ctx.fillStyle = '#EF4444';
        this.ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
        this.ctx.shadowBlur = 10;
        this.ctx.fill();

        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.stroke();
        this.ctx.restore();
    }

    spin(callback, targetWinnerName = null) {
        if (!this.canvas || !this.ctx) {
            if (callback) callback(null);
            return;
        }
        this.resize();
        this.onFinishCallback = callback;
        this.isSpinning = true;
        this.lastTickSegment = -1;

        if (window.soundFx) {
            window.soundFx.init();
        }

        const numSegments = Math.max(1, this.players.length);
        const arc = (Math.PI * 2) / numSegments;
        let winnerIdx = 0;
        if (targetWinnerName) {
            const found = this.players.findIndex(
                (p) => (p.name || '').toLowerCase() === String(targetWinnerName).toLowerCase()
            );
            winnerIdx = found !== -1 ? found : 0;
        } else {
            winnerIdx = Math.floor(Math.random() * numSegments);
        }

        const startAngle = this.currentAngle % (Math.PI * 2);
        const desiredModAngle = (((1.5 * Math.PI) - (winnerIdx + 0.5) * arc) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const extraRotations = 5 * Math.PI * 2;
        const delta = ((desiredModAngle - startAngle) + Math.PI * 2) % (Math.PI * 2);
        const targetAngle = startAngle + extraRotations + delta;
        const durationMs = 2500;
        const startTime = performance.now();

        const animateStep = (now) => {
            if (!this.isSpinning) return;
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / durationMs);
            const eased = 1 - Math.pow(1 - progress, 3);

            this.currentAngle = startAngle + (targetAngle - startAngle) * eased;

            const normalizedAngle = ((Math.PI * 2) - (this.currentAngle % (Math.PI * 2)) + (1.5 * Math.PI)) % (Math.PI * 2);
            const currentSegment = Math.floor(normalizedAngle / arc) % numSegments;

            if (currentSegment !== this.lastTickSegment) {
                this.lastTickSegment = currentSegment;
                if (window.soundFx) {
                    window.soundFx.playWheelTick();
                }
            }

            this.draw();

            if (progress < 1) {
                requestAnimationFrame(animateStep);
            } else {
                this.isSpinning = false;
                this.currentAngle = desiredModAngle;
                this.draw();
                this.selectedPlayer = this.players[winnerIdx];

                if (window.soundFx) {
                    window.soundFx.playCorrect();
                }
                if (window.confetti) {
                    window.confetti.burst(window.innerWidth / 2, window.innerHeight / 2, 55);
                }
                if (this.onFinishCallback) {
                    this.onFinishCallback(this.selectedPlayer);
                }
            }
        };

        requestAnimationFrame(animateStep);
    }
}

window.ActiveFeedbackRoulette = ActiveFeedbackRoulette;
