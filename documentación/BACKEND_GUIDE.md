# 🚀 Guía Completa del Backend - HappiEty

Esta guía detalla toda la arquitectura, funcionamiento y desarrollo del servidor backend de HappiEty.

## 📁 Estructura del Backend

```
📁 src/
├── 📄 server.js                 # ⭐ SERVIDOR PRINCIPAL CON BASE DE DATOS
├── 📄 server-dev.js             # 🛠️ SERVIDOR DE DESARROLLO (sin BD)
├── 📄 db.js                     # 🔌 CONEXIÓN A MONGODB
├── 📄 index.js                  # 📍 PUNTO DE ENTRADA
│
├── 📁 models/
│   ├── 📄 index.js              # Exporta todos los modelos
│   ├── 📄 Usuario.js            # Modelo de usuarios
│   ├── 📄 Jardin.js             # ⭐ MODELO DE JARDINES
│   └── 📄 Recuerdos.js          # ⭐ MODELOS DE MEMORIAS
│
├── 📁 middleware/
│   └── 📄 auth.js               # Middleware de autenticación
│
├── 📁 services/
│   └── 📄 AuthService.js        # Servicios de autenticación
│
└── 📁 examples/
    └── 📄 database-examples.js  # Ejemplos de uso de BD
```

---

## 🏗️ Arquitectura del Sistema

### **1. Patrón de Arquitectura**
```
📱 FRONTEND (HTML/CSS/JS)
        ⬇️ HTTP Requests
🔗 HTTP SERVER (Node.js Nativo)
        ⬇️ API Calls
🧠 BUSINESS LOGIC (Models + Services)
        ⬇️ Database Operations
🗄️ MONGODB (Mongoose ODM)
```

### **2. Flujo de Datos**
1. **Cliente** hace petición HTTP
2. **Servidor** recibe y parsea la URL
3. **Router** decide si es API o archivo estático
4. **Controllers** procesan lógica de negocio
5. **Models** interactúan con MongoDB
6. **Response** se envía de vuelta al cliente

### **3. Tres Modos de Operación**

#### **🔐 Modo Autenticación (server-auth.js)**
- ✅ **ACTUALMENTE EN USO**
- Sistema de autenticación completo
- Base de datos en memoria para desarrollo rápido
- JWT tokens con expiración
- Validación de usuarios y contraseñas
- Ideal para desarrollo y testing de auth

#### **🌐 Modo Producción (server.js)**
- Conexión real a MongoDB Atlas
- Autenticación + persistencia de datos
- Manejo de errores robusto
- CORS configurado para producción
- Logging completo y métricas

#### **🛠️ Modo Desarrollo Simple (server-dev.js)**
- Sin autenticación (desarrollo básico)
- Sin base de datos (datos en memoria)
- APIs mock para testing rápido
- Datos de ejemplo predefinidos

---

## � **SERVIDOR DE AUTENTICACIÓN (server-auth.js)**

**Este es el servidor actualmente en uso, que implementa autenticación completa con almacenamiento en memoria para desarrollo rápido.**

### **🏗️ Arquitectura del Servidor de Autenticación**

```javascript
// Ubicación: /src/server-auth.js

// DEPENDENCIAS Y CONFIGURACIÓN
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// BASE DE DATOS EN MEMORIA PARA DESARROLLO
const memoryDB = {
    users: [],      // Array de usuarios registrados
    jardines: [],   // Array de jardines creados
    memorias: []    // Array de memorias guardadas
};

const PORT = process.env.PORT || 3000;
```

### **🔐 Servicio de Autenticación Simple**

```javascript
class SimpleAuthService {
    // REGISTRO DE USUARIO
    static async register(userData) {
        const { email, password, displayName } = userData;
        
        // 1. Validaciones
        if (!email || !password || !displayName) {
            throw new Error('Todos los campos son requeridos');
        }
        
        // 2. Validar formato de email
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Formato de email inválido');
        }
        
        // 3. Validar contraseña
        if (password.length < 6) {
            throw new Error('Contraseña debe tener mínimo 6 caracteres');
        }
        
        // 4. Verificar email único
        const existingUser = memoryDB.users.find(u => u.email === email.toLowerCase());
        if (existingUser) {
            throw new Error('El email ya está registrado');
        }
        
        // 5. Crear usuario
        const userId = Date.now().toString();
        const newUser = {
            _id: userId,
            email: email.toLowerCase().trim(),
            passwordHash: password, // En producción usar bcrypt
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
        
        // 6. Guardar en memoria
        memoryDB.users.push(newUser);
        
        // 7. Generar token simple (en producción usar JWT)
        const token = Buffer.from(JSON.stringify({
            id: userId,
            email: email,
            displayName: displayName,
            exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 días
        })).toString('base64');
        
        // 8. Respuesta sin contraseña
        const { passwordHash, ...safeUser } = newUser;
        
        return {
            success: true,
            message: 'Usuario registrado exitosamente',
            user: safeUser,
            token,
            expiresIn: '7d'
        };
    }
    
    // LOGIN DE USUARIO
    static async login(credentials) {
        const { email, password } = credentials;
        
        // 1. Validar datos
        if (!email || !password) {
            throw new Error('Email y contraseña son requeridos');
        }
        
        // 2. Buscar usuario
        const user = memoryDB.users.find(u => u.email === email.toLowerCase());
        if (!user) {
            throw new Error('Credenciales inválidas');
        }
        
        // 3. Verificar contraseña (en producción comparar con bcrypt)
        if (user.passwordHash !== password) {
            throw new Error('Credenciales inválidas');
        }
        
        // 4. Actualizar último login
        user.lastLogin = new Date();
        
        // 5. Generar token
        const token = Buffer.from(JSON.stringify({
            id: user._id,
            email: user.email,
            displayName: user.displayName,
            exp: Date.now() + (7 * 24 * 60 * 60 * 1000)
        })).toString('base64');
        
        // 6. Respuesta segura
        const { passwordHash, ...safeUser } = user;
        
        return {
            success: true,
            message: 'Login exitoso',
            user: safeUser,
            token,
            expiresIn: '7d'
        };
    }
    
    // VERIFICAR TOKEN
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
}
```

