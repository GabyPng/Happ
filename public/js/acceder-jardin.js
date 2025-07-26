/**
 * Acceder Jardín - Gestión del acceso a jardines por código
 */

class AccederJardin {
    constructor() {
        this.apiUrl = 'http://localhost:3000';
        this.currentUser = null;
        this.formElements = {};
        
        this.init();
    }

    init() {
        this.loadCurrentUser();
        this.getFormElements();
        this.setupEventListeners();
        this.focusCodeInput();
    }

    loadCurrentUser() {
        const userData = localStorage.getItem('happiety_user');
        if (userData) {
            this.currentUser = JSON.parse(userData);
        } else {
            // Redirigir a login si no hay usuario
            window.location.href = 'login-signup.html';
            return;
        }
    }

    getFormElements() {
        this.formElements = {
            form: document.getElementById('form-acceder-jardin'),
            codeInput: document.getElementById('codigo-acceso'),
            submitBtn: document.getElementById('btn-acceder'),
            cancelBtn: document.getElementById('btn-cancelar'),
            backBtn: document.getElementById('btn-mis-jardines'),
            createBtn: document.getElementById('btn-crear-jardin')
        };
    }

    setupEventListeners() {
        // Formulario de acceso
        if (this.formElements.form) {
            this.formElements.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAccessGarden();
            });
        }

        // Input del código - validación en tiempo real
        if (this.formElements.codeInput) {
            this.formElements.codeInput.addEventListener('input', (e) => {
                this.formatCodeInput(e);
                this.validateForm();
            });

            // Permitir solo números y letras
            this.formElements.codeInput.addEventListener('keypress', (e) => {
                const char = String.fromCharCode(e.which);
                if (!/[a-zA-Z0-9]/.test(char)) {
                    e.preventDefault();
                }
            });
        }

        // Botón cancelar
        if (this.formElements.cancelBtn) {
            this.formElements.cancelBtn.addEventListener('click', () => {
                window.location.href = 'mis-jardines.html';
            });
        }

        // Botón volver a jardines
        if (this.formElements.backBtn) {
            this.formElements.backBtn.addEventListener('click', () => {
                window.location.href = 'mis-jardines.html';
            });
        }

        // Botón crear jardín
        if (this.formElements.createBtn) {
            this.formElements.createBtn.addEventListener('click', () => {
                window.location.href = 'crear-jardin.html';
            });
        }
    }

    focusCodeInput() {
        // Auto-enfocar el input del código
        if (this.formElements.codeInput) {
            setTimeout(() => {
                this.formElements.codeInput.focus();
            }, 100);
        }
    }

    formatCodeInput(e) {
        let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        
        // Limitar a 6 caracteres
        if (value.length > 6) {
            value = value.substring(0, 6);
        }
        
        // Formatear con guión cada 3 caracteres
        if (value.length > 3) {
            value = value.substring(0, 3) + '-' + value.substring(3);
        }
        
        e.target.value = value;
    }

    validateForm() {
        const code = this.formElements.codeInput.value.replace('-', '');
        const isValid = code.length === 6;
        
        if (this.formElements.submitBtn) {
            this.formElements.submitBtn.disabled = !isValid;
        }

        return isValid;
    }

    async handleAccessGarden() {
        if (!this.validateForm()) {
            this.showError('Por favor, ingresa un código válido de 6 caracteres');
            return;
        }

        const accessCode = this.formElements.codeInput.value.replace('-', '').toUpperCase();
        
        try {
            // Deshabilitar botón mientras se procesa
            this.formElements.submitBtn.disabled = true;
            this.formElements.submitBtn.textContent = 'Buscando...';

            // Buscar el jardín por código
            const garden = await this.findGardenByCode(accessCode);
            
            if (!garden) {
                throw new Error('Código de jardín no válido o jardín no encontrado');
            }

            // Verificar si el usuario ya es miembro
            const isOwner = garden.owner._id === this.currentUser.id;
            const isMember = garden.members.some(member => member._id === this.currentUser.id);

            if (isOwner) {
                // Es el propietario, solo entrar al jardín
                this.enterGarden(garden);
                return;
            }

            if (isMember) {
                // Ya es miembro, preguntar si quiere entrar
                if (confirm(`Ya eres miembro del jardín "${garden.name}".\n¿Quieres entrar ahora?`)) {
                    this.enterGarden(garden);
                }
                return;
            }

            // No es miembro, preguntar si quiere unirse
            const joinMessage = `¿Quieres unirte al jardín "${garden.name}"?\n\nCreado por: ${garden.owner.name}\nDescripción: ${garden.description || 'Sin descripción'}\nMiembros: ${garden.members.length + 1}`;
            
            if (confirm(joinMessage)) {
                await this.joinGarden(garden);
            }

        } catch (error) {
            console.error('Error al acceder al jardín:', error);
            this.showError(error.message);
        } finally {
            // Rehabilitar botón
            this.formElements.submitBtn.disabled = false;
            this.formElements.submitBtn.textContent = 'Acceder';
        }
    }

    async findGardenByCode(accessCode) {
        try {
            // Usar la nueva ruta específica para búsqueda por código
            const response = await fetch(`${this.apiUrl}/getJardin/code/${accessCode}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('happiety_token')}`
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                return result.jardin;
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Error al buscar el jardín');
            }
        } catch (error) {
            console.error('Error al buscar jardín:', error);
            throw error;
        }
    }

    async joinGarden(garden) {
        try {
            // Agregar el usuario actual a la lista de miembros
            const updatedMembers = [...garden.members.map(m => m._id), this.currentUser.id];
            
            const response = await fetch(`${this.apiUrl}/updateJardin/${garden._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('happiety_token')}`
                },
                body: JSON.stringify({
                    members: updatedMembers
                })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Mostrar mensaje de éxito
                alert(`¡Te has unido exitosamente al jardín "${garden.name}"!`);
                
                // Entrar al jardín
                this.enterGarden(garden);
                
            } else {
                throw new Error(result.message || 'Error al unirse al jardín');
            }

        } catch (error) {
            console.error('Error al unirse al jardín:', error);
            throw new Error('Error al unirse al jardín: ' + error.message);
        }
    }

    enterGarden(garden) {
        // Guardar jardín actual en localStorage
        localStorage.setItem('currentGarden', JSON.stringify(garden));
        
        // Redirigir a la vista del jardín
        window.location.href = 'ver-jardin.html';
    }

    showError(message) {
        // Crear notificación de error temporal
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.innerHTML = `
            <div style="
                position: fixed; 
                top: 20px; 
                right: 20px; 
                z-index: 10000; 
                background: #ff4444; 
                color: white; 
                padding: 16px; 
                border-radius: 8px; 
                box-shadow: 0 4px 12px rgba(0,0,0,0.15); 
                max-width: 300px;
                display: flex;
                align-items: center;
                gap: 8px;
            ">
                <span>❌</span>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        // Remover después de 4 segundos
        setTimeout(() => {
            notification.remove();
        }, 4000);

        // También mostrar en consola
        console.error(message);
    }

    showSuccess(message) {
        // Crear notificación de éxito temporal
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.innerHTML = `
            <div style="
                position: fixed; 
                top: 20px; 
                right: 20px; 
                z-index: 10000; 
                background: #4CAF50; 
                color: white; 
                padding: 16px; 
                border-radius: 8px; 
                box-shadow: 0 4px 12px rgba(0,0,0,0.15); 
                max-width: 300px;
                display: flex;
                align-items: center;
                gap: 8px;
            ">
                <span>✅</span>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        // Remover después de 3 segundos
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new AccederJardin();
});
