# Happ

Para poder correr el proyecto de forma local con node en su computadora esta la opción mas recomendada

# Si tu usas linux:
Instala git, haces los pasos
Instala node igual en la carpeta Happ
Abres la carpeta en VS


# WSL
Windows Subsystem for Linux

Para descargarlo:
Abrir el cmd 

wsl --install -d ubuntu
    Les pedirá usuario y constraseña

Tienen que tener algo así
usuario@Nombre-de-la-computadora:/mnt/c/Users/Usuario de su computadora en Windows$


Siguen estando en windows, por lo que les aparecerá sus carpetas

# Comandos básicos:

ls: Lista los archivos y directorios en el directorio actual.
cd nombre: Cambia el directorio actual.
pwd: Muestra el directorio de trabajo actual.
mkdir: Crea un nuevo directorio.
rmdir: Elimina un directorio vacío.
rm: Elimina archivos o directorios.
cp: Copia archivos y directorios.
mv: Mueve o renombra archivos y directorios.
touch: Crea un archivo nuevo o actualiza la fecha de acceso y modificación de uno existente.
cat: Muestra el contenido de un archivo.

## Instalar git en WSL

 sudo apt-get install git

## Van a clonar el repositorio de git, y si ya lo tienen clonado pueden saltarse este paso

Si están en la ruta en la que les puso wsl
    usuario@Nombre-de-la-computadora:/mnt/c/Users/Usuario
Hacer-->
cd Documentos
git clone https://github.com/GabyPng/Happ.git
ls
    Debe aparecer todo lo que esta en la carpeta Documentos usario de windows 
cd Happ

# Instalar node por nvm
Deben estar en la carpeta de Happ

Solo peguen todo esto COMPLETO TODO TODITO TODO

### Download and install nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

### in lieu of restarting the shell
\. "$HOME/.nvm/nvm.sh"

### Download and install Node.js:
nvm install 22

### Verify the Node.js version:
node -v # Should print "v22.17.0".
nvm current # Should print "v22.17.0".

### Verify npm version:
npm -v # Should print "10.9.2".

HASTA AQUI 

## No cierren el cmd 
 

Ahora Abre VSC
# !!! Instala la extensión WSL por Microsoft

Abajo a la izquierda deben hacer click a un cuadro azul, tiene que salír en el buscador 
# Connect to wsl
Sino, busquen en youtube :D

Una vez conectado a WSL---->
    Vayan al cmd otra vez

# Abrir la carpeta Happ en VSC

ls
    Tienen que estar en la carpeta Happ y visualziar todo el contenido

Entonces,  hagan lo siguiente

'''
code Happ
'''

Es para abrir directorios y archivos en visual studio code, les tiene que abrir toda la carpeta

# Ejecutar el proyecto desde localhost

Abrir la terminal de VS (Arriba en la barra esta)
Shorcut> ctrl + shit + `

Escribir
    npm start 

Control + clic  Al link que aparece en localhost

Esto es temporal, para trabajar en el html y las estetica

#########################################################################################3

# Instalar vercel analytics