### **🌐 Rutas API de Autenticación**

```javascript
async function handleApiRoutes(req, res, pathname) {
    const method = req.method;
    
    try {
        // ============= RUTAS DE AUTENTICACIÓN =============
        if (pathname.startsWith('/api/auth')) {
            
            // REGISTRO: POST /api/auth/register
            if (method === 'POST' && pathname === '/api/auth/register') {
                const data = await parseRequestBody(req);
                const result = await SimpleAuthService.register(data);
                
                const statusCode = result.success ? 201 : 400;
                res.writeHead(statusCode, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
                return true;
            }
            
            // LOGIN: POST /api/auth/login
            if (method === 'POST' && pathname === '/api/auth/login') {
                const data = await parseRequestBody(req);
                const result = await SimpleAuthService.login(data);
                
                const statusCode = result.success ? 200 : 401;
                res.writeHead(statusCode, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
                return true;
            }
            
            // USUARIO ACTUAL: GET /api/auth/me (RUTA PROTEGIDA)
            if (method === 'GET' && pathname === '/api/auth/me') {
                // Extraer token del header
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
                
                // Verificar token
                const tokenResult = SimpleAuthService.verifyToken(token);
                if (!tokenResult.success) {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(tokenResult));
                    return true;
                }
                
                // Obtener usuario actual
                const result = await SimpleAuthService.getCurrentUser(tokenResult.userId);
                const statusCode = result.success ? 200 : 404;
                res.writeHead(statusCode, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
                return true;
            }
            
            // LOGOUT: POST /api/auth/logout
            if (method === 'POST' && pathname === '/api/auth/logout') {
                const result = SimpleAuthService.logout();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
                return true;
            }
        }
        
        // HEALTH CHECK: GET /api/health
        if (pathname === '/api/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'ok',
                database: 'memory',
                users: memoryDB.users.length,
                jardines: memoryDB.jardines.length,
                memorias: memoryDB.memorias.length,
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
```

### **🚀 Servidor HTTP Principal**

```javascript
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;
    
    // CORS para desarrollo
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Manejar preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Procesar rutas API
    if (pathname.startsWith('/api/')) {
        const handled = await handleApiRoutes(req, res, pathname);
        if (handled) return;
    }
    
    // Servir archivos estáticos
    if (pathname === '/') {
        pathname = '/index.html';
    }
    
    const filePath = path.join(__dirname, '..', 'public', pathname);
    
    // Verificar si el archivo existe
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 - Página no encontrada</h1>');
            return;
        }
        
        // Leer y servir archivo
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

// INICIAR SERVIDOR
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

startServer();
```

### **📊 Estado Actual del Servidor**

```bash
# Servidor ejecutándose en puerto 3000
🚀 Servidor HappiEty ejecutándose en:
- Local: http://localhost:3000
- Red: http://[tu-ip-local]:3000
- API Health: http://localhost:3000/api/health
- Login: http://localhost:3000/login-signup.html
📁 Archivos estáticos servidos desde public/
💾 Base de datos: Memoria (para desarrollo)
🔐 Autenticación: Habilitada

# Usuarios registrados: 2
# Base de datos: En memoria
# Estado: Funcionando perfectamente
```

### **🧪 Endpoints de Prueba**

```bash
# Ver estado del servidor
curl http://localhost:3000/api/health

# Registrar usuario
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","displayName":"Test User"}'

# Hacer login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'

# Ver usuario actual (necesita token del login)
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer [token_del_login]"
```

---

## �🔌 Conexión a Base de Datos (db.js)

