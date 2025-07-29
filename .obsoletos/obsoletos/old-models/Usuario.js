const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

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
        minlength: [6, 'Password debe tener mínimo 6 caracteres']
    },
    displayName: {
        type: String,
        trim: true,
        maxlength: [50, 'Nombre no puede exceder 50 caracteres']
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
        totalGardens: {
            type: Number,
            default: 0
        },
        totalMemories: {
            type: Number,
            default: 0
        }
    },
    lastLogin: {
        type: Date,
        default: null
    }
}, {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
    collection: 'usuarios'
});

// ÍNDICES PARA OPTIMIZACIÓN
usuarioSchema.index({ email: 1 }, { unique: true });
usuarioSchema.index({ createdAt: -1 });

// MIDDLEWARE PRE-SAVE: Hash de password
usuarioSchema.pre('save', async function(next) {
    // Solo hashear si el password fue modificado
    if (!this.isModified('passwordHash')) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// MÉTODOS DE INSTANCIA
usuarioSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.passwordHash);
};

usuarioSchema.methods.toSafeObject = function() {
    const { passwordHash, __v, ...safeUser } = this.toObject();
    return safeUser;
};

// MÉTODOS ESTÁTICOS
usuarioSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

usuarioSchema.statics.updateStats = async function(userId, jardinesCount, memoriesCount) {
    return this.findByIdAndUpdate(
        userId,
        { 
            'stats.totalGardens': jardinesCount,
            'stats.totalMemories': memoriesCount
        },
        { new: true }
    );
};

module.exports = mongoose.model('Usuario', usuarioSchema);