# 🌸 HappiEty - Jardines de Recuerdos Digitales

**HappiEty** es una aplicación web que permite crear jardines virtuales donde guardar y compartir recuerdos especiales. Cada jardín es un espacio único donde puedes plantar memorias de diferentes tipos: textos, fotos, audios, videos y ubicaciones.

## 📚 Guía Completa para Estudiantes

Esta documentación está diseñada para ayudar a estudiantes a entender la estructura del proyecto y continuar el desarrollo.

---

## 🗂️ Estructura del Proyecto

```
📁 Happ/
├── 📁 public/                    # Frontend - Archivos que ve el usuario
│   ├── 📁 css/                   # Estilos visuales
│   │   ├── styles-bem.css        # ⭐ ARCHIVO PRINCIPAL CSS
│   │   ├── styles.css            # Estilos adicionales
│   │   └── ...
│   ├── 📁 js/                    # JavaScript del frontend
│   │   ├── memory-manager.js     # ⭐ GESTIÓN DE RECUERDOS
│   │   ├── spa-navigation.js     # Navegación entre secciones
│   │   ├── sample-data.js        # Datos de ejemplo
│   │   ├── auth.js              # Sistema de autenticación
│   │   └── ...
│   ├── 📁 assets/               # Recursos (imágenes, iconos, audio)
│   │   ├── 📁 icons/            # Iconos de la interfaz
│   │   ├── 📁 img/              # Imágenes
│   │   └── 📁 audio/            # Archivos de audio
│   ├── index.html               # Página principal
│   ├── ver-jardin.html          # ⭐ PÁGINA DEL JARDÍN
│   ├── crear-jardin.html        # Crear nuevo jardín
│   └── ...
├── 📁 src/                      # Backend - Servidor
│   ├── 📁 models/               # Esquemas de base de datos
│   │   ├── Recuerdos.js         # ⭐ MODELO DE MEMORIAS
│   │   ├── Usuario.js           # Modelo de usuarios
│   │   ├── Jardin.js            # Modelo de jardines
│   │   └── index.js             # Exporta todos los modelos
│   ├── 📁 services/             # Lógica de negocio
│   │   └── AuthService.js       # 🔐 Servicio de autenticación
│   ├── 📁 middleware/           # Funciones intermedias
│   │   ├── auth.js              # Verificación de rutas protegidas
│   │   └── jwt.js               # 🔑 Manejo de tokens JWT
│   ├── server.js                # ⭐ SERVIDOR COMPLETO (MongoDB)
│   ├── server-auth.js           # 🔐 SERVIDOR CON AUTENTICACIÓN
│   ├── server-dev.js            # SERVIDOR DE DESARROLLO (simple)
│   └── db.js                    # Conexión a MongoDB
├── 📁 documentación/            # Documentos del proyecto
├── .env                         # Variables de entorno (crear desde .env.template)
├── .env.template                # Plantilla de configuración
├── package.json                 # Dependencias de Node.js
└── README.md                    # Este archivo
```

---

## 🚀 Instalación y Configuración

### Prerrequisitos
- **Node.js** (versión 14 o superior)
- **Git** para clonar el repositorio
- **VS Code** (recomendado)

### Pasos de Instalación

#### 1. **Clonar el Repositorio**
```bash
git clone https://github.com/GabyPng/Happ.git
cd Happ
```

#### 2. **Instalar Dependencias**
```bash
npm install
```

#### 3. **Configurar Variables de Entorno**
```bash
# Copiar el archivo de plantilla de configuración
cp .env.template .env

# Editar el archivo .env con tus configuraciones específicas
# (El archivo incluye comentarios explicativos)
```

#### 4. **Iniciar el Servidor de Desarrollo**
```bash
npm run dev-simple
```

#### 5. **Abrir en el Navegador**
- Ve a: `http://localhost:3000`
- Para el jardín: `http://localhost:3000/ver-jardin.html`

---

## 🧭 Navegación del Código

### 🎨 **Frontend (Interfaz de Usuario)**

