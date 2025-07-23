# 🗄️ Guía Completa de Base de Datos - HappiEty

Esta guía profundiza en toda la arquitectura de datos, modelos, relaciones y operaciones de la base de datos MongoDB de HappiEty.

## 📊 Arquitectura de Datos

### **Diagrama de Relaciones**
```
👤 USUARIOS (usuarios)
    ├── 🏡 JARDINES (jardines) - owner: ObjectId → usuarios._id
    │   ├── 💝 MEMORIAS (memories) - garden: ObjectId → jardines._id
    │   │   ├── 📝 TextMemory (discriminator: "Text")
    │   │   ├── 📷 ImageMemory (discriminator: "Image") 
    │   │   ├── 🎵 AudioMemory (discriminator: "Audio")
    │   │   ├── 🎬 VideoMemory (discriminator: "Video")
    │   │   └── 📍 LocationMemory (discriminator: "Location")
    │   └── 👥 MIEMBROS - members: [ObjectId] → usuarios._id
    └── 📈 ESTADÍSTICAS - stats: { totalGardens, totalMemories }
```

### **Colecciones en MongoDB**
- **`usuarios`** - Información de usuarios registrados
- **`jardines`** - Jardines de recuerdos (espacios principales)
- **`memories`** - Todas las memorias (usando discriminator pattern)

---

## 👤 Modelo Usuario (usuarios)

### **Schema Completo:**
```javascript
const usuarioSchema = new mongoose.Schema({
    // AUTENTICACIÓN
    email: {
        type: String,
        required: [true, 'Email es requerido'],
        unique: true,                    // Índice único en MongoDB
        lowercase: true,                 // Convertir a minúsculas automáticamente
        trim: true,                      // Eliminar espacios en blanco
        match: [                         // Validación con regex
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 
            'Email inválido'
        ]
    },
    passwordHash: {
        type: String,
        required: [true, 'Password es requerido'],
        minlength: [6, 'Password debe tener mínimo 6 caracteres']
        // NOTA: Se almacena hasheado con bcrypt, nunca en texto plano
    },
    
    // INFORMACIÓN PERSONAL
    displayName: {
        type: String,
        trim: true,
        maxlength: [50, 'Nombre no puede exceder 50 caracteres']
    },
    avatar: {
        type: String,                    // URL de la imagen de perfil
        default: null
    },
    
    // PREFERENCIAS DEL USUARIO
    preferences: {
        theme: {
            type: String,
            enum: ['rosado', 'azul', 'verde'],  // Solo estos valores permitidos
            default: 'rosado'
        },
        notifications: {
            type: Boolean,
            default: true                // Recibir notificaciones por defecto
        }
    },
    
    // ESTADÍSTICAS CALCULADAS
    stats: {
        totalGardens: {
            type: Number,
            default: 0                   // Se actualiza cuando se crean/eliminan jardines
        },
        totalMemories: {
            type: Number,
            default: 0                   // Se actualiza cuando se crean/eliminan memorias
        }
    },
    
    // METADATOS DE SESIÓN
    lastLogin: {
        type: Date,
        default: null                    // Se actualiza en cada login exitoso
    }
}, {
    timestamps: true,                    // Agrega createdAt y updatedAt automáticamente
    collection: 'usuarios'              // Nombre específico de la colección
});
```

### **Índices de Optimización:**
```javascript
// Búsqueda rápida por email (login más común)
usuarioSchema.index({ email: 1 }, { unique: true });

// Listado de usuarios por fecha de registro
usuarioSchema.index({ createdAt: -1 });

// Búsqueda por nombre (opcional, para admin)
usuarioSchema.index({ displayName: 1 });
```

### **Middleware de Seguridad:**
```javascript
// PRE-SAVE: Hashear contraseña antes de guardar
usuarioSchema.pre('save', async function(next) {
    // Solo hashear si el password fue modificado (nuevo o cambiado)
    if (!this.isModified('passwordHash')) return next();
    
    try {
        // Generar salt con complejidad 12 (recomendado para 2024)
        const salt = await bcrypt.genSalt(12);
        
        // Hashear la contraseña con el salt
        this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
        
        console.log('🔐 Password hasheado exitosamente');
        next();
    } catch (error) {
        console.error('❌ Error hasheando password:', error);
        next(error);
    }
});

// PRE-REMOVE: Limpiar datos relacionados cuando se elimina usuario
usuarioSchema.pre('remove', async function(next) {
    try {
        // Eliminar todos los jardines del usuario
        await mongoose.model('Jardin').deleteMany({ owner: this._id });
        
        // Remover usuario de jardines donde era miembro
        await mongoose.model('Jardin').updateMany(
            { members: this._id },
            { $pull: { members: this._id } }
        );
        
        console.log('🧹 Datos relacionados limpiados');
        next();
    } catch (error) {
        next(error);
    }
});
```

### **Métodos de Instancia:**
```javascript
// Comparar contraseña ingresada con hash almacenado
usuarioSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.passwordHash);
    } catch (error) {
        console.error('❌ Error comparando passwords:', error);
        return false;
    }
};

// Retornar objeto seguro (sin datos sensibles)
usuarioSchema.methods.toSafeObject = function() {
    const { passwordHash, __v, ...safeUser } = this.toObject();
    return safeUser;
};

// Actualizar última conexión
usuarioSchema.methods.updateLastLogin = function() {
    this.lastLogin = new Date();
    return this.save();
};

// Cambiar tema preferido
usuarioSchema.methods.updateTheme = function(newTheme) {
    if (['rosado', 'azul', 'verde'].includes(newTheme)) {
        this.preferences.theme = newTheme;
        return this.save();
    }
    throw new Error('Tema inválido');
};
```

