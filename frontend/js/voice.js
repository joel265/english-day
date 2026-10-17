const voiceSection = document.getElementById('voiceSection');
const startListeningButton = document.getElementById('startListeningButton');
const stopListeningButton = document.getElementById('stopListeningButton');
const voiceStatus = document.getElementById('voiceStatus');
const speechTranscript = document.getElementById('speechTranscript');
const speechService = window.speechService;

function setListeningState(isListening) {
    voiceSection.classList.toggle('is-listening', isListening);
    startListeningButton.disabled = isListening;
    startListeningButton.setAttribute('aria-pressed', String(isListening));
    stopListeningButton.disabled = !isListening;
}

function setVoiceError(message) {
    voiceStatus.textContent = message;
    voiceStatus.dataset.state = 'error';
    setListeningState(false);
}

if (!window.isSecureContext) {
    startListeningButton.disabled = true;
    voiceStatus.textContent = 'Para usar el micrófono, abre esta página en HTTPS o en localhost.';
    voiceStatus.dataset.state = 'error';
} else if (!speechService.isSupported) {
    startListeningButton.disabled = true;
    voiceStatus.textContent = 'Este navegador no ofrece reconocimiento de voz compatible.';
    voiceStatus.dataset.state = 'error';
} else {
    let hasError = false;
    let hasTranscript = false;

    startListeningButton.addEventListener('click', () => {
        hasError = false;
        hasTranscript = false;
        speechTranscript.textContent = 'Aún no se ha detectado voz.';
        voiceStatus.textContent = 'Solicitando acceso al micrófono…';
        delete voiceStatus.dataset.state;
        startListeningButton.disabled = true;

        speechService.startListening({
            onStart: () => {
                setListeningState(true);
                voiceStatus.textContent = 'Escuchando. Habla ahora en inglés.';
            },
            onInterim: (transcript) => {
                speechTranscript.textContent = transcript;
            },
            onTranscript: (transcript) => {
                hasTranscript = true;
                speechTranscript.textContent = transcript;
                voiceStatus.textContent = 'Transcripción lista. Aún no se ha enviado.';
            },
            onEnd: () => {
                setListeningState(false);
                if (hasError) {
                    return;
                }

                voiceStatus.textContent = hasTranscript
                    ? 'Transcripción lista. Aún no se ha enviado.'
                    : 'No se reconoció voz. Puedes intentarlo de nuevo.';
            },
            onError: (message) => {
                hasError = true;
                setVoiceError(message);
            }
        });
    });

    stopListeningButton.addEventListener('click', () => {
        speechService.stopListening();
    });
}
