/**
 * Memory Manager - Gestión de visualización y manipulación de recuerdos
 * Maneja tanto la vista de zona (césped) como la vista de lista de recuerdos
 */

class MemoryManager {
    constructor() {
        this.currentGarden = null;
        this.memories = [];
        this.isLoading = false;
        this.zoneElement = null;
        this.memoriesGridElement = null;
        
        this.init();
    }

    init() {
        this.zoneElement = document.querySelector('.zone__grass');
        this.memoriesGridElement = document.querySelector('.memories-grid');
        
        // Escuchar eventos de navegación
        document.addEventListener('sectionChanged', (e) => {
            if (e.detail.section === 'zona') {
                this.renderZoneView();
            } else if (e.detail.section === 'recuerdos') {
                this.renderMemoriesGrid();
            }
        });
        
        // Cargar jardín desde localStorage
        this.loadCurrentGarden();
    }

    loadCurrentGarden() {
        const gardenData = localStorage.getItem('currentGarden');
        console.log('Cargando jardín actual:', gardenData ? 'existe' : 'no existe');
        
        if (gardenData) {
            try {
                this.currentGarden = JSON.parse(gardenData);
                console.log('Jardín cargado:', this.currentGarden);
                
                // Cargar memorias inmediatamente desde localStorage para persistencia
                this.loadMemoriesFromLocalStorage();
                
                // También intentar cargar desde API como fallback/actualización
                this.loadMemories();
            } catch (error) {
                console.error('Error al parsear datos del jardín:', error);
                this.currentGarden = null;
            }
        } else {
            console.warn('No hay jardín actual en localStorage');
        }
    }

    async loadMemories() {
        if (!this.currentGarden) return;
        
        // Si ya tenemos memorias cargadas desde localStorage, no mostrar loading
        const hasLocalMemories = this.memories.length > 0;
        
        if (!hasLocalMemories) {
            this.isLoading = true;
            this.showLoading();
        }
        
        // Timeout de seguridad para evitar quedarse en loading infinito
        const loadingTimeout = setTimeout(() => {
            console.warn('Timeout en loadMemories, manteniendo datos de localStorage si existen');
            if (this.isLoading) { // Solo si aún está cargando
                this.isLoading = false;
                if (!hasLocalMemories) {
                    this.loadMemoriesFromLocalStorage();
                }
                this.renderCurrentView();
            }
        }, 3000); // 3 segundos
        
        try {
            // Detectar si estamos en desarrollo local o producción
            const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const apiBaseUrl = isDevelopment ? 'http://localhost:3000' : 'https://happ-k5za.onrender.com';
            
            console.log('Intentando cargar desde:', apiBaseUrl);
            const response = await fetch(`${apiBaseUrl}/getMemorias/${this.currentGarden._id}`);
            
            // Limpiar timeout si la petición responde
            clearTimeout(loadingTimeout);
            
            if (response.ok) {
                const result = await response.json();
                const serverMemories = result.memorias || [];
                console.log('Memorias cargadas desde API:', serverMemories.length);
                
                // Solo actualizar si el servidor tiene memorias diferentes o más recientes
                if (serverMemories.length > 0) {
                    this.memories = serverMemories;
                    this.updateLocalStorageMemories(); // Sincronizar con localStorage
                }
                this.renderCurrentView();
            } else {
                console.error('Error al cargar memorias desde API - Status:', response.status);
                // Si falla la API, mantener datos de localStorage
                if (!hasLocalMemories) {
                    this.loadMemoriesFromLocalStorage();
                }
                this.renderCurrentView();
            }
        } catch (error) {
            clearTimeout(loadingTimeout); // Limpiar timeout en caso de error
            console.error('Error al cargar memorias:', error);
            
            // Fallback: mantener datos de localStorage si existen
            console.warn('Manteniendo recuerdos de localStorage debido a error de conexión');
            if (!hasLocalMemories) {
                this.loadMemoriesFromLocalStorage();
            }
            this.renderCurrentView();
        } finally {
            this.isLoading = false;
        }
    }