### **Métodos Estáticos:**
```javascript
// Buscar usuario por email (case insensitive)
usuarioSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

// Actualizar estadísticas de usuario
usuarioSchema.statics.updateStats = async function(userId, jardinesCount, memoriesCount) {
    return this.findByIdAndUpdate(
        userId,
        { 
            'stats.totalGardens': jardinesCount,
            'stats.totalMemories': memoriesCount
        },
        { new: true, runValidators: true }
    );
};

// Buscar usuarios por patrón de nombre
usuarioSchema.statics.searchByName = function(searchTerm) {
    return this.find({
        displayName: { $regex: searchTerm, $options: 'i' }
    }).limit(20);
};

// Obtener usuarios más activos
usuarioSchema.statics.getMostActive = function(limit = 10) {
    return this.find()
        .sort({ 'stats.totalMemories': -1, lastLogin: -1 })
        .limit(limit)
        .select('displayName stats lastLogin');
};
```

---

## 🏡 Modelo Jardín (jardines)

### **Schema Detallado:**
```javascript
const jardinSchema = new mongoose.Schema({
    // PROPIEDAD Y ACCESO
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',                  // Relación con colección usuarios
        required: [true, 'Propietario es requerido'],
        index: true                      // Índice para búsquedas rápidas
    },
    
    // IDENTIFICACIÓN ÚNICA
    accessCode: {
        type: String,
        required: true,
        unique: true,                    // Código único en toda la BD
        uppercase: true,                 // Siempre mayúsculas
        length: 8,                       // Exactamente 8 caracteres
        match: [/^[A-Z]{4}[0-9]{4}$/, 'Código debe tener formato LOVE1234']
    },
    
    // INFORMACIÓN BÁSICA
    name: {
        type: String,
        required: [true, 'Nombre del jardín es requerido'],
        trim: true,
        minlength: [3, 'Nombre debe tener mínimo 3 caracteres'],
        maxlength: [100, 'Nombre no puede exceder 100 caracteres']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Descripción no puede exceder 500 caracteres'],
        default: ''
    },
    
    // COLABORADORES Y PERMISOS
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'                   // Usuarios que pueden agregar memorias
    }],
    isPrivate: {
        type: Boolean,
        default: true                    // Por defecto los jardines son privados
    },
    permissions: {
        allowGuestView: {                // Permitir ver sin código
            type: Boolean,
            default: false
        },
        allowMemberAdd: {                // Miembros pueden agregar memorias
            type: Boolean,
            default: true
        },
        moderateContent: {               // Moderar contenido antes de mostrar
            type: Boolean,
            default: false
        }
    },
    
    // PERSONALIZACIÓN VISUAL
    theme: {
        name: {
            type: String,
            enum: ['rosado', 'azul', 'verde', 'custom'],
            default: 'rosado'
        },
        primaryColor: {
            type: String,
            default: '#FF0080',
            match: [/^#[A-Fa-f0-9]{6}$/, 'Color debe ser hexadecimal válido']
        },
        secondaryColor: {
            type: String,
            default: '#ffcffc',
            match: [/^#[A-Fa-f0-9]{6}$/, 'Color debe ser hexadecimal válido']
        },
        backgroundImage: {
            type: String,                // URL de imagen de fondo personalizada
            default: null
        },
        musicUrl: {
            type: String,                // URL de música ambiente
            default: null
        },
        font: {
            type: String,
            enum: ['default', 'elegant', 'playful', 'modern'],
            default: 'default'
        }
    },
    
    // ESTADÍSTICAS Y MÉTRICAS
    stats: {
        memoryCount: {
            type: Number,
            default: 0,
            min: 0
        },
        lastAccessed: {
            type: Date,
            default: Date.now
        },
        viewCount: {
            type: Number,
            default: 0,
            min: 0
        },
        likeCount: {                     // Para futuro sistema de likes
            type: Number,
            default: 0,
            min: 0
        },
        shareCount: {                    // Cuántas veces se ha compartido
            type: Number,
            default: 0,
            min: 0
        }
    },
    
    // RELACIONES
    memories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Memory'                    // Array de referencias a memorias
    }],
    
    // METADATOS ADICIONALES
    tags: [{                             // Etiquetas para categorización
        type: String,
        trim: true,
        maxlength: 30
    }],
    category: {                          // Categoría del jardín
        type: String,
        enum: ['familia', 'pareja', 'amistad', 'viajes', 'logros', 'mascotas', 'otro'],
        default: 'otro'
    },
    isArchived: {                        // Jardines archivados (no eliminados)
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,                    // createdAt y updatedAt automáticos
    collection: 'jardines'
});
```

### **Índices Estratégicos:**
```javascript
// ÍNDICES ÚNICOS
jardinSchema.index({ accessCode: 1 }, { unique: true });

// ÍNDICES DE BÚSQUEDA FRECUENTE
jardinSchema.index({ owner: 1, createdAt: -1 });      // Jardines de un usuario
jardinSchema.index({ members: 1 });                    // Jardines donde es miembro
jardinSchema.index({ isPrivate: 1, isArchived: 1 });   // Jardines públicos activos

// ÍNDICES DE ORDENAMIENTO
jardinSchema.index({ 'stats.lastAccessed': -1 });      // Jardines más activos
jardinSchema.index({ 'stats.viewCount': -1 });         // Jardines más visitados
jardinSchema.index({ 'stats.memoryCount': -1 });       // Jardines con más memorias

// ÍNDICES COMPUESTOS
jardinSchema.index({ 
    owner: 1, 
    isArchived: 1, 
    createdAt: -1 
});  // Jardines activos de usuario

jardinSchema.index({ 
    category: 1, 
    isPrivate: 1, 
    'stats.viewCount': -1 
});  // Jardines públicos por categoría
```

