# 🗂️ Archivos Obsoletos - HappiEty

Esta carpeta contiene archivos que ya no se utilizan en la aplicación pero se mantienen como referencia histórica durante el desarrollo.

## 📁 Contenido

### 🔄 **Modelos de Base de Datos (Versiones Antiguas)**
- `Recuerdos-backup.js` - Backup del modelo original de recuerdos
- `Recuerdos-new.js` - Versión experimental del modelo de recuerdos

### 🧪 **Ejemplos y Desarrollo**
- `examples/` - Carpeta con ejemplos de uso de la base de datos
  - `database-examples.js` - Ejemplos de operaciones CRUD con los modelos

### ⚙️ **Configuración Duplicada**
- `.env` - Archivo de configuración duplicado que estaba en `src/` (el `.env` principal en la raíz SÍ se usa)

### 🌐 **Frontend Obsoleto**
- `main.js` - Archivo JavaScript vacío/obsoleto del frontend
- `old-styles.css` - Archivo CSS obsoleto renombrado (se usa `styles.css` en todas las páginas)

### 🔧 **Backend Obsoleto**
- `index.js` - Servidor alternativo no usado (se usa `server.js` y `server-dev.js`)

## ❗ Importante

- **NO** mover archivos de esta carpeta de vuelta al proyecto sin revisión
- Estos archivos están **excluidos del repositorio Git** via `.gitignore`
- Solo eliminar archivos si están completamente seguros de que no se necesitan
- Mantener como referencia histórica durante el desarrollo activo

## 🔍 Razones de Obsolescencia

1. **Modelos duplicados**: Se mantiene solo `Recuerdos.js` como versión actual
2. **Ejemplos de desarrollo**: Código de prueba que no pertenece al proyecto productivo  
3. **Configuración duplicada**: Solo se necesita `.env` en la raíz del proyecto
4. **Archivos vacíos**: `main.js` no tenía contenido útil
5. **CSS sin uso**: `old-styles.css` no era referenciado por ningún HTML (ahora se usa `styles.css` simplificado)
6. **Servidor duplicado**: `index.js` es una versión alternativa no usada del servidor principal

---

**Última actualización**: Julio 2025
**Estado**: Archivos movidos para limpieza del proyecto
