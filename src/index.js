const args = process.argv.slice(2); // 

let min =1;
let max = 100;

if (args.length >= 2) {
    const parseMin = parseInt(args[0],10)
    const parseMax = parseInt(args[1],10);

    if (!isNaN(parseMin) && !isNaN(parseMax) && parseMin < parseMax) {
        min = parseMin;
        max = parseMax;
    }else {
        console.error("Rango inválido (1-100)");
    }
}

const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
console.log(`Número aleatorio entre ${min} y ${max}: ${randomNumber}`);




// index.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

// Función para obtener el tipo MIME del archivo
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav'
  };
  return mimeTypes[ext] || 'text/plain';
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;

  // Si es la raíz, servir index.html
  if (pathname === '/') {
    pathname = '/index.html';
  }

  // Construir la ruta del archivo
  const filePath = path.join(__dirname, '..', 'public', pathname);

  // Verificar si el archivo existe
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // Archivo no encontrado
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 - Página no encontrada</h1>');
      return;
    }

    // Leer y servir el archivo
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<h1>500 - Error interno del servidor</h1>');
        return;
      }

      const mimeType = getMimeType(filePath);
      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(data);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor HappiEty ejecutándose en:`);
  console.log(`- Local: http://localhost:${PORT}`);
  console.log(`- Red: http://[tu-ip-local]:${PORT}`);
  console.log('Archivos estáticos servidos desde la carpeta public/');
  console.log('Para obtener tu IP: ipconfig (Windows) o ifconfig (Linux/Mac) :)');
});