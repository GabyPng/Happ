// EXPORTAR TODOS LOS MODELOS DE LA APLICACIÓN

const Usuario = require('./Usuario');
const Jardin = require('./Jardin');
const { 
    Memory, 
    TextMemory, 
    ImageMemory, 
    VideoMemory, 
    AudioMemory, 
    LocationMemory 
} = require('./Recuerdos');

module.exports = {
    // MODELOS PRINCIPALES
    Usuario,
    Jardin,
    Memory,
    
    // DISCRIMINADORES DE MEMORY
    TextMemory,
    ImageMemory,
    VideoMemory,
    AudioMemory,
    LocationMemory
};
