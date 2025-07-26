# 🌸 HappiEty - Jardines de Recuerdos Digitales

**HappiEty** es una aplicación web que permite crear jardines virtuales donde guardar y compartir recuerdos especiales.

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js (v14 o superior)
- MongoDB Atlas (cloud) configurado

### Instalación
1. Clona el repositorio
2. Instala dependencias: `npm install`
3. Configura tu `.env` con las credenciales de MongoDB
4. Ejecuta el servidor: `npm start`
5. Abre `http://localhost:3000` en tu navegador

## 📦 Dependencias

### Dependencias de Producción
- **mongoose** (^8.0.0) - ODM para MongoDB
- **bcrypt** (^5.1.1) - Encriptación de contraseñas
- **jsonwebtoken** (^9.0.2) - Autenticación JWT
- **dotenv** (^16.3.1) - Variables de entorno
- **cors** (^2.8.5) - Cross-Origin Resource Sharing
- **mongodb** (^6.17.0) - Driver nativo de MongoDB
- **express** (^5.1.0) - Framework web (no usado actualmente)

### Dependencias de Desarrollo
- **nodemon** (^3.1.10) - Auto-restart del servidor

## 🗂️ Estructura del Proyecto

```
📁 Happ/
├── 📁 public/                    # Frontend completo
│   ├── 📁 css/                   # Estilos
│   │   ├── styles.css            # Estilos principales
│   │   └── style--login.css      # Estilos del login
│   ├── 📁 js/                    # JavaScript modular
│   │   ├── auth.js              # Sistema de autenticación
│   │   ├── route-protection.js  # Protección de rutas
│   │   ├── memory-manager.js    # Gestión de memorias
│   │   ├── garden-manager.js    # Gestión de jardines
│   │   ├── crear-jardin.js      # Creación de jardines
│   │   ├── acceder-jardin.js    # Acceso a jardines
│   │   ├── music-player.js      # Reproductor de música
│   │   └── spa-navigation.js    # Navegación SPA
│   ├── 📁 assets/               # Recursos multimedia
│   │   ├── 📁 icons/            # Iconos de la interfaz
│   │   ├── 📁 img/              # Imágenes
│   │   └── 📁 audio/            # Archivos de audio
│   └── *.html                   # Páginas web
├── 📁 src/                      
│   └── index.js                 # Servidor principal
```

## 🔧 Archivos Principales

### Backend (`src/index.js`)
**Servidor HTTP nativo con MongoDB**

#### Esquemas de Base de Datos:
- `usuarioSchema` - Usuarios con displayName, email, contraseña encriptada, stats
- `jardinSchema` - Jardines con código de acceso, tema, privacidad
- `memoriaSchema` - Memorias con tipo, contenido, posición, tags

#### API Endpoints:
- `POST /loginUsuario` - Autenticación de usuarios
- `POST /newUsuario` - Registro de nuevos usuarios  
- `POST /newJardin` - Crear jardines
- `GET /getJardin/code/{codigo}` - Buscar jardín por código
- `POST /newMemoria` - Crear memorias
- `GET /getMemorias/{gardenId}` - Obtener memorias
- `GET /health` - Estado del servidor

#### Funciones Auxiliares:
- `parseRequestBody()` - Parser de JSON requests
- `generateAccessCode()` - Generador de códigos únicos
- `getMimeType()` - Tipos MIME para archivos estáticos

### Frontend JavaScript

#### `auth.js` - Gestión de Autenticación
**Clase:** `AuthManager`
- `handleLogin()` - Procesa login de usuarios
- `handleRegister()` - Procesa registro de usuarios
- `showMessage()` - Muestra mensajes de estado
- `apiCall()` - Llamadas HTTP a la API

#### `memory-manager.js` - Gestión de Memorias
**Clase:** `MemoryManager`
- `loadMemories()` - Carga memorias desde API
- `renderZoneView()` - Vista de zona interactiva
- `renderMemoriesGrid()` - Vista de grilla de memorias
- `createMemoryElement()` - Elementos DOM de memorias
- `deleteMemory()` - Eliminar memorias
- `editMemory()` - Editar memorias existentes

#### `route-protection.js` - Protección de Rutas
**Clase:** `NewRouteProtection`
- `init()` - Inicializar protección
- `checkAuth()` - Verificar autenticación
- `redirectToLogin()` - Redirección a login
- `validateToken()` - Validación de JWT

#### `garden-manager.js` - Gestión de Jardines
- `loadUserGardens()` - Cargar jardines del usuario
- `renderGardenCard()` - Tarjetas de jardines
- `deleteGarden()` - Eliminar jardines

#### `crear-jardin.js` - Creación de Jardines
- `handleGardenCreation()` - Procesar formulario
- `generatePreview()` - Vista previa del jardín
- `validateForm()` - Validación de datos

#### `acceder-jardin.js` - Acceso a Jardines
- `handleAccessCode()` - Procesar código de acceso
- `searchGarden()` - Buscar jardín por código
- `joinGarden()` - Unirse a jardín

#### `music-player.js` - Reproductor de Audio
**Clase:** `MusicPlayer`
- `play()` - Reproducir audio
- `pause()` - Pausar audio
- `setVolume()` - Control de volumen
- `updateProgress()` - Actualizar progreso

#### `spa-navigation.js` - Navegación SPA
- `showSection()` - Cambiar secciones
- `initializeModal()` - Modales de la interfaz
- `handleNavigation()` - Navegación entre vistas

## 🛠️ Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript vanilla (ES6+)
- **Backend**: Node.js con HTTP nativo (sin Express)
- **Base de datos**: MongoDB Atlas cloud
- **Autenticación**: JWT + bcrypt
- **Arquitectura**: SPA (Single Page Application)

## 📖 Documentación Completa

Para información detallada, consulta:
- `/documentación/ARCHITECTURE_GUIDE.md`
- `/documentación/FRONTEND_GUIDE.md`
- `/documentación/BACKEND_GUIDE.md`
- `/documentación/DATABASE_GUIDE.md`

## ✨ Funcionalidades

- 🌱 Crear jardines virtuales únicos
- 📝 Agregar memorias (texto, imagen, audio, video, ubicación)
- 🔗 Compartir jardines con códigos de acceso
- 🔐 Sistema de autenticación seguro (JWT)
- 📱 Interfaz responsive y amigable
- 🎵 Reproductor de música integrado
- 🗂️ Organización por zonas y grillas

## 🚀 Scripts Disponibles

- `npm start` - Iniciar servidor de producción
- `npm run dev` - Desarrollo con auto-restart
- `npm run db:seed` - Poblar base de datos con datos de prueba

---

🌸 **¡Empieza a crear tus jardines de recuerdos!**