#### **📄 ver-jardin.html** - Página Principal del Jardín
```html
<!-- Ubicación: /public/ver-jardin.html -->

<!-- ESTRUCTURA PRINCIPAL -->
<body class="page">
    <!-- Header con navegación -->
    <div class="header">...</div>
    
    <!-- Navegación entre secciones -->
    <nav class="header__nav">
        <button data-section="zona">Zona</button>      <!-- Vista del césped -->
        <button data-section="agregar">Agregar</button> <!-- Crear recuerdos -->
        <button data-section="recuerdos">Recuerdos</button> <!-- Lista de recuerdos -->
    </nav>
    
    <!-- SECCIÓN ZONA - Césped con recuerdos -->
    <section id="zona" class="page-section page-section--active">
        <div class="zone__grass">
            <!-- Aquí se cargan los recuerdos dinámicamente -->
        </div>
    </section>
    
    <!-- SECCIÓN RECUERDOS - Lista de tarjetas -->
    <section id="recuerdos" class="page-section">
        <div class="memories-grid">
            <!-- Aquí se cargan las tarjetas de recuerdos -->
        </div>
    </section>
</body>
```

#### **🎨 styles-bem.css** - Estilos Principales
```css
/* Ubicación: /public/css/styles-bem.css */

/* ZONA DE CÉSPED - Donde aparecen los recuerdos */
.zone__grass {
    background: linear-gradient(135deg, #4ade80 0%, #22c55e 50%, #16a34a 100%);
    min-height: 500px;
    position: relative;
    /* Efectos visuales del césped */
}

/* ELEMENTOS DE MEMORIA - Círculos y formas en el césped */
.memory-item {
    position: absolute;
    cursor: pointer;
    /* Posicionamiento dinámico */
}

.memory-item--text { /* Memorias de texto - círculos dorados */ }
.memory-item--photo { /* Fotos - marcos cuadrados */ }
.memory-item--audio { /* Audio - círculos violetas con animación */ }
.memory-item--video { /* Videos - rectángulos rojos */ }
.memory-item--location { /* Ubicaciones - pins azules */ }

/* TARJETAS DE RECUERDOS - Vista de lista */
.memory-card {
    background: white;
    border-radius: 15px;
    padding: 20px;
    /* Estilo de las tarjetas */
}

/* MENSAJES DE ESTADO VACÍO */
.zone__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    /* Centrado del mensaje cuando no hay recuerdos */
}
```

#### **⚙️ memory-manager.js** - Lógica de Recuerdos
```javascript
// Ubicación: /public/js/memory-manager.js

class MemoryManager {
    constructor() {
        this.memories = [];           // Array de recuerdos
        this.currentGarden = null;    // Jardín actual
        this.init();                  // Inicializar
    }
    
    // MÉTODOS PRINCIPALES
    loadMemories() {
        // Carga recuerdos desde la API o localStorage
    }
    
    renderZoneView() {
        // Dibuja recuerdos en la zona de césped
        // Posiciona elementos aleatoriamente
    }
    
    renderMemoriesGrid() {
        // Crea tarjetas de recuerdos para la lista
    }
    
    createMemoryZoneElement(memory) {
        // Crea elementos visuales para el césped
        // Diferentes estilos según el tipo de memoria
    }
}
```

### 🔧 **Backend (Servidor)**

#### **🌐 server-dev.js** - Servidor de Desarrollo
```javascript
// Ubicación: /src/server-dev.js

// DATOS DE EJEMPLO EN MEMORIA
const sampleMemories = [
    {
        _id: '...',
        title: 'Mi graduación',
        memoryType: 'Text',
        content: '...',
        // ... más propiedades
    }
    // ... más memorias
];

// RUTAS DE LA API
// GET /api/memorias/jardin/:id  - Obtener recuerdos de un jardín
// POST /api/memorias           - Crear nuevo recuerdo
// DELETE /api/memorias/:id     - Eliminar recuerdo
```

