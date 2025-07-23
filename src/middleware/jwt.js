const jwt = require('jsonwebtoken');

// Clave secreta para firmar tokens (en producción debe ser una variable de entorno)
const JWT_SECRET = process.env.JWT_SECRET || 'happiety-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Genera un JWT token para un usuario
 * @param {Object} usuario - Objeto usuario
 * @returns {string} JWT token
 */
function generateToken(usuario) {
    const payload = {
        id: usuario._id,
        email: usuario.email,
        displayName: usuario.displayName
    };
    
    return jwt.sign(payload, JWT_SECRET, { 
        expiresIn: JWT_EXPIRES_IN,
        algorithm: 'HS256'
    });
}

/**
 * Verifica un JWT token
 * @param {string} token - Token a verificar
 * @returns {Object} Payload decodificado
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET, { algorithm: 'HS256' });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token expirado');
        } else if (error.name === 'JsonWebTokenError') {
            throw new Error('Token inválido');
        } else {
            throw new Error('Error verificando token');
        }
    }
}

/**
 * Middleware para verificar autenticación en rutas protegidas
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            error: 'Token de acceso requerido',
            code: 'NO_TOKEN'
        }));
        return;
    }
    
    try {
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            error: error.message,
            code: 'INVALID_TOKEN'
        }));
    }
}

/**
 * Extrae token del header Authorization
 * @param {Object} req - Request object
 * @returns {string|null} Token o null si no existe
 */
function extractToken(req) {
    const authHeader = req.headers['authorization'];
    return authHeader && authHeader.split(' ')[1];
}

module.exports = {
    generateToken,
    verifyToken,
    authenticateToken,
    extractToken,
    JWT_SECRET,
    JWT_EXPIRES_IN
};