### **Clase DatabaseConnection**
```javascript
// Ubicación: /src/db.js

class DatabaseConnection {
    constructor() {
        this.isConnected = false;
    }

    async connect() {
        try {
            // Configuración optimizada para MongoDB Atlas
            const options = {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                maxPoolSize: 10,              // Máximo 10 conexiones concurrentes
                serverSelectionTimeoutMS: 5000,  // 5 segundos timeout
                socketTimeoutMS: 45000,       // 45 segundos socket timeout
                bufferCommands: false,        // No buffer comandos si no hay conexión
                bufferMaxEntries: 0           // No hacer buffer de entradas
            };

            // Conectar usando la URI del .env
            await mongoose.connect(process.env.MONGO_URI, options);
            this.isConnected = true;

            console.log('✅ Conectado exitosamente a MongoDB Atlas');
            console.log(`📍 Base de datos: ${mongoose.connection.name}`);

            // Configurar eventos de monitoreo
            this.setupConnectionEvents();

            return mongoose.connection;
        } catch (error) {
            console.error('❌ Error conectando a MongoDB:', error.message);
            process.exit(1);  // Terminar aplicación si no hay BD
        }
    }

    setupConnectionEvents() {
        // Eventos para monitorear la conexión
        mongoose.connection.on('connected', () => {
            console.log('🔗 Mongoose conectado a MongoDB');
        });

        mongoose.connection.on('error', (err) => {
            console.error('🚨 Error de conexión MongoDB:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('🔌 Mongoose desconectado');
            this.isConnected = false;
        });

        // Manejo de cierre graceful
        process.on('SIGINT', async () => {
            await this.disconnect();
            process.exit(0);
        });
    }

    async disconnect() {
        if (this.isConnected) {
            await mongoose.connection.close();
            console.log('👋 Conexión cerrada correctamente');
        }
    }

    // Método para verificar salud de la conexión
    getHealth() {
        return {
            connected: this.isConnected,
            readyState: mongoose.connection.readyState,
            host: mongoose.connection.host,
            name: mongoose.connection.name
        };
    }
}

// Exportar singleton
module.exports = new DatabaseConnection();
```

### **Estados de Conexión Mongoose:**
- `0` = desconectado
- `1` = conectado
- `2` = conectando  
- `3` = desconectando

---

## 🗄️ Modelos de Base de Datos

### **1. Modelo Jardín (Jardin.js)**

#### **Schema Principal:**
```javascript
const jardinSchema = new mongoose.Schema({
    // IDENTIFICACIÓN Y PROPIETARIO
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'Propietario es requerido']
    },
    
    // INFORMACIÓN BÁSICA
    name: {
        type: String,
        required: [true, 'Nombre del jardín es requerido'],
        trim: true,                    // Elimina espacios
        maxlength: [100, 'Nombre no puede exceder 100 caracteres']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Descripción no puede exceder 500 caracteres']
    },
    
    // CÓDIGO DE ACCESO ÚNICO
    accessCode: {
        type: String,
        required: true,
        unique: true,                  // Índice único en MongoDB
        uppercase: true,               // Siempre mayúsculas
        match: [/^[A-Z]{4}[0-9]{4}$/, 'Código debe tener formato ABCD1234']
    },
    
    // MIEMBROS Y COLABORADORES
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
    }],
    
    // PERSONALIZACIÓN VISUAL
    theme: {
        name: {
            type: String,
            enum: ['rosado', 'azul', 'verde'],  // Solo estos valores
            default: 'rosado'
        },
        primaryColor: {
            type: String,
            default: '#FF0080'
        },
        secondaryColor: {
            type: String,
            default: '#ffcffc'
        },
        musicUrl: {
            type: String,
            default: null
        }
    },
    
    // ESTADÍSTICAS Y MÉTRICAS
    stats: {
        memoryCount: {
            type: Number,
            default: 0
        },
        lastAccessed: {
            type: Date,
            default: Date.now
        },
        viewCount: {
            type: Number,
            default: 0
        }
    },
    
    // RELACIÓN CON MEMORIAS
    memories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Memory'                  // Referencia a colección memories
    }],
    
    // CONFIGURACIÓN DE PRIVACIDAD
    isPrivate: {
        type: Boolean,
        default: true                  // Por defecto jardines son privados
    }
}, {
    timestamps: true,                  // Agrega createdAt y updatedAt automáticamente
    collection: 'jardines'            // Nombre específico de colección
});
```

#### **Índices para Optimización:**
```javascript
// Búsqueda rápida por código de acceso (más común)
jardinSchema.index({ accessCode: 1 }, { unique: true });

// Jardines de un usuario ordenados por fecha
jardinSchema.index({ owner: 1, createdAt: -1 });

// Jardines donde el usuario es miembro
jardinSchema.index({ members: 1 });

// Jardines ordenados por última actividad
jardinSchema.index({ 'stats.lastAccessed': -1 });
```

#### **Middleware Pre-Save:**
```javascript
// Se ejecuta ANTES de guardar el documento
jardinSchema.pre('save', async function(next) {
    // Solo generar código si es un jardín nuevo
    if (!this.accessCode) {
        this.accessCode = await this.constructor.generateUniqueAccessCode();
    }
    next();  // Continuar con el save
});
```

#### **Métodos Estáticos (de Clase):**
```javascript
// Generar código único formato LOVE1234
jardinSchema.statics.generateUniqueAccessCode = async function() {
    let code;
    let exists = true;
    
    while (exists) {
        // Generar código aleatorio
        const letters = ['L', 'O', 'V', 'E'];  // Temática de amor
        const numbers = Math.floor(1000 + Math.random() * 9000);  // 1000-9999
        code = letters.join('') + numbers;
        
        // Verificar si ya existe en BD
        const existing = await this.findOne({ accessCode: code });
        exists = !!existing;  // Continuar si existe
    }
    
    return code;
};

// Buscar jardín por código (case insensitive)
jardinSchema.statics.findByAccessCode = function(accessCode) {
    return this.findOne({ accessCode: accessCode.toUpperCase() });
};
```