    // Método temporal para datos de prueba
    loadMockData() {
        this.memories = [
            {
                _id: '1',
                title: 'Mi primer recuerdo',
                description: 'Un día especial que siempre recordaré',
                memoryType: 'Text',
                content: 'Este es un recuerdo de prueba mientras configuramos el backend. ¡Qué día tan hermoso fue aquel!',
                eventDate: new Date().toISOString(),
                createdAt: new Date().toISOString()
            },
            {
                _id: '2',
                title: 'Ubicación especial',
                description: 'Un lugar que guardo en mi corazón',
                memoryType: 'Location',
                locationName: 'Mi lugar favorito',
                coordinates: { lat: -34.6037, lng: -58.3816 },
                eventDate: new Date().toISOString(),
                createdAt: new Date().toISOString()
            },
            {
                _id: '3',
                title: 'Momento de alegría',
                description: 'Una celebración inolvidable',
                memoryType: 'Text',
                content: 'Cumpleaños familiar lleno de amor y risas',
                eventDate: new Date().toISOString(),
                createdAt: new Date().toISOString()
            }
        ];
        this.renderCurrentView();
    }

    // Método para cargar recuerdos desde localStorage
    loadMemoriesFromLocalStorage() {
        try {
            if (!this.currentGarden || !this.currentGarden._id) {
                console.warn('No hay jardín actual para cargar recuerdos desde localStorage');
                this.loadMockData();
                return;
            }
            
            const storageKey = `garden_memories_${this.currentGarden._id}`;
            const savedMemories = JSON.parse(localStorage.getItem(storageKey) || '[]');
            
            if (savedMemories.length > 0) {
                console.log(`Cargando ${savedMemories.length} recuerdos desde localStorage para jardín ${this.currentGarden._id}`);
                this.memories = savedMemories;
                this.renderCurrentView();
                return true; // Indicar que se cargaron memorias
            } else {
                console.log('No hay recuerdos guardados en localStorage para este jardín');
                this.memories = []; // Limpiar memorias
                return false; // Indicar que no se encontraron memorias
            }
        } catch (error) {
            console.error('Error al cargar recuerdos desde localStorage:', error);
            this.memories = [];
            return false;
        }
    }

    renderCurrentView() {
        const activeSection = document.querySelector('.nav__item--active')?.dataset.section;
        console.log('Renderizando vista actual. Sección activa:', activeSection);
        
        if (activeSection === 'zona') {
            this.renderZoneView();
        } else if (activeSection === 'recuerdos') {
            this.renderMemoriesGrid();
        } else {
            // Si no hay sección activa, intentar renderizar basándose en la sección visible
            const visibleSection = document.querySelector('.page-section--active')?.id;
            console.log('No hay nav activo, sección visible:', visibleSection);
            
            if (visibleSection === 'zona') {
                this.renderZoneView();
            } else if (visibleSection === 'recuerdos') {
                this.renderMemoriesGrid();
            }
        }
    }

    /**
     * Renderiza la vista de zona (jardín virtual) con los recuerdos posicionados aleatoriamente
     * Cada recuerdo aparece como un elemento visual en el "césped"
     */
    renderZoneView() {
        if (!this.zoneElement) return;
        
        // Mostrar indicador de carga
        if (this.isLoading) {
            this.zoneElement.innerHTML = `
                <div class="zone__loading">
                    <img src="./assets/icons/sparkle.png" alt="Cargando" class="loading-icon"> Cargando recuerdos...
                </div>
            `;
            return;
        }
        
        // Estado vacío - sin recuerdos en el jardín
        if (this.memories.length === 0) {
            this.zoneElement.innerHTML = `
                <div class="zone__empty">
                    <div class="zone__empty-icon"><img src="./assets/icons/flor.png" alt="Jardín vacío" class="empty-icon"></div>
                    <div class="zone__empty-text">Tu jardín está esperando sus primeros recuerdos</div>
                    <div class="zone__empty-hint">Ve a "Agregar" para plantar tus memorias</div>
                </div>
            `;
            return;
        }
        
        // Limpiar zona antes de renderizar
        this.zoneElement.innerHTML = '';
        
        // Renderizar cada memoria en posición aleatoria dentro del césped
        this.memories.forEach((memory, index) => {
            const memoryElement = this.createMemoryZoneElement(memory, index);
            this.zoneElement.appendChild(memoryElement);
        });
    }

