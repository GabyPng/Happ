require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret-key';

// ============= CONEXIÓN A MONGODB =============
mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("✅ MongoDB Atlas Conectado exitosamente");
    console.log(`📊 Base de datos: ${mongoose.connection.name}`);
}) 
.catch(error => {
    console.log("❌ Error de conexión a MongoDB Atlas:", error.message);
    console.log("🔍 Detalles del error:", error);
});

// ============= ESQUEMAS =============

// Usuario Schema
const usuarioSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: [true, 'Email es requerido'], 
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
    },
    passwordHash: { 
        type: String, 
        required: [true, 'Password es requerido'],
        minlength: [6, 'Password debe tener al menos 6 caracteres']
    },
    displayName: { 
        type: String,
        trim: true,
        maxlength: [50, 'Nombre no puede exceder 50 caracteres']
    },
    avatar: { type: String },
    preferences: {
        theme: { type: String, enum: ['rosado', 'azul', 'verde'], default: 'rosado' },
        notifications: { type: Boolean, default: true }
    },
    stats: {
        totalGardens: { type: Number, default: 0 },
        totalMemories: { type: Number, default: 0 }
    },
    lastLogin: { type: Date },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Jardín Schema
const jardinSchema = new mongoose.Schema({
    owner: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Usuario', 
        required: false
    },
    name: { 
        type: String, 
        required: [true, 'Nombre del jardín es requerido'],
        trim: true,
        minlength: [3, 'Nombre debe tener al menos 3 caracteres'],
        maxlength: [50, 'Nombre no puede exceder 50 caracteres']
    },
    description: { 
        type: String,
        trim: true,
        maxlength: [200, 'Descripción no puede exceder 200 caracteres']
    },
    accessCode: { 
        type: String, 
        required: true, 
        unique: true,
        uppercase: true,
        length: [8, 'Código de acceso debe tener 8 caracteres']
    },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }],
    theme: {
        name: { type: String, enum: ['rosado', 'azul', 'verde'], default: 'rosado' },
        primaryColor: { type: String, default: '#FF0080' },
        secondaryColor: { type: String, default: '#ffcffc' },
        musicUrl: { type: String }
    },
    stats: {
        memoryCount: { type: Number, default: 0 },
        lastAccessed: { type: Date, default: Date.now },
        viewCount: { type: Number, default: 0 }
    },
    isPrivate: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Memoria Schema
const memoriaSchema = new mongoose.Schema({
    garden: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Jardin', 
        required: [true, 'Jardín es requerido'] 
    },
    title: { 
        type: String, 
        required: [true, 'Título es requerido'],
        trim: true,
        maxlength: [100, 'Título no puede exceder 100 caracteres']
    },
    description: { 
        type: String,
        trim: true,
        maxlength: [500, 'Descripción no puede exceder 500 caracteres']
    },
    memoryType: { 
        type: String, 
        required: [true, 'Tipo de memoria es requerido'], 
        enum: ['Text', 'Image', 'Audio', 'Video', 'Location'] 
    },
    eventDate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    tags: [{ 
        type: String,
        trim: true,
        maxlength: [20, 'Tag no puede exceder 20 caracteres']
    }],
    position: {
        x: { type: Number, default: 0, min: 0, max: 100 },
        y: { type: Number, default: 0, min: 0, max: 100 },
        zIndex: { type: Number, default: 1, min: 1, max: 1000 }
    },
    content: { 
        type: String,
        maxlength: [2000, 'Contenido no puede exceder 2000 caracteres']
    },
    emoji: { 
        type: String,
        maxlength: [10, 'Emoji no puede exceder 10 caracteres']
    }
}, { timestamps: true });

// Crear modelos
const Usuario = mongoose.model('Usuario', usuarioSchema);
const Jardin = mongoose.model('Jardin', jardinSchema);
const Memoria = mongoose.model('Memoria', memoriaSchema);

// ============= UTILIDADES DE AUTENTICACIÓN =============
async function verifyToken(req) {
    const authHeader = req.headers.authorization;
    console.log('🔍 Auth header recibido:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('❌ No hay header Authorization o no empieza con Bearer');
        return null;
    }
    
    const token = authHeader.substring(7);
    console.log('🎫 Token extraído:', token.substring(0, 20) + '...');
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('✅ Token decodificado:', decoded.userId);
        const usuario = await Usuario.findById(decoded.userId);
        console.log('👤 Usuario encontrado:', !!usuario);
        return usuario;
    } catch (error) {
        console.log('❌ Error al verificar token:', error.message);
        return null;
    }
}

