document.addEventListener('alpine:init', () => {
    Alpine.data('contactLogic', () => ({
        formData: { name: '', email: '', service: '', description: '' },
        touched: { name: false, email: false, service: false },
        status: 'idle', // idle, loading, success
        
        init() {
            // Capturar servicio desde URL si existe (ej. ?service=video)
            const params = new URLSearchParams(window.location.search);
            if (params.has('service')) {
                this.formData.service = params.get('service');
                
                // UX Enhancement: Limpiar la URL para mantenerla profesional sin recargar la página
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        },
        
        get isEmailValid() {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.formData.email);
        },
        
        get isValid() {
            return this.formData.name.trim() !== '' && this.isEmailValid && this.formData.service !== '';
        },
        
        submitForm() {
            if (!this.isValid) return;
            this.status = 'loading';
            setTimeout(() => {
                this.status = 'success';
            }, 1500);
        },
        
        resetForm() {
            this.formData = { name: '', email: '', service: '', description: '' };
            this.touched = { name: false, email: false, service: false };
            this.status = 'idle';
        }
    }));
});