#### **Métodos de Instancia:**
```javascript
// Agregar miembro al jardín
jardinSchema.methods.addMember = async function(userId) {
    if (!this.members.includes(userId)) {
        this.members.push(userId);
        return this.save();
    }
    return this;  // Ya era miembro
};

// Remover miembro del jardín
jardinSchema.methods.removeMember = async function(userId) {
    this.members = this.members.filter(id => !id.equals(userId));
    return this.save();
};

// Actualizar estadísticas de uso
jardinSchema.methods.updateStats = async function() {
    this.stats.memoryCount = this.memories.length;
    this.stats.lastAccessed = new Date();
    this.stats.viewCount += 1;
    return this.save();
};
```

### **2. Modelo de Memorias (Recuerdos.js)**

#### **Patrón Discriminator**
HappiEty usa el patrón **Discriminator** de Mongoose para manejar diferentes tipos de memorias en una sola colección:

```javascript
// SCHEMA BASE - Campos comunes a todas las memorias
const baseMemorySchema = new mongoose.Schema({
    // RELACIÓN CON JARDÍN
    garden: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Jardin',
        required: [true, 'El jardín es requerido']
    },
    
    // INFORMACIÓN BÁSICA
    title: {
        type: String,
        required: [true, 'El título es requerido'],
        trim: true,
        maxlength: [200, 'El título no puede exceder 200 caracteres']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'La descripción no puede exceder 1000 caracteres']
    },
    
    // FECHAS
    eventDate: {
        type: Date,
        required: [true, 'La fecha del evento es requerida'],
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    modifiedDate: {
        type: Date,
        default: Date.now
    },
    
    // ESTADO Y METADATOS
    isActive: {
        type: Boolean,
        default: true
    },
    tags: [{
        type: String,
        trim: true,
        maxlength: [50, 'Cada tag no puede exceder 50 caracteres']
    }],
    
    // POSICIÓN EN EL JARDÍN VISUAL
    position: {
        x: {
            type: Number,
            default: 0
        },
        y: {
            type: Number,
            default: 0
        },
        zIndex: {
            type: Number,
            default: 1
        }
    }
}, {
    discriminatorKey: 'memoryType',    // Campo que identifica el tipo
    collection: 'memories'             // Todas en la misma colección
});
```

#### **Discriminadores Específicos:**

##### **💬 Memoria de Texto:**
```javascript
const textSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        maxlength: 5000              // Textos largos permitidos
    },
    emoji: {
        type: String,
        maxlength: [10, 'Emoji no puede exceder 10 caracteres']
    }
});

const TextMemory = Memory.discriminator('Text', textSchema);
```

##### **📷 Memoria de Imagen:**
```javascript
const imageSchema = new mongoose.Schema({
    filePath: {
        type: String,
        required: true               // URL o path de la imagen
    },
    fileSize: {
        type: Number,                // Tamaño en bytes
        default: 0
    },
    width: Number,                   // Dimensiones originales
    height: Number,
    thumbnailPath: String            // Imagen pequeña para preview
});

const ImageMemory = Memory.discriminator('Image', imageSchema);
```

##### **🎵 Memoria de Audio:**
```javascript
const audioSchema = new mongoose.Schema({
    filePath: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        default: 0
    },
    duration: {
        type: Number,                // Duración en segundos
        default: 0
    },
    format: {
        type: String,                // mp3, wav, etc.
        enum: ['mp3', 'wav', 'ogg'],
        default: 'mp3'
    }
});

const AudioMemory = Memory.discriminator('Audio', audioSchema);
```

##### **🎬 Memoria de Video:**
```javascript
const videoSchema = new mongoose.Schema({
    filePath: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        default: 0
    },
    duration: {
        type: Number,                // Duración en segundos
        default: 0
    },
    width: Number,                   // Resolución del video
    height: Number,
    thumbnailPath: String            // Frame de preview
});

const VideoMemory = Memory.discriminator('Video', videoSchema);
```

##### **📍 Memoria de Ubicación:**
```javascript
const locationSchema = new mongoose.Schema({
    coordinates: {
        lat: {
            type: Number,
            required: true,
            min: -90,                // Latitud válida
            max: 90
        },
        lng: {
            type: Number,
            required: true,
            min: -180,               // Longitud válida
            max: 180
        }
    },
    locationName: String,            // Nombre del lugar
    address: String,                 // Dirección completa
    country: String,                 // País
    city: String                     // Ciudad
});

const LocationMemory = Memory.discriminator('Location', locationSchema);
```

