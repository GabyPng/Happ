/**
 * Crear Jardín - Gestión del formulario de creación/edición de jardines
 */

class CrearJardin {
    constructor() {
        this.apiUrl = 'https://happ-k5za.onrender.com';
        this.currentUser = null;
        this.editingGardenId = null;
        this.isEditing = false;
        this.formElements = {};
        
        this.init();
    }

    init() {
        // Limpiar cualquier estado de edición al inicializar si no hay parámetro edit en URL
        const urlParams = new URLSearchParams(window.location.search);
        if (!urlParams.get('edit')) {
            localStorage.removeItem('editingGardenId');
        }
        
        this.loadCurrentUser();
        this.getFormElements();
        this.checkEditMode();
        this.setupEventListeners();
        this.setupThemeSelection();
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
            form: document.getElementById('form-crear-jardin'),
            nameInput: document.getElementById('nombre-jardin'),
            descriptionInput: document.getElementById('descripcion-jardin'),
            themeSelect: document.getElementById('tema-jardin'),
            submitBtn: document.getElementById('btn-crear-jardin'),
            cancelBtn: document.getElementById('btn-cancelar'),
            backBtn: document.getElementById('btn-volver-jardines'),
            title: document.querySelector('.form__legend'),
            subtitle: document.querySelector('.text--description')
        };
    }

    checkEditMode() {
        // Verificar si estamos editando un jardín existente
        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('edit');
        
        console.log('checkEditMode: URL params edit =', editId);
        console.log('checkEditMode: window.location.search =', window.location.search);
        console.log('checkEditMode: localStorage editingGardenId =', localStorage.getItem('editingGardenId'));
        
        if (editId) {
            console.log('Modo EDITAR activado con ID:', editId);
            this.editingGardenId = editId;
            this.isEditing = true;
            // Asegurar que esté en localStorage para consistencia
            localStorage.setItem('editingGardenId', editId);
            this.loadGardenForEdit();
            this.updateUIForEdit();
        } else {
            console.log('Modo CREAR activado');
            // Modo crear - limpiar estado de edición
            this.editingGardenId = null;
            this.isEditing = false;
            localStorage.removeItem('editingGardenId');
        }
    }

    async loadGardenForEdit() {
        console.log('loadGardenForEdit llamado con editingGardenId:', this.editingGardenId);
        
        if (!this.editingGardenId || this.editingGardenId === 'undefined' || this.editingGardenId === 'null') {
            console.error('No hay ID válido de jardín para editar:', this.editingGardenId);
            alert('Error: No se pudo identificar el jardín a editar');
            window.location.href = 'mis-jardines.html';
            return;
        }

        try {
            console.log('Cargando jardín para editar:', this.editingGardenId);
            const response = await fetch(`${this.apiUrl}/getJardin/edit/${this.editingGardenId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('happiety_token')}`
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                const garden = result.jardin;
                
                // Llenar el formulario con los datos existentes
                this.formElements.nameInput.value = garden.name;
                this.formElements.descriptionInput.value = garden.description || '';
                this.formElements.themeSelect.value = garden.theme.name;
                
                // Actualizar la selección visual del tema
                this.selectTheme(garden.theme.name);
                
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Error al cargar el jardín');
            }
        } catch (error) {
            console.error('Error al cargar jardín para editar:', error);
            alert('Error al cargar los datos del jardín');
            window.location.href = 'mis-jardines.html';
        }
    }

    updateUIForEdit() {
        if (this.formElements.title) {
            this.formElements.title.textContent = 'Editar jardín';
        }
        if (this.formElements.subtitle) {
            this.formElements.subtitle.textContent = 'Modifica los detalles de tu jardín de recuerdos';
        }
        if (this.formElements.submitBtn) {
            this.formElements.submitBtn.textContent = 'Guardar cambios';
        }
    }

    setupEventListeners() {
        // Formulario de creación/edición
        if (this.formElements.form) {
            this.formElements.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmit();
            });
        }

        // Botón cancelar
        if (this.formElements.cancelBtn) {
            this.formElements.cancelBtn.addEventListener('click', () => {
                this.handleCancel();
            });
        }

        // Botón volver
        if (this.formElements.backBtn) {
            this.formElements.backBtn.addEventListener('click', () => {
                window.location.href = 'mis-jardines.html';
            });
        }

        // Validación en tiempo real
        if (this.formElements.nameInput) {
            this.formElements.nameInput.addEventListener('input', () => {
                this.validateForm();
            });
        }
    }

    setupThemeSelection() {
        // Agregar evento de cambio al selector de tema
        if (this.formElements.themeSelect) {
            this.formElements.themeSelect.addEventListener('change', (e) => {
                this.selectTheme(e.target.value);
            });
        }

        // Si hay botones de tema visual, agregar listeners
        const themeButtons = document.querySelectorAll('.theme-option');
        themeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const theme = e.target.dataset.theme;
                if (theme) {
                    this.selectTheme(theme);
                    this.formElements.themeSelect.value = theme;
                }
            });
        });
    }

    selectTheme(themeName) {
        // Remover selección anterior
        document.querySelectorAll('.theme-option').forEach(option => {
            option.classList.remove('theme-option--selected');
        });

        // Agregar selección actual
        const selectedOption = document.querySelector(`[data-theme="${themeName}"]`);
        if (selectedOption) {
            selectedOption.classList.add('theme-option--selected');
        }

        // Actualizar el selector
        if (this.formElements.themeSelect) {
            this.formElements.themeSelect.value = themeName;
        }

        // Aplicar vista previa del tema (opcional)
        this.applyThemePreview(themeName);
    }

    applyThemePreview(themeName) {
        const themes = {
            'rosado': { primary: '#FF0080', secondary: '#FFB3DA' },
            'azul': { primary: '#0080FF', secondary: '#B3D4FF' },
            'verde': { primary: '#00FF80', secondary: '#B3FFD4' }
        };

        const theme = themes[themeName];
        if (theme) {
            document.documentElement.style.setProperty('--preview-primary', theme.primary);
            document.documentElement.style.setProperty('--preview-secondary', theme.secondary);
        }
    }

    validateForm() {
        const name = this.formElements.nameInput.value.trim();
        const isValid = name.length >= 3 && name.length <= 50;
        
        if (this.formElements.submitBtn) {
            this.formElements.submitBtn.disabled = !isValid;
        }

        return isValid;
    }

    async handleFormSubmit() {
        if (!this.validateForm()) {
            alert('Por favor, ingresa un nombre válido para el jardín (3-50 caracteres)');
            return;
        }

        const formData = {
            name: this.formElements.nameInput.value.trim(),
            description: this.formElements.descriptionInput.value.trim(),
            theme: this.formElements.themeSelect.value,
            privacy: 'private' // Por defecto privado
        };

        if (this.isEditing) {
            await this.updateGarden(formData);
        } else {
            await this.createGarden(formData);
        }
    }

    async createGarden(gardenData) {
        try {
            // Deshabilitar botón mientras se procesa
            this.formElements.submitBtn.disabled = true;
            this.formElements.submitBtn.textContent = 'Creando...';

            const token = localStorage.getItem('happiety_token');
            console.log('🎫 Token para crear jardín:', token ? token.substring(0, 20) + '...' : 'NO HAY TOKEN');

            const response = await fetch(`${this.apiUrl}/newJardin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(gardenData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Limpiar localStorage de edición
                localStorage.removeItem('editingGardenId');
                
                // Mostrar mensaje de éxito
                alert(`¡Jardín "${gardenData.name}" creado exitosamente!\n\nCódigo de acceso: ${result.jardin.accessCode}\n\nComparte este código con otros para que puedan unirse a tu jardín.`);
                
                // Redirigir a mis jardines
                window.location.href = 'mis-jardines.html';
                
            } else {
                throw new Error(result.message || 'Error al crear el jardín');
            }

        } catch (error) {
            console.error('Error al crear jardín:', error);
            alert('Error al crear el jardín: ' + error.message);
        } finally {
            // Rehabilitar botón
            this.formElements.submitBtn.disabled = false;
            this.formElements.submitBtn.textContent = 'Crear jardín';
        }
    }

    async updateGarden(gardenData) {
        try {
            // Deshabilitar botón mientras se procesa
            this.formElements.submitBtn.disabled = true;
            this.formElements.submitBtn.textContent = 'Guardando...';

            const response = await fetch(`${this.apiUrl}/updateJardin/${this.editingGardenId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('happiety_token')}`
                },
                body: JSON.stringify(gardenData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Limpiar localStorage de edición
                localStorage.removeItem('editingGardenId');
                
                // Mostrar mensaje de éxito
                alert(`¡Jardín "${gardenData.name}" actualizado exitosamente!`);
                
                // Redirigir a mis jardines
                window.location.href = 'mis-jardines.html';
                
            } else {
                throw new Error(result.message || 'Error al actualizar el jardín');
            }

        } catch (error) {
            console.error('Error al actualizar jardín:', error);
            alert('Error al actualizar el jardín: ' + error.message);
        } finally {
            // Rehabilitar botón
            this.formElements.submitBtn.disabled = false;
            this.formElements.submitBtn.textContent = 'Guardar cambios';
        }
    }

    getThemeColor(themeName) {
        const colors = {
            'rosado': '#FF0080',
            'azul': '#0080FF',
            'verde': '#00FF80'
        };
        return colors[themeName] || colors.rosado;
    }

    handleCancel() {
        if (this.hasUnsavedChanges()) {
            if (confirm('¿Estás seguro de que quieres cancelar? Se perderán los cambios no guardados.')) {
                this.goBack();
            }
        } else {
            this.goBack();
        }
    }

    hasUnsavedChanges() {
        // Verificar si hay cambios no guardados
        const name = this.formElements.nameInput.value.trim();
        const description = this.formElements.descriptionInput.value.trim();
        
        return name !== '' || description !== '';
    }

    goBack() {
        // Limpiar localStorage de edición
        localStorage.removeItem('editingGardenId');
        window.location.href = 'mis-jardines.html';
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new CrearJardin();
});
