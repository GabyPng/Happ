# 🐧 Guía de Instalación en WSL (Windows Subsystem for Linux)

Esta guía está dirigida a estudiantes que usan Windows y quieren desarrollar en un entorno Linux.

## 🚀 Instalación de WSL

### 1. **Instalar WSL**
Abrir **Command Prompt (cmd)** como administrador y ejecutar:
```bash
wsl --install -d ubuntu
```

Después de la instalación:
- Te pedirá crear un **usuario** y **contraseña**
- Anota bien estos datos, los necesitarás siempre

### 2. **Verificar la Instalación**
Deberías ver algo como:
```bash
usuario@Nombre-de-la-computadora:/mnt/c/Users/TuUsuarioWindows$
```

**Nota:** Sigues teniendo acceso a tus carpetas de Windows desde `/mnt/c/`

## 📚 Comandos Básicos de Linux

### **Navegación de Archivos:**
```bash
ls                    # Lista archivos y carpetas
ls -la               # Lista detallada (incluye archivos ocultos)
cd nombre-carpeta    # Cambiar a una carpeta
cd ..                # Subir un nivel
cd ~                 # Ir a carpeta home
pwd                  # Mostrar ubicación actual
```

### **Manipulación de Archivos:**
```bash
mkdir nueva-carpeta   # Crear carpeta
rmdir carpeta-vacia  # Eliminar carpeta vacía
rm archivo.txt       # Eliminar archivo
rm -rf carpeta/      # Eliminar carpeta y contenido (¡cuidado!)
cp archivo.txt copia.txt      # Copiar archivo
mv archivo.txt nuevo-nombre.txt  # Renombrar/mover archivo
touch archivo.txt    # Crear archivo vacío
cat archivo.txt      # Ver contenido de archivo
```

### **Permisos y Sistema:**
```bash
sudo comando         # Ejecutar como administrador
chmod +x archivo     # Hacer archivo ejecutable
ps aux              # Ver procesos activos
kill PID            # Terminar proceso por ID
```

## 🔧 Configuración del Entorno de Desarrollo

### 1. **Actualizar el Sistema**
```bash
sudo apt update
sudo apt upgrade
```

### 2. **Instalar Git**
```bash
sudo apt-get install git
```

### 3. **Instalar Node.js y npm**
```bash
# Método recomendado - usando NodeSource
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalación
node --version
npm --version
```

### 4. **Configurar Git (Primera vez)**
```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu-email@ejemplo.com"
```

## 📁 Trabajar con el Proyecto HappiEty

### **Ubicación Recomendada:**
```bash
# Navegar a tus documentos de Windows
cd /mnt/c/Users/TuUsuario/Documents

# O crear una carpeta de desarrollo en home de Linux
cd ~
mkdir desarrollo
cd desarrollo
```

### **Clonar el Repositorio:**
```bash
git clone https://github.com/GabyPng/Happ.git
cd Happ
ls  # Ver contenido del proyecto
```

### **Instalar Dependencias:**
```bash
npm install
```

### **Iniciar el Proyecto:**
```bash
npm run dev-simple
```

## 🛠️ Herramientas Útiles en WSL

### **Editor de Texto desde Terminal:**
```bash
# Nano (más fácil para principiantes)
nano archivo.txt
# Ctrl+X para salir, Y para guardar

# Vim (más potente, pero más complejo)
vim archivo.txt
# :wq para guardar y salir
# :q! para salir sin guardar
```

### **Ver Archivos y Logs:**
```bash
# Ver las últimas líneas de un archivo
tail archivo.txt

# Ver archivo página por página
less archivo.txt
# q para salir

# Buscar texto en archivos
grep "texto" archivo.txt
grep -r "texto" carpeta/  # Buscar en toda la carpeta
```

### **Gestión de Procesos:**
```bash
# Ver procesos de Node.js
ps aux | grep node

# Terminar proceso por nombre
pkill -f nodemon

# Ver uso de puertos
sudo netstat -tulpn | grep :3000
```

## 🔗 Integración con VS Code

### **Instalar VS Code en Windows:**
1. Descargar desde [code.visualstudio.com](https://code.visualstudio.com/)
2. Instalar la extensión **"Remote - WSL"**

### **Abrir Proyecto desde WSL:**
```bash
# Desde la carpeta del proyecto en WSL
code .
```

Esto abrirá VS Code conectado directamente a WSL, permitiendo:
- Editar archivos de Linux desde Windows
- Terminal integrado de WSL
- Extensiones funcionando en entorno Linux

## 🐛 Solución de Problemas Comunes

### **"Command not found"**
```bash
# Verificar si está instalado
which comando
# Reinstalar o instalar
sudo apt install nombre-paquete
```

### **Permisos Denegados**
```bash
# Usar sudo para comandos administrativos
sudo comando

# Cambiar propietario de archivos
sudo chown -R $USER:$USER carpeta/
```

### **Puerto ya en uso**
```bash
# Ver qué proceso usa el puerto 3000
sudo lsof -i :3000

# Terminar proceso
kill -9 PID_DEL_PROCESO
```

### **Git Problems**
```bash
# Resetear cambios locales
git reset --hard HEAD

# Ver estado actual
git status

# Actualizar desde remoto
git pull origin main
```

## 📂 Estructura de Carpetas Recomendada

```
/mnt/c/Users/TuUsuario/
├── Documents/
│   └── desarrollo/          # Tus proyectos
│       ├── Happ/           # Este proyecto
│       └── otros-proyectos/
└── Downloads/              # Archivos descargados
```

O en Linux home:
```
/home/tu-usuario/
├── desarrollo/             # Carpeta de proyectos
│   ├── Happ/              # Este proyecto
│   └── otros-proyectos/
└── .bashrc                # Configuración del terminal
```

## 🎯 Comandos Específicos para HappiEty

### **Desarrollo Diario:**
```bash
cd /ruta/a/Happ
npm run dev-simple        # Iniciar servidor
# Ctrl+C para detener

# En otra terminal:
git status               # Ver cambios
git add .               # Preparar cambios
git commit -m "mensaje"  # Confirmar cambios
git push origin main     # Subir a GitHub
```

### **Debugging:**
```bash
# Ver logs del servidor
tail -f logs/error.log  # Si existe archivo de logs

# Verificar archivos importantes
ls -la public/css/
ls -la src/models/
```

## 🆘 Comandos de Emergencia

```bash
# Si algo se rompe, volver al estado anterior
git stash              # Guardar cambios temporalmente
git reset --hard HEAD  # Volver al último commit

# Si el terminal se congela
Ctrl+C                 # Cancelar comando actual
Ctrl+Z                 # Suspender proceso
bg                     # Continuar en background
fg                     # Traer a foreground

# Si WSL no responde
# Desde cmd de Windows:
wsl --shutdown
wsl                    # Reiniciar
```

---

**💡 Tip para Estudiantes:**
- Crea aliases para comandos frecuentes:
```bash
echo 'alias happ="cd /ruta/a/Happ && npm run dev-simple"' >> ~/.bashrc
source ~/.bashrc
# Ahora solo escribes 'happ' para iniciar el proyecto
```

¡Con esta configuración tendrás un entorno de desarrollo profesional en Windows! 🚀
