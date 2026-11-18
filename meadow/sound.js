const cues = {
    navigate: [{ duration: 0.055, pitch: 670, drift: -95, level: 0.24, texture: 0.30 }],
    open: [{ duration: 0.100, pitch: 495, drift: 115, level: 0.32, texture: 0.42 }],
    close: [{ duration: 0.078, pitch: 455, drift: -110, level: 0.22, texture: 0.26 }],
    confirm: [
        { duration: 0.073, pitch: 610, drift: 32, level: 0.23, texture: 0.12 },
        { offset: 0.047, duration: 0.090, pitch: 820, drift: 25, level: 0.21, texture: 0.09 }
    ]
};

function renderCue(context, notes) {
    const sampleRate = context.sampleRate;
    const length = Math.max(...notes.map(({ duration, offset = 0 }) => duration + offset));
    const buffer = context.createBuffer(1, Math.ceil(length * sampleRate), sampleRate);
    const samples = buffer.getChannelData(0);
    let seed = 2447;

    for (const { offset = 0, duration, pitch, drift, level, texture } of notes) {
        const start = Math.floor(offset * sampleRate);
        const noteLength = Math.floor(duration * sampleRate);
        let previousNoise = 0;

        for (let sample = 0; sample < noteLength; sample += 1) {
            const time = sample / sampleRate;
            const progress = time / duration;
            const phase = 2 * Math.PI * time * (pitch + drift * progress / 2);
            const attack = Math.min(1, time / 0.0025);
            const decay = (1 - progress) ** 4;
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
            const noise = seed / 0x80000000 - 1;
            const tap = (noise - previousNoise) * texture * Math.exp(-time / 0.0045);
            const tone = Math.sin(phase) + 0.23 * Math.sin(phase * 2.17) * Math.exp(-progress * 6);
            samples[start + sample] += level * attack * (tone * decay + tap);
            previousNoise = noise;
        }
    }

    return buffer;
}

export function connectSound() {
    const toggles = Array.from(document.querySelectorAll('[data-sound-toggle]'));
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const voices = new Set();
    const renderedCues = new Map();
    let available = Boolean(AudioContext);
    let enabled = false;
    let context;
    let master;
    let revision = 0;
    let lastCue;
    let lastTime = -Infinity;

    function reflectSetting() {
        for (const toggle of toggles) {
            toggle.hidden = false;
            toggle.setAttribute('aria-pressed', String(enabled));
            toggle.disabled = !available;
            if (!available) toggle.title = 'Sound is unavailable in this browser';
            const state = toggle.querySelector('[data-sound-state]');
            if (state) state.textContent = enabled ? 'On' : 'Off';
        }
    }

    function silence() {
        revision += 1;
        if (master) master.gain.value = 0;
        for (const voice of voices) voice.stop();
        voices.clear();
    }

    function play(name) {
        const now = context.currentTime;
        if (lastCue === name && now - lastTime < 0.04) return;
        lastCue = name;
        lastTime = now;

        if (!renderedCues.has(name)) renderedCues.set(name, renderCue(context, cues[name]));
        if (voices.size >= 2) {
            const oldest = voices.values().next().value;
            oldest.stop();
            voices.delete(oldest);
        }
        master.gain.value = 0.20;
        const source = context.createBufferSource();
        source.buffer = renderedCues.get(name);
        source.connect(master);
        source.onended = () => {
            voices.delete(source);
            source.disconnect();
        };
        source.start();
        voices.add(source);
    }

    async function playCue(name) {
        if (!enabled || document.hidden) return;
        const started = performance.now();
        const request = ++revision;
        try {
            if (context.state !== 'running') await context.resume();
            if (request === revision && enabled && !document.hidden && context.state === 'running' && performance.now() - started < 150) {
                play(name);
            }
        } catch {
            // Visual feedback remains available if sound cannot play.
        }
    }

    function toggleSound() {
        if (enabled) {
            enabled = false;
            silence();
            reflectSetting();
            return;
        }

        try {
            if (!context) {
                context = new AudioContext();
                master = context.createGain();
                master.gain.value = 0;
                master.connect(context.destination);
            }
            enabled = true;
            playCue('navigate');
        } catch {
            available = false;
        }
        reflectSetting();
    }

    for (const toggle of toggles) toggle.addEventListener('click', toggleSound);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) silence();
    });
    window.addEventListener('pagehide', silence);
    reflectSetting();
    return playCue;
}