### **Middleware Avanzado:**
```javascript
// PRE-SAVE: Generar código único y actualizar stats
jardinSchema.pre('save', async function(next) {
    try {
        // Generar código de acceso si es nuevo jardín
        if (this.isNew && !this.accessCode) {
            this.accessCode = await this.constructor.generateUniqueAccessCode();
        }
        
        // Actualizar contador de memorias
        if (this.isModified('memories')) {
            this.stats.memoryCount = this.memories.length;
        }
        
        // Validar que el owner no esté en members
        if (this.members.includes(this.owner)) {
            this.members = this.members.filter(id => !id.equals(this.owner));
        }
        
        next();
    } catch (error) {
        next(error);
    }
});

// POST-SAVE: Actualizar estadísticas del usuario
jardinSchema.post('save', async function(doc) {
    try {
        const jardinesCount = await this.constructor.countDocuments({ 
            owner: doc.owner,
            isArchived: false 
        });
        
        const memoriasCount = await mongoose.model('Memory').countDocuments({
            garden: { $in: await this.constructor.find({ owner: doc.owner }).distinct('_id') }
        });
        
        await mongoose.model('Usuario').updateStats(doc.owner, jardinesCount, memoriasCount);
    } catch (error) {
        console.error('Error actualizando stats de usuario:', error);
    }
});

// PRE-REMOVE: Limpiar memorias relacionadas
jardinSchema.pre('remove', async function(next) {
    try {
        // Eliminar todas las memorias del jardín
        await mongoose.model('Memory').deleteMany({ garden: this._id });
        console.log(`🗑️ Eliminadas memorias del jardín ${this.accessCode}`);
        next();
    } catch (error) {
        next(error);
    }
});
```

### **Métodos Estáticos Avanzados:**
```javascript
// Generar código único con tema de amor
jardinSchema.statics.generateUniqueAccessCode = async function() {
    const loveWords = ['LOVE', 'HEART', 'DEAR', 'SOUL', 'KISS', 'HAPP', 'JOY'];
    let attempts = 0;
    const maxAttempts = 100;
    
    while (attempts < maxAttempts) {
        // Seleccionar palabra aleatoria + 4 dígitos
        const word = loveWords[Math.floor(Math.random() * loveWords.length)];
        const numbers = Math.floor(1000 + Math.random() * 9000);
        const code = word + numbers;
        
        // Verificar unicidad
        const exists = await this.findOne({ accessCode: code });
        if (!exists) {
            return code;
        }
        
        attempts++;
    }
    
    // Fallback: usar timestamp si no se encuentra código único
    return 'HAPP' + Date.now().toString().slice(-4);
};

// Buscar jardín por código (con estadísticas)
jardinSchema.statics.findByAccessCode = function(accessCode) {
    return this.findOne({ 
        accessCode: accessCode.toUpperCase(),
        isArchived: false 
    });
};

// Jardines populares (públicos con más vistas)
jardinSchema.statics.getPopular = function(limit = 10) {
    return this.find({ 
        isPrivate: false, 
        isArchived: false 
    })
    .sort({ 'stats.viewCount': -1, 'stats.memoryCount': -1 })
    .limit(limit)
    .populate('owner', 'displayName avatar')
    .select('name description theme stats accessCode');
};

// Jardines recientes públicos
jardinSchema.statics.getRecent = function(limit = 10) {
    return this.find({ 
        isPrivate: false, 
        isArchived: false 
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('owner', 'displayName avatar');
};

// Estadísticas globales
jardinSchema.statics.getGlobalStats = async function() {
    const stats = await this.aggregate([
        { $match: { isArchived: false } },
        {
            $group: {
                _id: null,
                totalGardins: { $sum: 1 },
                totalMemories: { $sum: '$stats.memoryCount' },
                totalViews: { $sum: '$stats.viewCount' },
                avgMemoriesPerGarden: { $avg: '$stats.memoryCount' },
                publicGardens: {
                    $sum: { $cond: [{ $eq: ['$isPrivate', false] }, 1, 0] }
                }
            }
        }
    ]);
    
    return stats[0] || {};
};
```

### **Métodos de Instancia Avanzados:**
```javascript
// Agregar miembro con validaciones
jardinSchema.methods.addMember = async function(userId, permissions = {}) {
    // Validar que el usuario existe
    const user = await mongoose.model('Usuario').findById(userId);
    if (!user) {
        throw new Error('Usuario no encontrado');
    }
    
    // Validar que no sea el owner
    if (this.owner.equals(userId)) {
        throw new Error('El propietario no puede ser miembro');
    }
    
    // Agregar si no está ya
    if (!this.members.includes(userId)) {
        this.members.push(userId);
        console.log(`👥 ${user.displayName} agregado como miembro de ${this.name}`);
    }
    
    return this.save();
};

// Remover miembro
jardinSchema.methods.removeMember = async function(userId) {
    const initialLength = this.members.length;
    this.members = this.members.filter(id => !id.equals(userId));
    
    if (this.members.length < initialLength) {
        console.log(`👥 Miembro removido del jardín ${this.name}`);
        return this.save();
    }
    
    return this;
};

// Actualizar estadísticas con métricas avanzadas
jardinSchema.methods.updateStats = async function(incrementView = true) {
    // Contar memorias reales
    this.stats.memoryCount = await mongoose.model('Memory').countDocuments({
        garden: this._id,
        isActive: true
    });
    
    // Actualizar última vista
    this.stats.lastAccessed = new Date();
    
    // Incrementar contador de vistas
    if (incrementView) {
        this.stats.viewCount += 1;
    }
    
    return this.save();
};

// Cambiar tema con validación
jardinSchema.methods.updateTheme = function(themeData) {
    const allowedThemes = ['rosado', 'azul', 'verde', 'custom'];
    
    if (themeData.name && allowedThemes.includes(themeData.name)) {
        this.theme.name = themeData.name;
    }
    
    if (themeData.primaryColor && /^#[A-Fa-f0-9]{6}$/.test(themeData.primaryColor)) {
        this.theme.primaryColor = themeData.primaryColor;
    }
    
    if (themeData.secondaryColor && /^#[A-Fa-f0-9]{6}$/.test(themeData.secondaryColor)) {
        this.theme.secondaryColor = themeData.secondaryColor;
    }
    
    return this.save();
};

// Archivar jardín (soft delete)
jardinSchema.methods.archive = function(reason = '') {
    this.isArchived = true;
    this.archivedAt = new Date();
    this.archiveReason = reason;
    
    console.log(`📦 Jardín ${this.accessCode} archivado`);
    return this.save();
};

// Restaurar jardín archivado
jardinSchema.methods.restore = function() {
    this.isArchived = false;
    this.archivedAt = undefined;
    this.archiveReason = undefined;
    
    console.log(`📦 Jardín ${this.accessCode} restaurado`);
    return this.save();
};
```