#### **Factory Methods (Métodos de Creación):**
```javascript
// Crear memoria de texto
Memory.createTextMemory = function(gardenId, data) {
    return new TextMemory({
        garden: gardenId,
        memoryType: 'Text',          // Discriminator key
        ...data                      // Spread operator con el resto de datos
    });
};

// Crear memoria de imagen
Memory.createImageMemory = function(gardenId, data) {
    return new ImageMemory({
        garden: gardenId,
        memoryType: 'Image',
        ...data
    });
};

// Crear memoria de audio
Memory.createAudioMemory = function(gardenId, data) {
    return new AudioMemory({
        garden: gardenId,
        memoryType: 'Audio',
        ...data
    });
};

// Crear memoria de video
Memory.createVideoMemory = function(gardenId, data) {
    return new VideoMemory({
        garden: gardenId,
        memoryType: 'Video',
        ...data
    });
};

// Crear memoria de ubicación
Memory.createLocationMemory = function(gardenId, data) {
    return new LocationMemory({
        garden: gardenId,
        memoryType: 'Location',
        ...data
    });
};
```

---

## 🌐 API REST Endpoints

### **1. Rutas de Jardines**

#### **POST /api/jardines - Crear Jardín**
```javascript
// REQUEST BODY:
{
    "name": "Mi Jardín de Recuerdos",
    "description": "Un lugar especial para momentos importantes",
    "owner": "676c45a1234567890abcdef1",
    "isPrivate": true,
    "theme": {
        "name": "rosado",
        "primaryColor": "#FF0080",
        "secondaryColor": "#ffcffc"
    }
}

// RESPONSE (201 Created):
{
    "_id": "676c45a1234567890abcdef2",
    "name": "Mi Jardín de Recuerdos",
    "description": "Un lugar especial para momentos importantes",
    "owner": "676c45a1234567890abcdef1",
    "accessCode": "LOVE1234",        // Generado automáticamente
    "isPrivate": true,
    "theme": {
        "name": "rosado",
        "primaryColor": "#FF0080",
        "secondaryColor": "#ffcffc",
        "musicUrl": null
    },
    "stats": {
        "memoryCount": 0,
        "lastAccessed": "2024-01-15T10:30:00.000Z",
        "viewCount": 0
    },
    "memories": [],
    "members": [],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
}

// ERRORES POSIBLES:
// 400 - Datos inválidos
// 500 - Error interno del servidor
```

#### **GET /api/jardines/codigo/{accessCode} - Buscar por Código**
```javascript
// REQUEST:
GET /api/jardines/codigo/LOVE1234

// RESPONSE (200 OK):
{
    "_id": "676c45a1234567890abcdef2",
    "name": "Mi Jardín de Recuerdos",
    "description": "Un lugar especial para momentos importantes",
    "owner": {
        "_id": "676c45a1234567890abcdef1",
        "displayName": "Laura García"    // Populated
    },
    "accessCode": "LOVE1234",
    "memories": [                        // Populated
        {
            "_id": "676c45a1234567890abcdef3",
            "title": "Mi graduación",
            "memoryType": "Text",
            "eventDate": "2023-06-15T00:00:00.000Z"
        }
    ],
    "stats": {
        "memoryCount": 1,
        "lastAccessed": "2024-01-15T10:35:00.000Z",  // Actualizado automáticamente
        "viewCount": 1                                // Incrementado
    }
    // ... resto de campos
}

// ERRORES POSIBLES:
// 404 - Jardín no encontrado
// 500 - Error interno del servidor
```

### **2. Rutas de Memorias**

#### **POST /api/memorias - Crear Memoria**
```javascript
// REQUEST BODY (Memoria de Texto):
{
    "garden": "676c45a1234567890abcdef2",
    "memoryType": "Text",
    "title": "Mi graduación",
    "description": "El día más importante de mi carrera",
    "content": "Después de años de estudio, finalmente logré graduarme.",
    "eventDate": "2023-06-15T00:00:00.000Z",
    "tags": ["graduación", "universidad", "logro"],
    "position": {
        "x": 150,
        "y": 200,
        "zIndex": 1
    }
}

// REQUEST BODY (Memoria de Imagen):
{
    "garden": "676c45a1234567890abcdef2",
    "memoryType": "Image",
    "title": "Viaje a París",
    "description": "Una foto desde la Torre Eiffel",
    "filePath": "https://example.com/images/paris.jpg",
    "fileSize": 2048576,                 // 2MB en bytes
    "width": 1920,
    "height": 1080,
    "thumbnailPath": "https://example.com/thumbs/paris_thumb.jpg",
    "eventDate": "2023-08-20T00:00:00.000Z"
}

// REQUEST BODY (Memoria de Ubicación):
{
    "garden": "676c45a1234567890abcdef2",
    "memoryType": "Location",
    "title": "Nuestra primera cita",
    "description": "El restaurante donde nos conocimos",
    "coordinates": {
        "lat": 48.8566,                  // Torre Eiffel
        "lng": 2.2944
    },
    "locationName": "Torre Eiffel",
    "address": "Champ de Mars, 5 Avenue Anatole France, 75007 Paris",
    "country": "Francia",
    "city": "París",
    "eventDate": "2023-02-14T00:00:00.000Z"
}

// RESPONSE (201 Created):
{
    "_id": "676c45a1234567890abcdef4",
    "garden": "676c45a1234567890abcdef2",
    "memoryType": "Text",               // Discriminator
    "title": "Mi graduación",
    "description": "El día más importante de mi carrera",
    "content": "Después de años de estudio...",  // Campo específico de Text
    "eventDate": "2023-06-15T00:00:00.000Z",
    "createdAt": "2024-01-15T10:40:00.000Z",
    "modifiedDate": "2024-01-15T10:40:00.000Z",
    "isActive": true,
    "tags": ["graduación", "universidad", "logro"],
    "position": {
        "x": 150,
        "y": 200,
        "zIndex": 1
    }
}

// ERRORES POSIBLES:
// 400 - Tipo de memoria no válido
// 400 - Datos requeridos faltantes
// 404 - Jardín no encontrado
// 500 - Error interno del servidor
```

