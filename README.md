# 🌸 HappiEty - Jardines de Recuerdos Digitales

### Link: https://github.com/GabyPng/Happ
<br>

**HappiEty** es una aplicación web diseñada para compartir momentos felices con una persona especial. La plataforma permite a un usuario crear una "zona" personalizada, que funciona como un baúl interactivo lleno de recuerdos en forma de imágenes, vídeos, textos, música y notas. Estos recuerdos se representan metafóricamente como semillas que crecen en un campo llamado zona.

Una vez creada la zona, el usuario puede compartir un enlace o código único con otra persona para que ambos puedan colaborar y alimentar juntos este espacio emocional, desde cualquier dispositivo.

---
<br>

## Diagrama de Casos de uso

<img width="1524" height="446" alt="Casos de uso drawio" src="https://github.com/user-attachments/assets/56367a15-49df-4179-b782-5ad5488e0b88" />

---
<br>

## Características Destacadas

-  **Jardines Virtuales**: Crea espacios únicos para tus recuerdos

-  **Memorias Multimedia**: Texto, imágenes, audio, video y ubicaciones

-  **Diseño Responsivo**: Interfaz adaptativa para todos los dispositivos

-  **Temas Personalizables**: Rosa, Azul y Verde

##  Inicio Rápido
El servidor de este proyecto se encuentra subido a Render y es Hosteado por Vercel.
**Link** https://happ-ashy.vercel.app/
Tiene que esperar 30 segundos para que el servidor con plan gratuito de Render vuelva a prender.

## Link del video explicativo Youtube
https://youtu.be/v0ldfwDSIcg

### Prerrequisitos
- Node.js (v16 o superior)
- MongoDB Atlas configurado
- Git

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/GabyPng/Happ.git
cd Happ

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales de MongoDB Atlas

# 4. Iniciar el servidor
# Asegurate de cerrar todo
 pkill -f "node src/index.js" && node src/index.js
# Y ya iniciarlo
npm start

