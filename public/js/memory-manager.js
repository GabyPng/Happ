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
        if (gardenData) {
            this.currentGarden = JSON.parse(gardenData);
            this.loadMemories();
        }
    }

    async loadMemories() {
        if (!this.currentGarden) return;
        
        this.isLoading = true;
        this.showLoading();
        
        try {
            // Detectar si estamos en desarrollo local o producción
            const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const apiBaseUrl = isDevelopment ? 'http://localhost:3000' : 'https://happ-k5za.onrender.com';
            
            const response = await fetch(`${apiBaseUrl}/getMemorias/${this.currentGarden._id}`);
            if (response.ok) {
                const result = await response.json();
                this.memories = result.memorias || [];
                this.renderCurrentView();
            } else {
                console.error('Error al cargar memorias desde API');
                this.loadMockData();
            }
        } catch (error) {
            console.error('Error al cargar memorias:', error);
            
            // Fallback: cargar datos de prueba si no hay backend
            console.warn('Cargando datos de prueba debido a error de conexión');
            this.loadMockData();
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

    renderCurrentView() {
        const activeSection = document.querySelector('.navigation__item--active')?.dataset.section;
        
        if (activeSection === 'zona') {
            this.renderZoneView();
        } else if (activeSection === 'recuerdos') {
            this.renderMemoriesGrid();
        }
    }

    renderZoneView() {
        if (!this.zoneElement) return;
        
        if (this.isLoading) {
            this.zoneElement.innerHTML = `
                <div class="zone__loading">
                    🌱 Cargando recuerdos...
                </div>
            `;
            return;
        }
        
        if (this.memories.length === 0) {
            this.zoneElement.innerHTML = `
                <div class="zone__empty">
                    <div class="zone__empty-icon">🌸</div>
                    <div class="zone__empty-text">Tu jardín está esperando sus primeros recuerdos</div>
                    <div class="zone__empty-hint">Ve a "Agregar" para plantar tus memorias</div>
                </div>
            `;
            return;
        }
        
        // Limpiar zona
        this.zoneElement.innerHTML = '';
        
        // Renderizar cada memoria en posición aleatoria
        this.memories.forEach((memory, index) => {
            const memoryElement = this.createMemoryZoneElement(memory, index);
            this.zoneElement.appendChild(memoryElement);
        });
    }

    createMemoryZoneElement(memory, index) {
        const element = document.createElement('div');
        element.className = `memory-item memory-item--${memory.memoryType.toLowerCase()}`;
        element.dataset.memoryId = memory._id;
        
        // Posición aleatoria pero evitando bordes
        const maxX = this.zoneElement.offsetWidth - 100;
        const maxY = this.zoneElement.offsetHeight - 100;
        const x = 50 + Math.random() * (maxX - 50);
        const y = 50 + Math.random() * (maxY - 50);
        
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
        
        // Contenido según tipo de memoria
        let content = '';
        let tooltipText = memory.title || 'Recuerdo sin título';
        
        switch (memory.memoryType) {
            case 'Text':
                content = `<div class="memory-emoji">${this.getTextEmoji(memory.content)}</div>`;
                tooltipText = memory.title || memory.content?.substring(0, 30) + '...';
                break;
                
            case 'Image':
                content = `<img src="${memory.filePath}" alt="${memory.title}" />`;
                break;
                
            case 'Audio':
                // El CSS ya maneja el icono con ::before
                break;
                
            case 'Video':
                // El CSS ya maneja el icono con ::before
                break;
                
            case 'Location':
                // El CSS ya maneja el icono con ::before
                tooltipText = memory.locationName || `${memory.coordinates?.lat.toFixed(4)}, ${memory.coordinates?.lng.toFixed(4)}`;
                break;
        }
        
        element.innerHTML = `
            ${content}
            <div class="memory-tooltip">${tooltipText}</div>
        `;
        
        // Event listeners
        element.addEventListener('click', () => this.openMemoryModal(memory));
        
        return element;
    }

    getTextEmoji(content) {
        if (!content) return '📝';
        
        const lowerContent = content.toLowerCase();
        
        // Emojis basados en palabras clave
        if (lowerContent.includes('amor') || lowerContent.includes('quiero')) return '❤️';
        if (lowerContent.includes('feliz') || lowerContent.includes('alegr')) return '😊';
        if (lowerContent.includes('triste') || lowerContent.includes('llorar')) return '😢';
        if (lowerContent.includes('cumpleaños') || lowerContent.includes('celebrar')) return '🎉';
        if (lowerContent.includes('viaje') || lowerContent.includes('vacaciones')) return '✈️';
        if (lowerContent.includes('familia') || lowerContent.includes('casa')) return '🏠';
        if (lowerContent.includes('amigo') || lowerContent.includes('amistad')) return '👫';
        if (lowerContent.includes('graduación') || lowerContent.includes('título')) return '🎓';
        if (lowerContent.includes('trabajo') || lowerContent.includes('oficina')) return '💼';
        if (lowerContent.includes('comida') || lowerContent.includes('comer')) return '🍽️';
        
        return '📝'; // Default
    }

    renderMemoriesGrid() {
        if (!this.memoriesGridElement) return;
        
        if (this.isLoading) {
            this.memoriesGridElement.innerHTML = `
                <div class="zone__loading">
                    📖 Cargando recuerdos...
                </div>
            `;
            return;
        }
        
        if (this.memories.length === 0) {
            this.memoriesGridElement.innerHTML = `
                <div class="zone__empty">
                    <div class="zone__empty-icon">📚</div>
                    <div class="zone__empty-text">No hay recuerdos en este jardín</div>
                    <div class="zone__empty-hint">Comienza agregando tu primera memoria</div>
                </div>
            `;
            return;
        }
        
        // Renderizar grid de memorias
        this.memoriesGridElement.innerHTML = this.memories.map(memory => 
            this.createMemoryCardElement(memory)
        ).join('');
        
        // Agregar event listeners
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

    createMemoryCardElement(memory) {
        const formatDate = (date) => {
            return new Date(date).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        };
        
        const getTypeIcon = (type) => {
            const icons = {
                'Text': '📝',
                'Image': '📷',
                'Audio': '🎵',
                'Video': '🎬',
                'Location': '📍'
            };
            return icons[type] || '📝';
        };
        
        let mediaContent = '';
        let extraContent = '';
        
        switch (memory.memoryType) {
            case 'Image':
                mediaContent = `
                    <div class="memory-card__media">
                        <img src="${memory.filePath}" alt="${memory.title}" />
                    </div>
                `;
                break;
                
            case 'Audio':
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
                extraContent = `
                    <div class="memory-card__location-info">
                        <span>📍</span>
                        <span>${memory.locationName || 'Ubicación guardada'}</span>
                    </div>
                `;
                break;
        }
        
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
        `;
        
        const header = modal.querySelector('.memory-modal__header');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 20px 0;
            border-bottom: 1px solid #eee;
            margin-bottom: 20px;
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

    showLoading() {
        if (this.zoneElement) {
            this.zoneElement.innerHTML = `
                <div class="zone__loading">
                    🌱 Cargando recuerdos...
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
        this.memories.unshift(memory);
        this.renderCurrentView();
    }

    // Método para actualizar memoria existente
    updateMemory(updatedMemory) {
        const index = this.memories.findIndex(m => m._id === updatedMemory._id);
        if (index !== -1) {
            this.memories[index] = updatedMemory;
            this.renderCurrentView();
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.memoryManager = new MemoryManager();
});