---

## 💝 Modelo Memorias (memories) - Patrón Discriminator

### **Schema Base Detallado:**
```javascript
const baseMemorySchema = new mongoose.Schema({
    // RELACIÓN PRINCIPAL
    garden: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Jardin',
        required: [true, 'El jardín es requerido'],
        index: true
    },
    
    // IDENTIFICACIÓN Y METADATOS
    title: {
        type: String,
        required: [true, 'El título es requerido'],
        trim: true,
        minlength: [1, 'Título no puede estar vacío'],
        maxlength: [200, 'El título no puede exceder 200 caracteres']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'La descripción no puede exceder 1000 caracteres'],
        default: ''
    },
    
    // FECHAS Y TIEMPO
    eventDate: {
        type: Date,
        required: [true, 'La fecha del evento es requerida'],
        default: Date.now,
        validate: {
            validator: function(date) {
                return date <= new Date();  // No puede ser fecha futura
            },
            message: 'La fecha del evento no puede ser futura'
        }
    },
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true                  // No se puede modificar después de crear
    },
    modifiedDate: {
        type: Date,
        default: Date.now
    },
    
    // ESTADO Y VISIBILIDAD
    isActive: {
        type: Boolean,
        default: true                    // Soft delete
    },
    isPrivate: {
        type: Boolean,
        default: false                   // Privada dentro del jardín
    },
    isPinned: {
        type: Boolean,
        default: false                   // Destacada en el jardín
    },
    
    // CLASIFICACIÓN Y BÚSQUEDA
    tags: [{
        type: String,
        trim: true,
        lowercase: true,
        maxlength: [50, 'Cada tag no puede exceder 50 caracteres']
    }],
    category: {
        type: String,
        enum: ['recuerdo', 'celebracion', 'viaje', 'logro', 'familia', 'amistad', 'otro'],
        default: 'recuerdo'
    },
    mood: {                             // Estado emocional asociado
        type: String,
        enum: ['feliz', 'triste', 'emocionado', 'nostalgico', 'agradecido', 'amoroso', 'otro'],
        default: 'feliz'
    },
    
    // POSICIONAMIENTO EN EL JARDÍN VISUAL
    position: {
        x: {
            type: Number,
            default: () => Math.floor(Math.random() * 400) + 50,  // Posición aleatoria
            min: 0,
            max: 1000
        },
        y: {
            type: Number,
            default: () => Math.floor(Math.random() * 300) + 50,
            min: 0,
            max: 800
        },
        zIndex: {
            type: Number,
            default: 1,
            min: 1,
            max: 1000
        }
    },
    
    // INTERACCIONES Y MÉTRICAS
    stats: {
        viewCount: {
            type: Number,
            default: 0,
            min: 0
        },
        likeCount: {                    // Para futuro sistema de likes
            type: Number,
            default: 0,
            min: 0
        },
        commentCount: {                 // Para futuro sistema de comentarios
            type: Number,
            default: 0,
            min: 0
        }
    },
    
    // INFORMACIÓN DEL CREADOR
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        index: true
    },
    lastEditedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
    }
}, {
    discriminatorKey: 'memoryType',      // Campo que identifica el subtipo
    collection: 'memories',             // Todas las memorias en la misma colección
    timestamps: { 
        createdAt: false,               // Usar nuestro campo personalizado
        updatedAt: 'modifiedDate'       // Mapear updatedAt a modifiedDate
    }
});
```

### **Índices de Memorias:**
```javascript
// ÍNDICES BÁSICOS
baseMemorySchema.index({ garden: 1, eventDate: -1 });          // Memorias de jardín por fecha
baseMemorySchema.index({ memoryType: 1 });                     // Por tipo de memoria
baseMemorySchema.index({ garden: 1, isActive: 1 });            // Memorias activas de jardín

// ÍNDICES DE BÚSQUEDA
baseMemorySchema.index({ garden: 1, tags: 1 });                // Búsqueda por tags
baseMemorySchema.index({ garden: 1, category: 1 });            // Por categoría
baseMemorySchema.index({ garden: 1, mood: 1 });                // Por estado emocional

// ÍNDICES DE POSICIONAMIENTO
baseMemorySchema.index({ garden: 1, 'position.zIndex': -1 });  // Orden visual
baseMemorySchema.index({ garden: 1, isPinned: -1 });           // Memorias destacadas

// ÍNDICES DE ESTADÍSTICAS
baseMemorySchema.index({ 'stats.viewCount': -1 });             // Memorias más vistas
baseMemorySchema.index({ createdBy: 1, createdAt: -1 });       // Memorias por usuario
```

### **Middleware de Memorias:**
```javascript
// PRE-SAVE: Validaciones y actualizaciones automáticas
baseMemorySchema.pre('save', async function(next) {
    try {
        // Actualizar fecha de modificación
        if (this.isModified() && !this.isNew) {
            this.modifiedDate = new Date();
        }
        
        // Normalizar tags (minúsculas, sin duplicados)
        if (this.isModified('tags')) {
            this.tags = [...new Set(this.tags.map(tag => tag.toLowerCase()))];
        }
        
        // Validar que el jardín existe
        if (this.isModified('garden') || this.isNew) {
            const garden = await mongoose.model('Jardin').findById(this.garden);
            if (!garden) {
                throw new Error('Jardín no encontrado');
            }
        }
        
        next();
    } catch (error) {
        next(error);
    }
});

// POST-SAVE: Actualizar referencias en jardín
baseMemorySchema.post('save', async function(doc) {
    try {
        // Agregar referencia al jardín si es nueva memoria
        if (doc.isNew) {
            await mongoose.model('Jardin').findByIdAndUpdate(
                doc.garden,
                { 
                    $addToSet: { memories: doc._id },
                    $inc: { 'stats.memoryCount': 1 }
                }
            );
        }
    } catch (error) {
        console.error('Error actualizando jardín:', error);
    }
});

// PRE-REMOVE: Limpiar referencias
baseMemorySchema.pre('remove', async function(next) {
    try {
        // Remover referencia del jardín
        await mongoose.model('Jardin').findByIdAndUpdate(
            this.garden,
            { 
                $pull: { memories: this._id },
                $inc: { 'stats.memoryCount': -1 }
            }
        );
        
        next();
    } catch (error) {
        next(error);
    }
});
```

