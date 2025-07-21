La nomenclatura de las clases en el proyecto anterior no seguía una estructura coherente ni estandarizada, lo que podría haber generado dificultades a largo plazo, especialmente al intentar escalar o mantener el código. Debido a esto, decidí aplicar la metodología BEM para mejorar la claridad, organización y consistencia en el nombramiento de las clases a lo largo del proyecto.

Este cambio no afecta ni altera las propiedades ni los atributos CSS aplicados que ya se habia trabajado, sino que únicamente se modifican los nombres de las clases. Esta reorganización se realizó con el objetivo de que el proyecto tenga una mayor legibilidad, reducción del riesgo de conflictos y que facilite la colaboración futura al mantener una convención de nombres clara y uniforme en todo el proyecto.


## ¿Qué es BEM?

BEM (Block Element Modifier) es una metodología de nomenclatura para CSS que hace que el código sea más modular, mantenible y escalable.

### Estructura BEM:

```
.block__element--modifier
```

- **Block**: Componente independiente y reutilizable
- **Element**: Parte de un bloque que no puede existir sin él
- **Modifier**: Variación o estado de un bloque o elemento

## Cambios Implementados

### 1. Estructura de Archivos

### 2. Bloques Principales Identificados

#### **Layout y Página**
```css
.page                    /* Contenedor principal */
.main                    /* Contenido principal */
.header                  /* Cabecera */
.header--ver-jardin      /* Modificador para la página de jardín */
```

#### **Tipografía**
```css
.heading                 /* Títulos principales */
.heading--large          /* Título grande */
.heading--medium         /* Título mediano */
.heading--small          /* Título pequeño */

.text                    /* Texto base */
.text--description       /* Texto descriptivo */
.text--guide            /* Texto guía */
.text--stats            /* Texto de estadísticas */
```

#### **Botones**
```css
.button                  /* Botón base */
.button--primary         /* Botón principal */
.button--secondary       /* Botón secundario */
.button--access          /* Botón de acceso */
.button--theme           /* Botón de tema */
.button--add-option      /* Botón de opción para agregar */
```

#### **Formularios**
```css
.form                    /* Formulario base */
.form--garden            /* Formulario de jardín */
.form--modal             /* Formulario en modal */

.form__fieldset          /* Fieldset del formulario */
.form__legend            /* Leyenda del formulario */
.form__label             /* Etiqueta del formulario */
.form__input             /* Input del formulario */
.form__input--details    /* Input con detalles */
.form__input--modal      /* Input en modal */
.form__textarea          /* Textarea del formulario */
.form__select            /* Select del formulario */
```

#### **Cards**
```css
.card                    /* Card base */
.card--garden            /* Card de jardín */
.card--memory            /* Card de recuerdo */
.card--stats             /* Card de estadísticas */
.card--recent            /* Card reciente */
.card--music             /* Card de música */

.card__header            /* Cabecera de card */
.card__title             /* Título de card */
.card__content           /* Contenido de card */
.card__left              /* Lado izquierdo de card */
.card__right             /* Lado derecho de card */
```

#### **Navegación**
```css
.nav                     /* Navegación base */
.nav__item               /* Item de navegación */
.nav__item--active       /* Item activo */
.nav__icon               /* Icono de navegación */
```

#### **Modal**
```css
.modal                   /* Modal base */
.modal--active           /* Modal activo */
.modal__content          /* Contenido del modal */
.modal__header           /* Cabecera del modal */
.modal__title            /* Título del modal */
.modal__close            /* Botón cerrar modal */
.modal__body             /* Cuerpo del modal */
.modal__footer           /* Pie del modal */
```

#### **Iconos**
```css
.icon                    /* Icono base */
.icon--small             /* Icono pequeño */
.icon--medium            /* Icono mediano */
.icon--heart             /* Icono de corazón */
```

### 3. Beneficios de la Implementación

#### **Mantenibilidad**
- Código CSS más organizado y estructurado

#### **Escalabilidad**
- Fácil agregar nuevos componentes siguiendo la convención
- Reutilización de estilos entre páginas

#### **Legibilidad**
- Nombres de clases autodescriptivos
- Estructura clara de componentes
- Fácil para equipos de desarrollo

### 4. Ejemplos de Uso

#### Antes (sin BEM):
```html
<button class="btn-acceder">Acceder</button>
<div class="container-reciente">
    <h3>Título</h3>
    <p class="last-access">Último acceso</p>
</div>
```

#### Después (con BEM):
```html
<button class="button button--access">Acceder</button>
<div class="card card--recent">
    <h3 class="heading heading--small">Título</h3>
    <p class="text text--access">Último acceso</p>
</div>
```
### 5. Guía para Futuras Expansiones

#### Para agregar un nuevo componente:

1. **Identifica el bloque principal:**
   ```css
   .nuevo-componente { }
   ```

2. **Define los elementos:**
   ```css
   .nuevo-componente__titulo { }
   .nuevo-componente__contenido { }
   .nuevo-componente__boton { }
   ```

3. **Agrega modificadores si es necesario:**
   ```css
   .nuevo-componente--destacado { }
   .nuevo-componente__boton--primario { }
   ```
