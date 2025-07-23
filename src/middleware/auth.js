const AuthService = require('../services/AuthService');

// ============= MIDDLEWARE DE AUTENTICACIÓN =============
const authenticateToken = async (req, res, next) => {
    try {
        // Obtener token del header Authorization
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token de acceso requerido'
            });
        }
        
        // Verificar token
        const verification = AuthService.verifyToken(token);
        if (!verification.success) {
            return res.status(403).json({
                success: false,
                message: verification.message
            });
        }
        
        // Agregar userId al request para uso en rutas
        req.userId = verification.userId;
        next();
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error verificando autenticación'
        });
    }
};

// ============= MIDDLEWARE OPCIONAL =============
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (token) {
            const verification = AuthService.verifyToken(token);
            if (verification.success) {
                req.userId = verification.userId;
            }
        }
        
        next(); // Continuar independientemente del token
        
    } catch (error) {
        next(); // Continuar sin autenticación
    }
};

module.exports = {
    authenticateToken,
    optionalAuth
};
