(function () {
    function applySavedTheme() {
        if (!document.body) return;
        const savedTheme = localStorage.getItem('theme');
        document.body.classList.toggle('light-mode', savedTheme !== 'dark');
    }

    applySavedTheme();
    if (!document.body) {
        document.addEventListener('DOMContentLoaded', applySavedTheme, { once: true });
    }
})();
