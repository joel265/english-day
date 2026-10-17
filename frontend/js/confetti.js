/**
 * confetti.js - Animador de Confeti de alto rendimiento en Canvas
 * 100% nativo, liviano y sin dependencias externas.
 */

class ConfettiLauncher {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.animationId = null;
        this.init();
    }

    init() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'confetti-canvas';
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100vw';
        this.canvas.style.height = '100vh';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '9999';
        document.body.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    burst(x = window.innerWidth / 2, y = window.innerHeight / 3, count = 80) {
        const colors = ['#39A900', '#00D26A', '#38BDF8', '#818CF8', '#F59E0B', '#EF4444', '#EC4899'];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 8 + 3;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 4,
                size: Math.random() * 9 + 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 12,
                opacity: 1,
                decay: Math.random() * 0.015 + 0.008,
                shape: Math.random() > 0.4 ? 'rect' : 'circle'
            });
        }

        if (!this.animationId) {
            this.animate();
        }
    }

    continuousPodiumBurst(durationMs = 5000) {
        const startTime = Date.now();
        const interval = setInterval(() => {
            if (Date.now() - startTime > durationMs) {
                clearInterval(interval);
                return;
            }
            this.burst(Math.random() * window.innerWidth * 0.8 + window.innerWidth * 0.1, window.innerHeight * 0.4, 30);
        }, 300);
    }

    animate() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.22; // Gravedad
            p.vx *= 0.98; // Resistencia de aire
            p.rotation += p.rotationSpeed;
            p.opacity -= p.decay;

            if (p.opacity <= 0 || p.y > this.canvas.height + 20) {
                this.particles.splice(i, 1);
                continue;
            }

            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate((p.rotation * Math.PI) / 180);
            this.ctx.globalAlpha = Math.max(0, p.opacity);
            this.ctx.fillStyle = p.color;

            if (p.shape === 'rect') {
                this.ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
            } else {
                this.ctx.beginPath();
                this.ctx.arc(0, 0, p.size / 3, 0, Math.PI * 2);
                this.ctx.fill();
            }

            this.ctx.restore();
        }

        if (this.particles.length > 0) {
            this.animationId = requestAnimationFrame(() => this.animate());
        } else {
            this.animationId = null;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.confetti = new ConfettiLauncher();
});
