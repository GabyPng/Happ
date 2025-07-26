// ============= GESTIÓN DE AUTENTICACIÓN =============

class AuthManager {
    constructor() {
        // Detectar automáticamente la URL base
        this.apiUrl = window.location.protocol === 'file:' 
            ? 'http://localhost:3000' 
            : window.location.origin;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthentication();
    }

    setupEventListeners() {
        // Formulario de login
        const loginForm = document.querySelector('form.login');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin(e.target);
            });
        }

        // Formulario de registro
        const signupForm = document.querySelector('form.signup');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister(e.target);
            });
        }

        // Alternancia entre login y signup
        const slideInputs = document.querySelectorAll('input[name="slide"]');
        slideInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.clearMessages();
            });
        });
    }

    // ============= MANEJAR LOGIN =============
    async handleLogin(form) {
        try {
            const formData = new FormData(form);
            const credentials = {
                email: formData.get('email'),
                password: formData.get('password')
            };

            // Validar campos
            if (!credentials.email || !credentials.password) {
                this.showMessage('Por favor completa todos los campos', 'error');
                return;
            }

            // Mostrar loading
            this.showLoading(form, true);

            // Hacer petición de login
            const response = await fetch(`${this.apiUrl}/loginUsuario`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });

            const result = await response.json();

            if (result.success) {
                // Guardar token y usuario
                localStorage.setItem('happiety_token', result.token);
                localStorage.setItem('happiety_user', JSON.stringify(result.user));
                
                this.showMessage('¡Login exitoso! Redirigiendo...', 'success');
                
                // Redirigir después de 1 segundo
                setTimeout(() => {
                    window.location.href = 'inicio.html';
                }, 1000);
            } else {
                this.showMessage(result.message, 'error');
            }

        } catch (error) {
            console.error('Error en login:', error);
            this.showMessage('Error de conexión. Intenta de nuevo.', 'error');
        } finally {
            this.showLoading(form, false);
        }
    }

    // ============= MANEJAR REGISTRO =============
    async handleRegister(form) {
        try {
            const formData = new FormData(form);
            const userData = {
                email: formData.get('email'),
                password: formData.get('password'),
                displayName: formData.get('displayName')
            };

            // Validar campos
            if (!userData.email || !userData.password || !userData.displayName) {
                this.showMessage('Por favor completa todos los campos', 'error');
                return;
            }

            // Validar longitud de contraseña
            if (userData.password.length < 6) {
                this.showMessage('La contraseña debe tener mínimo 6 caracteres', 'error');
                return;
            }

            // Mostrar loading
            this.showLoading(form, true);

            // Hacer petición de registro
            const response = await fetch(`${this.apiUrl}/newUsuario`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();

            if (result.success) {
                // Guardar token y datos del usuario
                localStorage.setItem('happiety_token', result.token);
                localStorage.setItem('happiety_user', JSON.stringify(result.user));
                
                // Mostrar mensaje de éxito
                this.showMessage('¡Registro exitoso! Redirigiendo...', 'success');
                
                // Redirigir a la página principal después de un breve delay
                setTimeout(() => {
                    window.location.href = 'inicio.html';
                }, 1500);
            } else {
                this.showMessage(result.message || 'Error en el registro', 'error');
            }

        } catch (error) {
            console.error('Error en registro:', error);
            this.showMessage('Error de conexión. Intenta de nuevo.', 'error');
        } finally {
            this.showLoading(form, false);
        }
    }

    // ============= VERIFICAR AUTENTICACIÓN =============
    checkAuthentication() {
        const token = localStorage.getItem('happiety_token');
        const user = localStorage.getItem('happiety_user');
        
        // Verificar si se quiere forzar el login
        const urlParams = new URLSearchParams(window.location.search);
        const forceLogin = urlParams.get('force') === 'true';

        // Si ya está logueado y no se fuerza el login, redirigir
        if (token && user && !forceLogin) {
            window.location.href = 'inicio.html';
        }
    }

    // ============= UTILITIES =============
    showMessage(message, type = 'info') {
        // Remover mensaje anterior
        const existingMessage = document.querySelector('.auth-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Crear nuevo mensaje
        const messageDiv = document.createElement('div');
        messageDiv.className = `auth-message auth-message--${type}`;
        messageDiv.textContent = message;

        // Crear contenedor fijo para el mensaje
        let messageContainer = document.querySelector('.message-container');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.className = 'message-container';
            document.body.appendChild(messageContainer);
        }

        // Agregar mensaje al contenedor
        messageContainer.appendChild(messageDiv);

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (messageDiv && messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }

    clearMessages() {
        const messages = document.querySelectorAll('.auth-message');
        messages.forEach(msg => msg.remove());
    }

    showLoading(form, show) {
        const submitBtn = form.querySelector('input[type="submit"]');
        if (show) {
            submitBtn.value = 'Cargando...';
            submitBtn.disabled = true;
        } else {
            const isLogin = form.closest('.login');
            submitBtn.value = isLogin ? 'Login' : 'Signup';
            submitBtn.disabled = false;
        }
    }

    // ============= MÉTODO ESTÁTICO PARA LOGOUT =============
    static logout() {
        localStorage.removeItem('happiety_token');
        localStorage.removeItem('happiety_user');
        window.location.href = 'login-signup.html';
    }

    // ============= OBTENER USUARIO ACTUAL =============
    static getCurrentUser() {
        const user = localStorage.getItem('happiety_user');
        return user ? JSON.parse(user) : null;
    }

    // ============= VERIFICAR SI ESTÁ LOGUEADO =============
    static isAuthenticated() {
        const token = localStorage.getItem('happiety_token');
        const user = localStorage.getItem('happiety_user');
        return !!(token && user);
    }

    // ============= OBTENER TOKEN =============
    static getToken() {
        return localStorage.getItem('happiety_token');
    }

    // ============= CERRAR SESIÓN =============
    static logout() {
        localStorage.removeItem('happiety_token');
        localStorage.removeItem('happiety_user');
        window.location.href = 'login-signup.html';
    }

    // ============= HACER PETICIONES AUTENTICADAS =============
    static async apiCall(endpoint, options = {}) {
        const token = this.getToken();
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };

        const finalOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(`http://localhost:3000/api${endpoint}`, finalOptions);
            
            // Si el token expiró, redirigir al login
            if (response.status === 401 || response.status === 403) {
                this.logout();
                return;
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error en API call:', error);
            throw error;
        }
    }
}

// ============= INICIALIZAR =============
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
});

// ============= EXPORTAR PARA USO GLOBAL =============
window.AuthManager = AuthManager;