### **Discriminadores Específicos:**

#### **📝 TextMemory - Memorias de Texto**
```javascript
const textSchema = new mongoose.Schema({
    content: {
        type: String,
        required: [true, 'Contenido de texto es requerido'],
        trim: true,
        minlength: [1, 'Contenido no puede estar vacío'],
        maxlength: [5000, 'Contenido no puede exceder 5000 caracteres']
    },
    emoji: {
        type: String,
        maxlength: [10, 'Emoji no puede exceder 10 caracteres'],
        default: '📝'
    },
    textStyle: {
        fontSize: {
            type: String,
            enum: ['small', 'medium', 'large'],
            default: 'medium'
        },
        fontWeight: {
            type: String,
            enum: ['normal', 'bold'],
            default: 'normal'
        },
        color: {
            type: String,
            default: '#333333',
            match: [/^#[A-Fa-f0-9]{6}$/, 'Color debe ser hexadecimal válido']
        },
        backgroundColor: {
            type: String,
            default: '#ffffff',
            match: [/^#[A-Fa-f0-9]{6}$/, 'Color debe ser hexadecimal válido']
        }
    },
    wordCount: {
        type: Number,
        default: 0                      // Se calcula automáticamente
    }
});

// Middleware para calcular palabras
textSchema.pre('save', function(next) {
    if (this.isModified('content')) {
        this.wordCount = this.content.split(/\s+/).filter(word => word.length > 0).length;
    }
    next();
});

const TextMemory = Memory.discriminator('Text', textSchema);
```

#### **📷 ImageMemory - Memorias de Imagen**
```javascript
const imageSchema = new mongoose.Schema({
    filePath: {
        type: String,
        required: [true, 'Ruta de archivo es requerida'],
        validate: {
            validator: function(path) {
                return /\.(jpg|jpeg|png|gif|webp)$/i.test(path);
            },
            message: 'Archivo debe ser una imagen válida'
        }
    },
    fileSize: {
        type: Number,
        required: true,
        min: [0, 'Tamaño no puede ser negativo'],
        max: [50 * 1024 * 1024, 'Imagen no puede exceder 50MB']  // 50MB máximo
    },
    mimeType: {
        type: String,
        required: true,
        enum: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        default: 'image/jpeg'
    },
    dimensions: {
        width: {
            type: Number,
            required: true,
            min: 1
        },
        height: {
            type: Number,
            required: true,
            min: 1
        }
    },
    altText: {                          // Texto alternativo para accesibilidad
        type: String,
        maxlength: [200, 'Texto alternativo no puede exceder 200 caracteres']
    },
    thumbnailPath: {                    // Versión pequeña para preview
        type: String
    },
    filters: {                          // Filtros aplicados a la imagen
        brightness: { type: Number, default: 100, min: 0, max: 200 },
        contrast: { type: Number, default: 100, min: 0, max: 200 },
        saturation: { type: Number, default: 100, min: 0, max: 200 },
        blur: { type: Number, default: 0, min: 0, max: 100 }
    },
    exifData: {                         // Metadatos de la cámara
        camera: String,
        lens: String,
        location: {
            lat: Number,
            lng: Number
        },
        timestamp: Date
    }
});

const ImageMemory = Memory.discriminator('Image', imageSchema);
```

#### **🎵 AudioMemory - Memorias de Audio**
```javascript
const audioSchema = new mongoose.Schema({
    filePath: {
        type: String,
        required: [true, 'Ruta de archivo es requerida'],
        validate: {
            validator: function(path) {
                return /\.(mp3|wav|ogg|m4a|flac)$/i.test(path);
            },
            message: 'Archivo debe ser audio válido'
        }
    },
    fileSize: {
        type: Number,
        required: true,
        min: [0, 'Tamaño no puede ser negativo'],
        max: [100 * 1024 * 1024, 'Audio no puede exceder 100MB']  // 100MB máximo
    },
    mimeType: {
        type: String,
        required: true,
        enum: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/flac'],
        default: 'audio/mpeg'
    },
    duration: {                         // Duración en segundos
        type: Number,
        required: true,
        min: [0, 'Duración no puede ser negativa'],
        max: [7200, 'Audio no puede exceder 2 horas']  // 2 horas máximo
    },
    metadata: {
        title: String,                  // Título de la canción
        artist: String,                 // Artista
        album: String,                  // Álbum
        year: Number,                   // Año
        genre: String,                  // Género musical
        bitrate: Number                 // Calidad de audio
    },
    waveform: {                         // Datos de visualización de ondas
        type: [Number],                 // Array de amplitudes
        default: []
    },
    playbackSettings: {
        autoplay: { type: Boolean, default: false },
        loop: { type: Boolean, default: false },
        volume: { type: Number, default: 0.7, min: 0, max: 1 }
    }
});

const AudioMemory = Memory.discriminator('Audio', audioSchema);
```