#### **GET /api/memorias/jardin/{gardenId} - Obtener Memorias**
```javascript
// REQUEST:
GET /api/memorias/jardin/676c45a1234567890abcdef2

// RESPONSE (200 OK):
[
    {
        "_id": "676c45a1234567890abcdef4",
        "garden": "676c45a1234567890abcdef2",
        "memoryType": "Text",
        "title": "Mi graduación",
        "description": "El día más importante de mi carrera",
        "content": "Después de años de estudio...",
        "eventDate": "2023-06-15T00:00:00.000Z",
        "createdAt": "2024-01-15T10:40:00.000Z",
        "tags": ["graduación", "universidad", "logro"],
        "position": { "x": 150, "y": 200, "zIndex": 1 }
    },
    {
        "_id": "676c45a1234567890abcdef5",
        "garden": "676c45a1234567890abcdef2",
        "memoryType": "Image",
        "title": "Viaje a París",
        "filePath": "https://example.com/images/paris.jpg",
        "fileSize": 2048576,
        "width": 1920,
        "height": 1080,
        // ... más campos
    }
]

// NOTA: Las memorias se ordenan por eventDate descendente (más recientes primero)
// NOTA: Solo se incluyen memorias con isActive: true
```

### **3. Ruta de Health Check**

#### **GET /api/health - Estado del Sistema**
```javascript
// REQUEST:
GET /api/health

// RESPONSE (200 OK):
{
    "status": "ok",
    "database": {
        "connected": true,
        "readyState": 1,                 // 1 = conectado
        "host": "cluster0.mongodb.net",
        "name": "happiety"
    },
    "timestamp": "2024-01-15T10:45:00.000Z"
}

// RESPONSE SI HAY PROBLEMAS (500 Error):
{
    "status": "error",
    "database": {
        "connected": false,
        "readyState": 0,                 // 0 = desconectado
        "host": null,
        "name": null
    },
    "timestamp": "2024-01-15T10:45:00.000Z"
}
```

---

## 🚀 Servidor Principal (server.js)

### **Flujo de Request Processing:**

```javascript
// 1. CREAR SERVIDOR HTTP
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;
    
    // 2. CONFIGURAR CORS (Desarrollo)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // 3. MANEJAR PREFLIGHT OPTIONS
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // 4. DECIDIR TIPO DE RUTA
    if (pathname.startsWith('/api/')) {
        // Ruta API - Procesamiento dinámico
        const handled = await handleApiRoutes(req, res, pathname);
        if (handled) return;
    }
    
    // 5. SERVIR ARCHIVOS ESTÁTICOS
    if (pathname === '/') {
        pathname = '/index.html';  // Default file
    }
    
    const filePath = path.join(__dirname, '..', 'public', pathname);
    
    // 6. VERIFICAR EXISTENCIA DEL ARCHIVO
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // Archivo no encontrado
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 - Página no encontrada</h1>');
            return;
        }
        
        // 7. LEER Y SERVIR ARCHIVO
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end('<h1>500 - Error interno del servidor</h1>');
                return;
            }
            
            // 8. DETERMINAR MIME TYPE Y ENVIAR
            const mimeType = getMimeType(filePath);
            res.writeHead(200, { 'Content-Type': mimeType });
            res.end(data);
        });
    });
});
```

### **Función de Parsing del Body:**
```javascript
function parseRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        
        // Recibir datos en chunks
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        // Cuando se complete el stream
        req.on('end', () => {
            try {
                // Intentar parsear JSON
                resolve(body ? JSON.parse(body) : {});
            } catch (error) {
                // JSON inválido
                reject(error);
            }
        });
    });
}
```

### **MIME Types Soportados:**
```javascript
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
        '.wav': 'audio/wav',
        '.mp4': 'video/mp4',
        '.webm': 'video/webm'
    };
    return mimeTypes[ext] || 'text/plain';
}
```

---

## 🛠️ Servidor de Desarrollo (server-dev.js)

### **Datos de Ejemplo en Memoria:**
```javascript
const sampleGarden = {
    _id: '676c45a1234567890abcdef1',
    name: 'Mi Jardín de Recuerdos',
    description: 'Un lugar especial para guardar momentos importantes',
    owner: 'user123',
    accessCode: 'ABC123',
    isPrivate: false,
    memories: [],
    stats: {
        memoryCount: 5,
        views: 12,
        likes: 8
    }
};

const sampleMemories = [
    {
        _id: '676c45a1234567890abcdef2',
        garden: '676c45a1234567890abcdef1',
        title: 'Mi graduación',
        description: 'El día más importante de mi carrera universitaria',
        memoryType: 'Text',
        content: 'Después de años de estudio, finalmente logré graduarme.',
        eventDate: new Date('2023-06-15'),
        tags: ['graduación', 'universidad', 'logro']
    },
    {
        _id: '676c45a1234567890abcdef3',
        garden: '676c45a1234567890abcdef1',
        title: 'Viaje a París',
        description: 'Una foto desde la Torre Eiffel',
        memoryType: 'Image',
        filePath: 'https://images.unsplash.com/photo-1549144511-f099e773c147?w=300',
        eventDate: new Date('2023-08-20')
    }
    // ... más memorias de ejemplo
];
```

