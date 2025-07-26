/**
 * New Route Protection - Middleware de autenticación mejorado
 */

class NewRouteProtection {
    constructor() {
        this.apiUrl = 'http://localhost:3000';
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

    async checkAuthentication() {
        const token = localStorage.getItem('happiety_token');
        const userData = localStorage.getItem('happiety_user');

        if (!token || !userData) {
            this.redirectToLogin();
            return false;
        }

        try {
            const response = await fetch(`${this.apiUrl}/validateToken`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                
                if (result.success) {
                    localStorage.setItem('happiety_user', JSON.stringify(result.user));
                    return true;
                } else {
                    throw new Error('Token inválido');
                }
            } else {
                throw new Error('Token expirado');
            }
        } catch (error) {
            console.error('Error de autenticación:', error);
            this.redirectToLogin();
            return false;
        }
    }

    async checkIfAlreadyAuthenticated() {
        const token = localStorage.getItem('happiety_token');

        if (token) {
            try {
                const response = await fetch(`${this.apiUrl}/validateToken`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const result = await response.json();
                    
                    if (result.success) {
                        window.location.href = 'index.html';
                        return;
                    }
                }
            } catch (error) {
                console.error('Error al verificar autenticación:', error);
            }
        }
    }

    redirectToLogin() {
        localStorage.removeItem('happiety_token');
        localStorage.removeItem('happiety_user');
        localStorage.removeItem('currentGarden');
        localStorage.removeItem('editingGardenId');
        
        setTimeout(() => {
            window.location.href = 'login-signup.html';
        }, 100);
    }

    static logout() {
        localStorage.removeItem('happiety_token');
        localStorage.removeItem('happiety_user');
        localStorage.removeItem('currentGarden');
        localStorage.removeItem('editingGardenId');
        window.location.href = 'login-signup.html';
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    window.newRouteProtection = new NewRouteProtection();
});
