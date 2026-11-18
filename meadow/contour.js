import { fragmentSource, vertexSource } from './contour-shader.js';

const stage = document.querySelector('.ambient-grid');
const canvas = stage?.querySelector('.contour-canvas');

if (canvas) startContour(stage, canvas);

function createProgram(gl) {
    const shaders = [];
    let linked = false;
    const program = gl.createProgram();
    if (!program) return null;

    try {
        for (const [type, source] of [[gl.VERTEX_SHADER, vertexSource], [gl.FRAGMENT_SHADER, fragmentSource]]) {
            const shader = gl.createShader(type);
            if (!shader) return null;
            shaders.push(shader);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                throw new Error(gl.getShaderInfoLog(shader) || 'Contour shader compilation failed');
            }
            gl.attachShader(program, shader);
        }

        gl.linkProgram(program);
        linked = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (!linked) throw new Error(gl.getProgramInfoLog(program) || 'Contour shader linking failed');
        return program;
    } finally {
        for (const shader of shaders) gl.deleteShader(shader);
        if (!linked) gl.deleteProgram(program);
    }
}

function startContour(stage, canvas) {
    let gl;
    try {
        gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false });
    } catch {
        return;
    }
    if (!gl) return;

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const hover = window.matchMedia('(any-hover: hover) and (any-pointer: fine)');
    const light = { x: 0.5, y: 0.5, strength: 0 };
    let pointer = null;
    let renderer = null;
    let frame = 0;
    let previousTime = 0;
    let densityQuery;
    let viewport;
    let dialogOpen = Boolean(document.querySelector('dialog[open]'));

    function showContour(visible) {
        if (stage.hasAttribute('data-contour') === visible) return;
        canvas.hidden = !visible;
        stage.toggleAttribute('data-contour', visible);
        stage.dispatchEvent(new Event('contourchange'));
    }

    function queueFrame() {
        if (!frame && renderer && !document.hidden) frame = requestAnimationFrame(drawFrame);
    }

    function stopMotion() {
        cancelAnimationFrame(frame);
        frame = 0;
        pointer = null;
        light.strength = 0;
        previousTime = 0;
    }

    function allowMotion() {
        return !motion.matches && hover.matches && !dialogOpen && !document.hidden;
    }

    function clearPointer() {
        if (!pointer) return;
        pointer = null;
        queueFrame();
    }

    function updateSize() {
        if (viewport) return true;
        const bounds = stage.getBoundingClientRect();
        const { width, height } = bounds;
        if (!width || !height) return false;

        const [maximumWidth, maximumHeight] = renderer.viewportLimit;
        const scale = Math.min(
            window.devicePixelRatio || 1,
            2,
            maximumWidth / width,
            maximumHeight / height,
            Math.sqrt(8_000_000 / (width * height))
        );
        const pixelWidth = Math.max(1, Math.round(width * scale));
        const pixelHeight = Math.max(1, Math.round(height * scale));
        if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
        if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
        viewport = bounds;
        return true;
    }

    function ease(from, to, decay, tolerance) {
        const next = to + (from - to) * decay;
        return Math.abs(next - to) < tolerance ? to : next;
    }

    function updateLight(time) {
        const elapsed = previousTime ? Math.min(time - previousTime, 50) : 1000 / 60;
        previousTime = time;

        if (pointer) {
            const decay = Math.exp(-elapsed / 65);
            light.x = ease(light.x, pointer.x, decay, 0.0005);
            light.y = ease(light.y, pointer.y, decay, 0.0005);
        }

        const goal = pointer ? 1 : 0;
        light.strength = ease(light.strength, goal, Math.exp(-elapsed / 90), 0.005);
        return light.strength !== goal || Boolean(pointer && (light.x !== pointer.x || light.y !== pointer.y));
    }

    function drawFrame(time) {
        frame = 0;
        if (!renderer || gl.isContextLost() || document.hidden || !updateSize()) return;

        const moving = allowMotion() && updateLight(time);
        const { uniforms } = renderer;
        const width = gl.drawingBufferWidth;
        const height = gl.drawingBufferHeight;
        gl.viewport(0, 0, width, height);
        gl.uniform2f(uniforms.resolution, width, height);
        gl.uniform2f(uniforms.pointer, light.x, light.y);
        gl.uniform1f(uniforms.strength, light.strength);
        gl.uniform1f(uniforms.dark, Number(document.documentElement.dataset.theme === 'dark'));
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        if (gl.isContextLost()) return;
        if (!stage.hasAttribute('data-contour') && gl.getError() !== gl.NO_ERROR) {
            gl.deleteProgram(renderer.program);
            renderer = null;
            stopMotion();
            return;
        }

        showContour(true);
        if (moving) queueFrame();
        else previousTime = 0;
    }

    function initialize() {
        try {
            const program = createProgram(gl);
            if (!program) return;
            const uniforms = {
                resolution: gl.getUniformLocation(program, 'uResolution'),
                pointer: gl.getUniformLocation(program, 'uPointer'),
                strength: gl.getUniformLocation(program, 'uPointerStrength'),
                dark: gl.getUniformLocation(program, 'uDark'),
            };
            if (Object.values(uniforms).some((uniform) => uniform === null)) {
                gl.deleteProgram(program);
                throw new Error('Contour shader uniforms are missing');
            }

            gl.useProgram(program);
            renderer = { program, uniforms, viewportLimit: gl.getParameter(gl.MAX_VIEWPORT_DIMS) };
            resize();
        } catch (error) {
            console.warn('Unable to render the Contour Light background.', error);
        }
    }

    function resize() {
        viewport = null;
        queueFrame();
    }

    function watchDensity() {
        densityQuery?.removeEventListener('change', watchDensity);
        densityQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
        densityQuery.addEventListener('change', watchDensity);
        resize();
    }

    function resetStill() {
        stopMotion();
        queueFrame();
    }

    window.addEventListener('pointermove', (event) => {
        if (!renderer || !viewport || !allowMotion()) return;
        if (event.pointerType === 'touch' || event.target?.closest?.('.panel, .column-controls, .wordmark, dialog')) {
            clearPointer();
            return;
        }

        const x = (event.clientX - viewport.left) / viewport.width;
        const y = (viewport.bottom - event.clientY) / viewport.height;
        if (x < 0 || x > 1 || y < 0 || y > 1) {
            clearPointer();
            return;
        }

        if (pointer?.x === x && pointer?.y === y) return;
        pointer = { x, y };
        if (!light.strength) Object.assign(light, pointer);
        queueFrame();
    }, { passive: true });

    window.addEventListener('pointerout', (event) => {
        if (!event.relatedTarget) clearPointer();
    }, { passive: true });
    window.addEventListener('pointerdown', (event) => {
        if (event.pointerType === 'touch' && (pointer || light.strength)) resetStill();
    }, { passive: true });
    window.addEventListener('pointercancel', clearPointer, { passive: true });
    window.addEventListener('blur', resetStill);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', resetStill);
    document.addEventListener('meadow:themechange', queueFrame);
    motion.addEventListener('change', resetStill);
    hover.addEventListener('change', resetStill);

    const observer = new MutationObserver(() => {
        const open = Boolean(document.querySelector('dialog[open]'));
        if (open === dialogOpen) return;
        dialogOpen = open;
        if (dialogOpen && (pointer || light.strength)) resetStill();
    });
    for (const dialog of document.querySelectorAll('dialog')) {
        observer.observe(dialog, { attributes: true, attributeFilter: ['open'] });
    }

    canvas.addEventListener('webglcontextlost', (event) => {
        event.preventDefault();
        stopMotion();
        renderer = null;
        showContour(false);
    });
    canvas.addEventListener('webglcontextrestored', initialize);

    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
    watchDensity();
    initialize();
}
