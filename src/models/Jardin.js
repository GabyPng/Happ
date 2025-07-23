
const mongoose = require('mongoose');

const jardinSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'Propietario es requerido']
    },
    name: {
        type: String,
        required: [true, 'Nombre del jardín es requerido'],
        trim: true,
        maxlength: [100, 'Nombre no puede exceder 100 caracteres']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Descripción no puede exceder 500 caracteres']
    },
    accessCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        match: [/^[A-Z]{4}[0-9]{4}$/, 'Código debe tener formato ABCD1234']
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
    }],
    theme: {
        name: {
            type: String,
            enum: ['rosado', 'azul', 'verde'],
            default: 'rosado'
        },
        primaryColor: {
            type: String,
            default: '#FF0080'
        },
        secondaryColor: {
            type: String,
            default: '#ffcffc'
        },
        musicUrl: {
            type: String,
            default: null
        }
    },
    stats: {
        memoryCount: {
            type: Number,
            default: 0
        },
        lastAccessed: {
            type: Date,
            default: Date.now
        },
        viewCount: {
            type: Number,
            default: 0
        }
    },
    memories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Memory'
    }],
    isPrivate: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    collection: 'jardines'
});

// ÍNDICES PARA OPTIMIZACIÓN
jardinSchema.index({ accessCode: 1 }, { unique: true });
jardinSchema.index({ owner: 1, createdAt: -1 });
jardinSchema.index({ members: 1 });
jardinSchema.index({ 'stats.lastAccessed': -1 });

// MIDDLEWARE PRE-SAVE: Generar código de acceso único
jardinSchema.pre('save', async function(next) {
    if (!this.accessCode) {
        this.accessCode = await this.constructor.generateUniqueAccessCode();
    }
    next();
});

// MÉTODOS ESTÁTICOS
jardinSchema.statics.generateUniqueAccessCode = async function() {
    let code;
    let exists = true;
    
    while (exists) {
        // Generar código formato LOVE1234
        const letters = ['L', 'O', 'V', 'E'];
        const numbers = Math.floor(1000 + Math.random() * 9000);
        code = letters.join('') + numbers;
        
        // Verificar si ya existe
        const existing = await this.findOne({ accessCode: code });
        exists = !!existing;
    }
    
    return code;
};

jardinSchema.statics.findByAccessCode = function(accessCode) {
    return this.findOne({ accessCode: accessCode.toUpperCase() });
};

// MÉTODOS DE INSTANCIA
jardinSchema.methods.addMember = async function(userId) {
    if (!this.members.includes(userId)) {
        this.members.push(userId);
        return this.save();
    }
    return this;
};

jardinSchema.methods.removeMember = async function(userId) {
    this.members = this.members.filter(id => !id.equals(userId));
    return this.save();
};

jardinSchema.methods.updateStats = async function() {
    this.stats.memoryCount = this.memories.length;
    this.stats.lastAccessed = new Date();
    this.stats.viewCount += 1;
    return this.save();
};

module.exports = mongoose.model('Jardin', jardinSchema);