// ============= UTILIDADES =============

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
                const parsed = body ? JSON.parse(body) : {};
                resolve(parsed);
            } catch (error) {
                console.error('❌ Error parseando JSON:', error);
                reject(error);
            }
        });
    });
}

// Generar código de acceso único
async function generateAccessCode() {
    let code;
    let exists = true;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (exists && attempts < maxAttempts) {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = Math.floor(1000 + Math.random() * 9000);
        code = '';
        for (let i = 0; i < 4; i++) {
            code += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        code += numbers;
        
        const existing = await Jardin.findOne({ accessCode: code });
        exists = !!existing;
        attempts++;
    }
    
    if (attempts >= maxAttempts) {
        throw new Error('No se pudo generar un código único');
    }
    
    return code;
}

// ============= RUTAS API =============
async function handleApiRoutes(req, res, pathname) {
    const method = req.method;
    
    try {
        // Login usuario
        if (method === 'POST' && pathname === '/loginUsuario') {
            const { email, password } = await parseRequestBody(req);

            if (!email || !password) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: "Email y password son requeridos"
                }));
                return true;
            }

            const usuario = await Usuario.findOne({ 
                email: email.toLowerCase().trim(),
                isActive: true 
            });
            
            if (!usuario) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: "Credenciales inválidas"
                }));
                return true;
            }

            const isValid = await bcrypt.compare(password, usuario.passwordHash);
            if (!isValid) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: "Credenciales inválidas"
                }));
                return true;
            }

            usuario.lastLogin = new Date();
            await usuario.save();

            const token = jwt.sign(
                { 
                    userId: usuario._id,
                    email: usuario.email 
                }, 
                JWT_SECRET, 
                { expiresIn: '1h' }
            );

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: "Login exitoso",
                user: {
                    id: usuario._id,
                    email: usuario.email,
                    displayName: usuario.displayName,
                    preferences: usuario.preferences,
                    stats: usuario.stats
                },
                token,
                expiresIn: 3600
            }));
            return true;
        }

        // Registrar nuevo usuario
        if (method === 'POST' && pathname === '/newUsuario') {
            const { email, password, displayName } = await parseRequestBody(req);
            
            if (!email || !password) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: "Email y password son requeridos"
                }));
                return true;
            }

            if (password.length < 6) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: "Password debe tener al menos 6 caracteres"
                }));
                return true;
            }

            const existingUser = await Usuario.findOne({ 
                email: email.toLowerCase().trim() 
            });
            
            if (existingUser) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: "El email ya está registrado"
                }));
                return true;
            }

            const salt = await bcrypt.genSalt(12);
            const passwordHash = await bcrypt.hash(password, salt);

            const newUsuario = new Usuario({
                email: email.toLowerCase().trim(),
                passwordHash,
                displayName: displayName || null
            });

            await newUsuario.save();

            const token = jwt.sign(
                { 
                    userId: newUsuario._id,
                    email: newUsuario.email 
                }, 
                JWT_SECRET, 
                { expiresIn: '1h' }
            );

            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: "Usuario creado con éxito",
                user: {
                    id: newUsuario._id,
                    email: newUsuario.email,
                    displayName: newUsuario.displayName,
                    preferences: newUsuario.preferences
                },
                token,
                expiresIn: 3600
            }));
            return true;
        }

        // Crear nuevo jardín
        if (method === 'POST' && pathname === '/newJardin') {
            console.log('🌻 Petición para crear jardín recibida');
            
            // Verificar autenticación
            const usuario = await verifyToken(req);
            if (!usuario) {
                console.log('❌ Token inválido o no proporcionado');
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: "Token de autenticación requerido"
                }));
                return true;
            }
            console.log('👤 Usuario autenticado:', usuario.email);
            
            const { name, description, theme, privacy } = await parseRequestBody(req);
            console.log('📝 Datos del jardín:', { name, description, theme, privacy });
            
            if (!name || name.trim().length === 0) {
                console.log('❌ Nombre del jardín requerido');
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: "Nombre del jardín es requerido"
                }));
                return true;
            }

            // Generar código de acceso único
            const accessCode = await generateAccessCode();
            console.log('🔑 Código de acceso generado:', accessCode);

            const newJardin = new Jardin({
                name: name.trim(),
                description: description ? description.trim() : '',
                accessCode: accessCode,
                theme: theme || 'green',
                isPrivate: privacy === 'private',
                owner: usuario._id, // Asociar con el usuario autenticado
                members: []
            });

            await newJardin.save();
            console.log('✅ Jardín creado exitosamente:', newJardin._id);

            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: "Jardín creado con éxito",
                jardin: {
                    id: newJardin._id,
                    name: newJardin.name,
                    description: newJardin.description,
                    accessCode: newJardin.accessCode,
                    theme: newJardin.theme,
                    isPrivate: newJardin.isPrivate,
                    createdAt: newJardin.createdAt
                }
            }));
            return true;
        }

        // Buscar jardín por código
        if (method === 'GET' && pathname.startsWith('/getJardin/code/')) {
            const accessCode = pathname.split('/').pop().toUpperCase();
            
            const jardin = await Jardin.findOne({ 
                accessCode: accessCode,
                isActive: true 
            })
                .populate('owner', 'displayName email')
                .populate('members', 'displayName email');

            if (!jardin) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: "Jardín no encontrado"
                }));
                return true;
            }

            jardin.stats.lastAccessed = new Date();
            jardin.stats.viewCount += 1;
            await jardin.save();

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: "Jardín encontrado",
                jardin: jardin
            }));
            return true;
        }

        // Obtener memorias de un jardín
        if (method === 'GET' && pathname.startsWith('/getMemorias/')) {
            const gardenId = pathname.split('/').pop();
            
            const memorias = await Memoria.find({
                garden: gardenId,
                isActive: true
            }).sort({ eventDate: -1 });

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: "Memorias obtenidas con éxito",
                memorias: memorias,
                count: memorias.length
            }));
            return true;
        }

        // Obtener jardines del usuario
        if (method === 'GET' && pathname === '/getJardines') {
            console.log('🌻 Petición para obtener jardines del usuario');
            
            // Verificar autenticación
            const usuario = await verifyToken(req);
            if (!usuario) {
                console.log('❌ Token inválido o no proporcionado');
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: "Token de autenticación requerido",
                    requiresAuth: true
                }));
                return true;
            }
            console.log('👤 Obteniendo jardines para usuario:', usuario.email);
            
            try {
                // Buscar jardines donde el usuario es owner o member
                const jardines = await Jardin.find({
                    $or: [
                        { owner: usuario._id },
                        { members: usuario._id }
                    ]
                }).populate('owner', 'email displayName').exec();
                
                console.log('🌻 Jardines encontrados:', jardines.length);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    jardines: jardines
                }));
            } catch (error) {
                console.error('❌ Error al obtener jardines:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: "Error interno del servidor"
                }));
            }
            return true;
        }

        // Eliminar jardín
        if (method === 'DELETE' && pathname.startsWith('/deleteJardin/')) {
            const gardenId = pathname.split('/')[2];
            console.log('🗑️ Petición para eliminar jardín:', gardenId);
            
            // Verificar autenticación
            const usuario = await verifyToken(req);
            if (!usuario) {
                console.log('❌ Token inválido o no proporcionado');
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: "Token de autenticación requerido",
                    requiresAuth: true
                }));
                return true;
            }

            try {
                // Buscar el jardín y verificar que el usuario es el propietario
                const jardin = await Jardin.findById(gardenId);
                if (!jardin) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        message: "Jardín no encontrado"
                    }));
                    return true;
                }

                if (jardin.owner.toString() !== usuario._id.toString()) {
                    res.writeHead(403, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        message: "No tienes permisos para eliminar este jardín"
                    }));
                    return true;
                }

                // Eliminar todas las memorias del jardín
                await Memoria.deleteMany({ jardin: gardenId });
                console.log('🗑️ Memorias del jardín eliminadas');

                // Eliminar el jardín
                await Jardin.findByIdAndDelete(gardenId);
                console.log('✅ Jardín eliminado exitosamente');

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    message: "Jardín eliminado correctamente"
                }));
            } catch (error) {
                console.error('❌ Error al eliminar jardín:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: "Error interno del servidor"
                }));
            }
            return true;
        }

        // Obtener jardín para editar
        if (method === 'GET' && pathname.startsWith('/getJardin/edit/')) {
            const gardenId = pathname.split('/')[3];
            console.log('📝 Petición para obtener jardín para editar:', gardenId);
            
            // Verificar autenticación
            const usuario = await verifyToken(req);
            if (!usuario) {
                console.log('❌ Token inválido o no proporcionado');
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: "Token de autenticación requerido",
                    requiresAuth: true
                }));
                return true;
            }

            try {
                // Buscar el jardín y verificar que el usuario es el propietario
                const jardin = await Jardin.findById(gardenId).populate('owner', 'email displayName');
                if (!jardin) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        message: "Jardín no encontrado"
                    }));
                    return true;
                }

                if (jardin.owner._id.toString() !== usuario._id.toString()) {
                    res.writeHead(403, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        message: "No tienes permisos para editar este jardín"
                    }));
                    return true;
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    jardin: jardin
                }));
            } catch (error) {
                console.error('❌ Error al obtener jardín:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: "Error interno del servidor"
                }));
            }
            return true;
        }

        // Actualizar jardín
        if (method === 'PUT' && pathname.startsWith('/updateJardin/')) {
            const gardenId = pathname.split('/')[2];
            console.log('📝 Petición para actualizar jardín:', gardenId);
            
            // Verificar autenticación
            const usuario = await verifyToken(req);
            if (!usuario) {
                console.log('❌ Token inválido o no proporcionado');
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: "Token de autenticación requerido",
                    requiresAuth: true
                }));
                return true;
            }

            try {
                const { name, description, theme } = await parseRequestBody(req);
                
                if (!name || !theme) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        message: "Nombre y tema son requeridos"
                    }));
                    return true;
                }

                // Buscar el jardín y verificar que el usuario es el propietario
                const jardin = await Jardin.findById(gardenId);
                if (!jardin) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        message: "Jardín no encontrado"
                    }));
                    return true;
                }

                if (jardin.owner.toString() !== usuario._id.toString()) {
                    res.writeHead(403, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        message: "No tienes permisos para editar este jardín"
                    }));
                    return true;
                }

                // Actualizar el jardín
                const updatedJardin = await Jardin.findByIdAndUpdate(gardenId, {
                    name,
                    description,
                    theme: {
                        name: theme,
                        colors: {
                            rosado: '#FFE4F6',
                            azul: '#E4F2FF', 
                            verde: '#E4FFE4'
                        }[theme] || '#FFE4F6'
                    },
                    updatedAt: new Date()
                }, { new: true }).populate('owner', 'email displayName');

                console.log('✅ Jardín actualizado exitosamente');

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    message: "Jardín actualizado correctamente",
                    jardin: updatedJardin
                }));
            } catch (error) {
                console.error('❌ Error al actualizar jardín:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: "Error interno del servidor"
                }));
            }
            return true;
        }

        // Crear nueva memoria
        if (method === 'POST' && pathname === '/newMemoria') {
            const { gardenId, title, description, memoryType, content, emoji, position, tags } = await parseRequestBody(req);
            
            if (!gardenId || !title || !memoryType) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: "Jardín ID, título y tipo de memoria son requeridos"
                }));
                return true;
            }

            // Verificar que el jardín existe
            const jardin = await Jardin.findById(gardenId);
            if (!jardin) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: "Jardín no encontrado"
                }));
                return true;
            }

            const newMemoria = new Memoria({
                garden: gardenId,
                title: title.trim(),
                description: description ? description.trim() : '',
                memoryType: memoryType,
                content: content || '',
                emoji: emoji || '💭',
                position: position || { x: 50, y: 50, zIndex: 1 },
                tags: tags || []
            });

            await newMemoria.save();

            // Actualizar estadísticas del jardín
            jardin.stats.memoryCount += 1;
            await jardin.save();

            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: "Memoria creada con éxito",
                memoria: newMemoria
            }));
            return true;
        }

        // Health check
        if (method === 'GET' && pathname === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'ok',
                database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
                timestamp: new Date().toISOString()
            }));
            return true;
        }
        
    } catch (error) {
        console.error('Error en API:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: false,
            error: 'Error interno del servidor',
            message: error.message 
        }));
        return true;
    }
    
    return false;
}