#### **📊 Recuerdos.js** - Modelo de Base de Datos
```javascript
// Ubicación: /src/models/Recuerdos.js

// ESQUEMA BASE DE MEMORIAS
const baseMemorySchema = new mongoose.Schema({
    garden: ObjectId,              // Jardín al que pertenece
    title: String,                 // Título del recuerdo
    memoryType: String,            // Tipo: Text, Image, Audio, Video, Location
    eventDate: Date,               // Fecha del recuerdo
    // ... más campos
});

// TIPOS DE MEMORIAS (Discriminadores)
const TextMemory = Memory.discriminator('Text', textSchema);
const ImageMemory = Memory.discriminator('Image', imageSchema);
// ... otros tipos
```

---

## � Sistema de Autenticación

**HappiEty** incluye un sistema completo de autenticación con registro, login, gestión de sesiones y rutas protegidas.

### 🏗️ Arquitectura de Autenticación

```
📁 Frontend (public/)
├── login-signup.html          # Interfaz de registro/login
├── auth-test.html             # Página de pruebas de autenticación
└── js/auth.js                 # Lógica de autenticación del cliente

📁 Backend (src/)
├── server-auth.js             # 🔐 Servidor con autenticación completa
├── services/AuthService.js    # Lógica de negocio de auth
├── middleware/jwt.js          # Manejo de tokens JWT
└── models/Usuario.js          # Modelo de usuarios
```

### 🚀 Configuración y Uso

#### **1. Iniciar Servidor con Autenticación**
```bash
# Servidor completo con autenticación en memoria
node src/server-auth.js

# Servidor completo con MongoDB (requiere configuración)
node src/server.js
```

#### **2. Endpoints de Autenticación**
```bash
# Registro de usuario
POST /api/auth/register
Content-Type: application/json
{
  "email": "usuario@ejemplo.com",
  "password": "password123",
  "displayName": "Nombre Usuario"
}

# Login
POST /api/auth/login
Content-Type: application/json
{
  "email": "usuario@ejemplo.com",
  "password": "password123"
}

# Usuario actual (requiere token)
GET /api/auth/me
Authorization: Bearer [token]

# Logout
POST /api/auth/logout

# Estado del servidor
GET /api/health
```

### 🔧 Implementación Técnica

#### **🔑 Generación y Verificación de Tokens**
```javascript
// src/middleware/jwt.js

// Generar token JWT
function generateToken(usuario) {
    const payload = {
        id: usuario._id,
        email: usuario.email,
        displayName: usuario.displayName
    };
    
    return jwt.sign(payload, JWT_SECRET, { 
        expiresIn: '7d',
        algorithm: 'HS256'
    });
}

// Verificar token
function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET, { algorithm: 'HS256' });
}

// Middleware de autenticación para rutas protegidas
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Token requerido' });
    }
    
    try {
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido' });
    }
}
```

#### **👤 Modelo de Usuario**
```javascript
// src/models/Usuario.js

const usuarioSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        match: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
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
}, {
    timestamps: true
});

// Hash automático de contraseñas
usuarioSchema.pre('save', async function(next) {
    if (!this.isModified('passwordHash')) return next();
    
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
});

// Comparar contraseñas
usuarioSchema.methods.comparePassword = async function(password) {
    return bcrypt.compare(password, this.passwordHash);
};

// Objeto seguro sin contraseña
usuarioSchema.methods.toSafeObject = function() {
    const { passwordHash, __v, ...safeUser } = this.toObject();
    return safeUser;
};
```

