// EJEMPLOS DE USO BÁSICO DE LOS MODELOS
const { Usuario, Jardin, Memory, TextMemory, ImageMemory } = require('../models');

class DatabaseExamples {
    
    // ============= EJEMPLOS USUARIOS =============
    
    static async crearUsuario() {
        try {
            const usuario = new Usuario({
                email: 'laura@happiety.com',
                passwordHash: 'password123', // Se hasheará automáticamente
                displayName: 'Laura 🌸',
                preferences: {
                    theme: 'rosado',
                    notifications: true
                }
            });
            
            const usuarioGuardado = await usuario.save();
            console.log('✅ Usuario creado:', usuarioGuardado.toSafeObject());
            
            return usuarioGuardado;
        } catch (error) {
            console.error('❌ Error creando usuario:', error.message);
        }
    }
    
    static async autenticarUsuario(email, password) {
        try {
            const usuario = await Usuario.findByEmail(email);
            if (!usuario) {
                throw new Error('Usuario no encontrado');
            }
            
            const isValid = await usuario.comparePassword(password);
            if (!isValid) {
                throw new Error('Contraseña incorrecta');
            }
            
            console.log('✅ Usuario autenticado:', usuario.displayName);
            return usuario.toSafeObject();
        } catch (error) {
            console.error('❌ Error autenticando:', error.message);
        }
    }
    
    // ============= EJEMPLOS JARDINES =============
    
    static async crearJardin(ownerId) {
        try {
            const jardin = new Jardin({
                owner: ownerId,
                name: 'Mi Jardín de Recuerdos 🌸',
                description: 'Un lugar especial para guardar mis momentos felices',
                theme: {
                    name: 'rosado',
                    primaryColor: '#FF0080',
                    secondaryColor: '#ffcffc'
                }
                // accessCode se genera automáticamente
            });
            
            const jardinGuardado = await jardin.save();
            console.log('✅ Jardín creado con código:', jardinGuardado.accessCode);
            
            return jardinGuardado;
        } catch (error) {
            console.error('❌ Error creando jardín:', error.message);
        }
    }
    
    static async buscarJardinPorCodigo(accessCode) {
        try {
            const jardin = await Jardin.findByAccessCode(accessCode)
                .populate('owner', 'displayName email')
                .populate('members', 'displayName')
                .populate({
                    path: 'memories',
                    options: { sort: { createdAt: -1 } }
                });
            
            if (!jardin) {
                throw new Error('Jardín no encontrado');
            }
            
            // Actualizar estadísticas de visita
            await jardin.updateStats();
            
            console.log('✅ Jardín encontrado:', jardin.name);
            console.log('👤 Propietario:', jardin.owner.displayName);
            console.log('📊 Recuerdos:', jardin.stats.memoryCount);
            
            return jardin;
        } catch (error) {
            console.error('❌ Error buscando jardín:', error.message);
        }
    }
    
    static async obtenerJardinesUsuario(userId) {
        try {
            // Jardines donde es propietario
            const jardinesPropios = await Jardin.find({ owner: userId })
                .populate('memories', 'title memoryType createdAt')
                .sort({ 'stats.lastAccessed': -1 });
            
            // Jardines donde es miembro
            const jardinesCompartidos = await Jardin.find({ 
                members: userId,
                owner: { $ne: userId }
            })
                .populate('owner', 'displayName')
                .populate('memories', 'title memoryType createdAt')
                .sort({ 'stats.lastAccessed': -1 });
            
            console.log('✅ Jardines propios:', jardinesPropios.length);
            console.log('✅ Jardines compartidos:', jardinesCompartidos.length);
            
            return {
                propios: jardinesPropios,
                compartidos: jardinesCompartidos
            };
        } catch (error) {
            console.error('❌ Error obteniendo jardines:', error.message);
        }
    }
    
    // ============= EJEMPLOS MEMORIAS =============
    
