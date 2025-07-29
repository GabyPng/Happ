require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// ============= CONEXIÓN A MONGODB =============
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB Conectado")) 
.catch(error => console.log("❌ Error de conexión:", error.message));

// ============= MIDDLEWARES =============
app.use(express.json()); // Leer y recibir json
app.use(cors());

// ============= ESQUEMAS Y MODELOS =============

// Schema Usuario
const usuarioSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    passwordHash: {
        type: String,
        required: true,
        minlength: 6
    },
    displayName: {
        type: String,
        trim: true,
        maxlength: 50
    },
    avatar: {
        type: String,
        default: null
    },
    preferences: {
        theme: {
            type: String,
            enum: ['rosado', 'azul', 'verde'],
            default: 'rosado'
        },
        notifications: {
            type: Boolean,
            default: true
        }
    },
    stats: {
        totalGardens: { type: Number, default: 0 },
        totalMemories: { type: Number, default: 0 }
    },
    lastLogin: { type: Date, default: null }
}, { timestamps: true });

// Schema Jardín
const jardinSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    accessCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
    }],
    theme: {
        name: {
            type: String,
            enum: ['rosado', 'azul', 'verde'],
            default: 'rosado'
        },
        primaryColor: { type: String, default: '#FF0080' },
        secondaryColor: { type: String, default: '#ffcffc' },
        musicUrl: { type: String, default: null }
    },
    stats: {
        memoryCount: { type: Number, default: 0 },
        lastAccessed: { type: Date, default: Date.now },
        viewCount: { type: Number, default: 0 }
    },
    isPrivate: { type: Boolean, default: true }
}, { timestamps: true });

// Schema Memoria (con discriminador)
const memoriaSchema = new mongoose.Schema({
    garden: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Jardin',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    memoryType: {
        type: String,
        required: true,
        enum: ['Text', 'Image', 'Audio', 'Video', 'Location']
    },
    eventDate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    tags: [{ type: String, trim: true, maxlength: 50 }],
    position: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 },
        zIndex: { type: Number, default: 1 }
    },
    // Campos específicos por tipo
    content: String, // Text
    emoji: String, // Text
    filePath: String, // Image, Audio, Video
    fileSize: Number, // Image, Audio, Video
    mimeType: String, // Image, Audio, Video
    width: Number, // Image, Video
    height: Number, // Image, Video
    duration: Number, // Audio, Video
    artist: String, // Audio
    album: String, // Audio
    thumbnailPath: String, // Video
    altText: String, // Image
    coordinates: { // Location
        lat: Number,
        lng: Number
    },
    locationName: String, // Location
    address: String, // Location
    country: String, // Location
    city: String // Location
}, { timestamps: true });

// Crear modelos
const Usuario = mongoose.model('Usuario', usuarioSchema);
const Jardin = mongoose.model('Jardin', jardinSchema);
const Memoria = mongoose.model('Memoria', memoriaSchema);

// ============= FUNCIONES AUXILIARES =============

// Generar código de acceso único
async function generateUniqueAccessCode() {
    let code;
    let exists = true;
    
    while (exists) {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = Math.floor(1000 + Math.random() * 9000);
        code = '';
        for (let i = 0; i < 4; i++) {
            code += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        code += numbers;
        
        const existing = await Jardin.findOne({ accessCode: code });
        exists = !!existing;
    }
    
    return code;
}

// Hash password
async function hashPassword(password) {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
}

// Comparar password
async function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}

// Generar JWT
function generateToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'secret-key', { expiresIn: '24h' });
}

// Verificar JWT
function verifyToken(token) {
    try {
        return jwt.verify(token, process.env.JWT_SECRET || 'secret-key');
    } catch (error) {
        return null;
    }
}

// ============= RUTAS DE AUTENTICACIÓN =============

// Ruta de bienvenida
app.get('/', (req, res) => {
    res.json({ mensaje: 'Bienvenido a HappiEty API' });
});

// Registro de usuario
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, displayName } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email y password son requeridos"
            });
        }

        // Verificar si el usuario ya existe
        const existingUser = await Usuario.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "El email ya está registrado"
            });
        }

        // Crear nuevo usuario
        const passwordHash = await hashPassword(password);
        const newUser = new Usuario({
            email,
            passwordHash,
            displayName: displayName || null
        });

        await newUser.save();

        // Generar token
        const token = generateToken(newUser._id);

        return res.status(201).json({
            success: true,
            message: "Usuario registrado con éxito",
            user: {
                id: newUser._id,
                email: newUser.email,
                displayName: newUser.displayName,
                preferences: newUser.preferences
            },
            token
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error al registrar usuario",
            error: error.message
        });
    }
});

// Login de usuario
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email y password son requeridos"
            });
        }

        // Buscar usuario
        const user = await Usuario.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Credenciales inválidas"
            });
        }

        // Verificar password
        const isValidPassword = await comparePassword(password, user.passwordHash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: "Credenciales inválidas"
            });
        }

        // Actualizar último login
        user.lastLogin = new Date();
        await user.save();

        // Generar token
        const token = generateToken(user._id);

        return res.status(200).json({
            success: true,
            message: "Login exitoso",
            user: {
                id: user._id,
                email: user.email,
                displayName: user.displayName,
                preferences: user.preferences
            },
            token
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error al hacer login",
            error: error.message
        });
    }
});

// ============= RUTAS DE JARDINES =============

// Obtener todos los jardines del usuario
app.get('/api/jardines', async (req, res) => {
    try {
        const jardines = await Jardin.find()
            .populate('owner', 'displayName email')
            .populate('members', 'displayName email');
        
        return res.status(200).json({
            message: "Jardines obtenidos con éxito",
            jardines: jardines
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error al consultar jardines",
            error: error.message
        });
    }
});

