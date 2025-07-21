document.addEventListener('DOMContentLoaded', function() {
    const audio = document.getElementById('audio-element');
    const playPauseBtn = document.getElementById('play-pause');
    const currentTimeEl = document.getElementById('current-time');
    const durationEl = document.getElementById('duration');
    const volumeBtn = document.getElementById('volume-btn');
    const volumeSlider = document.getElementById('volume-slider');
    const volumeIcon = document.getElementById('volume-icon');
    const audioPlayer = document.querySelector('.audio-player');

    // Función para formatear tiempo
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // Cargar duración cuando el audio esté listo
    audio.addEventListener('loadedmetadata', function() {
        durationEl.textContent = formatTime(audio.duration);
    });

    // Actualizar tiempo actual
    audio.addEventListener('timeupdate', function() {
        currentTimeEl.textContent = formatTime(audio.currentTime);
    });

    // Control de play/pause
    playPauseBtn.addEventListener('click', function() {
        if (audio.paused) {
            audio.play();
            audioPlayer.classList.add('playing');
        } else {
            audio.pause();
            audioPlayer.classList.remove('playing');
        }
    });

    // Control de volumen
    volumeSlider.addEventListener('input', function() {
        audio.volume = this.value / 100;
        updateVolumeIcon();
    });

    // Actualizar ícono de volumen con imágenes
    function updateVolumeIcon() {
        const volume = audio.volume;
        if (volume === 0) {
            volumeIcon.src = './assets/icons/volume-mute.png';
            volumeIcon.alt = 'Silenciado';
        } else if (volume < 0.5) {
            volumeIcon.src = './assets/icons/volume-low.png';
            volumeIcon.alt = 'Volumen bajo';
        } else {
            volumeIcon.src = './assets/icons/volume-high.png';
            volumeIcon.alt = 'Volumen alto';
        }
    }

    // Botón de volumen para mutear/desmutear
    let previousVolume = 0.7;
    
    volumeBtn.addEventListener('click', function() {
        if (audio.volume === 0) {
            audio.volume = previousVolume;
            volumeSlider.value = previousVolume * 100;
        } else {
            previousVolume = audio.volume;
            audio.volume = 0;
            volumeSlider.value = 0;
        }
        updateVolumeIcon();
    });

    // Establecer volumen inicial
    audio.volume = 0.7;
    updateVolumeIcon();
});