#### **🎯 Servicio de Autenticación**
```javascript
// src/services/AuthService.js

class AuthService {
    // Registro de nuevo usuario
    static async registerUser({ email, password, displayName }) {
        // 1. Validar datos de entrada
        if (!email || !password || !displayName) {
            throw new Error('Todos los campos son requeridos');
        }
        
        // 2. Verificar formato de email
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Formato de email inválido');
        }
        
        // 3. Verificar longitud de contraseña
        if (password.length < 6) {
            throw new Error('Contraseña debe tener mínimo 6 caracteres');
        }
        
        // 4. Verificar que el email no exista
        const existingUser = await models.Usuario.findByEmail(email);
        if (existingUser) {
            throw new Error('El email ya está registrado');
        }
        
        // 5. Crear nuevo usuario
        const newUser = new models.Usuario({
            email,
            passwordHash: password, // Se hashea automáticamente
            displayName: displayName || email.split('@')[0]
        });
        
        const savedUser = await newUser.save();
        
        // 6. Generar token
        const token = generateToken(savedUser);
        
        // 7. Actualizar último login
        savedUser.lastLogin = new Date();
        await savedUser.save();
        
        return {
            success: true,
            message: 'Usuario registrado exitosamente',
            user: savedUser.toSafeObject(),
            token,
            expiresIn: '7d'
        };
    }
    
    // Inicio de sesión
    static async loginUser({ email, password }) {
        // 1. Validar datos
        if (!email || !password) {
            throw new Error('Email y contraseña son requeridos');
        }
        
        // 2. Buscar usuario
        const user = await models.Usuario.findByEmail(email);
        if (!user) {
            throw new Error('Credenciales inválidas');
        }
        
        // 3. Verificar contraseña
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            throw new Error('Credenciales inválidas');
        }
        
        // 4. Actualizar último login
        user.lastLogin = new Date();
        await user.save();
        
        // 5. Generar token
        const token = generateToken(user);
        
        return {
            success: true,
            message: 'Login exitoso',
            user: user.toSafeObject(),
            token,
            expiresIn: '7d'
        };
    }
}
```

#### **🌐 Frontend - Manejo de Autenticación**
```javascript
// public/js/auth.js

class AuthManager {
    constructor() {
        this.apiUrl = 'http://localhost:3000/api';
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.checkAuthentication();
    }
    
    // Registro de usuario
    async handleSignup(formData) {
        const userData = {
            email: formData.get('email'),
            password: formData.get('password'),
            displayName: formData.get('displayName')
        };
        
        const response = await fetch(`${this.apiUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Guardar token y usuario en localStorage
            localStorage.setItem('happiety_token', result.token);
            localStorage.setItem('happiety_user', JSON.stringify(result.user));
            
            // Redirigir a página principal
            window.location.href = 'index.html';
        }
        
        return result;
    }
    
    // Inicio de sesión
    async handleLogin(formData) {
        const credentials = {
            email: formData.get('email'),
            password: formData.get('password')
        };
        
        const response = await fetch(`${this.apiUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        
        const result = await response.json();
        
        if (result.success) {
            localStorage.setItem('happiety_token', result.token);
            localStorage.setItem('happiety_user', JSON.stringify(result.user));
            window.location.href = 'index.html';
        }
        
        return result;
    }
    
    // Métodos estáticos para uso global
    static logout() {
        localStorage.removeItem('happiety_token');
        localStorage.removeItem('happiety_user');
        window.location.href = 'login-signup.html';
    }
    
    static isAuthenticated() {
        const token = localStorage.getItem('happiety_token');
        const user = localStorage.getItem('happiety_user');
        return !!(token && user);
    }
    
    static getToken() {
        return localStorage.getItem('happiety_token');
    }
    
    static getCurrentUser() {
        const user = localStorage.getItem('happiety_user');
        return user ? JSON.parse(user) : null;
    }
    
    // Hacer peticiones autenticadas
    static async apiCall(endpoint, options = {}) {
        const token = this.getToken();
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };
        
        const finalOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };
        
        try {
            const response = await fetch(
                `http://localhost:3000/api${endpoint}`, 
                finalOptions
            );
            
            // Si el token expiró, hacer logout
            if (response.status === 401 || response.status === 403) {
                this.logout();
                return;
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error en API call:', error);
            throw error;
        }
    }
}
```

### 🧪 Pruebas y Validación

#### **1. Página de Pruebas**
- **URL**: `http://localhost:3000/auth-test.html`
- **Funciones**: Registro, login, verificación de usuario, logout
- **Casos de prueba**: Validación de emails, contraseñas, tokens