    /**
     * Crea un elemento visual para mostrar un recuerdo en la zona del jardín
     * Cada recuerdo se posiciona aleatoriamente y tiene un icono según su tipo
     * @param {Object} memory - El objeto recuerdo con toda su información
     * @param {number} index - Índice del recuerdo en la lista
     * @returns {HTMLElement} - Elemento DOM listo para agregar al jardín
     */
    createMemoryZoneElement(memory, index) {
        const element = document.createElement('div');
        element.className = `memory-item memory-item--${memory.memoryType.toLowerCase()}`;
        element.dataset.memoryId = memory._id;
        
        // Calcular posición aleatoria dentro del área del césped (evitando bordes)
        const maxX = this.zoneElement.offsetWidth - 100;  // Margen derecho de 100px
        const maxY = this.zoneElement.offsetHeight - 100; // Margen inferior de 100px
        const x = 50 + Math.random() * (maxX - 50);       // Margen izquierdo de 50px
        const y = 50 + Math.random() * (maxY - 50);       // Margen superior de 50px
        
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
        
        // Generar contenido visual según el tipo de recuerdo
        let content = '';
        let tooltipText = memory.title || 'Recuerdo sin título';
        
        switch (memory.memoryType) {
            case 'Text':
                // Para texto, usar el sistema de iconos inteligente basado en contenido
                content = this.getTextEmoji(memory.content);
                tooltipText = memory.title || memory.content?.substring(0, 30) + '...';
                break;
                
            case 'Image':
                // Para imágenes, mostrar la imagen o icono de foto como fallback
                if (memory.filePath) {
                    content = `<img src="${memory.filePath}" alt="${memory.title}" class="memory-preview-image" />`;
                } else {
                    content = `<img src="./assets/icons/photo.png" alt="Foto" class="memory-icon">`;
                    tooltipText = memory.title + ' (imagen no disponible)';
                }
                break;
                
            case 'Audio':
                // Para audio, usar icono de música
                content = `<img src="./assets/icons/music.png" alt="Audio" class="memory-icon" style="animation: pulse 2s ease-in-out infinite;">`;
                tooltipText = memory.title || 'Audio grabado';
                break;
                
            case 'Video':
                // Para video, usar icono de video
                content = `<img src="./assets/icons/video.png" alt="Video" class="memory-icon">`;
                tooltipText = memory.title || 'Video grabado';
                break;
                
            case 'Location':
                // Para ubicaciones, usar icono de mapa y mostrar coordenadas en tooltip
                content = `<img src="./assets/icons/location-map.png" alt="Ubicación" class="memory-icon">`;
                tooltipText = memory.locationName || `${memory.coordinates?.lat.toFixed(4)}, ${memory.coordinates?.lng.toFixed(4)}`;
                break;
        }
        
        // Estructura HTML del elemento recuerdo con tooltip informativo
        element.innerHTML = `
            ${content}
            <div class="memory-tooltip">${tooltipText}</div>
        `;
        
        // Agregar interactividad: click abre modal con detalles completos
        element.addEventListener('click', () => this.openMemoryModal(memory));
        
        return element;
    }

