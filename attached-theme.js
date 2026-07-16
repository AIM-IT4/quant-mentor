(function () {
    function applyTheme() {
        if (!document.body) return;
        const savedTheme = localStorage.getItem('theme');
        document.body.classList.toggle('light-mode', savedTheme !== 'dark');
    }

    applyTheme();
    if (!document.body) {
        document.addEventListener('DOMContentLoaded', applyTheme, { once: true });
    }
})();