#### **2. Comandos cURL para Pruebas**
```bash
# Probar registro
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","displayName":"Test User"}'

# Probar login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'

# Probar usuario actual
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer [token]"

# Ver estado del servidor
curl -X GET http://localhost:3000/api/health
```

### 🔒 Seguridad

#### **Características de Seguridad Implementadas**
1. **Hashing de Contraseñas**: Bcrypt con salt de 12 rounds
2. **Tokens JWT**: Firmados y con expiración de 7 días
3. **Validación de Email**: Regex robusto
4. **Sanitización**: Trim y lowercase en datos
5. **CORS**: Configurado para desarrollo
6. **Rate Limiting**: Preparado para implementar
7. **Rutas Protegidas**: Middleware de autenticación

#### **Variables de Entorno Recomendadas**
```bash
# .env
JWT_SECRET=tu_clave_secreta_muy_segura_aqui
JWT_EXPIRES_IN=7d
MONGO_URI=mongodb://localhost:27017/happiety
NODE_ENV=production
```

---

## �🔄 Flujo de Funcionamiento

### 1. **Carga Inicial**
```
Usuario abre ver-jardin.html
    ↓
Se cargan los scripts: sample-data.js → memory-manager.js → spa-navigation.js
    ↓
MemoryManager se inicializa y busca datos en localStorage
    ↓
Si no hay datos, usa los datos de ejemplo
    ↓
Renderiza la vista actual (zona o recuerdos)
```

### 2. **Navegación Entre Secciones**
```
Usuario hace clic en "Zona" o "Recuerdos"
    ↓
spa-navigation.js detecta el clic
    ↓
Oculta secciones y muestra la seleccionada
    ↓
Emite evento 'sectionChanged'
    ↓
MemoryManager escucha el evento y actualiza la vista
```

### 3. **Visualización de Recuerdos**
```
MemoryManager.renderZoneView() o renderMemoriesGrid()
    ↓
Itera sobre this.memories array
    ↓
Para cada memoria:
    - Zona: Crea elemento posicionado aleatoriamente
    - Grid: Crea tarjeta con información completa
    ↓
Añade elementos al DOM
```

---

## 🛠️ Archivos Clave para Desarrollo

### **🎯 Para Modificar la Apariencia Visual:**
- **`/public/css/styles-bem.css`** - Líneas 51-450 (estilos de memorias)

### **🎯 Para Cambiar la Lógica de Recuerdos:**
- **`/public/js/memory-manager.js`** - Clase MemoryManager completa

### **🎯 Para Añadir Nuevas Páginas:**
- **`/public/`** - Crear nuevo archivo .html
- **`/src/server-dev.js`** - Añadir ruta si necesita API

### **🎯 Para Modificar la Base de Datos:**
- **`/src/models/Recuerdos.js`** - Esquemas de Mongoose

### **🎯 Para Cambiar la API:**
- **`/src/server-dev.js`** - Rutas y endpoints

---

## 🐛 Depuración y Herramientas

### **Consola del Navegador**
```javascript
// Funciones disponibles globalmente:
createSampleMemories()  // Llenar jardín con datos de ejemplo
createEmptyGarden()     // Vaciar jardín para probar estado vacío
clearSampleData()       // Limpiar localStorage

// Acceder al manager:
window.memoryManager.memories        // Ver array de recuerdos
window.memoryManager.renderZoneView() // Forzar actualización de zona
```

### **Logs del Servidor**
```bash
# En la terminal verás:
GET /ver-jardin.html              # Página solicitada
GET /css/styles-bem.css           # CSS cargado
GET /js/memory-manager.js         # JavaScript cargado
GET /api/memorias/jardin/...      # API de recuerdos llamada
```

---

## 📝 Tareas Comunes de Desarrollo

### **Agregar un Nuevo Tipo de Memoria**

