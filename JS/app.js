document.addEventListener('alpine:init', () => {
    
    // 0. Estado Global de Carga (Loader)
    Alpine.store('app', {
        isLoading: true
    });

    let isCatalogReady = false;
    let isWindowReady = document.readyState === 'complete';

    const checkAppReady = () => {
        if (isCatalogReady && isWindowReady) {
            // Pequeño retraso para un efecto de transición visual suave
            setTimeout(() => {
                Alpine.store('app').isLoading = false;
            }, 400);
        }
    };

    window.addEventListener('load', () => {
        isWindowReady = true;
        checkAppReady();
    });

    document.addEventListener('catalog-loaded', () => {
        isCatalogReady = true;
        checkAppReady();
    });

    if (isWindowReady) checkAppReady();

    // 1. Catálogo Global (Alimenta todos los HTMLs automáticamente)
    Alpine.store('catalog', {
        servicios: [],
        bundles: [],
        async init() {
            try {
                const response = await fetch('../JSON/servicios.json');
                if (response.ok) {
                    const data = await response.json();
                    this.servicios = data.servicios;
                    this.bundles = data.bundles;
                    // Avisar a la UI que ya puede animar las tarjetas generadas
                    document.dispatchEvent(new CustomEvent('catalog-loaded'));
                }
            } catch (error) {
                console.error('Error cargando el catálogo:', error);
            }
        }
    });

    // Lógica Global de la Aplicación
    Alpine.data('appLogic', () => ({
        showWelcomePopup: false,
        observer: null,
        
        init() {
            // Inicializar Pop-up (si es la primera visita)
            if (!localStorage.getItem('st_welcomed')) {
                setTimeout(() => {
                    this.showWelcomePopup = true;
                    document.body.style.overflow = 'hidden';
                }, 200);
            }
            
            // Inicializar Animaciones por Scroll
            this.initScrollAnimations();
            
            // Refrescar observadores cuando Alpine termine de renderizar el JSON
            window.addEventListener('catalog-loaded', () => {
                setTimeout(() => { this.initScrollAnimations(); }, 50);
            });
        },
        
        closePopup() {
            this.showWelcomePopup = false;
            document.body.style.overflow = 'auto';
            localStorage.setItem('st_welcomed', 'true');
        },
        
        initScrollAnimations() {
            const observerOptions = { root: null, rootMargin: '0px', threshold: 0.15 };
            
            // Si el observer no existe, crearlo. Si existe, lo reusamos para el DOM nuevo.
            if (!this.observer) {
                this.observer = new IntersectionObserver((entries, observer) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const el = entry.target;
                            el.classList.remove('opacity-0', 'translate-y-10');
                            el.classList.add('opacity-100', 'translate-y-0');
                            
                            if (el.classList.contains('counter-trigger') && !el.dataset.counted) {
                                const counters = el.querySelectorAll('.counter-value');
                                counters.forEach(counter => {
                                    const target = +counter.getAttribute('data-target');
                                    this.animateCounter(counter, target, 2000);
                                });
                                el.dataset.counted = true;
                            }
                            observer.unobserve(el);
                        }
                    });
                }, observerOptions);
            }

            // Solo observar elementos que no han sido observados antes (evita duplicados)
            document.querySelectorAll('.animate-on-scroll:not(.observed)').forEach(el => {
                el.classList.add('observed', 'opacity-0', 'translate-y-10', 'transition-all', 'duration-700', 'ease-out');
                
                // Accesibilidad: Set to 0 if JS acts, preventing a flash of completion since they start full in HTML
                if (el.classList.contains('counter-trigger')) {
                    el.querySelectorAll('.counter-value').forEach(counter => {
                        counter.innerText = '0';
                    });
                }
                
                this.observer.observe(el);
            });
        },
        
        animateCounter(counter, target, duration) {
            let startTime = null;
            const updateCounter = (currentTime) => {
                if (!startTime) startTime = currentTime;
                const progress = Math.min((currentTime - startTime) / duration, 1);
                
                // Easing (easeOutQuad) para suavizar la animación progresivamente
                const easeOutProgress = progress * (2 - progress);
                counter.innerText = Math.ceil(easeOutProgress * target);
                
                if (progress < 1) requestAnimationFrame(updateCounter);
                else counter.innerText = target;
            };
            requestAnimationFrame(updateCounter);
        }
    }));
});