/**
 * Garden Manager - Gestión de jardines del usuario
 * Maneja la visualización de jardines propios y compartidos usando el HTML existente
 */

class GardenManager {
    constructor() {
        this.apiUrl = 'https://happ-k5za.onrender.com';
        this.currentUser = null;
        this.userGardens = [];
        this.isLoading = false;
        this.gardensContainer = null;
        
        this.init();
    }

    init() {
        // Obtener elementos del DOM basados en tu HTML existente
        this.gardensContainer = document.querySelector('.gardens-grid');
        
        // Cargar usuario actual
        this.loadCurrentUser();
        
        // Verificar si estamos en la página de jardines
        if (window.location.pathname.includes('mis-jardines') || 
            document.querySelector('.gardens-grid')) {
            this.loadUserGardens();
        }
        
        // Event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Botón para crear nuevo jardín
        const createGardenBtn = document.getElementById('btn-nuevo-jardin');
        if (createGardenBtn) {
            createGardenBtn.addEventListener('click', () => {
                window.location.href = 'crear-jardin.html';
            });
        }

        // Botón para ir a mis jardines desde acceder-jardin
        const misJardinesBtn = document.getElementById('btn-mis-jardines');
        if (misJardinesBtn) {
            misJardinesBtn.addEventListener('click', () => {
                window.location.href = 'mis-jardines.html';
            });
        }
    }

    loadCurrentUser() {
        const userData = localStorage.getItem('happiety_user');
        if (userData) {
            this.currentUser = JSON.parse(userData);
        }
    }

    async loadUserGardens() {
        if (!this.currentUser) {
            this.showMessage('Debes iniciar sesión para ver tus jardines', 'error');
            window.location.href = 'index.html';
            return;
        }

        this.isLoading = true;
        this.showLoading();

        try {
            // Obtener todos los jardines con autorización
            const token = localStorage.getItem('happiety_token');
            console.log('🎫 Token para obtener jardines:', token ? token.substring(0, 20) + '...' : 'NO HAY TOKEN');
            
            const response = await fetch(`${this.apiUrl}/getJardines`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                const allGardens = result.jardines || [];
                
                // Filtrar jardines del usuario (propios + compartidos)
                this.userGardens = allGardens.filter(garden => 
                    garden.owner._id === this.currentUser.id || 
                    garden.members.some(member => member._id === this.currentUser.id)
                );
                
                this.renderGardensWithExistingHTML();
                this.updateStats();
            } else {
                const error = await response.json();
                if (error.requiresAuth) {
                    // Token inválido, redirigir a login
                    localStorage.removeItem('happiety_token');
                    localStorage.removeItem('happiety_user');
                    window.location.href = 'index.html';
                    return;
                }
                throw new Error(error.message || 'Error al cargar jardines');
            }
        } catch (error) {
            console.error('Error al cargar jardines:', error);
            this.showError('Error al cargar tus jardines. Intenta de nuevo.');
        } finally {
            this.isLoading = false;
        }
    }

