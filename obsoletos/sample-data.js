// Datos de ejemplo para desarrollo - agregar recuerdos de prueba
// Este archivo se puede ejecutar en la consola del navegador o incluir temporalmente

// Función para crear datos de ejemplo
function createSampleMemories() {
    // Simular un jardín actual
    const sampleGarden = {
        _id: '676c45a1234567890abcdef1',
        name: 'Mi Jardín de Recuerdos',
        description: 'Un lugar especial para guardar momentos importantes',
        owner: 'user123',
        accessCode: 'ABC123',
        isPrivate: false,
        memories: [],
        stats: {
            memoryCount: 5,
            views: 12,
            likes: 8
        }
    };

    // Simular memorias de ejemplo
    const sampleMemories = [
        {
            _id: '676c45a1234567890abcdef2',
            garden: '676c45a1234567890abcdef1',
            title: 'Mi graduación',
            description: 'El día más importante de mi carrera universitaria',
            memoryType: 'Text',
            content: 'Después de años de estudio, finalmente logré graduarme. Fue un momento de gran alegría y orgullo.',
            eventDate: new Date('2023-06-15'),
            createdAt: new Date('2023-06-16'),
            modifiedDate: new Date('2023-06-16'),
            isActive: true,
            tags: ['graduación', 'universidad', 'logro']
        },
        {
            _id: '676c45a1234567890abcdef3',
            garden: '676c45a1234567890abcdef1',
            title: 'Viaje a París',
            description: 'Una foto desde la Torre Eiffel',
            memoryType: 'Image',
            filePath: 'https://images.unsplash.com/photo-1549144511-f099e773c147?w=300&h=200&fit=crop',
            eventDate: new Date('2023-08-20'),
            createdAt: new Date('2023-08-21'),
            modifiedDate: new Date('2023-08-21'),
            isActive: true,
            tags: ['viaje', 'París', 'torre eiffel']
        },
        {
            _id: '676c45a1234567890abcdef4',
            garden: '676c45a1234567890abcdef1',
            title: 'Nuestra canción',
            description: 'La canción que estaba sonando cuando nos conocimos',
            memoryType: 'Audio',
            filePath: '/assets/audio/sample-song.mp3',
            eventDate: new Date('2022-02-14'),
            createdAt: new Date('2022-02-15'),
            modifiedDate: new Date('2022-02-15'),
            isActive: true,
            tags: ['música', 'amor', 'primer encuentro']
        },
        {
            _id: '676c45a1234567890abcdef5',
            garden: '676c45a1234567890abcdef1',
            title: 'Video del cumpleaños',
            description: 'Los mejores momentos de mi cumpleaños 25',
            memoryType: 'Video',
            filePath: 'https://sample-videos.com/zip/10/mp4/360/SampleVideo_360x240_1mb.mp4',
            eventDate: new Date('2023-03-10'),
            createdAt: new Date('2023-03-11'),
            modifiedDate: new Date('2023-03-11'),
            isActive: true,
            tags: ['cumpleaños', 'celebración', 'familia']
        },
        {
            _id: '676c45a1234567890abcdef6',
            garden: '676c45a1234567890abcdef1',
            title: 'Casa de la abuela',
            description: 'El lugar donde crecí y pasé mi infancia',
            memoryType: 'Location',
            locationName: 'Casa de la Abuela Elena',
            coordinates: {
                lat: 40.7128,
                lng: -74.0060
            },
            eventDate: new Date('2010-07-15'),
            createdAt: new Date('2023-01-20'),
            modifiedDate: new Date('2023-01-20'),
            isActive: true,
            tags: ['familia', 'infancia', 'casa']
        }
    ];

    // Guardar en localStorage para simular datos
    localStorage.setItem('currentGarden', JSON.stringify(sampleGarden));
    localStorage.setItem('sampleMemories', JSON.stringify(sampleMemories));
    
    console.log('Datos de ejemplo creados:', {
        garden: sampleGarden,
        memories: sampleMemories
    });
    
    // Recargar si el memory manager ya está cargado
    if (window.memoryManager) {
        window.memoryManager.currentGarden = sampleGarden;
        window.memoryManager.memories = sampleMemories;
        window.memoryManager.renderCurrentView();
    }
    
    return { garden: sampleGarden, memories: sampleMemories };
}

// Función para limpiar datos de ejemplo
function clearSampleData() {
    localStorage.removeItem('currentGarden');
    localStorage.removeItem('sampleMemories');
    console.log('Datos de ejemplo eliminados');
}

// Función para crear jardín vacío (para probar estado vacío)
function createEmptyGarden() {
    const emptyGarden = {
        _id: '676c45a1234567890abcdef1',
        name: 'Mi Jardín Vacío',
        description: 'Un jardín esperando sus primeros recuerdos',
        owner: 'user123',
        accessCode: 'ABC123',
        isPrivate: false,
        memories: [],
        stats: {
            memoryCount: 0,
            views: 0,
            likes: 0
        }
    };

    localStorage.setItem('currentGarden', JSON.stringify(emptyGarden));
    localStorage.setItem('sampleMemories', JSON.stringify([]));
    
    console.log('Jardín vacío creado para probar estado sin recuerdos');
    
    // Recargar la página si el memory manager ya está cargado
    if (window.memoryManager) {
        window.memoryManager.currentGarden = emptyGarden;
        window.memoryManager.memories = [];
        window.memoryManager.renderCurrentView();
    }
    
    return { garden: emptyGarden, memories: [] };
}

// Auto-ejecutar si estamos en modo desarrollo
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Crear datos de ejemplo automáticamente si no existen
    if (!localStorage.getItem('currentGarden')) {
        createSampleMemories();
    }
}

// Exportar funciones para uso global
window.createSampleMemories = createSampleMemories;
window.clearSampleData = clearSampleData;
window.createEmptyGarden = createEmptyGarden;
