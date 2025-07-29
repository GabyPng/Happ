require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("✅ Conectado a MongoDB Atlas para seeding");
    console.log(`📊 Base de datos: ${mongoose.connection.name}`);
}) 
.catch(error => {
    console.log("❌ Error de conexión:", error.message);
    process.exit(1);
});

// Importar esquemas (copiados del index.js)
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

const jardinSchema = new mongoose.Schema({
    owner: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Usuario', 
        required: [true, 'Owner es requerido'] 
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

// Función para generar código de acceso
function generateAccessCode() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = Math.floor(1000 + Math.random() * 9000);
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    code += numbers;
    return code;
}

// Función principal para insertar datos
async function seedDatabase() {
    try {
        console.log("🌱 Iniciando seeding de la base de datos...");

        // Limpiar datos existentes (opcional)
        await Usuario.deleteMany({});
        await Jardin.deleteMany({});
        await Memoria.deleteMany({});
        console.log("🧹 Datos anteriores eliminados");

        // 1. Crear usuarios de prueba
        console.log("👥 Creando usuarios de prueba...");
        
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash("123456", salt);

        const usuarios = await Usuario.insertMany([
            {
                email: "test@happiety.com",
                passwordHash: passwordHash,
                displayName: "Usuario de Prueba",
                preferences: {
                    theme: "rosado",
                    notifications: true
                },
                stats: {
                    totalGardens: 0,
                    totalMemories: 0
                }
            },
            {
                email: "demo@happiety.com",
                passwordHash: passwordHash,
                displayName: "Demo User",
                preferences: {
                    theme: "azul",
                    notifications: true
                },
                stats: {
                    totalGardens: 0,
                    totalMemories: 0
                }
            }
        ]);

        console.log(`✅ ${usuarios.length} usuarios creados`);

        // 2. Crear jardines de prueba
        console.log("🌻 Creando jardines de prueba...");
        
        const jardines = await Jardin.insertMany([
            {
                owner: usuarios[0]._id,
                name: "Mi Primer Jardín",
                description: "Un jardín de prueba para explorar HappiEty",
                accessCode: generateAccessCode(),
                theme: {
                    name: "rosado",
                    primaryColor: "#FF0080",
                    secondaryColor: "#ffcffc"
                },
                stats: {
                    memoryCount: 0,
                    viewCount: 1
                }
            },
            {
                owner: usuarios[1]._id,
                name: "Jardín Familiar",
                description: "Recuerdos compartidos en familia",
                accessCode: generateAccessCode(),
                theme: {
                    name: "verde",
                    primaryColor: "#00FF80",
                    secondaryColor: "#ccffcc"
                },
                stats: {
                    memoryCount: 0,
                    viewCount: 0
                }
            }
        ]);

        console.log(`✅ ${jardines.length} jardines creados`);

        // 3. Crear memorias de prueba
        console.log("💭 Creando memorias de prueba...");
        
        const memorias = await Memoria.insertMany([
            {
                garden: jardines[0]._id,
                title: "Primera Memoria",
                description: "Esta es mi primera memoria en HappiEty",
                memoryType: "Text",
                content: "¡Bienvenido a HappiEty! Este es un texto de ejemplo para probar la funcionalidad.",
                emoji: "🌸",
                position: {
                    x: 25,
                    y: 25,
                    zIndex: 1
                },
                tags: ["bienvenida", "prueba"]
            },
            {
                garden: jardines[0]._id,
                title: "Recuerdo Especial",
                description: "Un momento que quiero recordar siempre",
                memoryType: "Text",
                content: "Los momentos especiales merecen ser recordados para siempre.",
                emoji: "💫",
                position: {
                    x: 60,
                    y: 40,
                    zIndex: 2
                },
                tags: ["especial", "momento"]
            },
            {
                garden: jardines[1]._id,
                title: "Memoria Familiar",
                description: "Un recuerdo compartido",
                memoryType: "Text",
                content: "Los recuerdos familiares son los más preciados.",
                emoji: "�",
                position: {
                    x: 30,
                    y: 50,
                    zIndex: 1
                },
                tags: ["familia", "amor"]
            }
        ]);

        console.log(`✅ ${memorias.length} memorias creadas`);

        // 4. Actualizar estadísticas
        console.log("📊 Actualizando estadísticas...");
        
        for (let jardin of jardines) {
            const memoryCount = await Memoria.countDocuments({ garden: jardin._id });
            await Jardin.findByIdAndUpdate(jardin._id, {
                'stats.memoryCount': memoryCount
            });
        }

        for (let usuario of usuarios) {
            const gardenCount = await Jardin.countDocuments({ owner: usuario._id });
            const totalMemories = await Memoria.countDocuments({
                garden: { $in: await Jardin.find({ owner: usuario._id }).distinct('_id') }
            });
            
            await Usuario.findByIdAndUpdate(usuario._id, {
                'stats.totalGardens': gardenCount,
                'stats.totalMemories': totalMemories
            });
        }

        console.log("✅ Estadísticas actualizadas");

        console.log("\n🎉 ¡Seeding completado exitosamente!");
        console.log("\n📊 Resumen de datos creados:");
        console.log(`   - Usuarios: ${usuarios.length}`);
        console.log(`   - Jardines: ${jardines.length}`);
        console.log(`   - Memorias: ${memorias.length}`);
        
        console.log("\n🔑 Credenciales de prueba:");
        console.log("   Email: test@happiety.com");
        console.log("   Password: 123456");
        console.log("\n   Email: demo@happiety.com");
        console.log("   Password: 123456");

        console.log(`\n🔗 Códigos de acceso a jardines:`);
        jardines.forEach((jardin, index) => {
            console.log(`   ${jardin.name}: ${jardin.accessCode}`);
        });

    } catch (error) {
        console.error("❌ Error durante el seeding:", error);
    } finally {
        mongoose.connection.close();
        console.log("\n🔌 Conexión cerrada");
    }
}

// Ejecutar seeding
seedDatabase();