    renderGardensWithExistingHTML() {
        if (!this.gardensContainer) return;

        if (this.userGardens.length === 0) {
            this.gardensContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state__icon">📚</div>
                    <h3 class="empty-state__title">No tienes jardines aún</h3>
                    <p class="empty-state__description">Usa el botón "+ Nuevo Jardín" arriba para crear tu primer jardín de recuerdos o únete a uno usando un código de acceso</p>
                </div>
            `;
            return;
        }

        // Limpiar el contenedor y renderizar jardines reales
        this.gardensContainer.innerHTML = '';
        
        this.userGardens.forEach((garden, index) => {
            const gardenCard = this.createGardenCardHTML(garden, index);
            this.gardensContainer.innerHTML += gardenCard;
        });

        // Agregar event listeners a las cards
        this.setupGardenCardListeners();
    }

    createGardenCardHTML(garden, index) {
        const isOwner = garden.owner._id === this.currentUser.id;
        const createdDate = new Date(garden.createdAt).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        return `
            <div class="card card--garden" data-garden-id="${garden._id}" data-access-code="${garden.accessCode}">
                <div class="card__header">
                    <p class="text text--guide">Hace ${this.getTimeAgo(garden.createdAt)}📅</p>
                    ${isOwner ? '<span class="owner-badge" title="Eres el propietario">👑</span>' : ''}
                </div>
                <p class="form__legend card__title">${garden.name}</p>
                <p class="text text--garden-description">
                    ${garden.description || 'Sin descripción'}
                </p>
                <p class="text text--guide">Creado: ${createdDate}</p>
                <p class="text text--guide">${garden.stats?.memoryCount || 0} Recuerdos guardados</p>
                <p class="text text--guide">Código: ${garden.accessCode}</p>
                
                <div class="button-group">
                    <button class="button button--icon garden-enter-btn" data-access-code="${garden.accessCode}" title="Ver jardín">
                        <img src="./assets/icons/visualize.png" alt="Ver" class="icon icon--button">
                    </button>
                    ${isOwner ? `
                        <button class="button button--icon garden-edit-btn" data-garden-id="${garden._id}" title="Editar jardín">
                            <img src="./assets/icons/text.png" alt="Editar" class="icon icon--button">
                        </button>
                        <button class="button button--icon button--danger garden-delete-btn" data-garden-id="${garden._id}" title="Eliminar jardín">
                            <img src="./assets/icons/add.png" alt="Eliminar" class="icon icon--button" style="transform: rotate(45deg);">
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    setupGardenCardListeners() {
        if (!this.gardensContainer) return;

        // Entrar al jardín
        this.gardensContainer.querySelectorAll('.garden-enter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const accessCode = e.target.dataset.accessCode;
                this.enterGarden(accessCode);
            });
        });

        // Editar jardín (solo propietarios)
        this.gardensContainer.querySelectorAll('.garden-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const gardenId = e.target.dataset.gardenId;
                this.editGarden(gardenId);
            });
        });

        // Eliminar jardín (solo propietarios)
        this.gardensContainer.querySelectorAll('.garden-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const gardenId = e.target.dataset.gardenId;
                this.deleteGarden(gardenId);
            });
        });

        // Salir del jardín (solo miembros)
        this.gardensContainer.querySelectorAll('.garden-leave-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const gardenId = e.target.dataset.gardenId;
                this.leaveGarden(gardenId);
            });
        });
    }

    updateStats() {
        // Actualizar estadísticas en la página
        const totalGardensEl = document.getElementById('conteo-jardines-creados');
        const totalMemoriesEl = document.getElementById('conteo-recuerdos');
        const averageEl = document.getElementById('conteo-promedio');

        if (totalGardensEl) {
            totalGardensEl.textContent = this.userGardens.length;
        }

        if (totalMemoriesEl) {
            const totalMemories = this.userGardens.reduce((sum, garden) => sum + garden.stats.memoryCount, 0);
            totalMemoriesEl.textContent = totalMemories;
        }

        if (averageEl) {
            const average = this.userGardens.length > 0 ? 
                Math.round(this.userGardens.reduce((sum, garden) => sum + garden.stats.memoryCount, 0) / this.userGardens.length) : 0;
            averageEl.textContent = average;
        }
    }

    async enterGarden(accessCode) {
        try {
            const garden = this.userGardens.find(g => g.accessCode === accessCode);
            if (garden) {
                // Guardar jardín actual en localStorage
                localStorage.setItem('currentGarden', JSON.stringify(garden));
                
                // Redirigir a la vista del jardín
                window.location.href = 'ver-jardin.html';
            }
        } catch (error) {
            console.error('Error al entrar al jardín:', error);
            this.showError('Error al acceder al jardín');
        }
    }

    async deleteGarden(gardenId) {
        const garden = this.userGardens.find(g => g._id === gardenId);
        if (!garden) return;

        const confirmMessage = `¿Estás seguro de que quieres eliminar el jardín "${garden.name}"?\n\nEsta acción eliminará:\n- Todos los recuerdos del jardín\n- Todos los miembros\n- No se puede deshacer`;
        
        if (!confirm(confirmMessage)) return;

        // Mostrar indicador de carga
        const gardenCard = document.querySelector(`[data-garden-id="${gardenId}"]`);
        const deleteBtn = gardenCard.querySelector('.garden-delete-btn');
        const originalContent = deleteBtn.innerHTML;
        deleteBtn.innerHTML = '<div style="width: 20px; height: 20px; border: 2px solid #fff; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>';
        deleteBtn.disabled = true;

        try {
            const response = await fetch(`${this.apiUrl}/deleteJardin/${gardenId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('happiety_token')}`
                }
            });

            if (response.ok) {
                // Remover del array local inmediatamente para una respuesta rápida
                this.userGardens = this.userGardens.filter(g => g._id !== gardenId);
                this.renderGardensWithExistingHTML();
                this.updateStats();
                this.showSuccess('Jardín eliminado correctamente');
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Error al eliminar el jardín');
            }
        } catch (error) {
            console.error('Error al eliminar jardín:', error);
            this.showError('Error al eliminar el jardín');
            // Restaurar el botón en caso de error
            deleteBtn.innerHTML = originalContent;
            deleteBtn.disabled = false;
        }
    }

    editGarden(gardenId) {
        // Guardar el ID del jardín a editar y redirigir
        localStorage.setItem('editingGardenId', gardenId);
        window.location.href = 'crear-jardin.html?edit=' + gardenId;
    }

    async leaveGarden(gardenId) {
        const garden = this.userGardens.find(g => g._id === gardenId);
        if (!garden) return;

        const confirmMessage = `¿Estás seguro de que quieres salir del jardín "${garden.name}"?\n\nPodrás volver a unirte usando el código de acceso.`;
        
        if (!confirm(confirmMessage)) return;

        try {
            // Actualizar jardín removiendo al usuario de members
            const updatedMembers = garden.members.filter(member => member._id !== this.currentUser.id);
            
            const response = await fetch(`${this.apiUrl}/updateJardin/${gardenId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    members: updatedMembers.map(m => m._id)
                })
            });

