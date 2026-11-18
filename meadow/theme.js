(() => {
    const root = document.documentElement;
    if (!['meadow', 'meadow-case'].includes(root.dataset.portfolioView)) return;

    const storageKey = 'meadow.appearance';
    const choices = ['light', 'dark', 'system'];
    const deviceDark = window.matchMedia('(prefers-color-scheme: dark)');
    const themeColor = document.querySelector('meta[name="theme-color"]');
    let preference = normalizePreference(readPreference());
    let options = [];

    function normalizePreference(value) {
        return choices.includes(value) ? value : 'light';
    }

    function readPreference() {
        try {
            return window.localStorage.getItem(storageKey);
        } catch {
            return undefined;
        }
    }

    function applyTheme() {
        const theme = preference === 'system'
            ? (deviceDark.matches ? 'dark' : 'light')
            : preference;
        const changed = root.dataset.theme !== theme;
        root.dataset.theme = theme;
        themeColor?.setAttribute('content', theme === 'dark' ? '#111318' : '#ffffff');

        for (const option of options) {
            option.setAttribute('aria-pressed', String(option.dataset.themeOption === preference));
        }

        if (changed) {
            document.dispatchEvent(new CustomEvent('meadow:themechange', { detail: { theme, preference } }));
        }
    }

    function selectTheme(choice) {
        preference = normalizePreference(choice);
        try {
            window.localStorage.setItem(storageKey, preference);
        } catch {
            // The setting still applies for this page when storage is unavailable.
        }
        applyTheme();
    }

    function syncPreference() {
        const storedPreference = readPreference();
        if (storedPreference === undefined) return;
        preference = normalizePreference(storedPreference);
        applyTheme();
    }

    // Run from the head ahead of the stylesheets to resolve the initial paint.
    applyTheme();

    deviceDark.addEventListener('change', () => {
        if (preference === 'system') applyTheme();
    });
    window.addEventListener('storage', (event) => {
        if (event.key === storageKey || event.key === null) syncPreference();
    });
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) syncPreference();
    });

    document.addEventListener('DOMContentLoaded', () => {
        const appearance = document.querySelector('[data-appearance]');
        if (!appearance) return;

        const toggle = appearance.querySelector('[data-appearance-toggle]');
        const panel = appearance.querySelector('[data-appearance-options]');
        options = Array.from(panel.querySelectorAll('[data-theme-option]'));

        function setOpen(open, restoreFocus = false) {
            if (restoreFocus) toggle.focus({ preventScroll: true });
            toggle.setAttribute('aria-expanded', String(open));
            panel.hidden = !open;
        }

        toggle.addEventListener('click', () => setOpen(panel.hidden));
        for (const option of options) {
            option.addEventListener('click', () => {
                selectTheme(option.dataset.themeOption);
                setOpen(false, true);
            });
        }

        document.addEventListener('keydown', (event) => {
            if (event.key !== 'Escape' || panel.hidden) return;
            event.preventDefault();
            setOpen(false, true);
        });
        document.addEventListener('focusin', (event) => {
            if (!panel.hidden && !appearance.contains(event.target)) setOpen(false);
        });
        document.addEventListener('pointerdown', (event) => {
            if (!panel.hidden && !appearance.contains(event.target)) setOpen(false);
        });

        applyTheme();
        appearance.hidden = false;
    }, { once: true });
})();
