// Lógica de la zona: recuerdos, música, herbario (archivados)

// Función auxiliar para convertir archivos a Base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('SPA Navigation cargado'); 
    
    const navItems = document.querySelectorAll('.nav__item');
    const sections = document.querySelectorAll('.page-section');

    console.log('Nav items encontrados:', navItems.length); 
    console.log('Secciones encontradas:', sections.length); 

    // Función para cambiar sección
    function showSection(targetSection) {
        console.log('Cambiando a sección:', targetSection); 
        
        // Ocultar todas las secciones
        sections.forEach(section => {
            section.classList.remove('page-section--active');
        });

        // Mostrar sección objetivo
        const section = document.getElementById(targetSection);
        if (section) {
            section.classList.add('page-section--active');
            console.log('Sección mostrada:', targetSection); 
        } else {
            console.error('Sección no encontrada:', targetSection); 
        }

        // Actualizar navegación activa
        navItems.forEach(item => {
            item.classList.remove('nav__item--active');
        });

        // Marcar botón activo
        const activeButton = document.querySelector(`[data-section="${targetSection}"]`);
        if (activeButton) {
            activeButton.classList.add('nav__item--active');
            console.log('Botón marcado como activo:', targetSection); 
        }

        // Emitir evento para que el memory manager pueda reaccionar
        document.dispatchEvent(new CustomEvent('sectionChanged', {
            detail: { section: targetSection }
        }));

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
            console.log('Click en botón:', section); 
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
});


// Agregar al archivo js/spa-navigation.js

