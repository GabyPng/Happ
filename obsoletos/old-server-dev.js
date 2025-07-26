/**
 * Servidor simple para desarrollo sin MongoDB
 * Solo sirve archivos estáticos y maneja algunos endpoints de prueba
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Datos de ejemplo en memoria
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

// Función para parsear el cuerpo de la request
function parseRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch (error) {
                resolve({});
            }
        });
        req.on('error', reject);
    });
}

// Función para manejar rutas API
async function handleApiRoutes(req, res, pathname) {
    const { method } = req;
    
    try {
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        if (method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return true;
        }
        
        // Rutas de memorias
        if (pathname.startsWith('/api/memorias')) {
            if (method === 'GET' && pathname.includes('/jardin/')) {
                // Obtener memorias de un jardín
                const gardenId = pathname.split('/').pop();
                console.log('Solicitando memorias para jardín:', gardenId);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(sampleMemories));
                return true;
            }
            
            if (method === 'POST' && pathname === '/api/memorias') {
                // Crear nueva memoria
                const data = await parseRequestBody(req);
                const newMemory = {
                    _id: 'new-' + Date.now(),
                    garden: data.garden,
                    memoryType: data.memoryType,
                    ...data,
                    createdAt: new Date(),
                    modifiedDate: new Date(),
                    isActive: true
                };
                
                sampleMemories.unshift(newMemory);
                
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(newMemory));
                return true;
            }
            
            if (method === 'DELETE' && pathname.includes('/api/memorias/')) {
                // Eliminar memoria
                const memoryId = pathname.split('/')[3];
                const index = sampleMemories.findIndex(m => m._id === memoryId);
                
                if (index !== -1) {
                    sampleMemories.splice(index, 1);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, message: 'Memoria eliminada' }));
                } else {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Memoria no encontrada' }));
                }
                return true;
            }
        }
        
        // Rutas de jardines
        if (pathname.startsWith('/api/jardines')) {
            if (method === 'GET' && pathname.includes('/codigo/')) {
                // Buscar jardín por código
                const accessCode = pathname.split('/').pop();
                console.log('Solicitando jardín con código:', accessCode);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(sampleGarden));
                return true;
            }
        }
        
        // Health check
        if (pathname === '/api/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'ok',
                mode: 'development-static',
                timestamp: new Date().toISOString()
            }));
            return true;
        }
        
    } catch (error) {
        console.error('Error en API:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            error: 'Error interno del servidor',
            message: error.message 
        }));
        return true;
    }
    
    return false; // No fue una ruta API
}

// Función para obtener MIME type
function getMimeType(ext) {
    const mimeTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon'
    };
    return mimeTypes[ext] || 'application/octet-stream';
}

// Servidor principal
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;
    
    console.log(`${req.method} ${pathname}`);
    
    // Habilitar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Manejar rutas API
    if (pathname.startsWith('/api/')) {
        const handled = await handleApiRoutes(req, res, pathname);
        if (handled) return;
    }
    
    // Servir archivos estáticos
    if (pathname === '/') {
        pathname = '/index.html';
    }
    
    const filePath = path.join(__dirname, '..', 'public', pathname);
    
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(`
                <html>
                    <head><title>404 - Archivo no encontrado</title></head>
                    <body>
                        <h1>404 - Página no encontrada</h1>
                        <p>El archivo "${pathname}" no existe.</p>
                        <a href="/">Volver al inicio</a>
                    </body>
                </html>
            `);
            return;
        }
        
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error interno del servidor');
                return;
            }
            
            const ext = path.extname(filePath);
            const mimeType = getMimeType(ext);
            
            res.writeHead(200, { 'Content-Type': mimeType });
            res.end(data);
        });
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log('🚀 Servidor HappiEty iniciado');
    console.log(`📍 Corriendo en: http://localhost:${PORT}`);
    console.log('📝 Modo: Desarrollo con datos estáticos');
    console.log('💡 Para la demostración, no necesitas MongoDB');
});

// Manejo de señales para cierre elegante
process.on('SIGINT', () => {
    console.log('\n⏹️ Cerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n⏹️ Cerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
    });
});
