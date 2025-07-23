// ============= SERVIDOR HAPPIETY CON AUTENTICACIÓN =============
require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Servicios y middleware
const AuthService = require('./services/AuthService');
const { authenticateToken } = require('./middleware/jwt');

const PORT = process.env.PORT || 3000;

// Simulación de base de datos en memoria para desarrollo
const memoryDB = {
    users: [],
    jardines: [],
    memorias: []
};

// Función para obtener el tipo MIME del archivo
function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav'
    };
    return mimeTypes[ext] || 'text/plain';
}

// Función para parsear JSON del body
function parseRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (error) {
                reject(error);
            }
        });
    });
}

// ============= AUTENTICACIÓN SIMPLE =============

class SimpleAuthService {
    static async register(userData) {
        try {
            const { email, password, displayName } = userData;
            
            // Validar datos requeridos
            if (!email || !password || !displayName) {
                throw new Error('Email, contraseña y nombre son requeridos');
            }
            
            // Validar formato de email
            const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
            if (!emailRegex.test(email)) {
                throw new Error('Formato de email inválido');
            }
            
            // Validar longitud de contraseña
            if (password.length < 6) {
                throw new Error('La contraseña debe tener mínimo 6 caracteres');
            }
            
            // Verificar si el email ya existe
            const existingUser = memoryDB.users.find(u => u.email === email.toLowerCase());
            if (existingUser) {
                throw new Error('El email ya está registrado');
            }
            
            // Crear nuevo usuario
            const userId = Date.now().toString();
            const newUser = {
                _id: userId,
                email: email.toLowerCase().trim(),
                passwordHash: password, // En producción se debería hashear
                displayName: displayName.trim(),
                preferences: {
                    theme: 'rosado',
                    notifications: true
                },
                stats: {
                    totalGardens: 0,
                    totalMemories: 0
                },
                lastLogin: new Date(),
                createdAt: new Date()
            };
            
            // Guardar en memoria
            memoryDB.users.push(newUser);
            
            // Generar token simple
            const token = Buffer.from(JSON.stringify({
                id: userId,
                email: email,
                displayName: displayName,
                exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 días
            })).toString('base64');
            
            // Usuario seguro sin password
            const { passwordHash, ...safeUser } = newUser;
            
            return {
                success: true,
                message: 'Usuario registrado exitosamente',
                user: safeUser,
                token,
                expiresIn: '7d'
            };
            
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Error al registrar usuario'
            };
        }
    }
    
    static async login(credentials) {
        try {
            const { email, password } = credentials;
            
            // Validar datos requeridos
            if (!email || !password) {
                throw new Error('Email y contraseña son requeridos');
            }
            
            // Buscar usuario por email
            const user = memoryDB.users.find(u => u.email === email.toLowerCase());
            if (!user) {
                throw new Error('Credenciales inválidas');
            }
            
            // Verificar contraseña (en producción se compararía el hash)
            if (user.passwordHash !== password) {
                throw new Error('Credenciales inválidas');
            }
            
            // Actualizar último login
            user.lastLogin = new Date();
            
            // Generar token simple
            const token = Buffer.from(JSON.stringify({
                id: user._id,
                email: user.email,
                displayName: user.displayName,
                exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 días
            })).toString('base64');
            
            // Usuario seguro sin password
            const { passwordHash, ...safeUser } = user;
            
            return {
                success: true,
                message: 'Login exitoso',
                user: safeUser,
                token,
                expiresIn: '7d'
            };
            
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Error al iniciar sesión'
            };
        }
    }
    
    static verifyToken(token) {
        try {
            const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
            
            // Verificar expiración
            if (decoded.exp < Date.now()) {
                throw new Error('Token expirado');
            }
            
            return {
                success: true,
                userId: decoded.id
            };
        } catch (error) {
            return {
                success: false,
                message: 'Token inválido o expirado'
            };
        }
    }
    
    static async getCurrentUser(userId) {
        try {
            const user = memoryDB.users.find(u => u._id === userId);
            if (!user) {
                throw new Error('Usuario no encontrado');
            }
            
            // Usuario seguro sin password
            const { passwordHash, ...safeUser } = user;
            
            return {
                success: true,
                user: safeUser
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Error al obtener usuario'
            };
        }
    }
    
    static logout() {
        return {
            success: true,
            message: 'Logout exitoso'
        };
    }
}