#### **🎬 VideoMemory - Memorias de Video**
```javascript
const videoSchema = new mongoose.Schema({
    filePath: {
        type: String,
        required: [true, 'Ruta de archivo es requerida'],
        validate: {
            validator: function(path) {
                return /\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i.test(path);
            },
            message: 'Archivo debe ser video válido'
        }
    },
    fileSize: {
        type: Number,
        required: true,
        min: [0, 'Tamaño no puede ser negativo'],
        max: [500 * 1024 * 1024, 'Video no puede exceder 500MB']  // 500MB máximo
    },
    mimeType: {
        type: String,
        required: true,
        enum: ['video/mp4', 'video/avi', 'video/quicktime', 'video/webm'],
        default: 'video/mp4'
    },
    duration: {                         // Duración en segundos
        type: Number,
        required: true,
        min: [0, 'Duración no puede ser negativa'],
        max: [3600, 'Video no puede exceder 1 hora']  // 1 hora máximo
    },
    dimensions: {
        width: {
            type: Number,
            required: true,
            min: 1
        },
        height: {
            type: Number,
            required: true,
            min: 1
        }
    },
    thumbnailPath: {                    // Frame de preview
        type: String,
        required: true
    },
    videoSettings: {
        quality: {
            type: String,
            enum: ['360p', '480p', '720p', '1080p', '4K'],
            default: '720p'
        },
        fps: {                          // Frames por segundo
            type: Number,
            default: 30,
            min: 1,
            max: 120
        },
        codec: {
            type: String,
            default: 'H.264'
        }
    },
    playbackSettings: {
        autoplay: { type: Boolean, default: false },
        controls: { type: Boolean, default: true },
        muted: { type: Boolean, default: false },
        volume: { type: Number, default: 0.7, min: 0, max: 1 }
    }
});

const VideoMemory = Memory.discriminator('Video', videoSchema);
```

#### **📍 LocationMemory - Memorias de Ubicación**
```javascript
const locationSchema = new mongoose.Schema({
    coordinates: {
        lat: {
            type: Number,
            required: [true, 'Latitud es requerida'],
            min: [-90, 'Latitud debe estar entre -90 y 90'],
            max: [90, 'Latitud debe estar entre -90 y 90']
        },
        lng: {
            type: Number,
            required: [true, 'Longitud es requerida'],
            min: [-180, 'Longitud debe estar entre -180 y 180'],
            max: [180, 'Longitud debe estar entre -180 y 180']
        }
    },
    address: {
        formatted: String,              // Dirección completa formateada
        street: String,                 // Calle y número
        city: String,                   // Ciudad
        state: String,                  // Estado/Provincia
        country: String,                // País
        postalCode: String              // Código postal
    },
    locationName: {                     // Nombre del lugar
        type: String,
        maxlength: [200, 'Nombre no puede exceder 200 caracteres']
    },
    placeType: {                        // Tipo de lugar
        type: String,
        enum: ['restaurant', 'park', 'home', 'school', 'work', 'hospital', 'beach', 'mountain', 'city', 'landmark', 'other'],
        default: 'other'
    },
    mapSettings: {
        zoom: {
            type: Number,
            default: 15,
            min: 1,
            max: 20
        },
        mapType: {
            type: String,
            enum: ['roadmap', 'satellite', 'hybrid', 'terrain'],
            default: 'roadmap'
        },
        showMarker: { type: Boolean, default: true },
        markerColor: { type: String, default: '#FF0080' }
    },
    weather: {                          // Información del clima (opcional)
        temperature: Number,
        condition: String,              // 'sunny', 'rainy', 'cloudy', etc.
        humidity: Number,
        windSpeed: Number,
        recordedAt: Date
    },
    radius: {                           // Radio de precisión en metros
        type: Number,
        default: 100,
        min: 1,
        max: 10000
    }
});

// Índice geoespacial para búsquedas por proximidad
locationSchema.index({ coordinates: '2dsphere' });

const LocationMemory = Memory.discriminator('Location', locationSchema);
```

---

## 🔧 Operaciones de Base de Datos

### **Queries Complejas:**

#### **Búsqueda Avanzada de Memorias:**
```javascript
// Buscar memorias por múltiples criterios
async function searchMemories(gardenId, filters) {
    const query = {
        garden: mongoose.Types.ObjectId(gardenId),
        isActive: true
    };
    
    // Filtro por tipo
    if (filters.type) {
        query.memoryType = filters.type;
    }
    
    // Filtro por rango de fechas
    if (filters.dateFrom || filters.dateTo) {
        query.eventDate = {};
        if (filters.dateFrom) query.eventDate.$gte = new Date(filters.dateFrom);
        if (filters.dateTo) query.eventDate.$lte = new Date(filters.dateTo);
    }
    
    // Filtro por tags
    if (filters.tags && filters.tags.length > 0) {
        query.tags = { $in: filters.tags };
    }
    
    // Filtro por categoría
    if (filters.category) {
        query.category = filters.category;
    }
    
    // Filtro por estado emocional
    if (filters.mood) {
        query.mood = filters.mood;
    }
    
    // Búsqueda de texto en título y descripción
    if (filters.search) {
        query.$or = [
            { title: { $regex: filters.search, $options: 'i' } },
            { description: { $regex: filters.search, $options: 'i' } }
        ];
    }
    
    return await Memory.find(query)
        .sort({ eventDate: -1 })
        .limit(filters.limit || 20)
        .skip(filters.offset || 0);
}
```

#### **Agregaciones de Estadísticas:**
```javascript
// Estadísticas detalladas de un jardín
async function getGardenStats(gardenId) {
    const [memoryStats] = await Memory.aggregate([
        { $match: { garden: mongoose.Types.ObjectId(gardenId), isActive: true } },
        {
            $group: {
                _id: null,
                totalMemories: { $sum: 1 },
                memoryTypes: {
                    $push: '$memoryType'
                },
                avgViews: { $avg: '$stats.viewCount' },
                totalViews: { $sum: '$stats.viewCount' },
                dateRange: {
                    oldest: { $min: '$eventDate' },
                    newest: { $max: '$eventDate' }
                },
                categories: { $push: '$category' },
                moods: { $push: '$mood' }
            }
        },
        {
            $project: {
                totalMemories: 1,
                avgViews: { $round: ['$avgViews', 2] },
                totalViews: 1,
                dateRange: 1,
                typeDistribution: {
                    $reduce: {
                        input: '$memoryTypes',
                        initialValue: {},
                        in: {
                            $mergeObjects: [
                                '$$value',
                                { $arrayToObject: [{ k: '$$this', v: { $add: [1, { $ifNull: [{ $getProperty: ['$$value', '$$this'] }, 0] }] } }] }
                            ]
                        }
                    }
                },
                categoryDistribution: {
                    $reduce: {
                        input: '$categories',
                        initialValue: {},
                        in: {
                            $mergeObjects: [
                                '$$value',
                                { $arrayToObject: [{ k: '$$this', v: { $add: [1, { $ifNull: [{ $getProperty: ['$$value', '$$this'] }, 0] }] } }] }
                            ]
                        }
                    }
                },
                moodDistribution: {
                    $reduce: {
                        input: '$moods',
                        initialValue: {},
                        in: {
                            $mergeObjects: [
                                '$$value',
                                { $arrayToObject: [{ k: '$$this', v: { $add: [1, { $ifNull: [{ $getProperty: ['$$value', '$$this'] }, 0] }] } }] }
                            ]
                        }
                    }
                }
            }
        }
    ]);
    
    return memoryStats || {};
}
```

