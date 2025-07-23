# 🔐 **SISTEMA DE AUTENTICACIÓN COMPLETO - HAPPIETY**

**Documentación técnica completa del sistema de autenticación implementado en HappiEty**

---

## 📋 **Arquitectura General**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FRONTEND      │    │   MIDDLEWARE    │    │   BACKEND       │
│                 │    │                 │    │                 │
│ • AuthManager   │◄──►│ • JWT Tokens    │◄──►│ • AuthService   │
│ • RouteProtection│    │ • Verificación  │    │ • Usuario Model │
│ • UI Components │    │ • CORS          │    │ • Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **🏗️ Componentes Implementados**

#### **Backend (Servidor):**
- ✅ **AuthService** - Lógica completa de autenticación y registro
- ✅ **JWT Middleware** - Generación, verificación y gestión de tokens
- ✅ **Usuario Model** - Esquema de base de datos con validaciones
- ✅ **Bcrypt Integration** - Hash seguro de contraseñas con salt
- ✅ **API Endpoints** - Rutas completas de autenticación
- ✅ **Error Handling** - Manejo robusto de errores
- ✅ **Security Headers** - CORS y headers de seguridad

#### **Frontend (Cliente):**  
- ✅ **AuthManager Class** - Gestión completa de autenticación del cliente
- ✅ **Route Protection** - Protección automática de páginas
- ✅ **UI Components** - Interfaz completa de login/registro
- ✅ **Local Storage** - Persistencia segura de sesión
- ✅ **API Integration** - Comunicación con backend
- ✅ **Error Messages** - Feedback visual para usuarios
- ✅ **Form Validation** - Validación en tiempo real

#### **Base de Datos:**
- ✅ **User Schema** - Esquema completo con validaciones
- ✅ **Indexing** - Índices optimizados para búsquedas
- ✅ **Pre-save Hooks** - Hash automático de contraseñas
- ✅ **Instance Methods** - Métodos de comparación y serialización
- ✅ **Static Methods** - Búsquedas y operaciones de usuario

---

## 🌐 **API ENDPOINTS COMPLETA**

### **🔐 Endpoints de Autenticación**

#### **1. Registro de Usuario**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "password": "password123",
  "displayName": "Nombre Usuario"
}
```

**Respuesta Exitosa (201):**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "usuario@ejemplo.com",
    "displayName": "Nombre Usuario",
    "preferences": {
      "theme": "rosado",
      "notifications": true
    },
    "stats": {
      "totalGardens": 0,
      "totalMemories": 0
    },
    "lastLogin": "2025-07-23T19:00:00.000Z",
    "createdAt": "2025-07-23T19:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "7d"
}
```

**Errores Posibles (400):**
```json
{
  "success": false,
  "message": "El email ya está registrado"
}
// o
{
  "success": false,
  "message": "Formato de email inválido"
}
// o
{
  "success": false,
  "message": "La contraseña debe tener mínimo 6 caracteres"
}
```

#### **2. Inicio de Sesión**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "password": "password123"
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Login exitoso",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "usuario@ejemplo.com",
    "displayName": "Nombre Usuario",
    "preferences": {
      "theme": "rosado",
      "notifications": true
    },
    "stats": {
      "totalGardens": 2,
      "totalMemories": 15
    },
    "lastLogin": "2025-07-23T19:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "7d"
}
```

**Error de Credenciales (401):**
```json
{
  "success": false,
  "message": "Credenciales inválidas"
}
```

#### **3. Usuario Actual (Ruta Protegida)**
```http
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "usuario@ejemplo.com",
    "displayName": "Nombre Usuario",
    "preferences": {
      "theme": "verde",
      "notifications": false
    },
    "stats": {
      "totalGardens": 3,
      "totalMemories": 18
    },
    "lastLogin": "2025-07-23T18:45:00.000Z"
  }
}
```

#### **4. Cerrar Sesión**
```http
POST /api/auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Logout exitoso"
}
```

#### **5. Estado del Servidor**
```http
GET /api/health
```

**Respuesta:**
```json
{
  "status": "ok",
  "database": "memory", // o "mongodb"
  "users": 5,
  "timestamp": "2025-07-23T19:00:00.000Z"
}
```

---

## 🔧 **IMPLEMENTACIÓN TÉCNICA DETALLADA**

### **1. JWT Token Management**

#### **Estructura del Token JWT:**
```javascript
// Header
{
  "alg": "HS256",
  "typ": "JWT"
}

