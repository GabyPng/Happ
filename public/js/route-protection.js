/**
 * Route Protection - Middleware de autenticación
 */

class RouteProtection {
    constructor() {
        this.protectedRoutes = [
            'mis-jardines.html',
            'crear-jardin.html', 
            'acceder-jardin.html',
            'ver-jardin.html'
        ];
        
        this.init();
    }

    init() {
        const currentPage = window.location.pathname.split('/').pop();
        
        if (this.protectedRoutes.includes(currentPage)) {
            this.checkAuthentication();
        }
        
        if (currentPage === 'login-signup.html') {
            this.checkIfAlreadyAuthenticated();
        }
    }

    checkAuthentication() {
        const token = localStorage.getItem('happiety_token');
        const userData = localStorage.getItem('happiety_user');

        if (!token || !userData) {
            this.redirectToLogin();
            return false;
        }

        try {
            const user = JSON.parse(userData);
            if (!user.email || !user.id) {
                this.redirectToLogin();
                return false;
            }
            
            return true;
        } catch (error) {
            this.redirectToLogin();
            return false;
        }
    }

    checkIfAlreadyAuthenticated() {
        const token = localStorage.getItem('happiety_token');
        const userData = localStorage.getItem('happiety_user');

        const urlParams = new URLSearchParams(window.location.search);
        const forceLogin = urlParams.get('force') === 'true';

        if (token && userData && !forceLogin) {
            try {
                const user = JSON.parse(userData);
                if (user.email && user.id) {
                    window.location.href = 'index.html';
                    return;
                }
            } catch (error) {
                // Error al parsear datos
            }
        }
    }

    redirectToLogin() {
        localStorage.removeItem('happiety_token');
        localStorage.removeItem('happiety_user');
        window.location.href = 'login-signup.html';
    }

    static logout() {
        localStorage.removeItem('happiety_token');
        localStorage.removeItem('happiety_user');
        window.location.href = 'login-signup.html';
    }

    static isAuthenticated() {
        const token = localStorage.getItem('happiety_token');
        const userData = localStorage.getItem('happiety_user');
        return !!(token && userData);
    }
}

// Inicializar automáticamente
document.addEventListener('DOMContentLoaded', () => {
    new RouteProtection();
});

// Exportar para uso global
window.RouteProtection = RouteProtection;