    static async crearMemoriaTexto(gardenId, data) {
        try {
            const memoria = Memory.createTextMemory(gardenId, {
                title: data.title,
                description: data.description,
                emoji: data.emoji,
                content: data.content,
                eventDate: data.eventDate || new Date()
            });
            
            const memoriaGuardada = await memoria.save();
            
            // Actualizar el jardín para incluir esta memoria
            await Jardin.findByIdAndUpdate(
                gardenId,
                { 
                    $push: { memories: memoriaGuardada._id },
                    $inc: { 'stats.memoryCount': 1 }
                }
            );
            
            console.log('✅ Memoria de texto creada:', memoriaGuardada.title);
            return memoriaGuardada;
        } catch (error) {
            console.error('❌ Error creando memoria texto:', error.message);
        }
    }
    
    static async crearMemoriaImagen(gardenId, data) {
        try {
            const memoria = Memory.createImageMemory(gardenId, {
                title: data.title,
                description: data.description,
                imageUrl: data.imageUrl,
                altText: data.altText,
                metadata: data.metadata,
                eventDate: data.eventDate || new Date()
            });
            
            const memoriaGuardada = await memoria.save();
            
            // Actualizar el jardín
            await Jardin.findByIdAndUpdate(
                gardenId,
                { 
                    $push: { memories: memoriaGuardada._id },
                    $inc: { 'stats.memoryCount': 1 }
                }
            );
            
            console.log('✅ Memoria de imagen creada:', memoriaGuardada.title);
            return memoriaGuardada;
        } catch (error) {
            console.error('❌ Error creando memoria imagen:', error.message);
        }
    }
    
    static async obtenerMemoriasJardin(gardenId) {
        try {
            const memorias = await Memory.find({ 
                garden: gardenId,
                isActive: true 
            })
                .sort({ eventDate: -1 })
                .limit(50);
            
            console.log('✅ Memorias encontradas:', memorias.length);
            
            // Agrupar por tipo
            const agrupadas = memorias.reduce((acc, memoria) => {
                const tipo = memoria.memoryType;
                if (!acc[tipo]) acc[tipo] = [];
                acc[tipo].push(memoria);
                return acc;
            }, {});
            
            console.log('📊 Tipos encontrados:', Object.keys(agrupadas));
            
            return {
                todas: memorias,
                porTipo: agrupadas
            };
        } catch (error) {
            console.error('❌ Error obteniendo memorias:', error.message);
        }
    }
    
    // ============= EJEMPLO COMPLETO =============
    
    static async ejemploCompleto() {
        try {
            console.log('🚀 Iniciando ejemplo completo...\n');
            
            // 1. Crear usuario
            const usuario = await this.crearUsuario();
            
            // 2. Crear jardín
            const jardin = await this.crearJardin(usuario._id);
            
            // 3. Crear memorias
            await this.crearMemoriaTexto(jardin._id, {
                title: 'Mi primer recuerdo 💕',
                description: 'El día que decidí crear este jardín',
                emoji: '💕',
                content: 'Hoy empiezo mi jardín de recuerdos. Quiero guardar todos los momentos felices que viva.'
            });
            
            await this.crearMemoriaImagen(jardin._id, {
                title: 'Atardecer en la playa 🌅',
                description: 'Un hermoso atardecer que vi ayer',
                imageUrl: '/uploads/atardecer.jpg',
                altText: 'Atardecer dorado en la playa'
            });
            
            // 4. Buscar jardín con memorias
            const jardinCompleto = await this.buscarJardinPorCodigo(jardin.accessCode);
            
            // 5. Obtener memorias
            await this.obtenerMemoriasJardin(jardin._id);
            
            console.log('\n✅ Ejemplo completo ejecutado exitosamente!');
            
        } catch (error) {
            console.error('❌ Error en ejemplo completo:', error.message);
        }
    }
}

module.exports = DatabaseExamples;