// ============= SERVIDOR PRINCIPAL =============
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;
    
    console.log(`🔄 ${req.method} ${pathname}`);
    
    // Habilitar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Manejar rutas API (cualquier ruta que no sea archivo estático)
    if (!pathname.includes('.') || pathname.startsWith('/api/')) {
        const handled = await handleApiRoutes(req, res, pathname);
        if (handled) {
            return;
        }
    }
    
    // Servir archivos estáticos
    if (pathname === '/') {
        pathname = '/index.html';
    }
    
    const filePath = path.join(process.cwd(), 'public', pathname);
    
    // Verificar si el archivo existe
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 - Página no encontrada</h1>');
            return;
        }
        
        // Leer y servir el archivo
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

// ============= INICIALIZAR SERVIDOR =============
if (process.env.NODE_ENV !== 'production') {
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Servidor HappiEty ejecutándose en:`);
        console.log(`   - Local: http://127.0.0.1:${PORT}`);
        console.log(`   - Localhost: http://localhost:${PORT}`);
        console.log(`   - Red: http://[tu-ip-local]:${PORT}`);
        console.log(`🌐 Servidor disponible en toda la red`);
        console.log(`📁 Archivos estáticos servidos desde public/`);
    });
}

// Exportar para Vercel
module.exports = server;