# 5. Abrir en navegador
# http://localhost:3000 
```

### Variables de Entorno (.env)
```env
MONGO_URI=mongodb+srv://usuario:contraseña@cluster.mongodb.net/happiety
JWT_SECRET=tu-secret-key-super-seguro
PORT=3000
```

## 🗂️ Estructura del Proyecto

```
📁 Happ/
├── 📁 public/                    # Frontend completo
│   ├── 📁 css/                   # Estilos CSS
│   │   ├── styles.css            # Estilos principales (BEM)
│   │   ├── style--login.css      # Estilos de autenticación
│   │   └── auth-messages.css     # Mensajes de estado
│   ├── 📁 js/                    # JavaScript del frontend
│   │   ├── auth.js               # Sistema de autenticación
│   │   ├── route-protection.js   # Protección de rutas
│   │   ├── garden-sharing.js     # Protección de rutas
│   │   ├── garden-manager.js     # CRUD de jardines
│   │   ├── crear-jardin.js       # Creación/edición jardines
│   │   ├── acceder-jardin.js     # Acceso con código
│   │   ├── memory-manager.js     # CRUD de memorias
│   │   ├── music-player.js       # Reproductor multimedia
│   │   └── spa-navigation.js     # Navegación SPA
│   ├── 📁 assets/                # Recursos multimedia
│   │   ├── 📁 icons/             # Iconos
│   │   ├── 📁 img/               # Imágenes
│   │   └── 📁 audio/             # Archivos de audio
│   ├── index.html                # Página de autenticación (Login y Signup)
│   ├── inicio.html               # Página principal de la aplicación
│   ├── mis-jardines.html         # Gestión de jardines
│   ├── crear-jardin.html         # Crear/editar jardín
│   ├── acceder-jardin.html       # Unirse con código
│   └── ver-jardin.html           # Vista del jardín
├── 📁 src/                      
│   └── index.js                 # Servidor con MongoDB y nodejs
├── 📁 obsoletos/                # Archivos antiguos
├── package.json                 # Dependencias NPM
├── .env                         # Variables de entorno privadas
└── README.md                    # Este archivo
```

##  Tecnologías y Arquitectura

### Frontend
- **HTML5**: Estructura semántica
- **CSS3**: Uso de la Metodología BEM con Diseños responsivos
- **JavaScript ES6+**: Modules, Classes, Async/Await
- **SPA**: Single Page Application con navegación client-side

### Backend
- **Node.js**: Servidor HTTP nativo (sin Express)
- **MongoDB Atlas**: Base de datos en la nube
- **Mongoose**: ODM para MongoDB
- **JWT**: Autenticación stateless
- **bcrypt**: Encriptación de contraseñas

### Seguridad
- Autenticación JWT con tokens
- Encriptación bcrypt (salt rounds 10)
- Validación de entrada
- Protección de rutas
- CORS configurado

##  Base de Datos (MongoDB)

### Colecciones

#### `usuarios`
```javascript
{
  _id: ObjectId,
  email: String (único, requerido),
  passwordHash: String (bcrypt),
  displayName: String,
  avatar: String,
  preferences: {
    theme: String ['rosado', 'azul', 'verde'],
    notifications: Boolean
  },
  stats: {
    jardinesCreados: Number,
    memoriasGuardadas: Number,
    fechaUltimoAcceso: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### `jardins`
```javascript
{
  _id: ObjectId,
  name: String (requerido),
  description: String,
  accessCode: String (único, 8 chars),
  owner: ObjectId (ref: usuarios),
  members: [ObjectId] (ref: usuarios),
  theme: {
    name: String ['rosado', 'azul', 'verde'],
    colors: String
  },
  isPrivate: Boolean,
  stats: {
    memoryCount: Number,
    viewCount: Number,
    lastAccessed: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### `memorias`
```javascript
{
  _id: ObjectId,
  jardin: ObjectId (ref: jardins),
  creator: ObjectId (ref: usuarios),
  title: String (requerido),
  description: String,
  memoryType: String ['texto', 'imagen', 'audio', 'video', 'ubicacion'],
  content: {
    text: String,
    fileUrl: String,
    fileName: String,
    coordinates: { lat: Number, lng: Number },
    locationName: String
  },
  emoji: String,
  position: { x: Number, y: Number },
  tags: [String],
  isPublic: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Autenticación
- `POST /loginUsuario` - Iniciar sesión
- `POST /newUsuario` - Registrar usuario

### Jardines
- `GET /getJardines` - Obtener jardines del usuario
- `POST /newJardin` - Crear jardín
- `GET /getJardin/edit/{id}` - Obtener jardín para editar
- `PUT /updateJardin/{id}` - Actualizar jardín
- `DELETE /deleteJardin/{id}` - Eliminar jardín
- `GET /getJardin/code/{codigo}` - Buscar por código

### Memorias
- `GET /getMemorias/{gardenId}` - Obtener memorias
- `POST /newMemoria` - Crear memoria
- `PUT /updateMemoria/{id}` - Actualizar memoria
- `DELETE /deleteMemoria/{id}` - Eliminar memoria

### Sistema
- `GET /health` - Estado del servidor

## Frontend - Módulos JavaScript

### AuthManager (`auth.js`)
```javascript
class AuthManager {
  handleLogin()      // Procesar inicio de sesión
  handleRegister()   // Procesar registro
  showMessage()      // Notificaciones flotantes
  apiCall()          // Cliente HTTP
}
```

### GardenManager (`garden-manager.js`)
```javascript
class GardenManager {
  loadUserGardens()   // Cargar jardines del usuario
  createGardenCard()  // Renderizar tarjetas
  deleteGarden()      // Eliminar con confirmación
  editGarden()        // Redirigir a edición
  updateStats()       // Actualizar estadísticas
}
```

### CrearJardin (`crear-jardin.js`)
```javascript
class CrearJardin {
  handleSubmit()      // Crear/actualizar jardín
  loadGardenForEdit() // Cargar datos para edición
  validateForm()      // Validación cliente
  setupThemeSelection() // Selección de tema
}
```

### MemoryManager (`memory-manager.js`)
```javascript
class MemoryManager {
  loadMemories()      // Cargar memorias
  renderZoneView()    // Vista de zona interactiva
  renderGrid()        // Vista de grilla
  createMemory()      // Crear nueva memoria
  deleteMemory()      // Eliminar memoria
}
```

### RouteProtection (`route-protection.js`)
```javascript
class RouteProtection {
  checkAuth()         // Verificar autenticación
  validateToken()     // Validar JWT
  redirectToLogin()   // Redirección segura
}
```

## Características Especiales

### Sistema de Temas
- **Rosa**: Colores cálidos y suaves
- **Azul**: Tonos frescos y tranquilos  
- **Verde**: Colores naturales y relajantes

### Reproductor de Música
- Controles de reproducción completos
- Control de volumen
- Soporte para múltiples formatos

### Gestión de Memorias
- Tipos: Texto, Imagen, Audio, Video, Ubicación
- Posicionamiento libre en zona
- Sistema de etiquetas
- Edición in-situ

### Códigos de Acceso
- Generación automática (8 caracteres)
- Únicos por jardín
- Fácil compartición

## 📱 Diseño Responsive

- **Móvil**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+

CSS Grid y Flexbox para layouts adaptativos.

## Seguridad Implementada

- **JWT Tokens**: Autenticación stateless
- **bcrypt**: Hash de contraseñas seguro
- **Validación**: Entrada sanitizada
- **CORS**: Configurado apropiadamente
- **Route Protection**: Rutas protegidas por autenticación

## Scripts NPM

```bash
npm start          # Iniciar servidor producción
npm run dev        # Desarrollo con nodemon
npm install        # Instalar dependencias
```

## Dependencias

### Producción
- `mongoose` ^8.0.0 - ODM MongoDB
- `bcrypt` ^5.1.1 - Encriptación
- `jsonwebtoken` ^9.0.2 - JWT
- `dotenv` ^16.3.1 - Variables entorno

### Desarrollo
- `nodemon` ^3.1.10 - Auto-restart

## Estado del Proyecto

🚧 **En desarrollo:**
- Compartir jardines entre usuarios
- Guardar los jardines para usuarios ajenos al jardín

## 🤝 Contribución

1. Fork del proyecto
2. Crear rama feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit cambios (`git commit -m 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abrir Pull Request

**VS CODE** Extension Live Server para ejecutar en vivo el proyecto.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.


---

🌸 **¡Empieza a crear tus jardines de recuerdos digitales!**

**HappiEty** - Donde cada recuerdo encuentra su hogar digital 🏡✨