// Crear nuevo jardín
app.post('/api/jardines', async (req, res) => {
    try {
        const { owner, name, description, theme } = req.body;

        if (!owner || !name) {
            return res.status(400).json({
                message: "Owner y name son requeridos"
            });
        }

        const accessCode = await generateUniqueAccessCode();
        
        const newJardin = new Jardin({
            owner,
            name,
            description: description || "",
            accessCode,
            theme: theme || { name: 'rosado' }
        });

        await newJardin.save();

        // Actualizar stats del usuario
        await Usuario.findByIdAndUpdate(owner, {
            $inc: { 'stats.totalGardens': 1 }
        });

        return res.status(201).json({
            message: "Jardín creado con éxito",
            jardin: newJardin
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error al crear jardín",
            error: error.message
        });
    }
});

// Buscar jardín por código
app.get('/api/jardines/codigo/:accessCode', async (req, res) => {
    try {
        const { accessCode } = req.params;
        
        const jardin = await Jardin.findOne({ accessCode: accessCode.toUpperCase() })
            .populate('owner', 'displayName')
            .populate('members', 'displayName');

        if (!jardin) {
            return res.status(404).json({
                message: "Jardín no encontrado"
            });
        }

        // Actualizar stats
        jardin.stats.lastAccessed = new Date();
        jardin.stats.viewCount += 1;
        await jardin.save();

        return res.status(200).json({
            message: "Jardín encontrado",
            jardin: jardin
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error al buscar jardín",
            error: error.message
        });
    }
});

// Actualizar jardín
app.put('/api/jardines/:jardinId', async (req, res) => {
    try {
        const { jardinId } = req.params;
        const updateData = req.body;
        
        const updatedJardin = await Jardin.findByIdAndUpdate(
            jardinId,
            updateData,
            { new: true }
        );

        if (!updatedJardin) {
            return res.status(404).json({
                message: "Jardín no encontrado"
            });
        }

        return res.status(200).json({
            message: "Jardín actualizado con éxito",
            jardin: updatedJardin
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error al actualizar jardín",
            error: error.message
        });
    }
});

// Eliminar jardín
app.delete('/api/jardines/:jardinId', async (req, res) => {
    try {
        const { jardinId } = req.params;
        
        const deletedJardin = await Jardin.findByIdAndDelete(jardinId);
        
        if (!deletedJardin) {
            return res.status(404).json({
                message: "Jardín no encontrado"
            });
        }

        // Eliminar todas las memorias del jardín
        await Memoria.deleteMany({ garden: jardinId });

        // Actualizar stats del usuario
        await Usuario.findByIdAndUpdate(deletedJardin.owner, {
            $inc: { 'stats.totalGardens': -1 }
        });

        return res.status(200).json({
            message: "Jardín eliminado con éxito"
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error al eliminar jardín",
            error: error.message
        });
    }
});

// ============= RUTAS DE MEMORIAS =============

// Obtener memorias de un jardín
app.get('/api/memorias/jardin/:gardenId', async (req, res) => {
    try {
        const { gardenId } = req.params;
        
        const memorias = await Memoria.find({
            garden: gardenId,
            isActive: true
        }).sort({ eventDate: -1 });

        return res.status(200).json({
            message: "Memorias obtenidas con éxito",
            memorias: memorias
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error al consultar memorias",
            error: error.message
        });
    }
});

// Crear nueva memoria
app.post('/api/memorias', async (req, res) => {
    try {
        const memoriaData = req.body;

        if (!memoriaData.garden || !memoriaData.title || !memoriaData.memoryType) {
            return res.status(400).json({
                message: "Garden, title y memoryType son requeridos"
            });
        }

        const newMemoria = new Memoria(memoriaData);
        await newMemoria.save();

        // Actualizar contador en jardín
        await Jardin.findByIdAndUpdate(memoriaData.garden, {
            $inc: { 'stats.memoryCount': 1 }
        });

        return res.status(201).json({
            message: "Memoria creada con éxito",
            memoria: newMemoria
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error al crear memoria",
            error: error.message
        });
    }
});

// Actualizar memoria
app.put('/api/memorias/:memoriaId', async (req, res) => {
    try {
        const { memoriaId } = req.params;
        const updateData = req.body;

        const updatedMemoria = await Memoria.findByIdAndUpdate(
            memoriaId,
            updateData,
            { new: true }
        );

        if (!updatedMemoria) {
            return res.status(404).json({
                message: "Memoria no encontrada"
            });
        }

        return res.status(200).json({
            message: "Memoria actualizada con éxito",
            memoria: updatedMemoria
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error al actualizar memoria",
            error: error.message
        });
    }
});

// Eliminar memoria
app.delete('/api/memorias/:memoriaId', async (req, res) => {
    try {
        const { memoriaId } = req.params;
        
        const deletedMemoria = await Memoria.findByIdAndDelete(memoriaId);
        
        if (!deletedMemoria) {
            return res.status(404).json({
                message: "Memoria no encontrada"
            });
        }

        // Actualizar contador en jardín
        await Jardin.findByIdAndUpdate(deletedMemoria.garden, {
            $inc: { 'stats.memoryCount': -1 }
        });

        return res.status(200).json({
            message: "Memoria eliminada con éxito"
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error al eliminar memoria",
            error: error.message
        });
    }
});

// ============= RUTA HEALTH CHECK =============
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// ============= INICIALIZAR SERVIDOR =============
app.listen(PORT, () => {
    console.log(`🚀 Servidor HappiEty ejecutándose en:`);
    console.log(`- Local: http://localhost:${PORT}`);
    console.log(`- API Health: http://localhost:${PORT}/api/health`);
    console.log('✅ Listo para recibir peticiones');
});
