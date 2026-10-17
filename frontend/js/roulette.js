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

    resize() {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const size = Math.min(rect.width || 360, 420);
        this.canvas.width = size * dpr;
        this.canvas.height = size * dpr;
        if (this.ctx) {
            this.ctx.scale(dpr, dpr);
        }
    }

    setPlayers(players) {
        this.players = players && players.length > 0 ? players : [
            { name: 'Carlos ADSO', answer: 'git checkout -b', isCorrect: true },
            { name: 'Laura Dev', answer: 'git branch -d', isCorrect: false },
            { name: 'Andrés Code', answer: 'git checkout -b', isCorrect: true },
            { name: 'Valentina Tech', answer: 'git status', isCorrect: false },
            { name: 'Mateo Frontend', answer: 'git checkout -b', isCorrect: true }
        ];
        this.draw();
    }

    draw() {
        if (!this.canvas || !this.ctx) return;
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(centerX, centerY) - 18;

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
            this.ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
            this.ctx.shadowColor = 'rgba(0,0,0,0.8)';
            this.ctx.shadowBlur = 4;

            const name = this.players[i].name || `Player ${i + 1}`;
            const displayName = name.length > 13 ? name.substring(0, 11) + '..' : name;
            this.ctx.fillText(displayName, radius - 22, 5);
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
        this.ctx.arc(centerX, centerY, 28, 0, Math.PI * 2);
        this.ctx.fillStyle = '#1e293b';
        this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
        this.ctx.shadowBlur = 8;
        this.ctx.fill();
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = '#38BDF8';
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 10, 0, Math.PI * 2);
        this.ctx.fillStyle = '#39A900';
        this.ctx.fill();
        this.ctx.restore();

        // 5. Aguja / Puntero fijo en la parte superior derecha (apunta hacia la ruleta)
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

    spin(callback) {
        if (this.isSpinning) return;
        this.onFinishCallback = callback;
        this.isSpinning = true;

        // Impulso aleatorio entre 0.35 y 0.5 rad/frame
        this.spinVelocity = Math.random() * 0.15 + 0.38;
        this.lastTickSegment = -1;

        if (window.soundFx) {
            window.soundFx.init();
        }

        this.animate();
    }

    animate() {
        if (!this.isSpinning) return;

        this.currentAngle = (this.currentAngle + this.spinVelocity) % (Math.PI * 2);
        this.spinVelocity *= this.deceleration;

        // Calcular en qué segmento se encuentra la aguja superior (-PI/2)
        const numSegments = this.players.length;
        const arc = (Math.PI * 2) / numSegments;
        const normalizedAngle = ((Math.PI * 2) - this.currentAngle + (3 * Math.PI / 2)) % (Math.PI * 2);
        const currentSegment = Math.floor(normalizedAngle / arc) % numSegments;

        if (currentSegment !== this.lastTickSegment) {
            this.lastTickSegment = currentSegment;
            if (window.soundFx) {
                window.soundFx.playWheelTick();
            }
        }

        this.draw();

        // Condición de parada cuando la velocidad es imperceptible
        if (this.spinVelocity < 0.0018) {
            this.isSpinning = false;
            this.spinVelocity = 0;
            this.selectedPlayer = this.players[currentSegment];

            if (window.soundFx) {
                window.soundFx.playCorrect();
            }
            if (window.confetti) {
                window.confetti.burst(window.innerWidth / 2, window.innerHeight / 2, 60);
            }

            if (this.onFinishCallback) {
                this.onFinishCallback(this.selectedPlayer);
            }
            return;
        }

        requestAnimationFrame(() => this.animate());
    }
}

window.ActiveFeedbackRoulette = ActiveFeedbackRoulette;
