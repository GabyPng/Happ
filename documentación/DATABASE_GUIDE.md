# 🗄️ **GUÍA COMPLETA DE BASE DE DATOS - HAPPIETY**

## 📊 **Resumen de Implementación**

Esta guía explica la implementación completa de la base de datos MongoDB con Mongoose para HappiEty, incluyendo esquemas, relaciones, índices y ejemplos prácticos.

---

## 🏗️ **ESTRUCTURA DE LA BASE DE DATOS**

### **Colecciones Principales:**
- **`usuarios`** - Gestión de cuentas y autenticación
- **`jardines`** - Contenedores de recuerdos con códigos únicos
- **`memories`** - Recuerdos con discriminadores por tipo

---

## 📋 **ESQUEMAS DETALLADOS**

### 1. **Usuario** (`/src/models/Usuario.js`)

```javascript
const usuarioSchema = new mongoose.Schema({
    email: String (único, requerido, validación email),
    passwordHash: String (bcrypt 12 rounds),
    displayName: String (máx 50 chars),
    avatar: String (URL),
    preferences: {
        theme: String (enum: rosado/azul/verde),
        notifications: Boolean
    },
    stats: {
        totalGardens: Number,
        totalMemories: Number
    }
}, { timestamps: true });
```

**Índices:**
- `{ email: 1 }` - único
- `{ createdAt: -1 }` - ordenamiento

**Métodos principales:**
- `comparePassword(password)` - Verificar contraseña
- `toSafeObject()` - Remover datos sensibles
- `Usuario.findByEmail(email)` - Buscar por email

### 2. **Jardín** (`/src/models/Jardin.js`)

```javascript
const jardinSchema = new mongoose.Schema({
    owner: ObjectId → Usuario,
    name: String (requerido, máx 100 chars),
    description: String (máx 500 chars),
    accessCode: String (único, formato ABCD1234),
    members: [ObjectId → Usuario],
    theme: {
        name: String (enum: rosado/azul/verde),
        primaryColor: String,
        secondaryColor: String,
        musicUrl: String
    },
    stats: {
        memoryCount: Number,
        lastAccessed: Date,
        viewCount: Number
    },
    memories: [ObjectId → Memory],
    isPrivate: Boolean
}, { timestamps: true });
```

**Índices:**
- `{ accessCode: 1 }` - único
- `{ owner: 1, createdAt: -1 }` - jardines por usuario
- `{ members: 1 }` - jardines compartidos
- `{ 'stats.lastAccessed': -1 }` - último acceso

**Métodos principales:**
- `generateUniqueAccessCode()` - Generar código LOVE1234
- `findByAccessCode(code)` - Buscar por código
- `addMember(userId)` - Agregar colaborador
- `updateStats()` - Actualizar estadísticas

### 3. **Memory con Discriminadores** (`/src/models/Recuerdos.js`)

```javascript
// ESQUEMA BASE
const baseMemorySchema = new mongoose.Schema({
    garden: ObjectId → Jardin,
    title: String (requerido, máx 200 chars),
    description: String (máx 1000 chars),
    eventDate: Date,
    position: { x: Number, y: Number, zIndex: Number },
    isActive: Boolean
}, { discriminatorKey: 'memoryType', timestamps: true });

// DISCRIMINADORES
Text: { emoji: String, content: String }
Image: { imageUrl: String, altText: String, metadata: Object }
Video: { videoUrl: String, thumbnailUrl: String, metadata: Object }
Audio: { artist: String, album: String, audioUrl: String, metadata: Object }
Location: { latitude: Number, longitude: Number, placeName: String, address: String }
```

**Índices:**
- `{ garden: 1, createdAt: -1 }` - recuerdos por jardín
- `{ memoryType: 1 }` - filtro por tipo
- `{ eventDate: -1 }` - ordenamiento por fecha

---

## 🔗 **RELACIONES ENTRE COLECCIONES**

### **Relaciones Implementadas:**
```
Usuario (1) ←→ (N) Jardín
    owner: ObjectId ref 'Usuario'

Jardín (N) ←→ (N) Usuario  
    members: [ObjectId] ref 'Usuario'

Jardín (1) ←→ (N) Memory
    garden: ObjectId ref 'Jardin'
    memories: [ObjectId] ref 'Memory'
```

### **Ejemplo de .populate():**
```javascript
// Jardín con propietario y recuerdos
const jardin = await Jardin.findByAccessCode('LOVE1234')
    .populate('owner', 'displayName email')
    .populate('memories')
    .populate('members', 'displayName');

// Recuerdos de un jardín específico
const memorias = await Memory.find({ garden: jardinId })
    .populate('garden', 'name theme');
```

---

## 🚀 **EJEMPLOS DE USO**

### **Crear Usuario:**
```javascript
const usuario = new Usuario({
    email: 'laura@happiety.com',
    passwordHash: 'password123', // Se hashea automáticamente
    displayName: 'Laura 🌸'
});
await usuario.save();
```