// Payload
{
  "id": "507f1f77bcf86cd799439011",
  "email": "usuario@ejemplo.com", 
  "displayName": "Nombre Usuario",
  "iat": 1642781700,  // Issued at
  "exp": 1643386500   // Expires (7 días después)
}

// Signature (firmado con JWT_SECRET)
```

#### **Middleware de Verificación:**
```javascript
// src/middleware/jwt.js

function authenticateToken(req, res, next) {
    // 1. Extraer token del header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
        return res.status(401).json({ 
            error: 'Token de acceso requerido',
            code: 'NO_TOKEN'
        });
    }
    
    try {
        // 2. Verificar y decodificar token
        const decoded = verifyToken(token);
        
        // 3. Agregar información del usuario a req
        req.user = decoded;
        
        // 4. Continuar con la siguiente función
        next();
    } catch (error) {
        return res.status(403).json({ 
            error: error.message,
            code: 'INVALID_TOKEN'
        });
    }
}
```

### **2. Password Hashing con Bcrypt**

#### **Hash en el Pre-save Hook:**
```javascript
// src/models/Usuario.js

usuarioSchema.pre('save', async function(next) {
    // Solo hashear si el password fue modificado
    if (!this.isModified('passwordHash')) return next();
    
    try {
        // Generar salt con cost factor de 12
        const salt = await bcrypt.genSalt(12);
        
        // Hashear password con el salt
        this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
        
        next();
    } catch (error) {
        next(error);
    }
});
```

#### **Comparación de Passwords:**
```javascript
usuarioSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        // Comparar password en texto plano con hash almacenado
        return await bcrypt.compare(candidatePassword, this.passwordHash);
    } catch (error) {
        throw new Error('Error comparando passwords');
    }
};
```

### **3. Validación de Datos**

#### **Validación de Email:**
```javascript
const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

function validateEmail(email) {
    if (!email) {
        throw new Error('Email es requerido');
    }
    
    if (!emailRegex.test(email)) {
        throw new Error('Formato de email inválido');
    }
    
    return email.toLowerCase().trim();
}
```

#### **Validación de Password:**
```javascript
function validatePassword(password) {
    if (!password) {
        throw new Error('Password es requerido');
    }
    
    if (password.length < 6) {
        throw new Error('Password debe tener mínimo 6 caracteres');
    }
    
    // Opcional: validaciones adicionales
    if (!/(?=.*[a-z])/.test(password)) {
        throw new Error('Password debe contener al menos una minúscula');
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
        throw new Error('Password debe contener al menos una mayúscula');
    }
    
    if (!/(?=.*\d)/.test(password)) {
        throw new Error('Password debe contener al menos un número');
    }
    
    return password;
}
```

### **4. Frontend Authentication Manager**

#### **Clase Principal AuthManager:**
```javascript
// public/js/auth.js

class AuthManager {
    constructor() {
        this.apiUrl = 'http://localhost:3000/api';
        this.tokenKey = 'happiety_token';
        this.userKey = 'happiety_user';
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.checkAuthentication();
        this.setupFormValidation();
    }
    
