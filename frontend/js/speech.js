/**
 * Adaptador pequeño para el reconocimiento de voz del navegador.
 * Entrega texto transcrito; no determina si la respuesta es correcta.
 */
class SpeechService {
    constructor() {
        const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.isSupported = typeof Recognition === 'function';
        this.recognition = this.isSupported ? new Recognition() : null;
        this.isListening = false;
        this.finalTranscript = '';
        this.callbacks = null;

        if (this.recognition) {
            this.recognition.lang = 'en-US';
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
        }
    }

    describeError(errorCode) {
        const messages = {
            aborted: 'La captura de voz se detuvo. Puedes intentarlo de nuevo.',
            'audio-capture': 'No se encontró un micrófono disponible.',
            'not-allowed': 'Permite el acceso al micrófono en la configuración del navegador.',
            'service-not-allowed': 'El navegador no permite usar el servicio de reconocimiento de voz.',
            'no-speech': 'No se detectó voz. Comprueba el micrófono e inténtalo de nuevo.',
            network: 'No se pudo conectar con el servicio de reconocimiento de voz.'
        };

        return messages[errorCode] || `No se pudo reconocer la voz (${errorCode}). Inténtalo de nuevo.`;
    }

    startListening({ onStart, onInterim, onTranscript, onEnd, onError } = {}) {
        if (!this.isSupported) {
            onError?.('Este navegador no ofrece reconocimiento de voz compatible.');
            return false;
        }

        if (this.isListening) {
            onError?.('El reconocimiento de voz ya está activo.');
            return false;
        }

        this.callbacks = { onStart, onInterim, onTranscript, onEnd, onError };
        this.finalTranscript = '';

        this.recognition.onstart = () => {
            this.isListening = true;
            this.callbacks.onStart?.();
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = '';

            for (let index = event.resultIndex; index < event.results.length; index += 1) {
                const result = event.results[index];
                const transcript = result[0].transcript.trim();

                if (result.isFinal && transcript) {
                    this.finalTranscript = [this.finalTranscript, transcript].filter(Boolean).join(' ');
                } else {
                    interimTranscript += transcript;
                }
            }

            if (interimTranscript) {
                const visibleTranscript = [this.finalTranscript, interimTranscript].filter(Boolean).join(' ');
                this.callbacks.onInterim?.(visibleTranscript);
            }

            if (this.finalTranscript) {
                this.callbacks.onTranscript?.(this.finalTranscript);
            }
        };

        this.recognition.onerror = (event) => {
            this.isListening = false;
            this.callbacks.onError?.(this.describeError(event.error));
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.callbacks.onEnd?.();
        };

        try {
            this.recognition.start();
            return true;
        } catch (error) {
            this.isListening = false;
            const errorCode = error.name || error.message || 'unknown';
            this.callbacks.onError?.(this.describeError(errorCode));
            return false;
        }
    }

    stopListening() {
        if (!this.recognition || !this.isListening) {
            return false;
        }

        try {
            this.recognition.stop();
            return true;
        } catch (error) {
            this.isListening = false;
            const errorCode = error.name || error.message || 'unknown';
            this.callbacks?.onError?.(this.describeError(errorCode));
            return false;
        }
    }
}

window.speechService = new SpeechService();