#### **Búsqueda Geoespacial:**
```javascript
// Buscar memorias de ubicación cerca de un punto
async function findNearbyLocationMemories(lat, lng, maxDistance = 1000) {
    return await LocationMemory.find({
        coordinates: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [lng, lat]  // [longitud, latitud] - orden importante
                },
                $maxDistance: maxDistance  // En metros
            }
        },
        isActive: true
    }).populate('garden', 'name accessCode');
}
```

### **Optimizaciones de Performance:**

#### **Populate Selectivo:**
```javascript
// Cargar jardín con memorias optimizado
async function loadGardenWithMemories(accessCode) {
    return await Jardin.findByAccessCode(accessCode)
        .populate({
            path: 'owner',
            select: 'displayName avatar'  // Solo campos necesarios
        })
        .populate({
            path: 'members',
            select: 'displayName avatar'
        })
        .populate({
            path: 'memories',
            match: { isActive: true },     // Solo memorias activas
            select: 'title memoryType eventDate position stats',  // Campos básicos
            options: { 
                sort: { eventDate: -1 },
                limit: 50                  // Máximo 50 memorias
            }
        });
}
```

#### **Paginación Eficiente:**
```javascript
// Paginación usando cursor en lugar de skip
async function getMemoriesPaginated(gardenId, cursor = null, limit = 20) {
    const query = {
        garden: mongoose.Types.ObjectId(gardenId),
        isActive: true
    };
    
    // Si hay cursor, buscar desde ese punto
    if (cursor) {
        query._id = { $lt: mongoose.Types.ObjectId(cursor) };
    }
    
    const memories = await Memory.find(query)
        .sort({ _id: -1 })              // Orden por _id es más eficiente
        .limit(limit + 1);              // +1 para saber si hay más
    
    const hasMore = memories.length > limit;
    if (hasMore) memories.pop();       // Remover el extra
    
    return {
        memories,
        hasMore,
        nextCursor: memories.length > 0 ? memories[memories.length - 1]._id : null
    };
}
```

---

## 🚀 Factory Methods y Utilidades

### **Factory Methods Avanzados:**
```javascript
// Factory para crear diferentes tipos de memorias
class MemoryFactory {
    
    static async createTextMemory(gardenId, data, userId) {
        const memory = new TextMemory({
            garden: gardenId,
            memoryType: 'Text',
            createdBy: userId,
            ...data
        });
        
        // Generar emoji automático basado en contenido
        if (!data.emoji) {
            memory.emoji = this.generateEmojiFromText(data.content);
        }
        
        return await memory.save();
    }
    
    static async createImageMemory(gardenId, data, userId) {
        const memory = new ImageMemory({
            garden: gardenId,
            memoryType: 'Image',
            createdBy: userId,
            ...data
        });
        
        // Generar texto alternativo si no se proporciona
        if (!data.altText) {
            memory.altText = `Imagen: ${data.title}`;
        }
        
        return await memory.save();
    }
    
    static async createLocationMemory(gardenId, data, userId) {
        const memory = new LocationMemory({
            garden: gardenId,
            memoryType: 'Location',
            createdBy: userId,
            ...data
        });
        
        // Obtener información de la dirección usando API externa
        if (!data.address && data.coordinates) {
            memory.address = await this.reverseGeocode(data.coordinates);
        }
        
        return await memory.save();
    }
    
    // Utilidades
    static generateEmojiFromText(text) {
        const lowerText = text.toLowerCase();
        
        if (lowerText.includes('amor') || lowerText.includes('quiero')) return '❤️';
        if (lowerText.includes('feliz') || lowerText.includes('alegr')) return '😊';
        if (lowerText.includes('triste') || lowerText.includes('llorar')) return '😢';
        if (lowerText.includes('graduación') || lowerText.includes('título')) return '🎓';
        if (lowerText.includes('viaje') || lowerText.includes('vacaciones')) return '✈️';
        if (lowerText.includes('cumpleaños') || lowerText.includes('celebr')) return '🎉';
        if (lowerText.includes('familia') || lowerText.includes('casa')) return '🏠';
        if (lowerText.includes('trabajo') || lowerText.includes('oficina')) return '💼';
        
        return '📝';  // Default
    }
    
    static async reverseGeocode(coordinates) {
        // Simulación - en producción usar Google Maps API o similar
        return {
            formatted: `${coordinates.lat}, ${coordinates.lng}`,
            city: 'Ciudad',
            country: 'País'
        };
    }
}

module.exports = MemoryFactory;
```

---

## 📊 Monitoreo y Mantenimiento

