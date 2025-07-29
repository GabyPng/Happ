
const mongoose = require('mongoose');

// CONFIGURACIÓN PARA DISCRIMINADORES
const options = { 
    discriminatorKey: 'memoryType', 
    timestamps: true,
    collection: 'memories'
};

// ESQUEMA BASE DE MEMORY
const baseMemorySchema = new mongoose.Schema({
    garden: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Jardin',
        required: [true, 'Jardín es requerido']
    },
    title: {
        type: String,
        required: [true, 'Título es requerido'],
        trim: true,
        maxlength: [200, 'Título no puede exceder 200 caracteres']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Descripción no puede exceder 1000 caracteres']
    },
    eventDate: {
        type: Date,
        default: Date.now
    },
    position: {
        x: {
            type: Number,
            default: 0
        },
        y: {
            type: Number,
            default: 0
        },
        zIndex: {
            type: Number,
            default: 1
        }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, options);

// ÍNDICES BASE
baseMemorySchema.index({ garden: 1, createdAt: -1 });
baseMemorySchema.index({ memoryType: 1 });
baseMemorySchema.index({ eventDate: -1 });

// MÉTODOS BASE
baseMemorySchema.methods.updatePosition = function(x, y, zIndex = null) {
    this.position.x = x;
    this.position.y = y;
    if (zIndex !== null) this.position.zIndex = zIndex;
    return this.save();
};

// MÉTODOS ESTÁTICOS PARA CREAR MEMORIAS ESPECÍFICAS (definir antes del modelo)
baseMemorySchema.statics.createTextMemory = function(gardenId, data) {
    const TextMemory = this.discriminators?.Text || mongoose.model('Text');
    return new TextMemory({
        garden: gardenId,
        memoryType: 'Text',
        ...data
    });
};

baseMemorySchema.statics.createImageMemory = function(gardenId, data) {
    const ImageMemory = this.discriminators?.Image || mongoose.model('Image');
    return new ImageMemory({
        garden: gardenId,
        memoryType: 'Image',
        ...data
    });
};

baseMemorySchema.statics.createVideoMemory = function(gardenId, data) {
    const VideoMemory = this.discriminators?.Video || mongoose.model('Video');
    return new VideoMemory({
        garden: gardenId,
        memoryType: 'Video',
        ...data
    });
};

baseMemorySchema.statics.createAudioMemory = function(gardenId, data) {
    const AudioMemory = this.discriminators?.Audio || mongoose.model('Audio');
    return new AudioMemory({
        garden: gardenId,
        memoryType: 'Audio',
        ...data
    });
};

baseMemorySchema.statics.createLocationMemory = function(gardenId, data) {
    const LocationMemory = this.discriminators?.Location || mongoose.model('Location');
    return new LocationMemory({
        garden: gardenId,
        memoryType: 'Location',
        ...data
    });
};

// MODELO BASE
const Memory = mongoose.model('Memory', baseMemorySchema);

// DISCRIMINADOR: TEXT
const textSchema = new mongoose.Schema({
    emoji: {
        type: String,
        maxlength: [10, 'Emoji no puede exceder 10 caracteres']
    },
    content: {
        type: String,
        required: [true, 'Contenido de texto es requerido'],
        maxlength: [5000, 'Contenido no puede exceder 5000 caracteres']
    }
});

// DISCRIMINADOR: IMAGE
const imageSchema = new mongoose.Schema({
    imageUrl: {
        type: String,
        required: [true, 'URL de imagen es requerida']
    },
    altText: {
        type: String,
        maxlength: [200, 'Texto alternativo no puede exceder 200 caracteres']
    },
    metadata: {
        width: Number,
        height: Number,
        fileSize: Number,
        mimeType: String
    }
});

// DISCRIMINADOR: VIDEO
const videoSchema = new mongoose.Schema({
    videoUrl: {
        type: String,
        required: [true, 'URL de video es requerida']
    },
    thumbnailUrl: String,
    metadata: {
        duration: Number, // en segundos
        fileSize: Number,
        mimeType: String,
        resolution: String
    }
});

// DISCRIMINADOR: AUDIO
const audioSchema = new mongoose.Schema({
    artist: {
        type: String,
        trim: true,
        maxlength: [100, 'Artista no puede exceder 100 caracteres']
    },
    album: {
        type: String,
        trim: true,
        maxlength: [100, 'Álbum no puede exceder 100 caracteres']
    },
    audioUrl: {
        type: String,
        required: [true, 'URL de audio es requerida']
    },
    metadata: {
        duration: Number, // en segundos
        fileSize: Number,
        bitRate: Number,
        mimeType: String
    }
});

// DISCRIMINADOR: LOCATION
const locationSchema = new mongoose.Schema({
    latitude: {
        type: Number,
        required: [true, 'Latitud es requerida'],
        min: [-90, 'Latitud debe estar entre -90 y 90'],
        max: [90, 'Latitud debe estar entre -90 y 90']
    },
    longitude: {
        type: Number,
        required: [true, 'Longitud es requerida'],
        min: [-180, 'Longitud debe estar entre -180 y 180'],
        max: [180, 'Longitud debe estar entre -180 y 180']
    },
    placeName: {
        type: String,
        trim: true,
        maxlength: [200, 'Nombre del lugar no puede exceder 200 caracteres']
    },
    address: {
        type: String,
        trim: true,
        maxlength: [500, 'Dirección no puede exceder 500 caracteres']
    }
});

// REGISTRAR DISCRIMINADORES
const TextMemory = Memory.discriminator('Text', textSchema);
const ImageMemory = Memory.discriminator('Image', imageSchema);
const VideoMemory = Memory.discriminator('Video', videoSchema);
const AudioMemory = Memory.discriminator('Audio', audioSchema);
const LocationMemory = Memory.discriminator('Location', locationSchema);

// EXPORTAR MODELOS
module.exports = {
    Memory,
    TextMemory,
    ImageMemory,
    VideoMemory,
    AudioMemory,
    LocationMemory
};