    setupEventListeners() {
        // Event listeners para formularios
        const loginForm = document.querySelector('form.login');
        const signupForm = document.querySelector('form.signup');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin(new FormData(loginForm));
            });
        }
        
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSignup(new FormData(signupForm));
            });
        }
    }
    
    setupFormValidation() {
        // Validación en tiempo real
        const emailInputs = document.querySelectorAll('input[type="email"]');
        const passwordInputs = document.querySelectorAll('input[type="password"]');
        
        emailInputs.forEach(input => {
            input.addEventListener('blur', this.validateEmailInput.bind(this));
        });
        
        passwordInputs.forEach(input => {
            input.addEventListener('input', this.validatePasswordInput.bind(this));
        });
    }
    
    validateEmailInput(event) {
        const email = event.target.value;
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        
        if (email && !emailRegex.test(email)) {
            this.showFieldError(event.target, 'Formato de email inválido');
            return false;
        }
        
        this.clearFieldError(event.target);
        return true;
    }
    
    validatePasswordInput(event) {
        const password = event.target.value;
        const strengthMeter = event.target.parentNode.querySelector('.password-strength');
        
        if (password.length < 6) {
            this.updatePasswordStrength(strengthMeter, 'weak', 'Muy débil');
        } else if (password.length < 8) {
            this.updatePasswordStrength(strengthMeter, 'medium', 'Medio');
        } else {
            this.updatePasswordStrength(strengthMeter, 'strong', 'Fuerte');
        }
    }
    
    async handleSignup(formData) {
        try {
            this.clearMessages();
            
            // Preparar datos
            const userData = {
                email: formData.get('email'),
                password: formData.get('password'),
                displayName: formData.get('displayName')
            };
            
            // Validaciones del lado cliente
            if (!this.validateSignupData(userData)) {
                return;
            }
            
            // Mostrar estado de carga
            this.showLoading(true);
            
            // Hacer petición al servidor
            const response = await fetch(`${this.apiUrl}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Guardar datos de autenticación
                this.saveAuthData(result.token, result.user);
                
                // Mostrar mensaje de éxito
                this.showMessage('¡Registro exitoso! Redirigiendo...', 'success');
                
                // Redirigir después de 1 segundo
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                this.showMessage(result.message, 'error');
            }
            
        } catch (error) {
            console.error('Error en registro:', error);
            this.showMessage('Error de conexión. Intenta de nuevo.', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    validateSignupData(userData) {
        const { email, password, displayName } = userData;
        
        // Validar email
        if (!email) {
            this.showMessage('Email es requerido', 'error');
            return false;
        }
        
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            this.showMessage('Formato de email inválido', 'error');
            return false;
        }
        
        // Validar password
        if (!password) {
            this.showMessage('Password es requerido', 'error');
            return false;
        }
        
        if (password.length < 6) {
            this.showMessage('Password debe tener mínimo 6 caracteres', 'error');
            return false;
        }
        
        // Validar display name
        if (!displayName || displayName.trim().length < 2) {
            this.showMessage('Nombre debe tener mínimo 2 caracteres', 'error');
            return false;
        }
        
        return true;
    }
    
    saveAuthData(token, user) {
        localStorage.setItem(this.tokenKey, token);
        localStorage.setItem(this.userKey, JSON.stringify(user));
    }
    
    // Métodos estáticos para uso global
    static isAuthenticated() {
        const token = localStorage.getItem('happiety_token');
        const user = localStorage.getItem('happiety_user');
        return !!(token && user);
    }
    
    static getCurrentUser() {
        const user = localStorage.getItem('happiety_user');
        return user ? JSON.parse(user) : null;
    }
    
    static getToken() {
        return localStorage.getItem('happiety_token');
    }
    
    static logout() {
        localStorage.removeItem('happiety_token');
        localStorage.removeItem('happiety_user');
        window.location.href = 'login-signup.html';
    }
    
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
            
            // Si el token expiró o es inválido
            if (response.status === 401 || response.status === 403) {
                console.warn('Token expirado o inválido, haciendo logout...');
                this.logout();
                return null;
            }
            
            const data = await response.json();
            return data;
            
        } catch (error) {
            console.error('Error en API call:', error);
            throw error;
        }
    }
}
```

---

## 🔒 **CONFIGURACIÓN DE SEGURIDAD**

### **1. Variables de Entorno**
```bash
# .env
JWT_SECRET=tu_clave_secreta_muy_larga_y_segura_aqui_2024
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
NODE_ENV=production
CORS_ORIGIN=https://tu-dominio.com

# MongoDB (si se usa)
MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/happiety
DB_NAME=happiety_prod

# Rate Limiting
RATE_LIMIT_WINDOW=15 # minutos
RATE_LIMIT_MAX=100   # requests por ventana

# SSL/HTTPS (producción)
SSL_CERT_PATH=/path/to/certificate.crt
SSL_KEY_PATH=/path/to/private.key
```

### **2. Headers de Seguridad**
```javascript
// Configuración de CORS y headers de seguridad
app.use((req, res, next) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Seguridad
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    next();
});
```

### **3. Rate Limiting**
```javascript
// Implementación básica de rate limiting
const rateLimiter = new Map();

function rateLimit(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutos
    const maxRequests = 100;
    
    if (!rateLimiter.has(ip)) {
        rateLimiter.set(ip, { count: 1, resetTime: now + windowMs });
        return next();
    }
    
    const record = rateLimiter.get(ip);
    
    if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + windowMs;
        return next();
    }
    
    if (record.count >= maxRequests) {
        return res.status(429).json({
            error: 'Demasiadas peticiones',
            retryAfter: Math.ceil((record.resetTime - now) / 1000)
        });
    }
    
    record.count++;
    next();
}
```

---

## 🧪 **PRUEBAS Y VALIDACIÓN**

### **1. Suite de Pruebas Manuales**

#### **Página de Pruebas: `/auth-test.html`**
- ✅ Registro de nuevos usuarios
- ✅ Login con credenciales válidas
- ✅ Verificación de tokens
- ✅ Logout y limpieza de sesión
- ✅ Manejo de errores
- ✅ Estado del servidor

### **2. Comandos cURL para Testing**

#### **Test de Registro:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@happiety.com",
    "password": "password123",
    "displayName": "Usuario de Prueba"
  }' | jq '.'
```

#### **Test de Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@happiety.com", 
    "password": "password123"
  }' | jq '.'
```

#### **Test de Usuario Autenticado:**
```bash
# Usar el token del response anterior
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

### **3. Casos de Prueba de Validación**

#### **Emails Inválidos:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "email-invalido", "password": "123456", "displayName": "Test"}'
# Esperado: Error de formato de email
```

#### **Passwords Débiles:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "password": "123", "displayName": "Test"}'
# Esperado: Error de longitud mínima
```

#### **Usuario Duplicado:**
```bash
# Registrar usuario
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "duplicate@test.com", "password": "123456", "displayName": "Test"}'

# Intentar registrar el mismo email
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "duplicate@test.com", "password": "123456", "displayName": "Test2"}'
# Esperado: Error de email ya registrado
```

---

## 🚀 **DEPLOYMENT Y PRODUCCIÓN**

### **1. Configuración de Producción**

#### **Variables de Entorno de Producción:**
```bash
NODE_ENV=production
JWT_SECRET=clave_super_secreta_y_larga_para_produccion_2024
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12
MONGO_URI=mongodb+srv://admin:password@cluster.mongodb.net/happiety_prod
CORS_ORIGIN=https://happiety.com
PORT=443
SSL_CERT_PATH=/etc/ssl/certs/happiety.crt
SSL_KEY_PATH=/etc/ssl/private/happiety.key
```

#### **Configuración de HTTPS:**
```javascript
const https = require('https');
const fs = require('fs');