    /**
     * Obtiene el icono apropiado para un recuerdo de texto basado en palabras clave
     * @param {string} content - El contenido del recuerdo a analizar
     * @returns {string} - HTML del icono correspondiente
     */
    getTextEmoji(content) {
        if (!content) return '<img src="./assets/icons/note-map.png" alt="Nota" class="memory-icon">';
        
        const lowerContent = content.toLowerCase();
        
        // Iconos basados en palabras clave del contenido
        if (lowerContent.includes('amor') || lowerContent.includes('quiero')) return '<img src="./assets/icons/red-heart.png" alt="Amor" class="memory-icon">';
        if (lowerContent.includes('feliz') || lowerContent.includes('alegre')) return '<img src="./assets/icons/sparkle.png" alt="Felicidad" class="memory-icon">';
        if (lowerContent.includes('triste') || lowerContent.includes('llorar')) return '<img src="./assets/icons/heart-outline.png" alt="Tristeza" class="memory-icon">';
        if (lowerContent.includes('cumpleaños') || lowerContent.includes('celebrar')) return '<img src="./assets/icons/sparkle.png" alt="Celebración" class="memory-icon">';
        if (lowerContent.includes('viaje') || lowerContent.includes('vacaciones')) return '<img src="./assets/icons/location.png" alt="Viaje" class="memory-icon">';
        if (lowerContent.includes('familia') || lowerContent.includes('casa')) return '<img src="./assets/icons/heart-outline.png" alt="Familia" class="memory-icon">';
        if (lowerContent.includes('amigo') || lowerContent.includes('amistad')) return '<img src="./assets/icons/sparkle.png" alt="Amistad" class="memory-icon">';
        if (lowerContent.includes('graduación') || lowerContent.includes('título')) return '<img src="./assets/icons/sparkle.png" alt="Graduación" class="memory-icon">';
        if (lowerContent.includes('trabajo') || lowerContent.includes('oficina')) return '<img src="./assets/icons/note-map.png" alt="Trabajo" class="memory-icon">';
        if (lowerContent.includes('comida') || lowerContent.includes('comer')) return '<img src="./assets/icons/sparkle.png" alt="Comida" class="memory-icon">';
        
        return '<img src="./assets/icons/note-map.png" alt="Nota" class="memory-icon">'; // Icono por defecto
    }

