(function () {
    const VIEW = {
        width: 1200,
        height: 700,
        waterline: 438
    };

    const TIME_ZONE = 'America/Los_Angeles';
    const clockFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: TIME_ZONE,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
    const partFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: TIME_ZONE,
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
    });

    const LIGHT_PALETTE = ['#FFF4D4', '#FAE8B2', '#F5D29D', '#E99988'];

    const phaseStops = [
        { hour: 0, phase: 'night', label: 'late night', burnColor: [60, 84, 122], burnOpacity: 0.27, ambientOpacity: 0.09, washOpacity: 0.08, bloomOpacity: 0.96, lightsStrength: 1, saturate: 0.93, contrast: 1.06, brightness: 0.82, hue: -6, sceneOpacity: 0.79, darkenOpacity: 0.09, textureOpacity: 0.18, frameOpacity: 0.95 },
        { hour: 5, phase: 'dawn', label: 'pre-dawn', burnColor: [86, 106, 142], burnOpacity: 0.23, ambientOpacity: 0.12, washOpacity: 0.1, bloomOpacity: 0.88, lightsStrength: 0.84, saturate: 0.97, contrast: 1.04, brightness: 0.86, hue: -3, sceneOpacity: 0.75, darkenOpacity: 0.08, textureOpacity: 0.17, frameOpacity: 0.93 },
        { hour: 6.6, phase: 'dawn', label: 'dawn', burnColor: [188, 147, 121], burnOpacity: 0.17, ambientOpacity: 0.22, washOpacity: 0.14, bloomOpacity: 0.76, lightsStrength: 0.56, saturate: 1.02, contrast: 1.02, brightness: 0.95, hue: 2, sceneOpacity: 0.68, darkenOpacity: 0.08, textureOpacity: 0.17, frameOpacity: 0.92 },
        { hour: 9, phase: 'day', label: 'morning haze', burnColor: [201, 187, 162], burnOpacity: 0.08, ambientOpacity: 0.25, washOpacity: 0.12, bloomOpacity: 0.46, lightsStrength: 0.18, saturate: 1, contrast: 0.98, brightness: 1.02, hue: 1, sceneOpacity: 0.49, darkenOpacity: 0.04, textureOpacity: 0.1, frameOpacity: 0.84 },
        { hour: 16.7, phase: 'day', label: 'late afternoon', burnColor: [181, 157, 129], burnOpacity: 0.09, ambientOpacity: 0.18, washOpacity: 0.12, bloomOpacity: 0.5, lightsStrength: 0.22, saturate: 1.03, contrast: 1, brightness: 0.99, hue: 0, sceneOpacity: 0.55, darkenOpacity: 0.05, textureOpacity: 0.11, frameOpacity: 0.86 },
        { hour: 18.3, phase: 'golden-hour', label: 'golden hour', burnColor: [203, 123, 95], burnOpacity: 0.16, ambientOpacity: 0.2, washOpacity: 0.15, bloomOpacity: 0.64, lightsStrength: 0.48, saturate: 1.08, contrast: 1.02, brightness: 0.94, hue: 4, sceneOpacity: 0.66, darkenOpacity: 0.06, textureOpacity: 0.14, frameOpacity: 0.9 },
        { hour: 20.3, phase: 'blue-hour', label: 'blue hour', burnColor: [82, 111, 152], burnOpacity: 0.24, ambientOpacity: 0.11, washOpacity: 0.12, bloomOpacity: 0.88, lightsStrength: 0.9, saturate: 1.03, contrast: 1.07, brightness: 0.87, hue: -4, sceneOpacity: 0.77, darkenOpacity: 0.08, textureOpacity: 0.18, frameOpacity: 0.93 },
        { hour: 24, phase: 'night', label: 'late night', burnColor: [60, 84, 122], burnOpacity: 0.27, ambientOpacity: 0.09, washOpacity: 0.08, bloomOpacity: 0.96, lightsStrength: 1, saturate: 0.93, contrast: 1.06, brightness: 0.82, hue: -6, sceneOpacity: 0.79, darkenOpacity: 0.09, textureOpacity: 0.18, frameOpacity: 0.95 }
    ];

    function formatSanFranciscoClock(date) {
        return clockFormatter.format(date).toLowerCase().replace(/\s/g, '');
    }

    function initializeCityIllustration() {
        const card = document.getElementById('cityIllustration');
        const baseImage = document.getElementById('cityBaseImage');
        const sceneImage = document.getElementById('citySceneImage');
        const frameImage = document.getElementById('cityFrameImage');
        const bloomCanvas = document.getElementById('cityBloomCanvas');
        const lightCanvas = document.getElementById('cityLightCanvas');
        const timeLabel = document.getElementById('cityTimeLabel');

        if (!card || !baseImage || !sceneImage || !frameImage || !bloomCanvas || !lightCanvas || !timeLabel || card.dataset.bound === 'true') {
            return;
        }

        hydrateArtwork(card, baseImage, sceneImage, frameImage);

        const bloomCtx = bloomCanvas.getContext('2d');
        const lightCtx = lightCanvas.getContext('2d');

        if (!bloomCtx || !lightCtx) {
            return;
        }

        card.dataset.bound = 'true';

        const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        let reducedMotion = reducedMotionQuery.matches;
        let rect = null;
        let isVisible = true;
        let rafId = 0;
        let lastFrame = 0;
        let lastTimeSync = 0;
        let lastPointerSparkle = 0;

        const pointer = { x: VIEW.width * 0.52, y: VIEW.height * 0.45, active: false };
        const sparkleParticles = [];
        const roadDefinitions = createRoadDefinitions();
        const staticLights = createStaticLights();
        const bridgeLights = createBridgeLights();
        let cars = createCars(roadDefinitions);

        const phaseState = {
            burnColor: phaseStops[0].burnColor.slice(),
            burnOpacity: phaseStops[0].burnOpacity,
            ambientOpacity: phaseStops[0].ambientOpacity,
            washOpacity: phaseStops[0].washOpacity,
            bloomOpacity: phaseStops[0].bloomOpacity,
            sceneOpacity: phaseStops[0].sceneOpacity,
            darkenOpacity: phaseStops[0].darkenOpacity,
            textureOpacity: phaseStops[0].textureOpacity,
            frameOpacity: phaseStops[0].frameOpacity,
            lightsStrength: phaseStops[0].lightsStrength,
            saturate: phaseStops[0].saturate,
            contrast: phaseStops[0].contrast,
            brightness: phaseStops[0].brightness,
            hue: phaseStops[0].hue
        };

        let targetPhase = computePhaseState();
        applyPhaseState(card, phaseState, targetPhase.phase);
        syncTimeLabel();

        function resizeCanvases() {
            rect = card.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const pixelWidth = Math.max(1, Math.round(rect.width * dpr));
            const pixelHeight = Math.max(1, Math.round(rect.height * dpr));

            [bloomCanvas, lightCanvas].forEach((canvas) => {
                canvas.width = pixelWidth;
                canvas.height = pixelHeight;
                canvas.style.width = rect.width + 'px';
                canvas.style.height = rect.height + 'px';
            });

            const scaleX = pixelWidth / VIEW.width;
            const scaleY = pixelHeight / VIEW.height;

            bloomCtx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
            lightCtx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
        }

        function syncTimeLabel() {
            targetPhase = computePhaseState();
            timeLabel.textContent = 'It is ' + formatSanFranciscoClock(new Date()) + ' in San Francisco.';
            card.dataset.phase = targetPhase.phase;
        }

        function tick(now) {
            if (!lastFrame) {
                lastFrame = now;
            }

            const deltaSeconds = Math.min((now - lastFrame) / 1000, 0.05);
            lastFrame = now;

            if (now - lastTimeSync > 15000) {
                syncTimeLabel();
                lastTimeSync = now;
            }

            easePhaseState(phaseState, targetPhase, deltaSeconds);
            applyPhaseState(card, phaseState, targetPhase.phase);
            drawFrame(lightCtx, bloomCtx, phaseState, staticLights, bridgeLights, cars, sparkleParticles, pointer, deltaSeconds, now * 0.001, reducedMotion);

            if (isVisible) {
                rafId = window.requestAnimationFrame(tick);
            } else {
                rafId = 0;
            }
        }

        function resume() {
            if (!rafId) {
                lastFrame = 0;
                rafId = window.requestAnimationFrame(tick);
            }
        }

        function onPointerMove(event) {
            if (!rect) {
                return;
            }

            const relativeX = clamp((event.clientX - rect.left) / rect.width, 0, 1);
            const relativeY = clamp((event.clientY - rect.top) / rect.height, 0, 1);

            pointer.x = relativeX * VIEW.width;
            pointer.y = relativeY * VIEW.height;
            pointer.active = true;

            card.style.setProperty('--city-pointer-x', (relativeX * 100).toFixed(2) + '%');
            card.style.setProperty('--city-pointer-y', (relativeY * 100).toFixed(2) + '%');
            card.style.setProperty('--city-pointer-opacity', reducedMotion ? '0' : '0.58');

            if (!reducedMotion && performance.now() - lastPointerSparkle > 34) {
                sparkleParticles.push({
                    x: pointer.x + randomBetween(-10, 10),
                    y: pointer.y + randomBetween(-8, 8),
                    vx: randomBetween(-12, 12),
                    vy: randomBetween(-8, 8),
                    radius: randomBetween(1.1, 2.4),
                    life: 1,
                    decay: randomBetween(1.2, 1.8),
                    color: Math.random() > 0.4 ? '#F7E6AB' : '#F7C6A2',
                    seed: Math.floor(Math.random() * 100000)
                });
                lastPointerSparkle = performance.now();
            }
        }

        function onPointerLeave() {
            pointer.active = false;
            card.style.setProperty('--city-pointer-opacity', '0');
        }

        function onReducedMotionChange(event) {
            reducedMotion = event.matches;
            cars = createCars(roadDefinitions);
            card.style.setProperty('--city-pointer-opacity', '0');
        }

        resizeCanvases();
        resume();

        card.addEventListener('pointermove', onPointerMove);
        card.addEventListener('pointerleave', onPointerLeave);
        window.addEventListener('resize', resizeCanvases, { passive: true });

        if (typeof reducedMotionQuery.addEventListener === 'function') {
            reducedMotionQuery.addEventListener('change', onReducedMotionChange);
        } else if (typeof reducedMotionQuery.addListener === 'function') {
            reducedMotionQuery.addListener(onReducedMotionChange);
        }

        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                isVisible = entries.some((entry) => entry.isIntersecting);
                if (isVisible) {
                    resume();
                }
            }, { threshold: 0.08 });

            observer.observe(card);
        }
    }

    function hydrateArtwork(card, baseImage, sceneImage, frameImage) {
        if (card.dataset.artRendered === 'true') {
            return;
        }

        const artwork = createArtworkLayers();
        if (!artwork) {
            return;
        }

        baseImage.src = artwork.baseUrl;
        sceneImage.src = artwork.sceneUrl;
        frameImage.src = artwork.frameUrl;
        card.style.setProperty('--city-texture-image', 'url("' + artwork.textureUrl + '")');
        card.dataset.artRendered = 'true';
    }

    function createArtworkLayers() {
        const baseLayer = createLayerCanvas();
        const sceneLayer = createLayerCanvas();
        const textureLayer = createLayerCanvas();
        const frameLayer = createLayerCanvas();

        if (!baseLayer.ctx || !sceneLayer.ctx || !textureLayer.ctx || !frameLayer.ctx) {
            return null;
        }

        paintBaseLayer(baseLayer.ctx);
        paintSceneLayer(sceneLayer.ctx);
        paintTextureLayer(textureLayer.ctx);
        paintFrameLayer(frameLayer.ctx);

        return {
            baseUrl: baseLayer.canvas.toDataURL('image/png'),
            sceneUrl: sceneLayer.canvas.toDataURL('image/png'),
            textureUrl: textureLayer.canvas.toDataURL('image/png'),
            frameUrl: frameLayer.canvas.toDataURL('image/png')
        };
    }

    function createLayerCanvas() {
        const canvas = document.createElement('canvas');
        canvas.width = VIEW.width;
        canvas.height = VIEW.height;
        return { canvas: canvas, ctx: canvas.getContext('2d') };
    }

    function paintBaseLayer(ctx) {
        const random = mulberry32(101);
        const skyGradient = ctx.createLinearGradient(0, 0, 0, VIEW.height);
        skyGradient.addColorStop(0, '#16263B');
        skyGradient.addColorStop(0.24, '#38516A');
        skyGradient.addColorStop(0.54, '#6A8799');
        skyGradient.addColorStop(0.74, '#768790');
        skyGradient.addColorStop(1, '#5A686E');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, VIEW.width, VIEW.height);

        paintSoftEllipse(ctx, 368, 152, 250, 130, '#E8D0A8', 0.18, -0.1, 46);
        paintSoftEllipse(ctx, 880, 150, 430, 160, '#6C89A2', 0.12, 0.08, 58);
        paintSoftEllipse(ctx, 660, 262, 700, 110, '#7A8C95', 0.16, 0.02, 52);
        paintSoftEllipse(ctx, 180, 258, 240, 92, '#D8C7AA', 0.08, -0.08, 30);

        for (let index = 0; index < 28; index += 1) {
            const y = 90 + random() * 250;
            paintSoftEllipse(
                ctx,
                120 + random() * 1060,
                y,
                130 + random() * 250,
                22 + random() * 44,
                random() > 0.48 ? '#D2C3B0' : '#89A2B6',
                0.028 + random() * 0.04,
                randomBetween(-0.12, 0.12),
                22 + random() * 22
            );
        }

        const waterGradient = ctx.createLinearGradient(0, VIEW.waterline - 36, 0, VIEW.height);
        waterGradient.addColorStop(0, 'rgba(96, 117, 131, 0.75)');
        waterGradient.addColorStop(0.34, 'rgba(70, 87, 103, 0.74)');
        waterGradient.addColorStop(1, 'rgba(31, 44, 58, 0.9)');
        ctx.fillStyle = waterGradient;
        ctx.fillRect(0, VIEW.waterline - 28, VIEW.width, VIEW.height - VIEW.waterline + 28);

        paintSoftEllipse(ctx, 820, 470, 270, 34, '#F0DBAF', 0.06, 0.02, 22);
        paintSoftEllipse(ctx, 284, 454, 160, 24, '#E9D0A0', 0.06, 0.04, 20);
        paintSoftEllipse(ctx, 710, 430, 610, 28, '#C9D2D2', 0.06, 0, 26);
        paintSoftEllipse(ctx, 812, 438, 360, 26, '#E2D7BE', 0.05, 0, 18);

        paintWaterStrokes(ctx, random);
        paintGrain(ctx, mulberry32(1337), 1800, 0.032, 1.5);
    }

    function paintSceneLayer(ctx) {
        const random = mulberry32(202);

        const leftHillGradient = ctx.createLinearGradient(140, 248, 420, 610);
        leftHillGradient.addColorStop(0, 'rgba(62, 83, 100, 0.76)');
        leftHillGradient.addColorStop(0.62, 'rgba(38, 54, 68, 0.88)');
        leftHillGradient.addColorStop(1, 'rgba(17, 25, 36, 0.96)');
        fillPolygon(ctx, [
            [0, 450], [58, 430], [112, 398], [168, 370], [234, 339], [304, 324], [402, 332], [486, 360], [564, 395], [608, 430], [608, 700], [0, 700]
        ], leftHillGradient, 0.98);
        paintSoftEllipse(ctx, 274, 374, 244, 72, '#67839B', 0.16, -0.16, 28);
        paintSoftEllipse(ctx, 210, 322, 148, 40, '#90A6B5', 0.08, -0.22, 24);

        const cityGradient = ctx.createLinearGradient(740, 216, 860, 460);
        cityGradient.addColorStop(0, 'rgba(43, 66, 86, 0.86)');
        cityGradient.addColorStop(0.52, 'rgba(24, 37, 54, 0.94)');
        cityGradient.addColorStop(1, 'rgba(10, 18, 30, 1)');
        fillPolygon(ctx, [
            [574, 432], [594, 392], [622, 360], [650, 358], [676, 320], [706, 326], [736, 302], [770, 282], [804, 258], [836, 272],
            [864, 240], [894, 252], [922, 234], [950, 270], [982, 258], [1014, 292], [1048, 286], [1080, 320], [1122, 336], [1160, 360],
            [1200, 372], [1200, 700], [574, 700]
        ], cityGradient, 0.98);

        const skylineBlocks = [
            [610, 336, 26, 92], [650, 316, 28, 114], [694, 298, 30, 126], [738, 286, 42, 136], [796, 264, 46, 158], [858, 244, 38, 174],
            [914, 228, 26, 194], [960, 252, 28, 172], [1002, 284, 36, 136], [1054, 300, 26, 122], [1090, 322, 26, 100]
        ];

        for (let index = 0; index < skylineBlocks.length; index += 1) {
            const block = skylineBlocks[index];
            const blockGradient = ctx.createLinearGradient(block[0], block[1], block[0], block[1] + block[3]);
            blockGradient.addColorStop(0, 'rgba(54, 74, 90, 0.32)');
            blockGradient.addColorStop(1, 'rgba(7, 12, 21, 0.84)');
            paintSoftRect(ctx, block[0], block[1], block[2], block[3], blockGradient, 0.94, 1.2);
        }

        paintSoftRect(ctx, 704, 294, 10, 132, 'rgba(11, 18, 29, 0.96)', 0.9, 0.6);
        paintSoftRect(ctx, 914, 224, 8, 198, 'rgba(9, 15, 26, 0.96)', 0.92, 0.5);
        paintSoftRect(ctx, 980, 246, 12, 176, 'rgba(9, 15, 26, 0.94)', 0.9, 0.6);

        const shorelineGradient = ctx.createLinearGradient(600, 412, 1100, 506);
        shorelineGradient.addColorStop(0, 'rgba(72, 91, 104, 0.46)');
        shorelineGradient.addColorStop(1, 'rgba(20, 29, 40, 0.76)');
        fillPolygon(ctx, [
            [564, 430], [650, 434], [732, 436], [824, 442], [930, 452], [1038, 474], [1168, 500], [1200, 534], [1200, 700], [564, 700]
        ], shorelineGradient, 0.58);

        drawBridgeSilhouette(ctx);

        const foregroundGradient = ctx.createLinearGradient(0, 476, 0, 700);
        foregroundGradient.addColorStop(0, 'rgba(56, 68, 77, 0.12)');
        foregroundGradient.addColorStop(1, 'rgba(5, 10, 16, 0.96)');
        fillPolygon(ctx, [
            [0, 534], [96, 500], [176, 492], [242, 500], [306, 520], [366, 546], [422, 570], [474, 602], [522, 640], [560, 700], [0, 700]
        ], foregroundGradient, 0.92);

        fillPolygon(ctx, [
            [650, 482], [736, 450], [820, 438], [904, 444], [1002, 468], [1114, 520], [1200, 564], [1200, 700], [650, 700]
        ], 'rgba(14, 20, 31, 0.8)', 0.9);
        paintSoftEllipse(ctx, 926, 470, 320, 36, '#71879A', 0.11, -0.06, 20);

        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        paintSoftEllipse(ctx, 310, 410, 172, 30, '#000000', 0.18, -0.06, 20);
        paintSoftEllipse(ctx, 798, 416, 284, 34, '#000000', 0.18, 0.02, 28);
        paintSoftEllipse(ctx, 980, 424, 246, 30, '#000000', 0.15, 0.04, 24);
        paintSoftEllipse(ctx, 736, 308, 240, 28, '#000000', 0.07, -0.04, 18);
        ctx.restore();

        for (let index = 0; index < 24; index += 1) {
            paintStroke(
                ctx,
                16 + random() * VIEW.width,
                320 + random() * 280,
                66 + random() * VIEW.width,
                316 + random() * 280,
                1.2 + random() * 2.8,
                random() > 0.56 ? 'rgba(122, 143, 160, 0.12)' : 'rgba(15, 21, 31, 0.14)',
                0.4,
                1.4
            );
        }
    }

    function paintTextureLayer(ctx) {
        const random = mulberry32(303);

        for (let index = 0; index < 14; index += 1) {
            paintSoftEllipse(
                ctx,
                80 + random() * 1040,
                80 + random() * 560,
                120 + random() * 240,
                50 + random() * 110,
                random() > 0.5 ? '#C7B8A3' : '#8EA0AC',
                0.02 + random() * 0.035,
                randomBetween(-0.4, 0.4),
                24 + random() * 34
            );
        }

        for (let index = 0; index < 320; index += 1) {
            const x = random() * VIEW.width;
            const y = random() * VIEW.height;
            const length = 12 + random() * 60;
            const angle = -0.12 + random() * 0.24;
            paintStroke(
                ctx,
                x,
                y,
                x + Math.cos(angle) * length,
                y + Math.sin(angle) * length,
                0.5 + random() * 1.2,
                random() > 0.58 ? 'rgba(255, 247, 232, 0.06)' : 'rgba(17, 27, 41, 0.06)',
                1,
                0.8
            );
        }

        paintGrain(ctx, mulberry32(404), 4200, 0.06, 1.3);
    }

    function paintFrameLayer(ctx) {
        paintSoftEllipse(ctx, VIEW.width * 0.5, -32, 760, 120, '#F4F1EB', 0.2, 0, 30);
        paintSoftEllipse(ctx, VIEW.width * 0.5, VIEW.height + 28, 700, 110, '#ECE8E0', 0.16, 0, 24);
        paintSoftEllipse(ctx, -54, VIEW.height * 0.5, 120, 420, '#F3F0E8', 0.18, 0, 22);
        paintSoftEllipse(ctx, VIEW.width + 54, VIEW.height * 0.5, 120, 420, '#F3F0E8', 0.16, 0, 22);

        paintSoftEllipse(ctx, 132, 106, 190, 110, '#FFFFFF', 0.08, -0.18, 24);
        paintSoftEllipse(ctx, 1040, 122, 180, 100, '#FFFFFF', 0.06, 0.12, 22);
        paintSoftEllipse(ctx, 110, 612, 210, 120, '#F5F1E8', 0.12, 0.12, 26);
        paintSoftEllipse(ctx, 1088, 590, 180, 110, '#F3EFE7', 0.1, -0.08, 24);

        const edgeGradient = ctx.createLinearGradient(0, 0, 0, VIEW.height);
        edgeGradient.addColorStop(0, 'rgba(244, 241, 235, 0.18)');
        edgeGradient.addColorStop(0.16, 'rgba(244, 241, 235, 0)');
        edgeGradient.addColorStop(0.84, 'rgba(244, 241, 235, 0)');
        edgeGradient.addColorStop(1, 'rgba(235, 231, 223, 0.15)');
        ctx.fillStyle = edgeGradient;
        ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    }

    function paintWaterStrokes(ctx, random) {
        for (let index = 0; index < 180; index += 1) {
            const y = VIEW.waterline + random() * (VIEW.height - VIEW.waterline);
            const x = random() * VIEW.width;
            const length = 48 + random() * 220;
            const width = 0.8 + random() * 2.8;
            const alpha = 0.035 + random() * 0.05;
            const color = random() > 0.72 ? '#E4CFAB' : (random() > 0.5 ? '#93A5B2' : '#627B8E');

            paintStroke(
                ctx,
                x,
                y,
                x + length,
                y + randomBetween(-5, 5),
                width,
                color,
                alpha,
                1.4
            );
        }
    }

    function drawBridgeSilhouette(ctx) {
        paintStroke(ctx, 126, 377, 662, 394, 12, '#1A2839', 0.78, 6);
        paintStroke(ctx, 126, 377, 662, 394, 4.4, '#43576B', 0.22, 1.4);
        paintStroke(ctx, 126, 377, 662, 394, 1.3, 'rgba(181, 199, 214, 0.16)', 0.9, 0.8);

        paintSoftRect(ctx, 223, 250, 14, 136, 'rgba(25, 37, 50, 0.92)', 1, 1.2);
        paintSoftRect(ctx, 436, 226, 14, 162, 'rgba(23, 35, 48, 0.94)', 1, 1.2);
        paintStroke(ctx, 230, 252, 230, 386, 1.1, 'rgba(166, 184, 198, 0.14)', 0.8, 0.6);
        paintStroke(ctx, 443, 226, 443, 389, 1.1, 'rgba(166, 184, 198, 0.14)', 0.8, 0.6);

        strokePolyline(ctx, [[225, 252], [198, 276], [174, 304], [150, 340], [126, 377]], 2, 'rgba(72, 92, 112, 0.28)', 0.8, 0.8);
        strokePolyline(ctx, [[442, 230], [418, 254], [396, 278], [382, 300], [366, 324], [348, 350], [330, 373], [316, 390]], 1.7, 'rgba(72, 92, 112, 0.24)', 0.8, 0.7);

        paintStroke(ctx, 222, 252, 224, 386, 3.8, '#42576C', 0.18, 1);
        paintStroke(ctx, 439, 226, 441, 389, 3.8, '#42576C', 0.16, 1);

        fillPolygon(ctx, [[0, 412], [108, 396], [126, 377], [134, 394], [0, 436]], 'rgba(43, 58, 71, 0.5)', 0.4);
    }

    function drawFrame(lightCtx, bloomCtx, phaseState, staticLights, bridgeLights, cars, sparkleParticles, pointer, deltaSeconds, timeSeconds, reducedMotion) {
        lightCtx.clearRect(0, 0, VIEW.width, VIEW.height);
        bloomCtx.clearRect(0, 0, VIEW.width, VIEW.height);
        lightCtx.globalCompositeOperation = 'source-over';
        bloomCtx.globalCompositeOperation = 'source-over';

        drawStaticLights(lightCtx, bloomCtx, staticLights, phaseState, timeSeconds);
        drawBridgeLights(lightCtx, bloomCtx, bridgeLights, phaseState, timeSeconds);
        drawCars(lightCtx, bloomCtx, cars, phaseState, deltaSeconds, timeSeconds, reducedMotion);
        drawSparkles(lightCtx, bloomCtx, sparkleParticles, deltaSeconds);

        if (!reducedMotion && pointer.active) {
            drawGlowPair(lightCtx, bloomCtx, pointer.x, pointer.y, { color: '#F7E6AB', alpha: 0.1, coreRadius: 2.6, bloomRadius: 34, seed: 8031 });
        }
    }

    function drawStaticLights(lightCtx, bloomCtx, lights, phaseState, timeSeconds) {
        for (let index = 0; index < lights.length; index += 1) {
            const light = lights[index];
            const twinkle = 0.76 + 0.24 * Math.sin(timeSeconds * light.speed + light.phase);
            const alpha = light.alpha * phaseState.lightsStrength * twinkle;

            drawGlowPair(lightCtx, bloomCtx, light.x, light.y, {
                color: light.color,
                alpha: alpha,
                coreRadius: light.radius,
                bloomRadius: light.radius * light.bloom,
                seed: light.seed
            });

            if (light.reflect) {
                drawReflection(lightCtx, bloomCtx, light.x, light.y, {
                    color: light.color,
                    alpha: alpha * 0.18,
                    coreRadius: light.radius * 0.85,
                    bloomRadius: light.radius * light.bloom * 0.9,
                    seed: light.seed
                }, timeSeconds);
            }
        }
    }

    function drawBridgeLights(lightCtx, bloomCtx, lights, phaseState, timeSeconds) {
        for (let index = 0; index < lights.length; index += 1) {
            const light = lights[index];
            const pulse = light.kind === 'blink'
                ? 0.5 + 0.5 * Math.sin(timeSeconds * light.speed + light.phase)
                : 0.9 + 0.1 * Math.sin(timeSeconds * light.speed + light.phase);
            const alpha = light.alpha * phaseState.lightsStrength * pulse;

            drawGlowPair(lightCtx, bloomCtx, light.x, light.y, {
                color: light.color,
                alpha: alpha,
                coreRadius: light.radius,
                bloomRadius: light.radius * light.bloom,
                seed: light.seed
            });

            if (light.reflect) {
                drawReflection(lightCtx, bloomCtx, light.x, light.y, {
                    color: light.color,
                    alpha: alpha * 0.13,
                    coreRadius: light.radius * 0.72,
                    bloomRadius: light.radius * light.bloom * 0.8,
                    seed: light.seed + 9
                }, timeSeconds);
            }
        }
    }

    function drawCars(lightCtx, bloomCtx, cars, phaseState, deltaSeconds, timeSeconds, reducedMotion) {
        const motionFactor = reducedMotion ? 0.18 : 1;

        for (let index = 0; index < cars.length; index += 1) {
            const car = cars[index];
            car.progress = (car.progress + car.speed * deltaSeconds * motionFactor) % 1;

            const position = sampleRoad(car.road.path, car.progress);
            const offsetX = position.normalX * car.laneOffset;
            const offsetY = position.normalY * car.laneOffset;
            const x = position.x + offsetX;
            const y = position.y + offsetY;
            const visible = applyOcclusion(car.road.occlusion, car.progress);
            const flicker = 0.9 + 0.1 * Math.sin(timeSeconds * car.twinkleSpeed + car.phase);
            const alpha = visible * phaseState.lightsStrength * flicker * car.alpha;

            drawTrail(lightCtx, bloomCtx, car, alpha, timeSeconds);
            drawGlowPair(lightCtx, bloomCtx, x, y, {
                color: car.color,
                alpha: alpha,
                coreRadius: car.coreRadius,
                bloomRadius: car.bloomRadius,
                stretch: car.stretch,
                angle: position.angle,
                seed: car.seed
            });

            if (car.road.reflection) {
                drawReflection(lightCtx, bloomCtx, x, y, {
                    color: car.color,
                    alpha: alpha * 0.18,
                    coreRadius: car.coreRadius * 0.7,
                    bloomRadius: car.bloomRadius * 0.78,
                    stretch: car.stretch * 0.86,
                    angle: position.angle,
                    seed: car.seed + 17
                }, timeSeconds);
            }
        }
    }

    function drawTrail(lightCtx, bloomCtx, car, alpha, timeSeconds) {
        for (let step = 1; step <= car.trailCount; step += 1) {
            const progress = (car.progress - car.trailSpacing * step + 1) % 1;
            const trailPosition = sampleRoad(car.road.path, progress);
            const fade = alpha * (1 - step / (car.trailCount + 1)) * car.trailAlpha;
            const x = trailPosition.x + trailPosition.normalX * car.laneOffset;
            const y = trailPosition.y + trailPosition.normalY * car.laneOffset;

            drawGlowPair(lightCtx, bloomCtx, x, y, {
                color: car.color,
                alpha: fade,
                coreRadius: car.coreRadius * (0.82 - step * 0.06),
                bloomRadius: car.bloomRadius * (0.78 - step * 0.07),
                stretch: car.stretch,
                angle: trailPosition.angle,
                seed: car.seed + step * 31
            });

            if (car.road.reflection) {
                drawReflection(lightCtx, bloomCtx, x, y, {
                    color: car.color,
                    alpha: fade * 0.18,
                    coreRadius: car.coreRadius * 0.5,
                    bloomRadius: car.bloomRadius * 0.55,
                    stretch: car.stretch * 0.86,
                    angle: trailPosition.angle,
                    seed: car.seed + step * 37
                }, timeSeconds);
            }
        }
    }

    function drawSparkles(lightCtx, bloomCtx, sparkleParticles, deltaSeconds) {
        for (let index = sparkleParticles.length - 1; index >= 0; index -= 1) {
            const sparkle = sparkleParticles[index];
            sparkle.life -= deltaSeconds * sparkle.decay;
            sparkle.x += sparkle.vx * deltaSeconds;
            sparkle.y += sparkle.vy * deltaSeconds;
            sparkle.vy += deltaSeconds * 4;

            if (sparkle.life <= 0) {
                sparkleParticles.splice(index, 1);
                continue;
            }

            const alpha = sparkle.life * 0.46;
            drawGlowPair(lightCtx, bloomCtx, sparkle.x, sparkle.y, {
                color: sparkle.color,
                alpha: alpha,
                coreRadius: sparkle.radius,
                bloomRadius: sparkle.radius * 8,
                seed: sparkle.seed
            });
        }
    }

    function drawReflection(lightCtx, bloomCtx, x, y, spec, timeSeconds) {
        if (y >= VIEW.waterline) {
            return;
        }

        const reflectedY = VIEW.waterline + (VIEW.waterline - y) * 0.72 + 8;
        const shiftedX = x + Math.sin(timeSeconds * 2.6 + x * 0.024) * 2.4;
        drawGlowPair(lightCtx, bloomCtx, shiftedX, reflectedY, {
            color: spec.color,
            alpha: spec.alpha,
            coreRadius: spec.coreRadius,
            bloomRadius: spec.bloomRadius,
            stretch: (spec.stretch || 1) * 1.25,
            angle: -(spec.angle || 0),
            seed: spec.seed || hashSeed(x, y, spec.bloomRadius)
        });
    }

    function drawGlowPair(lightCtx, bloomCtx, x, y, spec) {
        const seed = spec.seed || hashSeed(x, y, spec.bloomRadius);
        drawGradientLight(bloomCtx, x, y, spec.bloomRadius, spec.color, spec.alpha * 0.72, (spec.stretch || 1) * 1.05, spec.angle || 0, seed, true);
        drawBloomSmear(bloomCtx, x, y, spec.bloomRadius, spec.color, spec.alpha * 0.16, spec.angle || 0, seed + 11);
        drawGradientLight(lightCtx, x, y, spec.coreRadius, spec.color, Math.min(1, spec.alpha), Math.max(1, (spec.stretch || 1) * 0.9), spec.angle || 0, seed, false);
    }

    function drawGradientLight(ctx, x, y, radius, color, alpha, stretch, angle, seed, isBloom) {
        if (alpha <= 0 || radius <= 0) {
            return;
        }

        const rgb = hexToRgb(color);
        const random = mulberry32(seed);
        const layers = isBloom ? 4 : 3;
        const spread = radius * (isBloom ? 0.22 : 0.12);

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.scale(stretch, 1);
        ctx.globalCompositeOperation = 'lighter';

        for (let layer = 0; layer < layers; layer += 1) {
            const layerScale = 1 - layer * (isBloom ? 0.14 : 0.18);
            const offsetX = (random() - 0.5) * spread * (1 + layer * 0.35);
            const offsetY = (random() - 0.5) * spread * (0.9 + layer * 0.15);
            const rx = Math.max(0.8, radius * layerScale * (0.84 + random() * 0.34));
            const ry = Math.max(0.8, rx * (isBloom ? 0.56 : 0.72) * (0.84 + random() * 0.18));
            const layerAlpha = alpha * (isBloom ? 0.72 : 0.96) * (1 - layer * 0.16);

            const gradient = ctx.createRadialGradient(offsetX, offsetY, 0, offsetX, offsetY, rx);
            gradient.addColorStop(0, colorToRgba(rgb, layerAlpha));
            gradient.addColorStop(0.2, colorToRgba(rgb, layerAlpha * (isBloom ? 0.56 : 0.7)));
            gradient.addColorStop(0.58, colorToRgba(rgb, layerAlpha * 0.14));
            gradient.addColorStop(1, colorToRgba(rgb, 0));

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.ellipse(offsetX, offsetY, rx, ry, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        if (!isBloom) {
            ctx.fillStyle = colorToRgba(rgb, Math.min(1, alpha * 0.72));
            ctx.beginPath();
            ctx.ellipse(0, 0, Math.max(0.65, radius * 0.36), Math.max(0.55, radius * 0.26), 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    function drawBloomSmear(ctx, x, y, radius, color, alpha, angle, seed) {
        if (alpha <= 0 || radius < 8) {
            return;
        }

        const rgb = hexToRgb(color);
        const random = mulberry32(seed);
        const length = radius * (1.8 + random() * 0.8);
        const width = Math.max(1.5, radius * (0.12 + random() * 0.06));

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.globalCompositeOperation = 'lighter';

        const gradient = ctx.createLinearGradient(-length * 0.5, 0, length * 0.5, 0);
        gradient.addColorStop(0, colorToRgba(rgb, 0));
        gradient.addColorStop(0.34, colorToRgba(rgb, alpha * 0.3));
        gradient.addColorStop(0.5, colorToRgba(rgb, alpha));
        gradient.addColorStop(0.66, colorToRgba(rgb, alpha * 0.3));
        gradient.addColorStop(1, colorToRgba(rgb, 0));

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse((random() - 0.5) * radius * 0.12, (random() - 0.5) * radius * 0.08, length * 0.5, width, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function createStaticLights() {
        const random = mulberry32(7);
        const lights = [];
        const buildingZones = [
            { x: 604, y: 338, width: 30, height: 86, count: 15 },
            { x: 648, y: 316, width: 30, height: 112, count: 19 },
            { x: 694, y: 302, width: 31, height: 124, count: 20 },
            { x: 742, y: 288, width: 42, height: 136, count: 24 },
            { x: 800, y: 264, width: 48, height: 160, count: 29 },
            { x: 860, y: 244, width: 39, height: 176, count: 24 },
            { x: 914, y: 232, width: 26, height: 192, count: 23 },
            { x: 962, y: 256, width: 30, height: 170, count: 19 },
            { x: 1004, y: 286, width: 36, height: 140, count: 17 },
            { x: 1054, y: 302, width: 28, height: 122, count: 14 },
            { x: 1092, y: 322, width: 24, height: 100, count: 12 }
        ];

        for (let zoneIndex = 0; zoneIndex < buildingZones.length; zoneIndex += 1) {
            const zone = buildingZones[zoneIndex];
            for (let count = 0; count < zone.count; count += 1) {
                lights.push({
                    x: zone.x + random() * zone.width,
                    y: zone.y + random() * zone.height,
                    radius: 0.9 + random() * 0.85,
                    bloom: 10 + random() * 5,
                    alpha: 0.12 + random() * 0.22,
                    color: LIGHT_PALETTE[Math.floor(random() * LIGHT_PALETTE.length)],
                    speed: 1 + random() * 2.6,
                    phase: random() * Math.PI * 2,
                    reflect: false,
                    seed: Math.floor(random() * 1000000)
                });
            }
        }

        for (let index = 0; index < 58; index += 1) {
            const x = 548 + random() * 570;
            const slope = 454 - (x - 560) * 0.095;
            lights.push({
                x: x,
                y: slope + random() * 48,
                radius: 0.95 + random() * 0.7,
                bloom: 10 + random() * 5,
                alpha: 0.13 + random() * 0.16,
                color: random() > 0.2 ? '#FFF0C1' : '#F2CAA7',
                speed: 0.9 + random() * 2.1,
                phase: random() * Math.PI * 2,
                reflect: false,
                seed: Math.floor(random() * 1000000)
            });
        }

        for (let index = 0; index < 26; index += 1) {
            lights.push({
                x: 694 + random() * 438,
                y: 470 + random() * 26,
                radius: 1 + random() * 0.74,
                bloom: 11 + random() * 4,
                alpha: 0.09 + random() * 0.13,
                color: '#F9E8A9',
                speed: 1 + random() * 1.9,
                phase: random() * Math.PI * 2,
                reflect: false,
                seed: Math.floor(random() * 1000000)
            });
        }

        for (let index = 0; index < 20; index += 1) {
            lights.push({
                x: 146 + random() * 290,
                y: 344 + random() * 76,
                radius: 0.85 + random() * 0.55,
                bloom: 9 + random() * 3,
                alpha: 0.08 + random() * 0.14,
                color: random() > 0.4 ? '#F7E8B2' : '#E7A789',
                speed: 1.2 + random() * 2,
                phase: random() * Math.PI * 2,
                reflect: false,
                seed: Math.floor(random() * 1000000)
            });
        }

        return lights;
    }

    function createBridgeLights() {
        const lights = [];

        for (let step = 0; step <= 40; step += 1) {
            const t = step / 40;
            const x = 126 + (662 - 126) * t;
            const y = 377 + (394 - 377) * t;
            lights.push({
                x: x,
                y: y,
                radius: 1.04,
                bloom: 14,
                alpha: 0.2,
                color: '#E9D792',
                speed: 1.6,
                phase: step * 0.35,
                reflect: true,
                kind: 'rope',
                seed: 2000 + step * 17
            });
        }

        const blinkers = [
            { x: 229, y: 252 },
            { x: 442, y: 230 },
            { x: 229, y: 375 },
            { x: 442, y: 385 },
            { x: 914, y: 230 },
            { x: 984, y: 248 }
        ];

        for (let index = 0; index < blinkers.length; index += 1) {
            lights.push({
                x: blinkers[index].x,
                y: blinkers[index].y,
                radius: index < 4 ? 1.9 : 1.4,
                bloom: index < 4 ? 20 : 15,
                alpha: index < 4 ? 0.34 : 0.18,
                color: '#FF8CA4',
                speed: 4.6 + index * 0.7,
                phase: index * 1.8,
                reflect: index < 2,
                kind: 'blink',
                seed: 5000 + index * 23
            });
        }

        return lights;
    }

    function createRoadDefinitions() {
        return [
            {
                id: 'bridge-deck',
                path: buildSmoothPath([[118, 377], [200, 378], [282, 379], [365, 382], [450, 385], [540, 390], [662, 394]]),
                reflection: true,
                occlusion: []
            },
            {
                id: 'shore-road',
                path: buildSmoothPath([[118, 592], [230, 550], [390, 525], [554, 517], [715, 524], [900, 548], [1120, 571]]),
                reflection: false,
                occlusion: [[0.08, 0.15], [0.46, 0.53]]
            },
            {
                id: 'hillside-road',
                path: buildSmoothPath([[612, 488], [692, 466], [786, 440], [886, 430], [990, 441], [1110, 486]]),
                reflection: false,
                occlusion: [[0.36, 0.44], [0.73, 0.81]]
            }
        ];
    }

    function createCars(roads) {
        const random = mulberry32(17);
        const cars = [];

        function pushCars(road, options) {
            for (let index = 0; index < options.count; index += 1) {
                cars.push({
                    road: road,
                    progress: (index / options.count + random() * 0.18) % 1,
                    speed: options.speedMin + random() * (options.speedMax - options.speedMin),
                    laneOffset: options.laneOffset,
                    color: options.color,
                    alpha: options.alpha,
                    coreRadius: options.coreRadius,
                    bloomRadius: options.bloomRadius,
                    stretch: options.stretch,
                    trailCount: options.trailCount,
                    trailSpacing: options.trailSpacing,
                    trailAlpha: options.trailAlpha,
                    twinkleSpeed: options.twinkleSpeedMin + random() * (options.twinkleSpeedMax - options.twinkleSpeedMin),
                    phase: random() * Math.PI * 2,
                    seed: Math.floor(random() * 1000000)
                });
            }
        }

        pushCars(roads[0], { count: 6, speedMin: 0.014, speedMax: 0.021, laneOffset: -1.5, color: '#F7E5A5', alpha: 0.4, coreRadius: 2.3, bloomRadius: 22, stretch: 1.58, trailCount: 4, trailSpacing: 0.013, trailAlpha: 0.56, twinkleSpeedMin: 2.8, twinkleSpeedMax: 4.8 });
        pushCars(roads[0], { count: 5, speedMin: 0.011, speedMax: 0.018, laneOffset: 1.6, color: '#F49A8A', alpha: 0.32, coreRadius: 2.1, bloomRadius: 18, stretch: 1.34, trailCount: 4, trailSpacing: 0.014, trailAlpha: 0.52, twinkleSpeedMin: 2.4, twinkleSpeedMax: 4.2 });
        pushCars(roads[1], { count: 7, speedMin: 0.018, speedMax: 0.026, laneOffset: -2.6, color: '#F7E7AE', alpha: 0.46, coreRadius: 2.5, bloomRadius: 24, stretch: 1.62, trailCount: 5, trailSpacing: 0.012, trailAlpha: 0.6, twinkleSpeedMin: 3, twinkleSpeedMax: 5 });
        pushCars(roads[1], { count: 6, speedMin: 0.016, speedMax: 0.023, laneOffset: 2.7, color: '#E98C7F', alpha: 0.32, coreRadius: 2.2, bloomRadius: 18, stretch: 1.38, trailCount: 4, trailSpacing: 0.011, trailAlpha: 0.48, twinkleSpeedMin: 2.4, twinkleSpeedMax: 4.1 });
        pushCars(roads[2], { count: 5, speedMin: 0.014, speedMax: 0.02, laneOffset: -2.1, color: '#F7E2A4', alpha: 0.36, coreRadius: 2.2, bloomRadius: 18, stretch: 1.45, trailCount: 4, trailSpacing: 0.014, trailAlpha: 0.5, twinkleSpeedMin: 2, twinkleSpeedMax: 3.8 });
        pushCars(roads[2], { count: 4, speedMin: 0.012, speedMax: 0.018, laneOffset: 2.2, color: '#F19986', alpha: 0.28, coreRadius: 2, bloomRadius: 15, stretch: 1.3, trailCount: 3, trailSpacing: 0.014, trailAlpha: 0.42, twinkleSpeedMin: 1.9, twinkleSpeedMax: 3.2 });

        return cars;
    }

    function buildSmoothPath(points) {
        const sampled = [];

        for (let index = 0; index < points.length - 1; index += 1) {
            const p0 = points[Math.max(0, index - 1)];
            const p1 = points[index];
            const p2 = points[index + 1];
            const p3 = points[Math.min(points.length - 1, index + 2)];
            const segments = 22;

            for (let step = 0; step < segments; step += 1) {
                const t = step / segments;
                sampled.push([catmullRom(p0[0], p1[0], p2[0], p3[0], t), catmullRom(p0[1], p1[1], p2[1], p3[1], t)]);
            }
        }

        sampled.push(points[points.length - 1]);

        let totalLength = 0;
        const cumulative = [0];

        for (let index = 1; index < sampled.length; index += 1) {
            const dx = sampled[index][0] - sampled[index - 1][0];
            const dy = sampled[index][1] - sampled[index - 1][1];
            totalLength += Math.hypot(dx, dy);
            cumulative.push(totalLength);
        }

        return { points: sampled, cumulative: cumulative, length: totalLength };
    }

    function sampleRoad(path, progress) {
        const distance = path.length * progress;
        let index = 1;

        while (index < path.cumulative.length && path.cumulative[index] < distance) {
            index += 1;
        }

        const previousIndex = Math.max(0, index - 1);
        const start = path.points[previousIndex];
        const end = path.points[Math.min(path.points.length - 1, index)];
        const startDistance = path.cumulative[previousIndex];
        const endDistance = path.cumulative[Math.min(path.cumulative.length - 1, index)];
        const segmentLength = Math.max(0.0001, endDistance - startDistance);
        const mix = clamp((distance - startDistance) / segmentLength, 0, 1);
        const x = lerp(start[0], end[0], mix);
        const y = lerp(start[1], end[1], mix);
        const dx = end[0] - start[0];
        const dy = end[1] - start[1];
        const angle = Math.atan2(dy, dx);
        const normalLength = Math.max(0.0001, Math.hypot(dx, dy));

        return {
            x: x,
            y: y,
            angle: angle,
            normalX: -dy / normalLength,
            normalY: dx / normalLength
        };
    }

    function applyOcclusion(ranges, progress) {
        for (let index = 0; index < ranges.length; index += 1) {
            if (progress >= ranges[index][0] && progress <= ranges[index][1]) {
                return 0.24;
            }
        }
        return 1;
    }

    function computePhaseState() {
        const parts = partFormatter.formatToParts(new Date());
        const hour = Number(getPart(parts, 'hour'));
        const minute = Number(getPart(parts, 'minute'));
        const second = Number(getPart(parts, 'second'));
        const decimalHour = hour + minute / 60 + second / 3600;

        let lower = phaseStops[0];
        let upper = phaseStops[phaseStops.length - 1];

        for (let index = 0; index < phaseStops.length - 1; index += 1) {
            if (decimalHour >= phaseStops[index].hour && decimalHour <= phaseStops[index + 1].hour) {
                lower = phaseStops[index];
                upper = phaseStops[index + 1];
                break;
            }
        }

        const span = Math.max(0.001, upper.hour - lower.hour);
        const mix = clamp((decimalHour - lower.hour) / span, 0, 1);

        return {
            phase: mix < 0.5 ? lower.phase : upper.phase,
            label: mix < 0.5 ? lower.label : upper.label,
            burnColor: mixColor(lower.burnColor, upper.burnColor, mix),
            burnOpacity: lerp(lower.burnOpacity, upper.burnOpacity, mix),
            ambientOpacity: lerp(lower.ambientOpacity, upper.ambientOpacity, mix),
            washOpacity: lerp(lower.washOpacity, upper.washOpacity, mix),
            bloomOpacity: lerp(lower.bloomOpacity, upper.bloomOpacity, mix),
            sceneOpacity: lerp(lower.sceneOpacity, upper.sceneOpacity, mix),
            darkenOpacity: lerp(lower.darkenOpacity, upper.darkenOpacity, mix),
            textureOpacity: lerp(lower.textureOpacity, upper.textureOpacity, mix),
            frameOpacity: lerp(lower.frameOpacity, upper.frameOpacity, mix),
            lightsStrength: lerp(lower.lightsStrength, upper.lightsStrength, mix),
            saturate: lerp(lower.saturate, upper.saturate, mix),
            contrast: lerp(lower.contrast, upper.contrast, mix),
            brightness: lerp(lower.brightness, upper.brightness, mix),
            hue: lerp(lower.hue, upper.hue, mix)
        };
    }

    function easePhaseState(current, target, deltaSeconds) {
        const ease = 1 - Math.exp(-deltaSeconds * 3.2);
        current.burnColor[0] = lerp(current.burnColor[0], target.burnColor[0], ease);
        current.burnColor[1] = lerp(current.burnColor[1], target.burnColor[1], ease);
        current.burnColor[2] = lerp(current.burnColor[2], target.burnColor[2], ease);
        current.burnOpacity = lerp(current.burnOpacity, target.burnOpacity, ease);
        current.ambientOpacity = lerp(current.ambientOpacity, target.ambientOpacity, ease);
        current.washOpacity = lerp(current.washOpacity, target.washOpacity, ease);
        current.bloomOpacity = lerp(current.bloomOpacity, target.bloomOpacity, ease);
        current.sceneOpacity = lerp(current.sceneOpacity, target.sceneOpacity, ease);
        current.darkenOpacity = lerp(current.darkenOpacity, target.darkenOpacity, ease);
        current.textureOpacity = lerp(current.textureOpacity, target.textureOpacity, ease);
        current.frameOpacity = lerp(current.frameOpacity, target.frameOpacity, ease);
        current.lightsStrength = lerp(current.lightsStrength, target.lightsStrength, ease);
        current.saturate = lerp(current.saturate, target.saturate, ease);
        current.contrast = lerp(current.contrast, target.contrast, ease);
        current.brightness = lerp(current.brightness, target.brightness, ease);
        current.hue = lerp(current.hue, target.hue, ease);
    }

    function applyPhaseState(card, state, phase) {
        const baseSaturate = lerp(0.96, state.saturate, 0.45);
        const baseContrast = lerp(0.98, state.contrast, 0.3);
        const baseBrightness = lerp(1.02, state.brightness, 0.4);
        const baseHue = state.hue * 0.35;
        const sceneSaturate = state.saturate * 1.05;
        const sceneContrast = state.contrast * 1.03;
        const sceneBrightness = state.brightness * 0.98;

        card.style.setProperty('--city-burn-color', colorToRgba(state.burnColor, 1));
        card.style.setProperty('--city-burn-opacity', state.burnOpacity.toFixed(3));
        card.style.setProperty('--city-ambient-opacity', state.ambientOpacity.toFixed(3));
        card.style.setProperty('--city-wash-opacity', state.washOpacity.toFixed(3));
        card.style.setProperty('--city-bloom-opacity', state.bloomOpacity.toFixed(3));
        card.style.setProperty('--city-scene-opacity', state.sceneOpacity.toFixed(3));
        card.style.setProperty('--city-darken-opacity', state.darkenOpacity.toFixed(3));
        card.style.setProperty('--city-texture-opacity', state.textureOpacity.toFixed(3));
        card.style.setProperty('--city-frame-opacity', state.frameOpacity.toFixed(3));
        card.style.setProperty('--city-base-filter', 'saturate(' + baseSaturate.toFixed(3) + ') contrast(' + baseContrast.toFixed(3) + ') brightness(' + baseBrightness.toFixed(3) + ') hue-rotate(' + baseHue.toFixed(2) + 'deg)');
        card.style.setProperty('--city-scene-filter', 'saturate(' + sceneSaturate.toFixed(3) + ') contrast(' + sceneContrast.toFixed(3) + ') brightness(' + sceneBrightness.toFixed(3) + ') hue-rotate(' + state.hue.toFixed(2) + 'deg)');
        card.dataset.phase = phase;
    }

    function fillPolygon(ctx, points, fillStyle, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha == null ? 1 : alpha;
        ctx.fillStyle = fillStyle;
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        for (let index = 1; index < points.length; index += 1) {
            ctx.lineTo(points[index][0], points[index][1]);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    function strokePolyline(ctx, points, width, color, alpha, blur) {
        ctx.save();
        ctx.globalAlpha = alpha == null ? 1 : alpha;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (blur) {
            ctx.filter = 'blur(' + blur + 'px)';
        }
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        for (let index = 1; index < points.length; index += 1) {
            ctx.lineTo(points[index][0], points[index][1]);
        }
        ctx.stroke();
        ctx.restore();
    }

    function paintSoftRect(ctx, x, y, width, height, color, alpha, blur) {
        ctx.save();
        ctx.globalAlpha = alpha == null ? 1 : alpha;
        if (blur) {
            ctx.filter = 'blur(' + blur + 'px)';
        }
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width, height);
        ctx.restore();
    }

    function paintSoftEllipse(ctx, x, y, radiusX, radiusY, color, alpha, rotation, blur) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation || 0);
        ctx.globalAlpha = alpha == null ? 1 : alpha;
        if (blur) {
            ctx.filter = 'blur(' + blur + 'px)';
        }
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function paintStroke(ctx, x1, y1, x2, y2, width, color, alpha, blur) {
        ctx.save();
        ctx.globalAlpha = alpha == null ? 1 : alpha;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        if (blur) {
            ctx.filter = 'blur(' + blur + 'px)';
        }
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
    }

    function paintGrain(ctx, random, count, alpha, maxSize) {
        for (let index = 0; index < count; index += 1) {
            const size = 0.4 + random() * maxSize;
            ctx.fillStyle = random() > 0.5
                ? 'rgba(255, 248, 236, ' + (alpha * (0.35 + random() * 0.65)).toFixed(4) + ')'
                : 'rgba(18, 25, 36, ' + (alpha * (0.28 + random() * 0.48)).toFixed(4) + ')';
            ctx.fillRect(random() * VIEW.width, random() * VIEW.height, size, size);
        }
    }

    function getPart(parts, type) {
        const match = parts.find((part) => part.type === type);
        return match ? match.value : '0';
    }

    function colorToRgba(color, alpha) {
        return 'rgba(' + Math.round(color[0]) + ', ' + Math.round(color[1]) + ', ' + Math.round(color[2]) + ', ' + alpha + ')';
    }

    function hexToRgb(hex) {
        const normalized = hex.replace('#', '');
        return [parseInt(normalized.slice(0, 2), 16), parseInt(normalized.slice(2, 4), 16), parseInt(normalized.slice(4, 6), 16)];
    }

    function mixColor(colorA, colorB, mix) {
        return [lerp(colorA[0], colorB[0], mix), lerp(colorA[1], colorB[1], mix), lerp(colorA[2], colorB[2], mix)];
    }

    function hashSeed(x, y, radius) {
        return ((Math.floor(x * 13) ^ Math.floor(y * 17) ^ Math.floor(radius * 71)) >>> 0) + 1;
    }

    function catmullRom(p0, p1, p2, p3, t) {
        return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
    }

    function mulberry32(seed) {
        return function () {
            let value = seed += 0x6D2B79F5;
            value = Math.imul(value ^ value >>> 15, value | 1);
            value ^= value + Math.imul(value ^ value >>> 7, value | 61);
            return ((value ^ value >>> 14) >>> 0) / 4294967296;
        };
    }

    function randomBetween(min, max) {
        return min + Math.random() * (max - min);
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function lerp(start, end, mix) {
        return start + (end - start) * mix;
    }

    window.initializeCityIllustration = initializeCityIllustration;
}());