const options = {
    cert: fs.readFileSync(process.env.SSL_CERT_PATH),
    key: fs.readFileSync(process.env.SSL_KEY_PATH)
};

const server = https.createServer(options, app);
```

### **2. Monitoreo y Logs**

#### **Logging de Autenticación:**
```javascript
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

// Log de eventos de autenticación
function logAuthEvent(event, userId, email, ip) {
    logger.info({
        event,
        userId,
        email,
        ip,
        timestamp: new Date().toISOString()
    });
}

// Ejemplos de uso:
logAuthEvent('USER_REGISTERED', userId, email, req.ip);
logAuthEvent('USER_LOGIN', userId, email, req.ip);
logAuthEvent('USER_LOGOUT', userId, email, req.ip);
logAuthEvent('TOKEN_EXPIRED', userId, email, req.ip);
```

---

## ❓ **FAQ Y TROUBLESHOOTING**

### **Errores Comunes:**

#### **1. "jwt must be provided"**
- **Causa**: No se está enviando el token en el header Authorization
- **Solución**: Agregar `Authorization: Bearer [token]` al header

#### **2. "User already exists"**
- **Causa**: Email ya registrado en la base de datos
- **Solución**: Usar otro email o implementar recuperación de contraseña

#### **3. "Invalid credentials"**
- **Causa**: Email o contraseña incorrectos
- **Solución**: Verificar credenciales o implementar recuperación

#### **4. "Token expired"**
- **Causa**: JWT ha expirado (después de 7 días)
- **Solución**: Hacer login nuevamente o implementar refresh tokens

### **Debug Tips:**

```javascript
// Verificar token manualmente
const jwt = require('jsonwebtoken');
const token = "eyJhbGciOiJIUzI1NiIs...";

try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token válido:', decoded);
} catch (error) {
    console.log('Token inválido:', error.message);
}

// Verificar hash de password
const bcrypt = require('bcrypt');
const password = "password123";
const hash = "$2b$12$...";

bcrypt.compare(password, hash).then(result => {
    console.log('Password match:', result);
});
```

---

**🎯 El sistema de autenticación está completamente implementado y listo para producción. Incluye todas las características modernas de seguridad y está preparado para escalar.** 
    "displayName": "Laura Paniagua",
    "preferences": { "theme": "rosado" },
    "createdAt": "2025-01-23T10:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### **Login:**
```javascript
POST /api/auth/login
Content-Type: application/json

{
  "email": "laura@happiety.com",  
  "password": "mipassword123"
}