### **Crear Jardín:**
```javascript
const jardin = new Jardin({
    owner: userId,
    name: 'Mi Jardín de Recuerdos',
    description: 'Lugar especial para momentos felices'
    // accessCode se genera automáticamente
});
await jardin.save();
```

### **Crear Memoria (Discriminadores):**
```javascript
// Memoria de texto
const memoriaTexto = Memory.createTextMemory(jardinId, {
    title: 'Mi primer recuerdo',
    emoji: '💕',
    content: 'Hoy empiezo mi jardín...'
});
await memoriaTexto.save();

// Memoria de imagen
const memoriaImagen = Memory.createImageMemory(jardinId, {
    title: 'Atardecer en la playa',
    imageUrl: '/uploads/atardecer.jpg',
    metadata: { width: 1920, height: 1080 }
});
await memoriaImagen.save();
```

### **Consultas Complejas:**
```javascript
// Jardines de un usuario con estadísticas
const jardines = await Jardin.find({ owner: userId })
    .populate('memories', 'title memoryType')
    .sort({ 'stats.lastAccessed': -1 });

// Recuerdos por tipo
const recuerdosTexto = await Memory.find({ 
    garden: jardinId, 
    memoryType: 'Text' 
});

// Búsqueda por código con todo el contexto
const jardinCompleto = await Jardin.findByAccessCode('LOVE1234')
    .populate('owner', 'displayName')
    .populate({
        path: 'memories',
        options: { sort: { eventDate: -1 } }
    });
```

---

## 🔧 **ÍNDICES Y OPTIMIZACIÓN**

### **Índices Implementados:**
```javascript
// Usuarios
db.usuarios.createIndex({ "email": 1 }, { unique: true })
db.usuarios.createIndex({ "createdAt": -1 })

// Jardines  
db.jardines.createIndex({ "accessCode": 1 }, { unique: true })
db.jardines.createIndex({ "owner": 1, "createdAt": -1 })
db.jardines.createIndex({ "members": 1 })
db.jardines.createIndex({ "stats.lastAccessed": -1 })

// Memorias
db.memories.createIndex({ "garden": 1, "createdAt": -1 })
db.memories.createIndex({ "memoryType": 1 })
db.memories.createIndex({ "eventDate": -1 })
```

### **Consultas Optimizadas:**
- **Búsqueda por código:** Índice único en `accessCode`
- **Jardines por usuario:** Índice compuesto `owner + createdAt`
- **Recuerdos por jardín:** Índice compuesto `garden + createdAt`
- **Filtro por tipo:** Índice en `memoryType`

---

## 📁 **ESTRUCTURA DE ARCHIVOS**

```
src/
├── db.js                    # Conexión a MongoDB
├── server.js               # Servidor con API endpoints
├── models/
│   ├── index.js            # Exportar todos los modelos
│   ├── Usuario.js          # Esquema de usuarios
│   ├── Jardin.js           # Esquema de jardines
│   └── Recuerdos.js        # Esquema base + discriminadores
└── examples/
    └── database-examples.js # Ejemplos de uso
```

---

## 🌐 **API ENDPOINTS**

### **Jardines:**
- `POST /api/jardines` - Crear jardín
- `GET /api/jardines/codigo/:code` - Buscar por código

### **Memorias:**
- `POST /api/memorias` - Crear memoria
- `GET /api/memorias/jardin/:id` - Obtener memorias de jardín

### **Sistema:**
- `GET /api/health` - Health check de la base de datos

---

## 🚀 **COMANDOS PARA EMPEZAR**

```bash
# 1. Instalar dependencias
npm install mongoose bcrypt dotenv nodemon

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tu MONGO_URI

# 3. Ejecutar servidor
npm run dev

# 4. Probar ejemplos
npm run db:examples
```

---

## 🛡️ **BUENAS PRÁCTICAS IMPLEMENTADAS**

### **Seguridad:**
- Contraseñas hasheadas con bcrypt (12 rounds)
- Validaciones de entrada en esquemas
- Índices únicos para prevenir duplicados
- Sanitización de datos de salida

### **Rendimiento:**
- Índices optimizados para consultas frecuentes
- Discriminadores para herencia eficiente
- Paginación implícita en consultas grandes
- Population selectiva de campos necesarios

### **Escalabilidad:**
- Conexión con pool de conexiones
- Manejo de errores robusto
- Eventos de conexión monitoreados
- Estructura modular y extensible

---

## 🔍 **DEBUGGING Y MONITOREO**

### **Health Check:**
```bash
curl http://localhost:3000/api/health
```

### **Logs importantes:**
- ✅ Conexión exitosa a MongoDB
- 📚 Modelos cargados
- 🔗 Estado de conexión
- 🚨 Errores de validación

---

¡Tu base de datos MongoDB está lista para manejar jardines de recuerdos de manera eficiente y escalable! 🌸
