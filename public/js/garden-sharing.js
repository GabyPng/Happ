/**
 * Garden Sharing - Sistema para compartir jardines desde localStorage
 * Permite exportar/importar jardines completos con todas sus memorias
 */

class GardenSharing {
    constructor() {
        this.init();
    }

    init() {
        // Escuchar parámetros de URL para importar jardín compartido
        this.checkForSharedGarden();
        
        // Agregar event listener al botón compartir
        const shareBtn = document.getElementById('shareGardenBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareCurrentGarden());
        }
    }

    /**
     * Detectar el entorno y generar la URL base correcta
     */
    getBaseUrl() {
        // Si es archivo local
        if (window.location.protocol === 'file:' || !window.location.origin || window.location.origin === 'null') {
            return 'http://localhost:3000';
        }
        
        // Si es servidor (local o Vercel)
        return window.location.origin;
    }

    /**
     * Verificar si estamos en un entorno de producción
     */
    isProductionEnvironment() {
        return window.location.hostname.includes('vercel.app') || 
               window.location.hostname.includes('netlify.app') ||
               window.location.hostname.includes('herokuapp.com') ||
               (window.location.hostname !== 'localhost' && 
                window.location.hostname !== '127.0.0.1' && 
                !window.location.hostname.startsWith('192.168.'));
    }

    /**
     * Compartir el jardín actual
     */
    async shareCurrentGarden() {
        try {
            // Evitar múltiples modales activos
            const existingModal = document.querySelector('.share-modal--active');
            if (existingModal) {
                console.log('❌ Modal ya está activo, cancelando');
                return;
            }

            const garden = JSON.parse(localStorage.getItem('currentGarden'));
            if (!garden) {
                alert('No hay jardín actual para compartir');
                return;
            }

            const memories = JSON.parse(localStorage.getItem(`garden_memories_${garden._id}`) || '[]');
            
            // Crear datos completos del jardín
            const shareData = {
                garden: {
                    ...garden,
                    isShared: true,
                    sharedAt: new Date().toISOString(),
                    originalId: garden._id
                },
                memories: memories,
                metadata: {
                    version: '1.0',
                    totalMemories: memories.length,
                    memoryTypes: [...new Set(memories.map(m => m.memoryType))],
                    createdAt: new Date().toISOString()
                }
            };

            // Comprimir y codificar datos
            const compressed = this.compressData(JSON.stringify(shareData));
            const encoded = btoa(compressed);
            
            // Crear URL para compartir
            const baseUrl = this.getBaseUrl();
            const isProduction = this.isProductionEnvironment();
            
            console.log('Environment detection:', {
                hostname: window.location.hostname,
                origin: window.location.origin,
                protocol: window.location.protocol,
                baseUrl: baseUrl,
                isProduction: isProduction
            });
            
            const shareUrl = `${baseUrl}/ver-jardin.html?shared=${encoded}`;
            
            console.log('=== DEBUG INFORMACIÓN ===');
            console.log('Garden data:', garden);
            console.log('Memories count:', memories.length);
            console.log('Share data size:', JSON.stringify(shareData).length);
            console.log('Compressed size:', compressed.length);
            console.log('Encoded size:', encoded.length);
            console.log('Generated share URL:', shareUrl);
            console.log('URL length:', shareUrl.length);
            console.log('Base URL:', baseUrl);
            console.log('Is Production:', isProduction);
            console.log('Encoded param:', encoded.substring(0, 100) + '...');
            console.log('Current window.location:', window.location.href);
            console.log('Window.location.origin:', window.location.origin);
            console.log('Window.location.protocol:', window.location.protocol);
            console.log('========================');
            
            // Mostrar opciones de compartir
            this.showShareOptions(shareUrl, garden.name);
            
        } catch (error) {
            console.error('Error al compartir jardín:', error);
            alert('Error al generar el enlace para compartir');
        }
    }

    /**
     * Comprimir datos para URLs más cortas
     */
    compressData(data) {
        // Remover espacios y caracteres innecesarios
        return data.replace(/\s+/g, '');
    }