### **APIs Mock:**
```javascript
// Mock API para desarrollo rápido
function handleDevApiRoutes(req, res, pathname) {
    const method = req.method;
    
    // Jardín por código
    if (method === 'GET' && pathname.includes('/api/jardines/codigo/')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            ...sampleGarden,
            memories: sampleMemories.slice(0, 3)  // Solo 3 memorias
        }));
        return true;
    }
    
    // Memorias de jardín
    if (method === 'GET' && pathname.includes('/api/memorias/jardin/')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(sampleMemories));
        return true;
    }
    
    // Health check
    if (pathname === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            mode: 'development',
            database: 'mock-data',
            timestamp: new Date().toISOString()
        }));
        return true;
    }
    
    return false;
}
```

---

## 🔧 Herramientas de Desarrollo

### **1. Comandos Disponibles:**
```bash
# Servidor de producción (con MongoDB)
npm start
npm run server

# Servidor de desarrollo (sin MongoDB)
npm run dev
npm run dev-simple

# Ver logs en tiempo real
npm run server 2>&1 | tee server.log
```

### **2. Variables de Entorno (.env):**
```bash
# MongoDB Connection
MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/happiety

# Server Configuration
PORT=3000
NODE_ENV=development

# Security (para futuro)
JWT_SECRET=tu-clave-secreta-aqui
SESSION_SECRET=otra-clave-secreta

# External APIs (para futuro)
CLOUDINARY_API_KEY=tu-key-cloudinary
CLOUDINARY_API_SECRET=tu-secret-cloudinary
```

### **3. Testing con cURL:**

#### **Crear Jardín:**
```bash
curl -X POST http://localhost:3000/api/jardines \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Garden",
    "description": "Jardín de prueba",
    "owner": "676c45a1234567890abcdef1",
    "isPrivate": false
  }'
```

#### **Buscar Jardín:**
```bash
curl -X GET http://localhost:3000/api/jardines/codigo/LOVE1234
```

#### **Crear Memoria:**
```bash
curl -X POST http://localhost:3000/api/memorias \
  -H "Content-Type: application/json" \
  -d '{
    "garden": "676c45a1234567890abcdef2",
    "memoryType": "Text",
    "title": "Memoria de prueba",
    "content": "Esta es una memoria de prueba",
    "eventDate": "2024-01-15T10:00:00.000Z"
  }'
```

#### **Health Check:**
```bash
curl -X GET http://localhost:3000/api/health
```

### **4. Debugging con Console:**
```javascript
// En cualquier parte del código del servidor:

// Log básico
console.log('🔍 Debug:', variable);

// Log de errores
console.error('❌ Error:', error.message);

// Log con timestamp
console.log(`⏰ ${new Date().toISOString()} - Evento importante`);

// Log condicional
if (process.env.NODE_ENV === 'development') {
    console.log('🛠️ Debug mode:', datos);
}
```

### **5. Monitoreo de Base de Datos:**
```javascript
// Ver estado de conexión
const health = dbConnection.getHealth();
console.log('DB Health:', health);

// Contar documentos
const jardinCount = await models.Jardin.countDocuments();
const memoryCount = await models.Memory.countDocuments();
console.log(`📊 Stats: ${jardinCount} jardines, ${memoryCount} memorias`);

// Ver índices
const indexes = await models.Jardin.collection.getIndexes();
console.log('📇 Jardín indexes:', indexes);
```

---

## 📊 Patrones de Desarrollo

### **1. Manejo de Errores:**
```javascript
try {
    // Operación que puede fallar
    const result = await models.Jardin.findById(id);
    
    if (!result) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            error: 'Jardín no encontrado',
            code: 'GARDEN_NOT_FOUND' 
        }));
        return;
    }
    
    // Éxito
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
    
} catch (error) {
    console.error('Error procesando request:', error);
    
    // Error de validación de Mongoose
    if (error.name === 'ValidationError') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            error: 'Datos inválidos',
            details: error.message 
        }));
    } else {
        // Error genérico
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            error: 'Error interno del servidor',
            message: error.message 
        }));
    }
}
```

### **2. Validación de Datos:**
```javascript
// Validar ID de MongoDB
function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

// Validar datos de entrada
function validateMemoryData(data) {
    const errors = [];
    
    if (!data.title || data.title.trim().length === 0) {
        errors.push('Título es requerido');
    }
    
    if (!data.memoryType || !['Text', 'Image', 'Audio', 'Video', 'Location'].includes(data.memoryType)) {
        errors.push('Tipo de memoria inválido');
    }
    
    if (!isValidObjectId(data.garden)) {
        errors.push('ID de jardín inválido');
    }
    
    return errors;
}

// Usar validación
const errors = validateMemoryData(requestData);
if (errors.length > 0) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
        error: 'Datos inválidos',
        details: errors 
    }));
    return;
}
```

