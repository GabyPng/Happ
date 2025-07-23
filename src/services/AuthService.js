const models = require('../models');
const { generateToken } = require('../middleware/jwt');

class AuthService {
    
    // ============= REGISTRO DE USUARIO =============
    static async register(userData) {
        try {
            const { email, password, displayName } = userData;
            
            // Validar datos requeridos
            if (!email || !password || !displayName) {
                throw new Error('Email, contraseña y nombre son requeridos');
            }
            
            // Validar formato de email
            const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
            if (!emailRegex.test(email)) {
                throw new Error('Formato de email inválido');
            }
            
            // Validar longitud de contraseña
            if (password.length < 6) {
                throw new Error('La contraseña debe tener mínimo 6 caracteres');
            }
            
            // Verificar si el email ya existe
            const existingUser = await models.Usuario.findByEmail(email);
            if (existingUser) {
                throw new Error('El email ya está registrado');
            }
            
            // Crear nuevo usuario
            const usuario = new models.Usuario({
                email: email.toLowerCase().trim(),
                passwordHash: password, // Se hasheará automáticamente en el pre('save')
                displayName: displayName.trim(),
                preferences: {
                    theme: 'rosado',
                    notifications: true
                }
            });
            
            const savedUser = await usuario.save();
            
            // Generar token JWT
            const token = generateToken(savedUser);
            
            return {
                success: true,
                message: 'Usuario registrado exitosamente',
                user: savedUser.toSafeObject(),
                token
            };
            
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Error al registrar usuario'
            };
        }
    }
    
    // ============= LOGIN DE USUARIO =============
    static async login(credentials) {
        try {
            const { email, password } = credentials;
            
            // Validar datos requeridos
            if (!email || !password) {
                throw new Error('Email y contraseña son requeridos');
            }
            
            // Buscar usuario por email
            const usuario = await models.Usuario.findByEmail(email);
            if (!usuario) {
                throw new Error('Credenciales inválidas');
            }
            
            // Verificar contraseña
            const isValidPassword = await usuario.comparePassword(password);
            if (!isValidPassword) {
                throw new Error('Credenciales inválidas');
            }
            
            // Actualizar último login (si tienes este campo)
            usuario.lastLogin = new Date();
            await usuario.save();
            
            // Generar token JWT
            const token = generateToken(usuario);
            
            return {
                success: true,
                message: 'Login exitoso',
                user: usuario.toSafeObject(),
                token
            };
            
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Error al iniciar sesión'
            };
        }
    }
    
    // ============= GENERAR TOKEN JWT =============
    static generateToken(userId) {
        return generateToken({ _id: userId }); // Usar función importada
    }
    
    // ============= VERIFICAR TOKEN =============
    static verifyToken(token) {
        try {
            const { verifyToken } = require('../middleware/jwt');
            const decoded = verifyToken(token);
            return {
                success: true,
                userId: decoded.id
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Token inválido o expirado'
            };
        }
    }
    
    // ============= OBTENER USUARIO ACTUAL =============
    static async getCurrentUser(userId) {
        try {
            const usuario = await models.Usuario.findById(userId);
            if (!usuario) {
                throw new Error('Usuario no encontrado');
            }
            
            return {
                success: true,
                user: usuario.toSafeObject()
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Error al obtener usuario'
            };
        }
    }
    
    // ============= CAMBIAR CONTRASEÑA =============
    static async changePassword(userId, passwords) {
        try {
            const { currentPassword, newPassword } = passwords;
            
            // Validar datos
            if (!currentPassword || !newPassword) {
                throw new Error('Contraseña actual y nueva son requeridas');
            }
            
            if (newPassword.length < 6) {
                throw new Error('La nueva contraseña debe tener mínimo 6 caracteres');
            }
            
            // Buscar usuario
            const usuario = await models.Usuario.findById(userId);
            if (!usuario) {
                throw new Error('Usuario no encontrado');
            }
            
            // Verificar contraseña actual
            const isValidPassword = await usuario.comparePassword(currentPassword);
            if (!isValidPassword) {
                throw new Error('Contraseña actual incorrecta');
            }
            
            // Actualizar contraseña
            usuario.passwordHash = newPassword; // Se hasheará automáticamente
            await usuario.save();
            
            return {
                success: true,
                message: 'Contraseña actualizada exitosamente'
            };
            
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Error al cambiar contraseña'
            };
        }
    }
    
    // ============= LOGOUT (INVALIDAR TOKEN) =============
    static logout() {
        // En este caso simple, el logout se maneja en el frontend
        // eliminando el token del localStorage
        return {
            success: true,
            message: 'Logout exitoso'
        };
    }
}

module.exports = AuthService;
