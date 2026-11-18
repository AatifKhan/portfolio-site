(() => {
    const layer = document.querySelector('.ambient-grid');
    const canvas = layer?.querySelector('.ambient-grid-canvas');
    const context = canvas?.getContext?.('2d');
    if (!context || typeof Path2D !== 'function') return;

    const pitch = 22;
    const idleRadius = 0.65;
    const activeRadius = 1.05;
    const influenceRadius = 130;
    const maximumShift = 4;
    const fineHover = window.matchMedia('(any-hover: hover) and (any-pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const cursor = { x: 0, y: 0, strength: 0 };
    let target = null;
    let grid = null;
    let paintedRegion = null;
    let frame = 0;
    let lastTime = 0;
    let contextLost = false;
    let windowFocused = true;
    let densityQuery;
    let idleColor;
    let activeColor;
    let restColor;

    function readColor(styles, property, fallback) {
        const channels = styles.getPropertyValue(property).split(',').map((value) => Number.parseFloat(value));
        return channels.length === 3 && channels.every((channel) => channel >= 0 && channel <= 255) ? channels : fallback;
    }

    function refreshPalette() {
        const styles = getComputedStyle(layer);
        idleColor = readColor(styles, '--grid-idle-rgb', [201, 205, 212]);
        activeColor = readColor(styles, '--grid-active-rgb', [149, 156, 168]);
        restColor = `rgb(${idleColor.join(', ')})`;

        if (grid && !contextLost) {
            paintGrid();
            if (paintedRegion) paint(paintedRegion, true);
        }
    }

    function paint(region, react = false) {
        const { left, top, right, bottom } = region;
        context.clearRect(left * pitch, top * pitch, (right - left) * pitch, (bottom - top) * pitch);
        const restingDots = new Path2D();

        for (let row = top; row < bottom; row += 1) {
            const y = (row + 0.5) * pitch;
            for (let column = left; column < right; column += 1) {
                const x = (column + 0.5) * pitch;
                const dx = x - cursor.x;
                const dy = y - cursor.y;
                const distance = react ? Math.hypot(dx, dy) : influenceRadius;
                if (distance >= influenceRadius) {
                    restingDots.moveTo(x + idleRadius, y);
                    restingDots.arc(x, y, idleRadius, 0, Math.PI * 2);
                    continue;
                }

                const progress = distance / influenceRadius;
                const remaining = 1 - progress;
                const strength = remaining * remaining * (1 + 2 * progress) * cursor.strength;
                const shift = maximumShift * strength / Math.hypot(distance, 6);
                const radius = idleRadius + (activeRadius - idleRadius) * strength;
                const color = idleColor.map((channel, index) => Math.round(channel + (activeColor[index] - channel) * strength));
                context.beginPath();
                context.arc(x + dx * shift, y + dy * shift, radius, 0, Math.PI * 2);
                context.fillStyle = `rgb(${color.join(', ')})`;
                context.fill();
            }
        }

        context.fillStyle = restColor;
        context.fill(restingDots);
    }

    function paintGrid() {
        paint({ left: 0, top: 0, right: grid.columns, bottom: grid.rows });
    }

    function reset() {
        cancelAnimationFrame(frame);
        frame = 0;
        lastTime = 0;
        target = null;
        cursor.strength = 0;
        if (paintedRegion && !contextLost) paint(paintedRegion);
        paintedRegion = null;
    }

    function drawFrame(time) {
        frame = 0;
        const elapsed = lastTime ? Math.min(time - lastTime, 50) : 1000 / 60;
        const ease = 1 - Math.exp(-elapsed / 44);
        lastTime = time;

        if (target) {
            cursor.x += (target.x - cursor.x) * ease;
            cursor.y += (target.y - cursor.y) * ease;
            if (Math.abs(target.x - cursor.x) < 0.05) cursor.x = target.x;
            if (Math.abs(target.y - cursor.y) < 0.05) cursor.y = target.y;
        }

        const goal = target ? 1 : 0;
        cursor.strength += (goal - cursor.strength) * ease;
        if (Math.abs(goal - cursor.strength) < 0.008) cursor.strength = goal;

        if (paintedRegion) paint(paintedRegion);
        paintedRegion = null;
        if (cursor.strength > 0) {
            paintedRegion = {
                left: Math.max(0, Math.floor((cursor.x - influenceRadius) / pitch)),
                top: Math.max(0, Math.floor((cursor.y - influenceRadius) / pitch)),
                right: Math.min(grid.columns, Math.ceil((cursor.x + influenceRadius) / pitch)),
                bottom: Math.min(grid.rows, Math.ceil((cursor.y + influenceRadius) / pitch)),
            };
            paint(paintedRegion, true);
        }

        const moving = target && (cursor.x !== target.x || cursor.y !== target.y);
        if (moving || cursor.strength !== goal) frame = requestAnimationFrame(drawFrame);
        else lastTime = 0;
    }

    function settle() {
        target = null;
        if (cursor.strength > 0 && !frame) frame = requestAnimationFrame(drawFrame);
    }

    function syncCanvas() {
        const bounds = layer.getBoundingClientRect();
        const { width, height } = bounds;
        if (layer.hasAttribute('data-contour') || contextLost || reducedMotion.matches || !fineHover.matches || !width || !height) {
            reset();
            grid = null;
            layer.removeAttribute('data-enhanced');
            canvas.hidden = true;
            return;
        }

        const scale = Math.min(window.devicePixelRatio || 1, Math.sqrt(12_000_000 / (width * height)));
        const pixelWidth = Math.max(1, Math.round(width * scale));
        const pixelHeight = Math.max(1, Math.round(height * scale));
        if (grid?.width === width && grid?.height === height && canvas.width === pixelWidth && canvas.height === pixelHeight) return;

        reset();
        grid = { width, height, columns: Math.ceil(width / pitch), rows: Math.ceil(height / pitch) };
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
        context.setTransform(pixelWidth / width, 0, 0, pixelHeight / height, 0, 0);
        paintGrid();
        canvas.hidden = false;
        layer.setAttribute('data-enhanced', '');
    }

    function watchDensity() {
        densityQuery?.removeEventListener('change', watchDensity);
        densityQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
        densityQuery.addEventListener('change', watchDensity);
        syncCanvas();
    }

    window.addEventListener('pointermove', (event) => {
        if (!grid || !windowFocused || event.pointerType !== 'mouse' || document.hidden || document.querySelector('dialog[open]')) return;

        const x = event.clientX;
        const y = event.clientY;
        if (x < 0 || x > grid.width || y < 0 || y > grid.height) {
            settle();
            return;
        }
        if (target?.x === x && target?.y === y) return;
        target = { x, y };
        if (cursor.strength === 0) {
            cursor.x = x;
            cursor.y = y;
        }
        if (!frame) frame = requestAnimationFrame(drawFrame);
    }, { passive: true });

    window.addEventListener('pointerout', (event) => {
        if (event.pointerType === 'mouse' && !event.relatedTarget) settle();
    }, { passive: true });
    window.addEventListener('pointerdown', (event) => {
        if (event.pointerType !== 'mouse') settle();
    }, { passive: true });
    window.addEventListener('pointercancel', settle, { passive: true });
    window.addEventListener('blur', () => {
        windowFocused = false;
        reset();
    });
    window.addEventListener('focus', () => { windowFocused = true; });
    window.addEventListener('resize', syncCanvas);
    document.addEventListener('visibilitychange', reset);
    document.addEventListener('meadow:themechange', refreshPalette);
    layer.addEventListener('contourchange', syncCanvas);
    fineHover.addEventListener('change', syncCanvas);
    reducedMotion.addEventListener('change', syncCanvas);

    const dialogs = new MutationObserver(() => {
        if (document.querySelector('dialog[open]')) settle();
    });
    dialogs.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open'] });

    canvas.addEventListener('contextlost', () => {
        contextLost = true;
        syncCanvas();
    });
    canvas.addEventListener('contextrestored', () => {
        contextLost = false;
        syncCanvas();
    });

    refreshPalette();
    if ('ResizeObserver' in window) new ResizeObserver(syncCanvas).observe(layer);
    watchDensity();
})();