// ============= RUTAS API =============

async function handleApiRoutes(req, res, pathname) {
    const method = req.method;
    
    try {
        // ============= RUTAS DE AUTENTICACIÓN =============
        if (pathname.startsWith('/api/auth')) {
            // Registro de usuario
            if (method === 'POST' && pathname === '/api/auth/register') {
                const data = await parseRequestBody(req);
                const result = await SimpleAuthService.register(data);
                
                const statusCode = result.success ? 201 : 400;
                res.writeHead(statusCode, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
                return true;
            }
            
            // Login de usuario
            if (method === 'POST' && pathname === '/api/auth/login') {
                const data = await parseRequestBody(req);
                const result = await SimpleAuthService.login(data);
                
                const statusCode = result.success ? 200 : 401;
                res.writeHead(statusCode, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
                return true;
            }
            
            // Verificar usuario actual (ruta protegida)
            if (method === 'GET' && pathname === '/api/auth/me') {
                const authHeader = req.headers['authorization'];
                const token = authHeader && authHeader.split(' ')[1];
                
                if (!token) {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: false,
                        message: 'Token de acceso requerido' 
                    }));
                    return true;
                }
                
                const tokenResult = SimpleAuthService.verifyToken(token);
                if (!tokenResult.success) {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(tokenResult));
                    return true;
                }
                
                const result = await SimpleAuthService.getCurrentUser(tokenResult.userId);
                const statusCode = result.success ? 200 : 404;
                res.writeHead(statusCode, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
                return true;
            }
            
            // Logout
            if (method === 'POST' && pathname === '/api/auth/logout') {
                const result = SimpleAuthService.logout();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
                return true;
            }
        }
        
        // RUTA DE HEALTH CHECK
        if (pathname === '/api/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'ok',
                database: 'memory',
                users: memoryDB.users.length,
                timestamp: new Date().toISOString()
            }));
            return true;
        }
        
    } catch (error) {
        console.error('Error en API:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            error: 'Error interno del servidor',
            message: error.message 
        }));
        return true;
    }
    
    return false; // No fue una ruta API
}

// ============= SERVIDOR PRINCIPAL =============

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;
    
    // Habilitar CORS para desarrollo
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Manejar rutas API
    if (pathname.startsWith('/api/')) {
        const handled = await handleApiRoutes(req, res, pathname);
        if (handled) return;
    }
    
    // Servir archivos estáticos
    if (pathname === '/') {
        pathname = '/index.html';
    }
    
    const filePath = path.join(__dirname, '..', 'public', pathname);
    
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 - Página no encontrada</h1>');
            return;
        }
        
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end('<h1>500 - Error interno del servidor</h1>');
                return;
            }
            
            const mimeType = getMimeType(filePath);
            res.writeHead(200, { 'Content-Type': mimeType });
            res.end(data);
        });
    });
});

// ============= INICIALIZAR APLICACIÓN =============

function startServer() {
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Servidor HappiEty ejecutándose en:`);
        console.log(`- Local: http://localhost:${PORT}`);
        console.log(`- Red: http://[tu-ip-local]:${PORT}`);
        console.log(`- API Health: http://localhost:${PORT}/api/health`);
        console.log(`- Login: http://localhost:${PORT}/login-signup.html`);
        console.log('📁 Archivos estáticos servidos desde public/');
        console.log('💾 Base de datos: Memoria (para desarrollo)');
        console.log('🔐 Autenticación: Habilitada');
    });
}

// Iniciar servidor inmediatamente
startServer();