    /**
     * Renderiza la vista de cuadrícula con todos los recuerdos en formato de tarjetas
     * Muestra información detallada de cada recuerdo con opciones de edición y eliminación
     */
    renderMemoriesGrid() {
        if (!this.memoriesGridElement) {
            console.warn('Elemento .memories-grid no encontrado');
            return;
        }
        
        console.log('Renderizando grid de memorias. isLoading:', this.isLoading, 'memories count:', this.memories.length);
        
        // Mostrar indicador de carga
        if (this.isLoading) {
            this.memoriesGridElement.innerHTML = `
                <div class="zone__loading">
                    <img src="./assets/icons/flor.png" alt="Cargando" class="loading-icon"> Cargando recuerdos...
                </div>
            `;
            return;
        }
        
        // Estado vacío - sin recuerdos para mostrar
        if (this.memories.length === 0) {
            this.memoriesGridElement.innerHTML = `
                <div class="zone__empty">
                    <div class="zone__empty-icon"><img src="./assets/icons/flor.png" alt="Sin recuerdos" class="empty-icon"></div>
                    <div class="zone__empty-text">No hay recuerdos en este jardín</div>
                    <div class="zone__empty-hint">Comienza agregando tu primera memoria</div>
                </div>
            `;
            return;
        }
        
        // Renderizar cuadrícula de tarjetas de memorias
        this.memoriesGridElement.innerHTML = this.memories.map(memory => 
            this.createMemoryCardElement(memory)
        ).join('');
        
        // Agregar event listeners para botones de acción
        this.memoriesGridElement.querySelectorAll('.memory-card__action--edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const memoryId = e.target.closest('.memory-card').dataset.memoryId;
                const memory = this.memories.find(m => m._id === memoryId);
                this.editMemory(memory);
            });
        });
        
        this.memoriesGridElement.querySelectorAll('.memory-card__action--delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const memoryId = e.target.closest('.memory-card').dataset.memoryId;
                this.deleteMemory(memoryId);
            });
        });
    }

    /**
     * Crea el elemento HTML de una tarjeta de recuerdo para la vista de cuadrícula
     * Incluye toda la información del recuerdo y botones de acción
     * @param {Object} memory - El objeto recuerdo con toda su información
     * @returns {string} - HTML string de la tarjeta completa
     */
    createMemoryCardElement(memory) {
        // Función auxiliar para formatear fechas en español
        const formatDate = (date) => {
            return new Date(date).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        };
        
        // Función auxiliar para obtener iconos según tipo de recuerdo
        const getTypeIcon = (type) => {
            const icons = {
                'Text': '<img src="./assets/icons/note-map.png" alt="Texto" class="type-icon">',
                'Image': '<img src="./assets/icons/photo.png" alt="Imagen" class="type-icon">',
                'Audio': '<img src="./assets/icons/music.png" alt="Audio" class="type-icon">',
                'Video': '<img src="./assets/icons/video.png" alt="Video" class="type-icon">',
                'Location': '<img src="./assets/icons/location-map.png" alt="Ubicación" class="type-icon">'
            };
            return icons[type] || '<img src="./assets/icons/note-map.png" alt="Recuerdo" class="type-icon">';
        };
        
        let mediaContent = '';
        let extraContent = '';
        
        // Generar contenido específico según el tipo de recuerdo
        switch (memory.memoryType) {
            case 'Image':
                // Mostrar imagen o placeholder si no está disponible
                if (memory.filePath) {
                    mediaContent = `
                        <div class="memory-card__media">
                            <img src="${memory.filePath}" alt="${memory.title}" />
                        </div>
                    `;
                } else {
                    mediaContent = `
                        <div class="memory-card__media">
                            <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 10px;">
                                <img src="./assets/icons/photo.png" alt="Imagen no disponible" class="placeholder-icon"> Imagen no disponible
                            </div>
                        </div>
                    `;
                }
                break;
                
            case 'Audio':
                // Reproductor de audio embebido
                mediaContent = `
                    <div class="memory-card__media">
                        <audio controls class="memory-card__audio">
                            <source src="${memory.filePath}" type="audio/mpeg">
                            Tu navegador no soporta audio.
                        </audio>
                    </div>
                `;
                break;
                
            case 'Video':
                // Reproductor de video embebido
                mediaContent = `
                    <div class="memory-card__media">
                        <video controls>
                            <source src="${memory.filePath}" type="video/mp4">
                            Tu navegador no soporta video.
                        </video>
                    </div>
                `;
                break;
                
            case 'Location':
                // Información de ubicación con icono
                extraContent = `
                    <div class="memory-card__location-info">
                        <img src="./assets/icons/location.png" alt="Ubicación" class="location-icon">
                        <span>${memory.locationName || 'Ubicación guardada'}</span>
                    </div>
                `;
                break;
        }
        
        // Estructura completa de la tarjeta de recuerdo
        return `
            <div class="memory-card memory-card--${memory.memoryType.toLowerCase()}" data-memory-id="${memory._id}">
                <div class="memory-card__header">
                    <div class="memory-card__type-icon memory-card__type-icon--${memory.memoryType.toLowerCase()}">
                        ${getTypeIcon(memory.memoryType)}
                    </div>
                    <div class="memory-card__date">
                        ${formatDate(memory.eventDate)}
                    </div>
                </div>
                
                <h3 class="memory-card__title">${memory.title || 'Sin título'}</h3>
                
                <div class="memory-card__content">
                    ${memory.description ? `<p class="memory-card__description">${memory.description}</p>` : ''}
                    ${mediaContent}
                    ${extraContent}
                </div>
                
                <div class="memory-card__actions">
                    <button class="memory-card__action memory-card__action--edit">
                        Editar
                    </button>
                    <button class="memory-card__action memory-card__action--delete">
                        Eliminar
                    </button>
                </div>
            </div>
        `;
    }

    async deleteMemory(memoryId) {
        if (!confirm('¿Estás seguro de que quieres eliminar este recuerdo?')) {
            return;
        }
        
        try {
            // Detectar si estamos en desarrollo local o producción
            const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const apiBaseUrl = isDevelopment ? 'http://localhost:3000' : 'https://happ-k5za.onrender.com';
            
            const response = await fetch(`${apiBaseUrl}/deleteMemoria/${memoryId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                // Remover de la lista local
                this.memories = this.memories.filter(m => m._id !== memoryId);
                this.updateLocalStorageMemories();
                this.renderCurrentView();
                
                // Mostrar mensaje de éxito
                this.showSuccessMessage('Recuerdo eliminado correctamente');
            } else {
                throw new Error('Error al eliminar el recuerdo');
            }
        } catch (error) {
            console.error('Error al eliminar memoria:', error);
            
            // Fallback: eliminar solo localmente
            this.memories = this.memories.filter(m => m._id !== memoryId);
            this.updateLocalStorageMemories();
            this.renderCurrentView();
            this.showSuccessMessage('Recuerdo eliminado localmente (sin conexión al servidor)');
        }
    }

    editMemory(memory) {
        // Por ahora, abrir modal con información
        // En el futuro se puede integrar con un formulario de edición
        this.openMemoryModal(memory);
    }

    openMemoryModal(memory) {
        // Crear modal simple para mostrar detalles
        const modal = document.createElement('div');
        modal.className = 'memory-modal';
        modal.innerHTML = `
            <div class="memory-modal__backdrop">
                <div class="memory-modal__content">
                    <div class="memory-modal__header">
                        <h2>${memory.title || 'Recuerdo'}</h2>
                        <button class="memory-modal__close">&times;</button>
                    </div>
                    <div class="memory-modal__body">
                        <p><strong>Tipo:</strong> ${memory.memoryType}</p>
                        <p><strong>Fecha:</strong> ${new Date(memory.eventDate).toLocaleDateString('es-ES')}</p>
                        ${memory.description ? `<p><strong>Descripción:</strong> ${memory.description}</p>` : ''}
                        ${memory.content ? `<p><strong>Contenido:</strong> ${memory.content}</p>` : ''}
                        ${memory.locationName ? `<p><strong>Ubicación:</strong> ${memory.locationName}</p>` : ''}
                    </div>
                </div>
            </div>
        `;
        
        // Agregar estilos básicos
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
        `;
        
        const backdrop = modal.querySelector('.memory-modal__backdrop');
        backdrop.style.cssText = `
            background: rgba(0,0,0,0.8);
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        `;
        
        const content = modal.querySelector('.memory-modal__content');
        content.style.cssText = `
            background: white;
            border-radius: 15px;
            max-width: 500px;
            width: 100%;
            max-height: 80vh;
            overflow-y: auto;
            text-align:center;
        `;
        
        const header = modal.querySelector('.memory-modal__header');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 20px 0;
            border-bottom: 1px solid #eee;
            margin-bottom: 20px;
            margin: 0;
            color: #333;
            font-size: 0.8rem;
            font-weight: 600;
        `;
        
        const closeBtn = modal.querySelector('.memory-modal__close');
        closeBtn.style.cssText = `
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
        `;
        
        const body = modal.querySelector('.memory-modal__body');
        body.style.padding = '0 20px 20px';
        
        // Event listeners
        closeBtn.addEventListener('click', () => modal.remove());
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) modal.remove();
        });
        
        document.body.appendChild(modal);
    }

    /**
     * Muestra un indicador de carga en la zona del jardín
     * Se usa mientras se obtienen los recuerdos del servidor
     */
    showLoading() {
        if (this.zoneElement) {
            this.zoneElement.innerHTML = `
                <div class="zone__loading">
                    <img src="./assets/icons/sparkle.png" alt="Cargando" class="loading-icon"> Cargando recuerdos...
                </div>
            `;
        }
    }

    showError(message) {
        console.error(message);
        // En el futuro se puede agregar un sistema de notificaciones más elaborado
    }

    showSuccessMessage(message) {
        console.log(message);
        // En el futuro se puede agregar un sistema de notificaciones más elaborado
    }

    // Método para agregar nueva memoria (se llamará desde otros módulos)
    addMemory(memory) {
        console.log('Agregando nueva memoria:', memory.title);
        
        // Agregar al inicio de la lista
        this.memories.unshift(memory);
        
        // Guardar inmediatamente en localStorage para persistencia
        this.saveMemoryToLocalStorage(memory);
        
        // Renderizar vista actual
        this.renderCurrentView();
        
        console.log(`Total de memorias tras agregar: ${this.memories.length}`);
    }

    // Método para guardar recuerdo en localStorage
    saveMemoryToLocalStorage(memory) {
        try {
            if (!this.currentGarden || !this.currentGarden._id) {
                console.warn('No hay jardín actual para guardar el recuerdo');
                return;
            }
            
            const storageKey = `garden_memories_${this.currentGarden._id}`;
            const existingMemories = JSON.parse(localStorage.getItem(storageKey) || '[]');
            
            // Verificar si ya existe (por ID)
            const existingIndex = existingMemories.findIndex(m => m._id === memory._id);
            if (existingIndex === -1) {
                // Agregar nuevo recuerdo al inicio
                existingMemories.unshift(memory);
                localStorage.setItem(storageKey, JSON.stringify(existingMemories));
                console.log(`Recuerdo "${memory.title}" guardado en localStorage para jardín ${this.currentGarden._id}. Total: ${existingMemories.length}`);
            } else {
                // Actualizar recuerdo existente
                existingMemories[existingIndex] = memory;
                localStorage.setItem(storageKey, JSON.stringify(existingMemories));
                console.log(`Recuerdo "${memory.title}" actualizado en localStorage`);
            }
        } catch (error) {
            console.error('Error al guardar recuerdo en localStorage:', error);
        }
    }

    // Método para actualizar toda la lista de memorias en localStorage
    updateLocalStorageMemories() {
        try {
            if (!this.currentGarden || !this.currentGarden._id) {
                console.warn('No hay jardín actual para actualizar memorias en localStorage');
                return;
            }
            
            const storageKey = `garden_memories_${this.currentGarden._id}`;
            localStorage.setItem(storageKey, JSON.stringify(this.memories));
            console.log(`Memorias actualizadas en localStorage. Total: ${this.memories.length}`);
        } catch (error) {
            console.error('Error al actualizar memorias en localStorage:', error);
        }
    }

    // Método para actualizar memoria existente
    updateMemory(updatedMemory) {
        const index = this.memories.findIndex(m => m._id === updatedMemory._id);
        if (index !== -1) {
            this.memories[index] = updatedMemory;
            this.updateLocalStorageMemories();
            this.renderCurrentView();
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando MemoryManager...');
    window.memoryManager = new MemoryManager();
    
    // Verificar inmediatamente si hay un jardín actual y memorias guardadas
    setTimeout(() => {
        if (window.memoryManager.currentGarden && window.memoryManager.memories.length > 0) {
            console.log(`MemoryManager inicializado con ${window.memoryManager.memories.length} memorias guardadas`);
            window.memoryManager.renderCurrentView();
        }
    }, 100); // Pequeño delay para asegurar que todo esté cargado
});
