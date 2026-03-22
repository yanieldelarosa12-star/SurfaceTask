document.addEventListener('alpine:init', () => {
    Alpine.data('servicesLogic', () => ({
        // Envía el usuario a contacto autoseleccionando el servicio
        requestService(serviceId) {
            window.location.href = `contacto.html?service=${serviceId}`;
        }
    }));

    // Advanced 3D Hover Tilt Effect (Stripe/Apple style)
    Alpine.data('tiltCard', (index = 0) => ({
        baseStyle: `transition-delay: ${index * 50}ms;`,
        tiltStyle: 'transform: perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1);',
        transitionStyle: 'transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.5s ease;',

        mouseX: 0,
        mouseY: 0,
        hover: false,

        get combinedStyle() {
            return `${this.baseStyle} ${this.tiltStyle} ${this.transitionStyle}`;
        },

        onMouseMove(e) {
            const rect = this.$el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.mouseX = x;
            this.mouseY = y;
            
            if (window.innerWidth < 1024) return; // Disable 3D tilt on mobile
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const strength = 35; // The higher the number, the more subtle the tilt
            
            const tiltX = (centerY - y) / strength;
            const tiltY = (x - centerX) / strength;
            
            this.tiltStyle = `transform: perspective(1200px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02); z-index: 40;`;
            this.transitionStyle = `transition: transform 0.1s ease-out;`; // Quick snap while moving
        },

        onMouseEnter() {
            this.hover = true;
        },

        onMouseLeave() {
            this.hover = false;
            if (window.innerWidth < 1024) return;
            this.tiltStyle = `transform: perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1); z-index: 1;`;
            this.transitionStyle = `transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);`; // Smooth float back to flat
        }
    }));
});