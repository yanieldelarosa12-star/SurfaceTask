document.addEventListener('alpine:init', () => {
    Alpine.data('pricingLogic', () => ({
        contractService(serviceId) {
            window.location.href = `contacto.html?service=${serviceId}`;
        }
    }));
});