// Funcionalidad del modal
function initializeModal() {
    const modal = document.getElementById('add-modal');
    const addOptionBtns = document.querySelectorAll('.button--add-option');
    const modalClose = document.querySelector('.modal__close');
    const modalCancel = document.querySelector('.modal-cancel');
    const modalSave = document.querySelector('.modal-save');
    const modalTitle = document.getElementById('modal-title');
    const formContainer = document.getElementById('form-container');

    // Formularios para cada tipo de contenido
    const formTemplates = {
        texto: `
            <form class="form form--modal">
                <label for="texto-titulo" class="form__label form__label--modal">Título del recuerdo</label>
                <input type="text" id="texto-titulo" class="form__input form__input--modal" required>
                
                <label for="texto-contenido" class="form__label form__label--modal">Contenido</label>
                <textarea id="texto-contenido" rows="4" class="form__textarea form__textarea--modal" required></textarea>
                
                <label for="texto-fecha" class="form__label form__label--modal">Fecha</label>
                <input type="date" id="texto-fecha" class="form__input form__input--modal">
                
                <label for="texto-estado" class="form__label form__label--modal">Estado de ánimo</label>
                <select id="texto-estado" class="form__select form__select--modal">
                    <option value="feliz">😊 Feliz</option>
                    <option value="nostalgico">😌 Nostálgico</option>
                    <option value="emocionado">🤗 Emocionado</option>
                    <option value="tranquilo">😌 Tranquilo</option>
                </select>
            </form>
        `,
        foto: `
            <form class="form form--modal">
                <label for="foto-titulo" class="form__label form__label--modal">Título de la foto</label>
                <input type="text" id="foto-titulo" class="form__input form__input--modal" required>
                
                <label for="foto-descripcion" class="form__label form__label--modal">Descripción</label>
                <textarea id="foto-descripcion" rows="3" class="form__textarea form__textarea--modal"></textarea>
                
                <label class="form__label form__label--modal">Subir foto</label>
                <div class="file-upload">
                    <input type="file" id="foto-file" class="file-upload__input" accept="image/*">
                    <div class="file-upload__button">
                        <span>📁 Seleccionar imagen</span>
                    </div>
                </div>
                
                <label for="foto-fecha" class="form__label form__label--modal">Fecha de la foto</label>
                <input type="date" id="foto-fecha" class="form__input form__input--modal">
            </form>
        `,
        audio: `
            <form class="form form--modal">
                <label for="audio-titulo" class="form__label form__label--modal">Título del audio</label>
                <input type="text" id="audio-titulo" class="form__input form__input--modal" required>
                
                <label for="audio-descripcion" class="form__label form__label--modal">Descripción</label>
                <textarea id="audio-descripcion" rows="2" class="form__textarea form__textarea--modal"></textarea>
                
                <label class="form__label form__label--modal">Subir audio</label>
                <div class="file-upload">
                    <input type="file" id="audio-file" class="file-upload__input" accept="audio/*">
                    <div class="file-upload__button">
                        <span><img src="./assets/icons/music.png" alt="Música" class="inline-icon"> Seleccionar audio</span>
                    </div>
                </div>
                
                <div class="record-section">
                    <button type="button" class="button button--secondary record-btn"><img src="./assets/icons/audio.png" alt="Micrófono" class="inline-icon"> Grabar ahora</button>
                </div>
            </form>
        `,
        video: `
            <form class="form form--modal">
                <label for="video-titulo" class="form__label form__label--modal">Título del video</label>
                <input type="text" id="video-titulo" class="form__input form__input--modal" required>
                
                <label for="video-descripcion" class="form__label form__label--modal">Descripción</label>
                <textarea id="video-descripcion" rows="3" class="form__textarea form__textarea--modal"></textarea>
                
                <label class="form__label form__label--modal">Subir video</label>
                <div class="file-upload">
                    <input type="file" id="video-file" class="file-upload__input" accept="video/*">
                    <div class="file-upload__button">
                        <span>🎬 Seleccionar video</span>
                    </div>
                </div>
                
                <label for="video-fecha" class="form__label form__label--modal">Fecha del video</label>
                <input type="date" id="video-fecha" class="form__input form__input--modal">
            </form>
        `,
        ubicacion: `
            <form class="form form--modal">
                <label for="ubicacion-nombre" class="form__label form__label--modal">Nombre del lugar</label>
                <input type="text" id="ubicacion-nombre" class="form__input form__input--modal" required>
                
                <label for="ubicacion-descripcion" class="form__label form__label--modal">¿Por qué es especial este lugar?</label>
                <textarea id="ubicacion-descripcion" rows="3" class="form__textarea form__textarea--modal"></textarea>
                
                <label for="ubicacion-direccion" class="form__label form__label--modal">Dirección</label>
                <input type="text" id="ubicacion-direccion" class="form__input form__input--modal">
                
                <div class="map-placeholder">
                    <p class="text text--description"><img src="./assets/icons/location-map.png" alt="Ubicación" class="inline-icon"> Mapa del lugar aparecerá aquí</p>
                    <button type="button" class="button button--secondary">Usar ubicación actual</button>
                </div>
                
                <label for="ubicacion-fecha" class="form__label form__label--modal">Fecha de la visita</label>
                <input type="date" id="ubicacion-fecha" class="form__input form__input--modal">
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
            modal.classList.add('modal--active');
            document.body.style.overflow = 'hidden'; // Prevenir scroll
        });
    });

    // Cerrar modal
    function closeModal() {
        modal.classList.remove('modal--active');
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
    modalSave.addEventListener('click', async function() {
        console.log('Guardando contenido...');
        
        try {
            const form = formContainer.querySelector('form');
            if (!form) return;
            
            // Determinar tipo de recuerdo por el modal activo
            const currentType = modalTitle.textContent.toLowerCase();
            let memoryType = 'Text';
            let memoryData = {};
            
            if (currentType.includes('texto')) {
                memoryType = 'Text';
                memoryData = {
                    title: document.getElementById('texto-titulo')?.value || '',
                    content: document.getElementById('texto-contenido')?.value || '',
                    description: document.getElementById('texto-contenido')?.value || '',
                    eventDate: document.getElementById('texto-fecha')?.value || new Date().toISOString().split('T')[0]
                };
            } else if (currentType.includes('foto')) {
                memoryType = 'Image';
                const fileInput = document.getElementById('foto-file');
                const file = fileInput?.files[0];
                
                memoryData = {
                    title: document.getElementById('foto-titulo')?.value || '',
                    description: document.getElementById('foto-descripcion')?.value || '',
                    eventDate: document.getElementById('foto-fecha')?.value || new Date().toISOString().split('T')[0],
                    file: file
                };
                
                // Convertir imagen a Base64 para persistencia
                if (file) {
                    try {
                        const base64 = await fileToBase64(file);
                        memoryData.filePath = base64;
                        memoryData.fileName = file.name;
                        memoryData.fileType = file.type;
                        console.log('Imagen convertida a Base64 para persistencia');
                    } catch (error) {
                        console.error('Error al convertir imagen a Base64:', error);
                        // Fallback a URL temporal
                        memoryData.filePath = URL.createObjectURL(file);
                        memoryData.fileName = file.name;
                        memoryData.fileType = file.type;
                    }
                }
            } else if (currentType.includes('audio')) {
                memoryType = 'Audio';
                const fileInput = document.getElementById('audio-file');
                const file = fileInput?.files[0] || null;
                memoryData = {
                    title: document.getElementById('audio-titulo')?.value || '',
                    description: document.getElementById('audio-descripcion')?.value || '',
                    eventDate: new Date().toISOString().split('T')[0],
                    file: file
                };
                
                // Convertir audio a Base64 para persistencia
                if (file) {
                    try {
                        const base64 = await fileToBase64(file);
                        memoryData.filePath = base64;
                        memoryData.fileName = file.name;
                        memoryData.fileType = file.type;
                        console.log('Audio convertido a Base64 para persistencia');
                    } catch (error) {
                        console.error('Error al convertir audio a Base64:', error);
                        // Fallback a URL temporal
                        memoryData.filePath = URL.createObjectURL(file);
                        memoryData.fileName = file.name;
                        memoryData.fileType = file.type;
                    }
                }
            } else if (currentType.includes('video')) {
                memoryType = 'Video';
                const fileInput = document.getElementById('video-file');
                const file = fileInput?.files[0] || null;
                memoryData = {
                    title: document.getElementById('video-titulo')?.value || '',
                    description: document.getElementById('video-descripcion')?.value || '',
                    eventDate: document.getElementById('video-fecha')?.value || new Date().toISOString().split('T')[0],
                    file: file
                };
                
                // Convertir video a Base64 para persistencia
                if (file) {
                    try {
                        const base64 = await fileToBase64(file);
                        memoryData.filePath = base64;
                        memoryData.fileName = file.name;
                        memoryData.fileType = file.type;
                        console.log('Video convertido a Base64 para persistencia');
                    } catch (error) {
                        console.error('Error al convertir video a Base64:', error);
                        // Fallback a URL temporal
                        memoryData.filePath = URL.createObjectURL(file);
                        memoryData.fileName = file.name;
                        memoryData.fileType = file.type;
                    }
                }
            } else if (currentType.includes('ubicación')) {
                memoryType = 'Location';
                memoryData = {
                    title: document.getElementById('ubicacion-nombre')?.value || '',
                    description: document.getElementById('ubicacion-descripcion')?.value || '',
                    locationName: document.getElementById('ubicacion-nombre')?.value || '',
                    address: document.getElementById('ubicacion-direccion')?.value || '',
                    eventDate: document.getElementById('ubicacion-fecha')?.value || new Date().toISOString().split('T')[0],
                    coordinates: { lat: -34.6037, lng: -58.3816 } // Por ahora coordenadas por defecto
                };
            }
            
            // Validar datos mínimos
            if (!memoryData.title || memoryData.title.trim() === '') {
                alert('Por favor, ingresa un título para el recuerdo');
                return;
            }
            
            // Crear objeto de memoria completo
            const newMemory = {
                _id: Date.now().toString(), // ID temporal hasta que se guarde en el backend
                title: memoryData.title.trim(),
                description: memoryData.description?.trim() || '',
                memoryType: memoryType,
                eventDate: memoryData.eventDate ? new Date(memoryData.eventDate).toISOString() : new Date().toISOString(),
                createdAt: new Date().toISOString(),
                ...memoryData
            };
            
            // Agregar al MemoryManager inmediatamente (para que se vea)
            if (window.memoryManager) {
                window.memoryManager.addMemory(newMemory);
                console.log('Recuerdo agregado al MemoryManager:', newMemory);
                
                // El MemoryManager ya se encarga de guardarlo en localStorage
            }
            
            // TODO: Aquí se podría enviar al backend
            // await saveMemoryToBackend(newMemory);
            
            // Mostrar confirmación
            alert('¡Recuerdo guardado exitosamente!');
            closeModal();
            
            // Cambiar a sección de recuerdos para ver el resultado
            setTimeout(() => {
                document.querySelector('[data-section="recuerdos"]')?.click();
            }, 500);
            
        } catch (error) {
            console.error('Error al guardar recuerdo:', error);
            alert('Error al guardar el recuerdo. Inténtalo de nuevo.');
        }
    });

    // Escape key para cerrar
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('modal--active')) {
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