            if (response.ok) {
                // Remover del array local
                this.userGardens = this.userGardens.filter(g => g._id !== gardenId);
                this.renderGardensWithExistingHTML();
                this.updateStats();
                this.showSuccess('Has salido del jardín correctamente');
            } else {
                throw new Error('Error al salir del jardín');
            }
        } catch (error) {
            console.error('Error al salir del jardín:', error);
            this.showError('Error al salir del jardín');
        }
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffTime = Math.abs(now - new Date(date));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Hace 1 día';
        if (diffDays < 7) return `Hace ${diffDays} días`;
        if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
        return `Hace ${Math.floor(diffDays / 30)} meses`;
    }

    showLoading() {
        if (this.gardensContainer) {
            this.gardensContainer.innerHTML = `
                <div class="card card--garden">
                    <div class="card__header">
                        <p class="text text--guide">Cargando...</p>
                    </div>
                    <p class="form__legend card__title">🌸 Cargando jardines</p>
                    <p class="text text--garden-description">Estamos buscando tus jardines de recuerdos...</p>
                    <p class="text text--guide">Por favor espera un momento</p>
                    <p class="text text--guide">✨ Preparando la magia</p>
                    <button class="button button--access" disabled>Cargando...</button>
                </div>
            `;
        }
    }

    showError(message) {
        console.error(message);
        if (this.gardensContainer) {
            this.gardensContainer.innerHTML = `
                <div class="card card--garden card--error">
                    <div class="card__header">
                        <p class="text text--guide">Error</p>
                    </div>
                    <p class="form__legend card__title">⚠️ Oops, algo salió mal</p>
                    <p class="text text--garden-description">${message}</p>
                    <p class="text text--guide">Intenta recargar la página</p>
                    <p class="text text--guide">Si el problema persiste, contacta soporte</p>
                    <button class="button button--access" onclick="window.location.reload()">Reintentar</button>
                </div>
            `;
        }
    }

    showSuccess(message) {
        // Crear notificación temporal usando los estilos existentes
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.innerHTML = `
            <div class="card" style="position: fixed; top: 20px; right: 20px; z-index: 10000; background: #4CAF50; color: white; padding: 16px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-width: 300px;">
                <p class="text" style="color: white; margin: 0;">✅ ${message}</p>
            </div>
        `;

        document.body.appendChild(notification);

        // Remover después de 3 segundos
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Método público para refrescar jardines
    refresh() {
        this.loadUserGardens();
    }

    // Método para agregar un nuevo jardín a la lista (llamado desde crear-jardin)
    addGarden(garden) {
        this.userGardens.unshift(garden);
        this.renderGardensWithExistingHTML();
        this.updateStats();
        this.showSuccess(`Jardín "${garden.name}" agregado correctamente`);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.gardenManager = new GardenManager();
});

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GardenManager;
}