### **Tareas de Mantenimiento:**
```javascript
class DatabaseMaintenance {
    
    // Limpiar memorias inactivas antiguas
    static async cleanupInactiveMemories(daysOld = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        
        const result = await Memory.deleteMany({
            isActive: false,
            modifiedDate: { $lt: cutoffDate }
        });
        
        console.log(`🧹 Eliminadas ${result.deletedCount} memorias inactivas`);
        return result.deletedCount;
    }
    
    // Actualizar estadísticas de jardines
    static async updateAllGardenStats() {
        const jardines = await Jardin.find({ isArchived: false });
        let updated = 0;
        
        for (const jardin of jardines) {
            const memoryCount = await Memory.countDocuments({
                garden: jardin._id,
                isActive: true
            });
            
            if (jardin.stats.memoryCount !== memoryCount) {
                jardin.stats.memoryCount = memoryCount;
                await jardin.save();
                updated++;
            }
        }
        
        console.log(`📊 Actualizadas estadísticas de ${updated} jardines`);
        return updated;
    }
    
    // Generar reporte de uso
    static async generateUsageReport() {
        const [userStats] = await Usuario.aggregate([
            {
                $lookup: {
                    from: 'jardines',
                    localField: '_id',
                    foreignField: 'owner',
                    as: 'ownedGardens'
                }
            },
            {
                $group: {
                    _id: null,
                    totalUsers: { $sum: 1 },
                    activeUsers: {
                        $sum: {
                            $cond: [
                                { $gt: [{ $size: '$ownedGardens' }, 0] },
                                1,
                                0
                            ]
                        }
                    },
                    avgGardensPerUser: { $avg: { $size: '$ownedGardens' } }
                }
            }
        ]);
        
        const totalGardens = await Jardin.countDocuments({ isArchived: false });
        const totalMemories = await Memory.countDocuments({ isActive: true });
        
        return {
            ...userStats,
            totalGardens,
            totalMemories,
            avgMemoriesPerGarden: totalMemories / totalGardens || 0,
            generatedAt: new Date()
        };
    }
    
    // Verificar integridad de datos
    static async checkDataIntegrity() {
        const issues = [];
        
        // Jardines sin owner
        const orphanGardens = await Jardin.countDocuments({
            owner: { $exists: false }
        });
        if (orphanGardens > 0) {
            issues.push(`${orphanGardens} jardines sin propietario`);
        }
        
        // Memorias sin jardín
        const orphanMemories = await Memory.countDocuments({
            garden: { $exists: false }
        });
        if (orphanMemories > 0) {
            issues.push(`${orphanMemories} memorias sin jardín`);
        }
        
        // Referencias rotas
        const memoriesWithInvalidGarden = await Memory.aggregate([
            {
                $lookup: {
                    from: 'jardines',
                    localField: 'garden',
                    foreignField: '_id',
                    as: 'gardenDoc'
                }
            },
            {
                $match: { gardenDoc: { $size: 0 } }
            },
            {
                $count: 'count'
            }
        ]);
        
        if (memoriesWithInvalidGarden.length > 0) {
            issues.push(`${memoriesWithInvalidGarden[0].count} memorias con jardín inexistente`);
        }
        
        return {
            healthy: issues.length === 0,
            issues,
            checkedAt: new Date()
        };
    }
}

module.exports = DatabaseMaintenance;
```

---

## 🔒 Backup y Recuperación

### **Estrategia de Backup:**
```javascript
// Script de backup automático
class BackupManager {
    
    static async createBackup(backupPath) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = `${backupPath}/happiety-backup-${timestamp}.json`;
        
        try {
            // Obtener todos los datos
            const users = await Usuario.find({}).lean();
            const jardines = await Jardin.find({}).lean();
            const memories = await Memory.find({}).lean();
            
            const backupData = {
                version: '1.0',
                timestamp: new Date(),
                data: {
                    users,
                    jardines,
                    memories
                },
                stats: {
                    userCount: users.length,
                    gardenCount: jardines.length,
                    memoryCount: memories.length
                }
            };
            
            // Guardar backup
            require('fs').writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
            
            console.log(`💾 Backup creado: ${backupFile}`);
            return backupFile;
            
        } catch (error) {
            console.error('❌ Error creando backup:', error);
            throw error;
        }
    }
    
    static async restoreBackup(backupFile) {
        try {
            const backupData = JSON.parse(require('fs').readFileSync(backupFile, 'utf8'));
            
            console.log('🔄 Iniciando restauración...');
            
            // Limpiar datos existentes (¡CUIDADO!)
            await Memory.deleteMany({});
            await Jardin.deleteMany({});
            await Usuario.deleteMany({});
            
            // Restaurar datos
            await Usuario.insertMany(backupData.data.users);
            await Jardin.insertMany(backupData.data.jardines);
            await Memory.insertMany(backupData.data.memories);
            
            console.log('✅ Restauración completada');
            return backupData.stats;
            
        } catch (error) {
            console.error('❌ Error restaurando backup:', error);
            throw error;
        }
    }
}
```

---

## 🎯 Próximos Desarrollos de BD

### **Nuevas Colecciones Planificadas:**

#### **💬 Comentarios:**
```javascript
const commentSchema = new mongoose.Schema({
    memory: { type: ObjectId, ref: 'Memory', required: true },
    author: { type: ObjectId, ref: 'Usuario', required: true },
    content: { type: String, required: true, maxlength: 500 },
    isActive: { type: Boolean, default: true },
    likes: [{ type: ObjectId, ref: 'Usuario' }]
}, { timestamps: true });
```

#### **🔔 Notificaciones:**
```javascript
const notificationSchema = new mongoose.Schema({
    recipient: { type: ObjectId, ref: 'Usuario', required: true },
    type: { type: String, enum: ['new_memory', 'new_comment', 'garden_invite'], required: true },
    title: String,
    message: String,
    relatedId: ObjectId,  // ID del jardín, memoria, etc. relacionado
    isRead: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });
```

### **Mejoras Planificadas:**
- [ ] **Versionado de Memorias** - Historial de cambios
- [ ] **Sistema de Likes** - Para memorias y jardines
- [ ] **Búsqueda Full-Text** - Con MongoDB Atlas Search
- [ ] **Caché con Redis** - Para consultas frecuentes
- [ ] **Métricas Avanzadas** - Analytics detallados

---

**¡Con esta guía tienes conocimiento completo y profundo sobre toda la arquitectura de base de datos de HappiEty! 🗄️🚀**
