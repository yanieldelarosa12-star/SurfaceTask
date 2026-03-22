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

    // ==========================================
    // SISTEMA DE RESEÑAS DINÁMICO
    // ==========================================
    Alpine.store('reviews', {
        isModalOpen: false,
        list: [
            { name: "Carlos M.", role: "Estudiante Univ.", text: "Me salvaron con una presentación urgente para mi tesis. El diseño quedó increíble, súper estructurado y la entrega fue incluso antes del tiempo estimado.", avatar: "https://randomuser.me/api/portraits/men/32.jpg", rating: 5 },
            { name: "Laura G.", role: "Emprendedora", text: "Encargué el rediseño de mis documentos corporativos y el resultado superó mis expectativas. La imagen de mi negocio ahora proyecta muchísima confianza.", avatar: "https://randomuser.me/api/portraits/women/68.jpg", rating: 5 },
            { name: "David R.", role: "Creador de Contenido", text: "La edición de video es impecable. Entienden exactamente el ritmo que necesitan mis redes sociales para retener a mi audiencia. 100% recomendados.", avatar: "https://randomuser.me/api/portraits/men/46.jpg", rating: 5 }
        ],
        openModal() {
            this.isModalOpen = true;
            document.body.style.overflow = 'hidden';
        },
        closeModal() {
            this.isModalOpen = false;
            document.body.style.overflow = 'auto';
        },
        addReview(review) {
            // Generar avatar automático usando el nombre
            review.avatar = "https://ui-avatars.com/api/?name=" + encodeURIComponent(review.name) + "&background=00B4D8&color=fff";
            this.list.unshift(review); // Agregar al principio de la lista
        }
    });

    Alpine.data('reviewFormLogic', () => ({
        form: { name: '', role: '', text: '', rating: 5 },
        status: 'idle', // idle, loading, success
        setRating(val) { this.form.rating = val; },
        get isValid() { return this.form.name.trim() !== '' && this.form.text.trim() !== ''; },
        submit() {
            if (!this.isValid) return;
            this.status = 'loading';
            setTimeout(() => {
                Alpine.store('reviews').addReview({ ...this.form });
                this.status = 'success';
                setTimeout(() => { Alpine.store('reviews').closeModal(); this.reset(); }, 2500);
            }, 1200);
        },
        reset() { this.form = { name: '', role: '', text: '', rating: 5 }; this.status = 'idle'; }
    }));
});