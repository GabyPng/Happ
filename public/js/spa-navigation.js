// Lógica de la zona: recuerdos, música, herbario (archivados)
document.addEventListener('DOMContentLoaded', function() {
    console.log('SPA Navigation cargado'); // Debug
    
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.page-section');

    console.log('Nav items encontrados:', navItems.length); // Debug
    console.log('Secciones encontradas:', sections.length); // Debug

    // Función para cambiar sección
    function showSection(targetSection) {
        console.log('Cambiando a sección:', targetSection); // Debug
        
        // Ocultar todas las secciones
        sections.forEach(section => {
            section.classList.remove('active');
        });

        // Mostrar sección objetivo
        const section = document.getElementById(targetSection);
        if (section) {
            section.classList.add('active');
            console.log('Sección mostrada:', targetSection); // Debug
        } else {
            console.error('Sección no encontrada:', targetSection); // Debug
        }

        // Actualizar navegación activa
        navItems.forEach(item => {
            item.classList.remove('active');
        });

        // Marcar botón activo
        const activeButton = document.querySelector(`[data-section="${targetSection}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
            console.log('Botón marcado como activo:', targetSection); // Debug
        }

        // Cambiar URL sin recargar (opcional)
        if (history.pushState) {
            history.pushState(null, '', `#${targetSection}`);
        }
    }

    // Event listeners para navegación
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault(); // Prevenir comportamiento por defecto
            const section = this.getAttribute('data-section');
            console.log('Click en botón:', section); // Debug
            showSection(section);
        });
    });

    // Manejar navegación por URL (back/forward)
    window.addEventListener('popstate', function() {
        const hash = window.location.hash.substring(1);
        if (hash) {
            showSection(hash);
        } else {
            showSection('zona'); // Sección por defecto
        }
    });

    // Cargar sección inicial basada en URL
    const initialHash = window.location.hash.substring(1);
    if (initialHash && document.getElementById(initialHash)) {
        showSection(initialHash);
    } else {
        showSection('zona'); // Sección por defecto
    }

    // Test: Funciones globales para debug
    window.testNavigation = function(section) {
        showSection(section);
    };
});


// Agregar al archivo js/spa-navigation.js

// Funcionalidad del modal
function initializeModal() {
    const modal = document.getElementById('add-modal');
    const addOptionBtns = document.querySelectorAll('.add-option-btn');
    const modalClose = document.querySelector('.modal-close');
    const modalCancel = document.querySelector('.modal-cancel');
    const modalSave = document.querySelector('.modal-save');
    const modalTitle = document.getElementById('modal-title');
    const formContainer = document.getElementById('form-container');

    // Formularios para cada tipo de contenido
    const formTemplates = {
        texto: `
            <form class="modal-form">
                <label for="texto-titulo">Título del recuerdo</label>
                <input type="text" id="texto-titulo" required>
                
                <label for="texto-contenido">Contenido</label>
                <textarea id="texto-contenido" rows="4" required></textarea>
                
                <label for="texto-fecha">Fecha</label>
                <input type="date" id="texto-fecha">
                
                <label for="texto-estado">Estado de ánimo</label>
                <select id="texto-estado">
                    <option value="feliz">😊 Feliz</option>
                    <option value="nostalgico">😌 Nostálgico</option>
                    <option value="emocionado">🤗 Emocionado</option>
                    <option value="tranquilo">😌 Tranquilo</option>
                </select>
            </form>
        `,
        foto: `
            <form class="modal-form">
                <label for="foto-titulo">Título de la foto</label>
                <input type="text" id="foto-titulo" required>
                
                <label for="foto-descripcion">Descripción</label>
                <textarea id="foto-descripcion" rows="3"></textarea>
                
                <label>Subir foto</label>
                <div class="file-upload">
                    <input type="file" id="foto-file" accept="image/*">
                    <div class="file-upload-btn">
                        <span>📁 Seleccionar imagen</span>
                    </div>
                </div>
                
                <label for="foto-fecha">Fecha de la foto</label>
                <input type="date" id="foto-fecha">
            </form>
        `,
        audio: `
            <form class="modal-form">
                <label for="audio-titulo">Título del audio</label>
                <input type="text" id="audio-titulo" required>
                
                <label for="audio-descripcion">Descripción</label>
                <textarea id="audio-descripcion" rows="2"></textarea>
                
                <label>Subir audio</label>
                <div class="file-upload">
                    <input type="file" id="audio-file" accept="audio/*">
                    <div class="file-upload-btn">
                        <span>🎵 Seleccionar audio</span>
                    </div>
                </div>
                
                <div class="record-section">
                    <button type="button" class="btn-secundario record-btn">🎤 Grabar ahora</button>
                </div>
            </form>
        `,
        video: `
            <form class="modal-form">
                <label for="video-titulo">Título del video</label>
                <input type="text" id="video-titulo" required>
                
                <label for="video-descripcion">Descripción</label>
                <textarea id="video-descripcion" rows="3"></textarea>
                
                <label>Subir video</label>
                <div class="file-upload">
                    <input type="file" id="video-file" accept="video/*">
                    <div class="file-upload-btn">
                        <span>🎬 Seleccionar video</span>
                    </div>
                </div>
                
                <label for="video-fecha">Fecha del video</label>
                <input type="date" id="video-fecha">
            </form>
        `,
        ubicacion: `
            <form class="modal-form">
                <label for="ubicacion-nombre">Nombre del lugar</label>
                <input type="text" id="ubicacion-nombre" required>
                
                <label for="ubicacion-descripcion">¿Por qué es especial este lugar?</label>
                <textarea id="ubicacion-descripcion" rows="3"></textarea>
                
                <label for="ubicacion-direccion">Dirección</label>
                <input type="text" id="ubicacion-direccion">
                
                <div class="map-placeholder">
                    <p>📍 Mapa del lugar aparecerá aquí</p>
                    <button type="button" class="btn-secundario">Usar ubicación actual</button>
                </div>
                
                <label for="ubicacion-fecha">Fecha de la visita</label>
                <input type="date" id="ubicacion-fecha">
            </form>
        `
    };

    const titleMap = {
        texto: 'Agregar Texto',
        foto: 'Agregar Foto',
        audio: 'Agregar Audio',
        video: 'Agregar Video',
        ubicacion: 'Agregar Ubicación'
    };

    // Abrir modal
    addOptionBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            modalTitle.textContent = titleMap[type];
            formContainer.innerHTML = formTemplates[type];
            modal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevenir scroll
        });
    });

    // Cerrar modal
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    modalClose.addEventListener('click', closeModal);
    modalCancel.addEventListener('click', closeModal);

    // Cerrar al hacer clic fuera del modal
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Guardar contenido
    modalSave.addEventListener('click', function() {
        // Aquí procesas el formulario
        console.log('Guardando contenido...');
        
        // TODO: Obtener datos del formulario y guardar
        const formData = new FormData(formContainer.querySelector('form'));
        
        // Mostrar confirmación
        alert('¡Recuerdo guardado exitosamente!');
        closeModal();
    });

    // Escape key para cerrar
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
}

// Agregar al final del DOMContentLoaded en spa-navigation.js
document.addEventListener('DOMContentLoaded', function() {
    // ... código existente ...
    
    // Inicializar modal
    initializeModal();
});