    /**
     * Mostrar opciones para compartir
     */
    showShareOptions(shareUrl, gardenName) {
        // Generar código de acceso único (primeros 8 caracteres del hash)
        const accessCode = btoa(gardenName + Date.now()).substring(0, 8).toUpperCase();
        
        // Crear modal para opciones de compartir
        const modal = document.createElement('div');
        modal.className = 'share-modal'; // Sin --active inicialmente
        modal.innerHTML = `
            <div class="share-modal__backdrop">
                <div class="share-modal__content">
                    <div class="share-modal__header">
                        <div class="share-modal__header__left">
                            <img src="./assets/icons/share.png" alt=">" class="nav__icon">
                            <h3>Compartir Jardín</h3>
                        </div>
                        <button class="share-modal__close">&times;</button>
                    </div>
                    <div class="share-modal__body">
                        <p>Comparte tu jardín "${gardenName}" con personas especiales</p>
                        
                        <!-- Pestañas -->
                        <div class="share-tabs">
                            <button class="share-tab share-tab--active" data-tab="enlace">Enlace</button>
                            <button class="share-tab" data-tab="configuracion">Configuración</button>
                            <button class="share-tab" data-tab="estadisticas">Estadísticas</button>
                        </div>
                        
                        <!-- Contenido de la pestaña Enlace -->
                        <div class="share-tab-content share-tab-content--active" id="tab-enlace">
                            <!-- Código de acceso -->
                            <div class="share-access-code">
                                <h4>Código de acceso</h4>
                                <div class="share-code-display">${accessCode}</div>
                                <a href="#" class="share-generate-link" id="generate-new-code">
                                    Generar nuevo
                                </a>
                            </div>
                            
                            <!-- Enlace directo -->
                            <div class="share-direct-link">
                                <h4>Enlace directo</h4>
                                <input type="text" class="share-url-input" readonly value="${shareUrl}" id="share-url-input" data-share-url="${shareUrl}">
                                <div class="share-buttons">
                                    <button class="share-button" id="download-file">
                                        Descargar
                                    </button>
                                    <button class="share-button share-button--primary" id="copy-link">
                                        Copiar
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Contenido de la pestaña Configuración -->
                        <div class="share-tab-content" id="tab-configuracion">
                            <div class="share-qr-section">
                                <h4>Código QR para acceso rápido</h4>
                                <div id="qr-container" style="display: none;">
                                    <!-- QR code will be generated here -->
                                </div>
                                <a href="#" class="share-generate-link" id="generate-qr">
                                    Generar código QR
                                </a>
                            </div>
                        </div>
                        
                        <!-- Contenido de la pestaña Estadísticas -->
                        <div class="share-tab-content" id="tab-estadisticas">
                            <div class="share-stats">
                                <h4>Información del jardín</h4>
                                <div class="share-stats-content">
                                    <p><strong>Este jardín es privado</strong></p>
                                    <p>Total de recuerdos: <span id="memory-count">0</span></p>
                                    <p>Creado: <span id="creation-date">Hoy</span></p>
                                    <p>Solo personas autorizadas pueden verlo</p>
                                </div>
                            </div>
                            
                            <!-- Compartir vía -->
                            <div class="share-via-section">
                                <h4>Compartir vía</h4>
                                <div class="share-via-buttons">
                                    <button class="share-via-button" id="share-email">
                                        <img src="./assets/icons/gmail.png" alt="gmail" class="nav__icon">
                                        Email
                                    </button>
                                    <button class="share-via-button" id="share-whatsapp">
                                        <img src="./assets/icons/whatsapp.png" alt="wsp" class="nav__icon">
                                        WhatsApp
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Configurar event listeners después de crear el DOM
        this.setupModalEventListeners(modal, shareUrl, gardenName, accessCode);
        
        // Actualizar estadísticas
        this.updateStatistics(modal);

        // Agregar al DOM
        document.body.appendChild(modal);
        
        // ✅ ACTIVAR MODAL USANDO EL SISTEMA UNIFICADO
        setTimeout(() => {
            modal.classList.add('share-modal--active');
            document.body.style.overflow = 'hidden';
            console.log('🔓 Share modal activado con sistema unificado');
        }, 10);
        
        // Aplicar estilos inmediatamente para Chrome
        this.applyChromeCompatibilityStyles(modal);
        
        // Forzar el valor del URL en el input inmediatamente
        const urlInput = modal.querySelector('#share-url-input');
        if (urlInput) {
            urlInput.value = shareUrl;
            urlInput.setAttribute('value', shareUrl);
            urlInput.defaultValue = shareUrl;
            console.log('Forced URL value:', urlInput.value);
        }
        
        // Asegurar visibilidad de elementos críticos después de añadir al DOM
        setTimeout(() => {
            this.ensureElementsVisible(modal);
        }, 100);
        
        // Verificación adicional para Chrome después de un breve delay
        setTimeout(() => {
            this.applyChromeCompatibilityStyles(modal);
            this.ensureElementsVisible(modal);
        }, 100);
    }

    /**
     * Aplicar estilos específicos para compatibilidad con Chrome
     */
    applyChromeCompatibilityStyles(modal) {
        // Aplicar estilos al input de URL
        const urlInput = modal.querySelector('#share-url-input');
        if (urlInput) {
            urlInput.setAttribute('style', 'display: block !important; visibility: visible !important; opacity: 1 !important; width: 100% !important; padding: 10px !important; margin: 10px 0 !important; border: 1px solid #ddd !important; border-radius: 5px !important; font-size: 12px !important; box-sizing: border-box !important; background: #f8f9fa !important; color: #333 !important; position: relative !important; z-index: 1000 !important; pointer-events: auto !important;');
            
            // Forzar el valor del input
            const shareUrl = urlInput.getAttribute('data-share-url');
            if (shareUrl && (!urlInput.value || urlInput.value.trim() === '')) {
                urlInput.value = shareUrl;
            }
        }

        // Aplicar estilos a botones principales
        const shareButtons = modal.querySelectorAll('.share-button');
        shareButtons.forEach(btn => {
            btn.setAttribute('style', 'display: inline-block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; z-index: 999 !important; pointer-events: auto !important;');
        });

        // Aplicar estilos a botones de compartir vía
        const shareViaButtons = modal.querySelectorAll('.share-via-button');
        shareViaButtons.forEach(btn => {
            btn.setAttribute('style', 'display: flex !important; visibility: visible !important; opacity: 1 !important; align-items: center !important; gap: 8px !important; padding: 10px 15px !important; margin: 5px !important; border: 1px solid #ddd !important; border-radius: 8px !important; background: white !important; cursor: pointer !important; color: #333 !important; position: relative !important; z-index: 998 !important; pointer-events: auto !important;');
        });

        // Aplicar estilos a imágenes en botones
        const buttonImages = modal.querySelectorAll('.share-via-button img');
        buttonImages.forEach(img => {
            img.setAttribute('style', 'display: block !important; width: 20px !important; height: 20px !important; position: relative !important; z-index: 997 !important;');
        });

        // Aplicar estilos a todos los botones
        const allButtons = modal.querySelectorAll('button');
        allButtons.forEach(btn => {
            const currentStyle = btn.getAttribute('style') || '';
            if (!currentStyle.includes('z-index')) {
                btn.setAttribute('style', currentStyle + ' position: relative !important; z-index: 999 !important; pointer-events: auto !important;');
            }
        });
    }

    /**
     * Asegurar que elementos críticos sean visibles - Optimizado para Chrome
     */
    ensureElementsVisible(modal) {
        // Asegurar que el input del URL sea visible y tenga el valor correcto
        const urlInput = modal.querySelector('#share-url-input');
        if (urlInput) {
            // Estilos específicos para Chrome
            const chromeStyles = {
                display: 'block',
                visibility: 'visible',
                opacity: '1',
                width: '100%',
                padding: '10px',
                margin: '10px 0',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '12px',
                boxSizing: 'border-box',
                background: '#f8f9fa',
                color: '#333',
                position: 'relative',
                zIndex: '1000',
                pointerEvents: 'auto'
            };
            
            // Aplicar estilos usando setProperty para mayor compatibilidad con Chrome
            Object.keys(chromeStyles).forEach(property => {
                urlInput.style.setProperty(property, chromeStyles[property], 'important');
            });
            
            // Asegurar que tiene valor
            if (!urlInput.value || urlInput.value.trim() === '') {
                // Re-obtener el shareUrl del atributo data o regenerar
                const shareUrl = urlInput.getAttribute('data-share-url') || urlInput.defaultValue;
                if (shareUrl) {
                    urlInput.value = shareUrl;
                }
            }
            
            console.log('URL Input value:', urlInput.value); // Debug
            console.log('URL Input visible:', urlInput.offsetHeight > 0); // Debug
        }

        // Asegurar que todos los botones sean visibles con estilos específicos para Chrome
        const allButtons = modal.querySelectorAll('button');
        allButtons.forEach(btn => {
            const buttonStyles = {
                display: 'flex',
                visibility: 'visible',
                opacity: '1',
                position: 'relative',
                zIndex: '999',
                pointerEvents: 'auto'
            };
            
            Object.keys(buttonStyles).forEach(property => {
                btn.style.setProperty(property, buttonStyles[property], 'important');
            });
        });

        // Asegurar que los botones de compartir vía sean visibles
        const shareViaButtons = modal.querySelectorAll('.share-via-button');
        shareViaButtons.forEach(btn => {
            const viaButtonStyles = {
                display: 'flex',
                visibility: 'visible',
                opacity: '1',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 15px',
                margin: '5px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                background: 'white',
                cursor: 'pointer',
                color: '#333',
                position: 'relative',
                zIndex: '998',
                pointerEvents: 'auto'
            };
            
            Object.keys(viaButtonStyles).forEach(property => {
                btn.style.setProperty(property, viaButtonStyles[property], 'important');
            });
        });

        // Asegurar que las imágenes en botones sean visibles
        const buttonImages = modal.querySelectorAll('.share-via-button img');
        buttonImages.forEach(img => {
            const imgStyles = {
                display: 'block',
                width: '20px',
                height: '20px',
                position: 'relative',
                zIndex: '997'
            };
            
            Object.keys(imgStyles).forEach(property => {
                img.style.setProperty(property, imgStyles[property], 'important');
            });
        });

        // Asegurar que botones principales sean visibles
        const shareButtons = modal.querySelectorAll('.share-button');
        shareButtons.forEach(btn => {
            const mainButtonStyles = {
                display: 'inline-block',
                visibility: 'visible',
                opacity: '1',
                position: 'relative',
                zIndex: '996',
                pointerEvents: 'auto'
            };
            
            Object.keys(mainButtonStyles).forEach(property => {
                btn.style.setProperty(property, mainButtonStyles[property], 'important');
            });
        });
    }

    /**
     * Configurar todos los event listeners del modal
     */
    setupModalEventListeners(modal, shareUrl, gardenName, accessCode) {
        // Event listeners para pestañas
        const tabs = modal.querySelectorAll('.share-tab');
        const tabContents = modal.querySelectorAll('.share-tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Evitar múltiples clicks en la misma pestaña activa
                if (tab.classList.contains('share-tab--active')) {
                    return;
                }
                
                // Remover active de todas las pestañas
                tabs.forEach(t => t.classList.remove('share-tab--active'));
                tabContents.forEach(tc => tc.classList.remove('share-tab-content--active'));
                
                // Activar pestaña clickeada
                tab.classList.add('share-tab--active');
                const targetTab = tab.dataset.tab;
                const targetContent = modal.querySelector(`#tab-${targetTab}`);
                if (targetContent) {
                    targetContent.classList.add('share-tab-content--active');
                }
            });
        });
        
        // Event listeners principales
        const closeBtn = modal.querySelector('.share-modal__close');
        const backdrop = modal.querySelector('.share-modal__backdrop');
        const downloadBtn = modal.querySelector('#download-file');
        const copyBtn = modal.querySelector('#copy-link');
        const qrBtn = modal.querySelector('#generate-qr');
        const generateNewCodeBtn = modal.querySelector('#generate-new-code');
        const urlInput = modal.querySelector('#share-url-input');
        const emailBtn = modal.querySelector('#share-email');
        const whatsappBtn = modal.querySelector('#share-whatsapp');

        // Cerrar modal usando sistema unificado
        closeBtn.addEventListener('click', () => this.closeShareModal(modal));
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) this.closeShareModal(modal);
        });

        // Cerrar con tecla ESC
        const handleEscape = (e) => {
            if (e.key === 'Escape' && modal.classList.contains('share-modal--active')) {
                this.closeShareModal(modal);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Descargar archivo
        downloadBtn.addEventListener('click', () => {
            this.downloadGardenFile(shareUrl, gardenName);
        });

        // Copiar enlace
        copyBtn.addEventListener('click', async () => {
            try {
                // Asegurar que el input tenga el valor correcto antes de copiar
                if (!urlInput.value || urlInput.value.trim() === '') {
                    urlInput.value = shareUrl;
                }
                
                // Intentar con clipboard API primero
                if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(shareUrl);
                } else {
                    // Fallback para Chrome y otros navegadores
                    urlInput.focus();
                    urlInput.select();
                    document.execCommand('copy');
                }
                
                copyBtn.textContent = 'Copiado';
                setTimeout(() => {
                    copyBtn.textContent = 'Copiar';
                }, 2000);
            } catch (err) {
                console.log('Error copiando, usando fallback:', err);
                // Fallback adicional
                urlInput.focus();
                urlInput.select();
                document.execCommand('copy');
                copyBtn.textContent = 'Copiado';
                setTimeout(() => {
                    copyBtn.textContent = 'Copiar';
                }, 2000);
            }
        });

        // Generar QR
        qrBtn.addEventListener('click', () => {
            this.generateQRCode(shareUrl, modal.querySelector('#qr-container'));
        });
        
        // Generar nuevo código
        generateNewCodeBtn.addEventListener('click', () => {
            const newCode = btoa(gardenName + Date.now()).substring(0, 8).toUpperCase();
            modal.querySelector('.share-code-display').textContent = newCode;
        });
        
        // Compartir por email
        emailBtn.addEventListener('click', () => {
            const subject = encodeURIComponent(`Jardín "${gardenName}" - HappiEty`);
            const body = encodeURIComponent(`¡Hola! Te invito a ver mi jardín de recuerdos "${gardenName}" en HappiEty.\n\nCódigo de acceso: ${accessCode}\nEnlace directo: ${shareUrl}\n\n¡Espero que te guste!`);
            window.open(`mailto:?subject=${subject}&body=${body}`);
        });
        
        // Compartir por WhatsApp
        whatsappBtn.addEventListener('click', () => {
            const text = encodeURIComponent(`¡Te invito a ver mi jardín "${gardenName}" en HappiEty!\n\nCódigo: ${accessCode}\nEnlace: ${shareUrl}`);
            window.open(`https://wa.me/?text=${text}`);
        });

        // Protección adicional contra desaparición de elementos
        this.addHoverProtection(modal);
    }

    /**
     * Agregar protección contra elementos que desaparecen al hacer hover - Chrome compatible
     */
    addHoverProtection(modal) {
        // Proteger todos los botones con estilos específicos para Chrome
        const allButtons = modal.querySelectorAll('button');
        allButtons.forEach(btn => {
            const protectionFunction = () => {
                const styles = {
                    display: 'flex',
                    visibility: 'visible',
                    opacity: '1',
                    position: 'relative',
                    zIndex: '999',
                    pointerEvents: 'auto'
                };
                
                Object.keys(styles).forEach(property => {
                    btn.style.setProperty(property, styles[property], 'important');
                });
            };
            
            ['mouseenter', 'mouseleave', 'mousemove', 'focus', 'blur'].forEach(event => {
                btn.addEventListener(event, protectionFunction);
            });
        });

        // Proteger input de URL con estilos específicos para Chrome
        const urlInput = modal.querySelector('#share-url-input');
        if (urlInput) {
            const protectionFunction = () => {
                const styles = {
                    display: 'block',
                    visibility: 'visible',
                    opacity: '1',
                    position: 'relative',
                    zIndex: '1000',
                    pointerEvents: 'auto'
                };
                
                Object.keys(styles).forEach(property => {
                    urlInput.style.setProperty(property, styles[property], 'important');
                });
                
                // Asegurar que el valor esté presente
                if (!urlInput.value || urlInput.value.trim() === '') {
                    const shareUrl = urlInput.getAttribute('data-share-url');
                    if (shareUrl) {
                        urlInput.value = shareUrl;
                    }
                }
            };
            
            ['mouseenter', 'mouseleave', 'mousemove', 'focus', 'blur', 'click'].forEach(event => {
                urlInput.addEventListener(event, protectionFunction);
            });
        }

        // Observer mejorado para Chrome con detección más específica
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const target = mutation.target;
                    
                    // Si es un botón que se está ocultando, forzar visibilidad
                    if (target.tagName === 'BUTTON' || target.classList.contains('share-via-button')) {
                        const computedStyle = window.getComputedStyle(target);
                        if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden' || computedStyle.opacity === '0') {
                            const styles = {
                                display: 'flex',
                                visibility: 'visible',
                                opacity: '1',
                                position: 'relative',
                                zIndex: '999',
                                pointerEvents: 'auto'
                            };
                            
                            Object.keys(styles).forEach(property => {
                                target.style.setProperty(property, styles[property], 'important');
                            });
                        }
                    }
                    
                    // Si es el input de URL que se está ocultando, forzar visibilidad
                    if (target.id === 'share-url-input') {
                        const computedStyle = window.getComputedStyle(target);
                        if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden' || computedStyle.opacity === '0') {
                            const styles = {
                                display: 'block',
                                visibility: 'visible',
                                opacity: '1',
                                position: 'relative',
                                zIndex: '1000',
                                pointerEvents: 'auto'
                            };
                            
                            Object.keys(styles).forEach(property => {
                                target.style.setProperty(property, styles[property], 'important');
                            });
                        }
                    }
                }
            });
        });

        observer.observe(modal, {
            attributes: true,
            attributeFilter: ['style', 'class'],
            subtree: true,
            childList: true
        });

        // Verificación periódica para Chrome (cada 100ms durante los primeros 2 segundos)
        let checkCount = 0;
        const maxChecks = 20;
        const periodicCheck = setInterval(() => {
            checkCount++;
            
            // Re-asegurar visibilidad de elementos críticos
            this.ensureElementsVisible(modal);
            
            if (checkCount >= maxChecks) {
                clearInterval(periodicCheck);
            }
        }, 100);

        // Limpiar observer y timer cuando se cierre el modal
        const originalRemove = modal.remove.bind(modal);
        modal.remove = function() {
            observer.disconnect();
            clearInterval(periodicCheck);
            originalRemove();
        };
    }

    /**
     * Actualizar estadísticas del jardín
     */
    updateStatistics(modal) {
        const memoryCountSpan = modal.querySelector('#memory-count');
        const creationDateSpan = modal.querySelector('#creation-date');
        
        if (memoryCountSpan) {
            const currentGarden = JSON.parse(localStorage.getItem('currentGarden') || '{}');
            const memories = JSON.parse(localStorage.getItem(`garden_memories_${currentGarden._id}`) || '[]');
            memoryCountSpan.textContent = memories.length;
        }
        
        if (creationDateSpan) {
            creationDateSpan.textContent = new Date().toLocaleDateString('es-ES');
        }
    }

    /**
     * Descargar jardín como archivo
     * TODO: Implementar funcionalidad de descarga en el futuro
     */
    downloadGardenFile(shareUrl, gardenName) {
        // Función preparada para implementación futura
        console.log('Download functionality will be implemented in the future');
        console.log('Share URL:', shareUrl);
        console.log('Garden Name:', gardenName);
        
        // Placeholder: mostrar mensaje temporal
        alert('próximamente solo en cines');
    }

    /**
     * Generar código QR (versión simple)
     */
    generateQRCode(shareUrl, container) {
        container.style.display = 'block';
        
        // Para un QR real, podrías usar una librería como qrcode.js
        // Por ahora, usamos un servicio online gratuito
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;
        
        container.innerHTML = `
            <img src="${qrUrl}" alt="Código QR">
            <p>Escanea con tu teléfono para abrir el jardín</p>
        `;
    }

    /**
     * Verificar si hay un jardín compartido en la URL
     */
    checkForSharedGarden() {
        const urlParams = new URLSearchParams(window.location.search);
        const sharedData = urlParams.get('shared');
        
        console.log('Checking for shared garden...');
        console.log('Current URL:', window.location.href);
        console.log('URL Params:', window.location.search);
        console.log('Shared data found:', sharedData ? 'YES' : 'NO');
        
        if (sharedData) {
            console.log('Shared data length:', sharedData.length);
            console.log('Shared data preview:', sharedData.substring(0, 100) + '...');
            this.importSharedGarden(sharedData);
        }
    }

    /**
     * Importar jardín compartido
     */
    async importSharedGarden(encodedData) {
        try {
            console.log('=== IMPORTANDO JARDÍN ===');
            console.log('Encoded data length:', encodedData.length);
            console.log('Encoded data preview:', encodedData.substring(0, 100) + '...');
            
            // Decodificar datos
            console.log('Decodificando datos...');
            const decompressed = atob(encodedData);
            console.log('Decompressed length:', decompressed.length);
            console.log('Decompressed preview:', decompressed.substring(0, 200) + '...');
            
            console.log('Parseando JSON...');
            const shareData = JSON.parse(decompressed);
            console.log('Share data parsed successfully');
            console.log('Garden name:', shareData.garden?.name);
            console.log('Memories count:', shareData.memories?.length);
            
            if (!shareData.garden || !shareData.memories) {
                throw new Error('Datos de jardín inválidos: ' + JSON.stringify({
                    hasGarden: !!shareData.garden,
                    hasMemories: !!shareData.memories
                }));
            }

            // Generar nuevo ID para evitar conflictos
            const importedGarden = {
                ...shareData.garden,
                _id: 'shared_' + Date.now(),
                name: shareData.garden.name + ' (Compartido)',
                isImported: true,
                importedAt: new Date().toISOString(),
                originalId: shareData.garden._id
            };

            // Actualizar IDs de memorias
            const importedMemories = shareData.memories.map(memory => ({
                ...memory,
                _id: 'mem_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                gardenId: importedGarden._id
            }));

            console.log('Guardando jardín importado...');
            // Guardar jardín importado como actual
            localStorage.setItem('currentGarden', JSON.stringify(importedGarden));
            localStorage.setItem(`garden_memories_${importedGarden._id}`, JSON.stringify(importedMemories));

            console.log('Jardín guardado exitosamente');
            
            // Mostrar mensaje de éxito
            this.showImportSuccess(shareData.garden.name, importedMemories.length);

            // Recargar memory manager si existe
            if (window.memoryManager) {
                window.memoryManager.loadCurrentGarden();
            }

            // Limpiar URL
            window.history.replaceState({}, '', window.location.pathname);
            console.log('=== IMPORTACIÓN COMPLETA ===');

        } catch (error) {
            console.error('=== ERROR AL IMPORTAR ===');
            console.error('Error details:', error);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            console.error('Encoded data that failed:', encodedData);
            console.error('========================');
            
            alert(`Error al importar el jardín compartido: ${error.message}\n\nVerifica que el enlace sea válido y completo.`);
        }
    }

    /**
     * Mostrar mensaje de importación exitosa
     */
    showImportSuccess(gardenName, memoryCount) {
        const notification = document.createElement('div');
        notification.className = 'import-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <h3>🌸 ¡Jardín importado!</h3>
                <p>Has importado el jardín "<strong>${gardenName}</strong>" con ${memoryCount} recuerdos.</p>
                <button class="notification-close">Entendido</button>
            </div>
        `;

        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });

        document.body.appendChild(notification);

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    /**
     * Cerrar modal de compartir usando el sistema unificado
     */
    closeShareModal(modal) {
        if (modal && modal.classList.contains('share-modal--active')) {
            console.log('🔒 Cerrando share modal con sistema unificado');
            
            // Desactivar modal
            modal.classList.remove('share-modal--active');
            
            // Restaurar scroll del body
            document.body.style.overflow = '';
            
            // Remover modal del DOM después de la animación
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.remove();
                }
            }, 300); // Esperar a que termine la animación
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.gardenSharing = new GardenSharing();
});
