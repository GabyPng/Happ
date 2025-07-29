const mongoose = require('mongoose');

// CONFIGURACIÓN BASE
const options = {
    discriminatorKey: 'memoryType',
    collection: 'memories'
};

// SCHEMA BASE PARA RECUERDOS/MEMORIAS
const baseMemorySchema = new mongoose.Schema({
    garden: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Jardin',
        required: [true, 'El jardín es requerido']
    },
    title: {
        type: String,
        required: [true, 'El título es requerido'],
        trim: true,
        maxlength: [200, 'El título no puede exceder 200 caracteres']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'La descripción no puede exceder 1000 caracteres']
    },
    eventDate: {
        type: Date,
        required: [true, 'La fecha del evento es requerida'],
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    modifiedDate: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    },
    tags: [{
        type: String,
        trim: true,
        maxlength: [50, 'Cada tag no puede exceder 50 caracteres']
    }],
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

// MODELO BASE
const Memory = mongoose.model('Memory', baseMemorySchema);

// DISCRIMINADOR: TEXT
const textSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        maxlength: 5000
    },
    emoji: {
        type: String,
        maxlength: [10, 'Emoji no puede exceder 10 caracteres']
    }
});

// DISCRIMINADOR: IMAGE
const imageSchema = new mongoose.Schema({
    filePath: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        default: 0
    },
    mimeType: {
        type: String,
        default: 'image/jpeg'
    },
    width: Number,
    height: Number,
    altText: String
});

// DISCRIMINADOR: AUDIO
const audioSchema = new mongoose.Schema({
    filePath: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        default: 0
    },
    mimeType: {
        type: String,
        default: 'audio/mpeg'
    },
    duration: {
        type: Number, // en segundos
        default: 0
    },
    artist: String,
    album: String
});

// DISCRIMINADOR: VIDEO
const videoSchema = new mongoose.Schema({
    filePath: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        default: 0
    },
    mimeType: {
        type: String,
        default: 'video/mp4'
    },
    duration: {
        type: Number, // en segundos
        default: 0
    },
    width: Number,
    height: Number,
    thumbnailPath: String
});

// DISCRIMINADOR: LOCATION
const locationSchema = new mongoose.Schema({
    coordinates: {
        lat: {
            type: Number,
            required: true,
            min: -90,
            max: 90
        },
        lng: {
            type: Number,
            required: true,
            min: -180,
            max: 180
        }
    },
    locationName: String,
    address: String,
    country: String,
    city: String
});

// CREAR DISCRIMINADORES
const TextMemory = Memory.discriminator('Text', textSchema);
const ImageMemory = Memory.discriminator('Image', imageSchema);
const AudioMemory = Memory.discriminator('Audio', audioSchema);
const VideoMemory = Memory.discriminator('Video', videoSchema);
const LocationMemory = Memory.discriminator('Location', locationSchema);

// MÉTODOS ESTÁTICOS EN EL MODELO BASE
Memory.createTextMemory = function(gardenId, data) {
    return new TextMemory({
        garden: gardenId,
        memoryType: 'Text',
        ...data
    });
};

Memory.createImageMemory = function(gardenId, data) {
    return new ImageMemory({
        garden: gardenId,
        memoryType: 'Image',
        ...data
    });
};

Memory.createVideoMemory = function(gardenId, data) {
    return new VideoMemory({
        garden: gardenId,
        memoryType: 'Video',
        ...data
    });
};

Memory.createAudioMemory = function(gardenId, data) {
    return new AudioMemory({
        garden: gardenId,
        memoryType: 'Audio',
        ...data
    });
};

Memory.createLocationMemory = function(gardenId, data) {
    return new LocationMemory({
        garden: gardenId,
        memoryType: 'Location',
        ...data
    });
};

// EXPORTAR MODELOS
module.exports = {
    Memory,
    TextMemory,
    ImageMemory,
    VideoMemory,
    AudioMemory,
    LocationMemory
};