// Respuesta:
{
  "success": true,
  "message": "Login exitoso",
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### **Obtener perfil (requiere autenticación):**
```javascript
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Respuesta:
{
  "success": true,
  "user": {
    "_id": "...",
    "email": "laura@happiety.com",
    "displayName": "Laura Paniagua",
    "lastLogin": "2025-01-23T10:30:00.000Z"
  }
}
```

---

## 💻 **Frontend - JavaScript**

### **Uso básico:**
```javascript
// Verificar si está logueado
if (AuthManager.isAuthenticated()) {
    console.log('Usuario logueado');
}

// Obtener usuario actual  
const user = AuthManager.getCurrentUser();
console.log('Hola', user.displayName);

// Hacer petición autenticada
const result = await AuthManager.apiCall('/jardines', {
    method: 'POST',
    body: JSON.stringify({ name: 'Mi Jardín' })
});

// Cerrar sesión
AuthManager.logout();
```

### **Protección de páginas:**
```javascript
// Automático - solo incluir el script
<script src="./js/auth.js"></script>
<script src="./js/route-protection.js"></script>

// Las páginas verifican autenticación automáticamente
// Si no está logueado, redirige a login-signup.html
```

---

## 🛡️ **Seguridad Implementada**

### **Contraseñas:**
- ✅ Hash con **bcrypt** (12 rounds)
- ✅ Validación mínimo 6 caracteres
- ✅ No se almacenan en texto plano

### **Tokens JWT:**
- ✅ Firmados con clave secreta
- ✅ Expiración de 7 días
- ✅ Verificación automática

### **Validaciones:**
- ✅ Formato de email
- ✅ Campos requeridos
- ✅ Sanitización de entrada
- ✅ Mensajes de error seguros

---

## 🚀 **Cómo usar en tu aplicación**

### **1. Incluir scripts en HTML:**
```html
<head>
    <script src="./js/auth.js"></script>
    <script src="./js/route-protection.js"></script>
</head>
```

### **2. Agregar elementos UI opcionales:**
```html
<!-- Mostrar nombre de usuario -->
<span class="user-name"></span>

<!-- Botón de logout -->
<button class="logout-btn">Cerrar Sesión</button>

<!-- Menú de usuario (se muestra/oculta automáticamente) -->
<div class="user-menu" style="display: none;">
    <span class="user-name"></span>
    <button class="logout-btn">Logout</button>
</div>
```

### **3. Usar en JavaScript:**
```javascript
// En cualquier página, verificar autenticación
document.addEventListener('DOMContentLoaded', () => {
    if (AuthManager.isAuthenticated()) {
        const user = AuthManager.getCurrentUser();
        console.log('Bienvenido', user.displayName);
        
        // Cargar datos del usuario
        loadUserData();
    } else {
        // Redirigir a login
        window.location.href = 'login-signup.html';
    }
});

// Hacer peticiones autenticadas
async function createGarden(gardenData) {
    const result = await AuthManager.apiCall('/jardines', {
        method: 'POST',
        body: JSON.stringify(gardenData)
    });
    
    if (result.success) {
        console.log('Jardín creado:', result.garden);
    }
}
```

---

## 🔄 **Flujo de autenticación**

### **Registro/Login:**
1. Usuario completa formulario
2. Frontend envía datos a `/api/auth/register` o `/api/auth/login`
3. Backend valida y hashea contraseña
4. Se genera token JWT
5. Token y usuario se guardan en localStorage  
6. Redirección a página principal

### **Navegación:**
1. Cada página verifica `AuthManager.isAuthenticated()`
2. Si no está logueado → redirige a login
3. Si está logueado → carga contenido y datos

### **Peticiones API:**
1. `AuthManager.apiCall()` incluye token automáticamente
2. Backend verifica token en middleware
3. Si token válido → procesa petición
4. Si token inválido → error 401/403

---

## 🛠️ **Comandos para probar**

```bash
# 1. Iniciar servidor
npm run dev

# 2. Probar registro
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@happiety.com","password":"123456","displayName":"Usuario Test"}'

# 3. Probar login  
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@happiety.com","password":"123456"}'

# 4. Probar perfil (usar token del login)
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

---

## ⚡ **Características principales**

- ✅ **Registro y login** completo
- ✅ **Protección automática** de páginas
- ✅ **Persistencia de sesión** en localStorage  
- ✅ **Tokens JWT** con expiración
- ✅ **Mensajes de error** amigables
- ✅ **UI responsive** con loading states
- ✅ **Logout automático** si token expira
- ✅ **Integración fácil** con el resto de la app

¡Tu sistema de autenticación está **listo y completamente funcional**! 🎉