### **3. Paginación (para listas grandes):**
```javascript
async function getMemoriesWithPagination(gardenId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const memories = await models.Memory
        .find({ garden: gardenId, isActive: true })
        .sort({ eventDate: -1 })
        .skip(skip)
        .limit(limit);
    
    const total = await models.Memory.countDocuments({ 
        garden: gardenId, 
        isActive: true 
    });
    
    return {
        memories,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1
        }
    };
}
```

---

## 🚀 Optimizaciones y Mejores Prácticas

### **1. Performance de Base de Datos:**
```javascript
// ✅ BUENO: Usar índices para búsquedas frecuentes
const jardin = await models.Jardin.findOne({ accessCode: 'LOVE1234' });

// ❌ MALO: Buscar sin índice
const jardin = await models.Jardin.findOne({ description: /palabra/ });

// ✅ BUENO: Limitar campos retornados
const jardines = await models.Jardin
    .find({ owner: userId })
    .select('name description accessCode stats.memoryCount');

// ✅ BUENO: Populate solo campos necesarios
const jardin = await models.Jardin
    .findById(id)
    .populate('owner', 'displayName email')
    .populate('memories', 'title memoryType eventDate');
```

### **2. Manejo de Memoria:**
```javascript
// ✅ BUENO: Streaming para archivos grandes
function streamFile(filePath, res) {
    const stream = fs.createReadStream(filePath);
    
    stream.on('error', (error) => {
        res.writeHead(404);
        res.end();
    });
    
    stream.pipe(res);
}

// ✅ BUENO: Límites de tamaño para uploads
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function validateFileSize(fileSize) {
    return fileSize <= MAX_FILE_SIZE;
}
```

### **3. Security Best Practices:**
```javascript
// ✅ Sanitizar entrada de usuario
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
        .trim()
        .replace(/[<>]/g, '')  // Remover < y >
        .substring(0, 1000);   // Límite de longitud
}

// ✅ Validar permisos de acceso
async function checkGardenAccess(gardenId, userId) {
    const garden = await models.Jardin.findById(gardenId);
    
    if (!garden) return false;
    
    // Owner siempre tiene acceso
    if (garden.owner.equals(userId)) return true;
    
    // Miembro tiene acceso
    if (garden.members.includes(userId)) return true;
    
    // Jardín público tiene acceso de lectura
    if (!garden.isPrivate) return { read: true, write: false };
    
    return false;
}
```

---

## 🔮 Próximos Desarrollos del Backend

### **1. Funcionalidades Pendientes:**
- [ ] **Sistema de Autenticación JWT**
  - Login/Register de usuarios
  - Middleware de autenticación
  - Refresh tokens
  
- [ ] **Upload de Archivos**
  - Integración con Cloudinary/AWS S3
  - Compresión automática de imágenes
  - Generación de thumbnails
  
- [ ] **APIs Adicionales**
  - CRUD completo de jardines
  - Búsqueda y filtrado de memorias
  - Sistema de comentarios
  - Compartir jardines públicos
  
- [ ] **Notificaciones**
  - WebSockets para tiempo real
  - Notificaciones push
  - Emails transaccionales

### **2. Mejoras de Performance:**
- [ ] **Caching**
  - Redis para sesiones
  - Cache de consultas frecuentes
  - CDN para archivos estáticos
  
- [ ] **Database Optimization**
  - Agregaciones complejas
  - Índices compuestos
  - Sharding para escalabilidad

### **3. Monitoreo y Logging:**
- [ ] **Sistema de Logs**
  - Winston para logging estructurado
  - Rotación de logs
  - Alertas automáticas
  
- [ ] **Métricas y Analytics**
  - Tiempo de respuesta de APIs
  - Uso de memoria y CPU
  - Estadísticas de usuarios activos

---

## 📚 Recursos de Aprendizaje

### **1. Conceptos Clave:**
- **HTTP Server Nativo:** Node.js sin frameworks como Express
- **Mongoose ODM:** Modelado de datos para MongoDB
- **Discriminator Pattern:** Un schema base con variaciones
- **Async/Await:** Manejo moderno de operaciones asíncronas
- **CORS:** Cross-Origin Resource Sharing para desarrollo

### **2. Debugging Tips:**
```javascript
// Ver requests entrantes
console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);

// Inspeccionar objetos complejos
console.log('Object:', JSON.stringify(obj, null, 2));

// Medir tiempo de operaciones
console.time('DatabaseQuery');
const result = await models.Memory.find({});
console.timeEnd('DatabaseQuery');
```

### **3. Comandos Útiles:**
```bash
# Ver procesos Node.js corriendo
ps aux | grep node

# Matar proceso por puerto
lsof -ti:3000 | xargs kill -9

# Ver logs en tiempo real
tail -f server.log

# Verificar conexión a MongoDB
mongo "mongodb+srv://cluster.mongodb.net/test" --username tu-usuario
```

---

**¡Con esta guía tienes todo el conocimiento necesario para desarrollar y mantener el backend de HappiEty! 🚀💾**
