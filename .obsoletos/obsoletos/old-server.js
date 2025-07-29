// ============= SERVIDOR HAPPIETY CON BASE DE DATOS =============
require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Conectar base de datos
const dbConnection = require('./db');
const models = require('./models');
const AuthService = require('./services/AuthService');
const { authenticateToken } = require('./middleware/jwt');

const PORT = process.env.PORT || 3000;

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

// ============= RUTAS API =============

async function handleApiRoutes(req, res, pathname) {
    const method = req.method;
    
    try {
        // ============= RUTAS DE AUTENTICACIÓN =============
        if (pathname.startsWith('/api/auth')) {
            // Registro de usuario
            if (method === 'POST' && pathname === '/api/auth/register') {
                const data = await parseRequestBody(req);
                const result = await AuthService.register(data);
                
                const statusCode = result.success ? 201 : 400;
                res.writeHead(statusCode, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
                return true;
            }
            
            // Login de usuario
            if (method === 'POST' && pathname === '/api/auth/login') {
                const data = await parseRequestBody(req);
                const result = await AuthService.login(data);
                
                const statusCode = result.success ? 200 : 401;
                res.writeHead(statusCode, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
                return true;
            }
            
            // Verificar usuario actual (ruta protegida)
            if (method === 'GET' && pathname === '/api/auth/me') {
                // Esta ruta requiere autenticación
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
                
                const tokenResult = AuthService.verifyToken(token);
                if (!tokenResult.success) {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(tokenResult));
                    return true;
                }
                
                const result = await AuthService.getCurrentUser(tokenResult.userId);
                const statusCode = result.success ? 200 : 404;
                res.writeHead(statusCode, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
                return true;
            }
            
            // Logout
            if (method === 'POST' && pathname === '/api/auth/logout') {
                const result = AuthService.logout();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
                return true;
            }
        }
        
        // RUTAS DE JARDINES
        if (pathname.startsWith('/api/jardines')) {
            if (method === 'POST' && pathname === '/api/jardines') {
                // Crear jardín
                const data = await parseRequestBody(req);
                const jardin = new models.Jardin(data);
                const saved = await jardin.save();
                
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(saved));
                return true;
            }
            
            if (method === 'GET' && pathname.includes('/api/jardines/codigo/')) {
                // Buscar jardín por código
                const accessCode = pathname.split('/').pop();
                const jardin = await models.Jardin.findByAccessCode(accessCode)
                    .populate('owner', 'displayName')
                    .populate('memories');
                
                if (jardin) {
                    await jardin.updateStats();
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(jardin));
                } else {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Jardín no encontrado' }));
                }
                return true;
            }
        }
        
        // RUTAS DE MEMORIAS
        if (pathname.startsWith('/api/memorias')) {
            if (method === 'POST' && pathname === '/api/memorias') {
                // Crear memoria
                const data = await parseRequestBody(req);
                let memoria;
                
                switch (data.memoryType) {
                    case 'Text':
                        memoria = models.Memory.createTextMemory(data.garden, data);
                        break;
                    case 'Image':
                        memoria = models.Memory.createImageMemory(data.garden, data);
                        break;
                    case 'Audio':
                        memoria = models.Memory.createAudioMemory(data.garden, data);
                        break;
                    case 'Video':
                        memoria = models.Memory.createVideoMemory(data.garden, data);
                        break;
                    case 'Location':
                        memoria = models.Memory.createLocationMemory(data.garden, data);
                        break;
                    default:
                        throw new Error('Tipo de memoria no válido');
                }
                
                const saved = await memoria.save();
                
                // Actualizar contador en jardín
                await models.Jardin.findByIdAndUpdate(
                    data.garden,
                    { 
                        $push: { memories: saved._id },
                        $inc: { 'stats.memoryCount': 1 }
                    }
                );
                
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(saved));
                return true;
            }
            
            if (method === 'GET' && pathname.includes('/api/memorias/jardin/')) {
                // Obtener memorias de un jardín
                const gardenId = pathname.split('/').pop();
                const memorias = await models.Memory.find({ 
                    garden: gardenId,
                    isActive: true 
                }).sort({ eventDate: -1 });
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(memorias));
                return true;
            }
        }
        
        // RUTA DE HEALTH CHECK
        if (pathname === '/api/health') {
            const health = dbConnection.getHealth();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'ok',
                database: health,
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
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
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

async function startServer() {
    try {
        console.log('🔄 Conectando a base de datos...');
        await dbConnection.connect();
        
        console.log('📚 Modelos cargados:', Object.keys(models));
        
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Servidor HappiEty ejecutándose en:`);
            console.log(`- Local: http://localhost:${PORT}`);
            console.log(`- Red: http://[tu-ip-local]:${PORT}`);
            console.log(`- API Health: http://localhost:${PORT}/api/health`);
            console.log('📁 Archivos estáticos servidos desde public/');
        });
        
    } catch (error) {
        console.error('❌ Error iniciando servidor:', error);
        process.exit(1);
    }
}

// Iniciar servidor
startServer();
