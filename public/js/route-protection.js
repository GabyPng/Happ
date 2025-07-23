// ============= PROTECCIÓN DE RUTAS =============

class RouteProtection {
    static init() {
        // Verificar si la página actual requiere autenticación
        const currentPage = window.location.pathname.split('/').pop();
        const publicPages = ['login-signup.html', 'index.html', ''];
        
        // Si no es página pública, verificar autenticación
        if (!publicPages.includes(currentPage)) {
            this.requireAuth();
        }
        
        // Actualizar UI según estado de autenticación
        this.updateUI();
    }
    
    static requireAuth() {
        if (!AuthManager.isAuthenticated()) {
            // Si no está autenticado, redirigir al login
            window.location.href = 'login-signup.html';
            return false;
        }
        return true;
    }
    
    static updateUI() {
        const user = AuthManager.getCurrentUser();
        
        if (user) {
            // Mostrar información del usuario
            this.showUserInfo(user);
            // Ocultar botones de login
            this.hideLoginButtons();
        } else {
            // Mostrar botones de login
            this.showLoginButtons();
        }
    }
    
    static showUserInfo(user) {
        // Buscar elementos donde mostrar info del usuario
        const userNameElements = document.querySelectorAll('.user-name');
        const userAvatarElements = document.querySelectorAll('.user-avatar');
        
        userNameElements.forEach(el => {
            el.textContent = user.displayName;
        });
        
        userAvatarElements.forEach(el => {
            if (user.avatar) {
                el.src = user.avatar;
            } else {
                // Avatar por defecto con iniciales
                el.textContent = user.displayName.charAt(0).toUpperCase();
            }
        });
    }
    
    static hideLoginButtons() {
        const loginButtons = document.querySelectorAll('.login-btn, .signup-btn');
        loginButtons.forEach(btn => {
            btn.style.display = 'none';
        });
        
        const userMenu = document.querySelectorAll('.user-menu');
        userMenu.forEach(menu => {
            menu.style.display = 'block';
        });
    }
    
    static showLoginButtons() {
        const loginButtons = document.querySelectorAll('.login-btn, .signup-btn');
        loginButtons.forEach(btn => {
            btn.style.display = 'block';
        });
        
        const userMenu = document.querySelectorAll('.user-menu');
        userMenu.forEach(menu => {
            menu.style.display = 'none';
        });
    }
    
    static setupLogoutButton() {
        const logoutButtons = document.querySelectorAll('.logout-btn');
        logoutButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                    AuthManager.logout();
                }
            });
        });
    }
}

// ============= AUTO-INICIALIZAR =============
document.addEventListener('DOMContentLoaded', () => {
    // Solo si AuthManager está disponible
    if (typeof AuthManager !== 'undefined') {
        RouteProtection.init();
        RouteProtection.setupLogoutButton();
    }
});

// ============= EXPORTAR =============
window.RouteProtection = RouteProtection;
