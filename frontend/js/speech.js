/**
 * speech.js - Reconocimiento de Voz con Web Speech API (RF-07 & RNF-05)
 * Soporta SpeechRecognition nativo (Chrome, Edge, Safari), síntesis de voz (TTS)
 * para escuchar la pronunciación y algoritmo de similitud fonética/textual tolerante.
 */

class SpeechService {
    constructor() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.isSupported = !!SpeechRecognition;
        this.recognition = null;
        this.isListening = false;
        this.synth = window.speechSynthesis || null;

        if (this.isSupported) {
            this.recognition = new SpeechRecognition();
            this.recognition.lang = 'en-US';
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.maxAlternatives = 3;
        }
    }

    /**
     * Normaliza cadenas eliminando puntuación, espacios redundantes y mayúsculas
     */
    normalize(text) {
        if (!text) return '';
        return text
            .toLowerCase()
            .trim()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '')
            .replace(/\s+/g, ' ');
    }

    /**
     * Calcula similitud entre 0 y 1 usando distancia de Levenshtein
     */
    calculateSimilarity(str1, str2) {
        const s1 = this.normalize(str1);
        const s2 = this.normalize(str2);

        if (s1 === s2) return 1.0;
        if (s1.length === 0 || s2.length === 0) return 0.0;

        // Si s2 está completamente contenido en s1 o viceversa
        if (s1.includes(s2) || s2.includes(s1)) {
            const minLen = Math.min(s1.length, s2.length);
            const maxLen = Math.max(s1.length, s2.length);
            return 0.85 + (0.15 * (minLen / maxLen));
        }

        const matrix = [];
        for (let i = 0; i <= s1.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= s2.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= s1.length; i++) {
            for (let j = 1; j <= s2.length; j++) {
                const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,       // Eliminación
                    matrix[i][j - 1] + 1,       // Inserción
                    matrix[i - 1][j - 1] + cost // Sustitución
                );
            }
        }

        const distance = matrix[s1.length][s2.length];
        const maxLen = Math.max(s1.length, s2.length);
        return Math.max(0, 1 - (distance / maxLen));
    }

    /**
     * Pronuncia la frase en inglés como modelo pedagógico para los aprendices
     */
    speakModel(text) {
        if (!this.synth) return;
        this.synth.cancel(); // Cancelar cualquier audio en curso
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.9; // Velocidad pedagógica adecuada
        utterance.pitch = 1.0;
        this.synth.speak(utterance);
    }

    /**
     * Inicia la captura de voz con callbacks de progreso y resultado
     */
    startListening(options = {}) {
        const { onResult, onInterim, onStart, onEnd, onError, targetText } = options;

        if (!this.isSupported) {
            if (onError) onError('Web Speech API is not supported in this browser. Please use Chrome/Edge/Safari.');
            return;
        }

        if (this.isListening) {
            try { this.recognition.abort(); } catch (e) {}
        }

        this.recognition.onstart = () => {
            this.isListening = true;
            if (onStart) onStart();
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            if (interimTranscript && onInterim) {
                onInterim(interimTranscript);
            }

            if (finalTranscript) {
                const cleanFinal = finalTranscript.trim();
                const similarity = targetText ? this.calculateSimilarity(cleanFinal, targetText) : 1;
                const isMatch = similarity >= 0.75; // Umbral de tolerancia pedagógica
                if (onResult) {
                    onResult({
                        transcript: cleanFinal,
                        similarity: Math.round(similarity * 100),
                        isMatch: isMatch
                    });
                }
            }
        };

        this.recognition.onerror = (event) => {
            this.isListening = false;
            if (onError) onError(event.error);
        };

        this.recognition.onend = () => {
            this.isListening = false;
            if (onEnd) onEnd();
        };

        try {
            this.recognition.start();
        } catch (err) {
            if (onError) onError(err.message || 'Error starting speech recognition');
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            try {
                this.recognition.stop();
            } catch (e) {}
            this.isListening = false;
        }
    }
}

window.speechService = new SpeechService();