1. **Modelo (Backend):**
```javascript
// En /src/models/Recuerdos.js
const nuevoTipoSchema = new mongoose.Schema({
    propiedadEspecial: String
});
const NuevoTipo = Memory.discriminator('NuevoTipo', nuevoTipoSchema);
```

2. **CSS (Frontend):**
```css
/* En /public/css/styles-bem.css */
.memory-item--nuevotipo {
    /* Estilos para la zona de césped */
}
.memory-card--nuevotipo {
    /* Estilos para las tarjetas */
}
```

3. **JavaScript (Frontend):**
```javascript
// En /public/js/memory-manager.js - método createMemoryZoneElement
case 'NuevoTipo':
    content = `<div>🎯</div>`;
    break;
```

### **Cambiar Colores del Tema**
```css
/* En /public/css/styles-bem.css */
:root {
    --color-primary: #ff4da3;    /* Rosa principal */
    --color-secondary: #4ade80;   /* Verde césped */
    /* Agregar más variables */
}
```

### **Añadir Nueva Página**
1. Crear `/public/nueva-pagina.html`
2. Incluir CSS y JS necesarios
3. Si necesita API, agregar rutas en `/src/server-dev.js`

---

## 🆘 Solución de Problemas

### **El servidor no inicia:**
```bash
# Verificar que las dependencias están instaladas
npm install

# Usar el servidor de desarrollo sin MongoDB
npm run dev-simple
```

### **Los recuerdos no aparecen:**
```javascript
// En consola del navegador:
localStorage.clear()  // Limpiar datos
createSampleMemories()  // Recrear datos
```

### **Estilos no se aplican:**
- Verificar que `/public/css/styles-bem.css` se carga correctamente
- Usar F12 → Network para ver si hay errores 404
- Verificar sintaxis CSS con validador online

---

## 📖 Recursos Adicionales

- **BEM Methodology:** [getbem.com](http://getbem.com/) - Metodología CSS usada
- **MongoDB/Mongoose:** [mongoosejs.com](https://mongoosejs.com/) - ODM para base de datos
- **Node.js:** [nodejs.org](https://nodejs.org/) - Runtime de JavaScript

---

## 🤝 Contribuir al Proyecto

1. Crear rama nueva: `git checkout -b mi-feature`
2. Hacer cambios y probar localmente
3. Commit: `git commit -m "Descripción clara"`
4. Push: `git push origin mi-feature`
5. Crear Pull Request en GitHub

---

**¡Feliz codificación! 🌸✨**

Para dudas específicas, revisa los comentarios en el código o contacta al equipo de desarrollo.
    Debe aparecer todo lo que esta en la carpeta Documentos usario de windows 
cd Happ

# Instalar node por nvm
Deben estar en la carpeta de Happ

Solo peguen todo esto COMPLETO TODO TODITO TODO

### Download and install nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

### in lieu of restarting the shell
\. "$HOME/.nvm/nvm.sh"

### Download and install Node.js:
nvm install 22

### Verify the Node.js version:
node -v # Should print "v22.17.0".
nvm current # Should print "v22.17.0".

### Verify npm version:
npm -v # Should print "10.9.2".

HASTA AQUI 

## No cierren el cmd 
 

Ahora Abre VSC
# !!! Instala la extensión WSL por Microsoft

Abajo a la izquierda deben hacer click a un cuadro azul, tiene que salír en el buscador 
# Connect to wsl
Sino, busquen en youtube :D

Una vez conectado a WSL---->
    Vayan al cmd otra vez

# Abrir la carpeta Happ en VSC

ls
    Tienen que estar en la carpeta Happ y visualziar todo el contenido

Entonces,  hagan lo siguiente

'''
code Happ
'''

Es para abrir directorios y archivos en visual studio code, les tiene que abrir toda la carpeta

# Ejecutar el proyecto desde localhost

Abrir la terminal de VS (Arriba en la barra esta)
Shorcut> ctrl + shit + `

Escribir
    npm start 

Control + clic  Al link que aparece en localhost

Esto es temporal, para trabajar en el html y las estetica

#########################################################################################3

# Instalar vercel analytics
