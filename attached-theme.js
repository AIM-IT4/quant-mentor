(function () {
    function initializeReferenceTheme() {
        if (!document.body) return;
        document.body.classList.add('light-mode');

        if (!document.querySelector('script[src*="script.js"]')) {
            const menuButton = document.getElementById('mobileMenuBtn');
            const navLinks = document.querySelector('.nav-links');
            if (menuButton && navLinks && !menuButton.dataset.referenceBound) {
                menuButton.dataset.referenceBound = 'true';
                menuButton.addEventListener('click', function () {
                    navLinks.classList.toggle('mobile-active');
                    const icon = this.querySelector('i');
                    if (icon) {
                        icon.classList.toggle('fa-bars');
                        icon.classList.toggle('fa-times');
                    }
                });
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeReferenceTheme, { once: true });
    } else {
        initializeReferenceTheme();
    }
})();
